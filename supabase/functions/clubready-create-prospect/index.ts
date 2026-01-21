import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const { firstName, lastName, email, phone, dateOfBirth, packageId } = await req.json();

    if (!firstName || !lastName || !email) {
      return new Response(
        JSON.stringify({ error: "First name, last name, and email are required" }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: config, error: configError } = await supabase
      .from("clubready_config")
      .select("*")
      .eq("id", 1)
      .maybeSingle();

    if (configError || !config) {
      return new Response(
        JSON.stringify({ error: "ClubReady configuration not found" }),
        {
          status: 500,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const clubreadyApiKey = config.api_key;
    const clubreadyStoreId = config.store_id;
    const clubreadyApiUrl = config.api_url;

    const startTime = Date.now();

    const formData = new URLSearchParams({
      ApiKey: clubreadyApiKey,
      StoreId: clubreadyStoreId,
      FirstName: firstName,
      LastName: lastName,
      Email: email,
    });

    if (phone) {
      formData.append("Phone", phone);
    }
    if (dateOfBirth) {
      formData.append("DateOfBirth", dateOfBirth);
    }
    if (packageId) {
      formData.append("PackageId", packageId);
    }

    const clientIp = req.headers.get("x-forwarded-for") || "127.0.0.1";

    const response = await fetch(`${clubreadyApiUrl}/sales/agreement/addNewUser`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "X-Forwarded-For": clientIp,
      },
      body: formData.toString(),
    });

    const duration = Date.now() - startTime;
    const responseText = await response.text();

    let responseData;
    try {
      responseData = JSON.parse(responseText);
    } catch {
      responseData = { raw: responseText };
    }

    await supabase.from("payment_logs").insert({
      endpoint: "/sales/agreement/addNewUser",
      request_data: { firstName, lastName, email, phone, dateOfBirth, storeId: clubreadyStoreId },
      response_data: responseData,
      status_code: response.status,
      duration_ms: duration,
    });

    if (!response.ok) {
      throw new Error(responseData.Message || responseData.message || "Failed to create user");
    }

    const userId = responseData.UserId || responseData.userId || responseData.Id;

    if (!userId) {
      throw new Error("User created but no UserId returned from ClubReady");
    }

    const { data: dbProspect, error: dbError } = await supabase
      .from("prospects")
      .insert({
        clubready_user_id: userId.toString(),
        email,
        phone: phone || null,
        first_name: firstName,
        last_name: lastName,
        date_of_birth: dateOfBirth || null,
        last_synced_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (dbError) {
      throw dbError;
    }

    return new Response(
      JSON.stringify({
        success: true,
        prospect: {
          id: dbProspect.id,
          clubreadyUserId: userId,
          email,
          firstName,
          lastName,
        },
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});
