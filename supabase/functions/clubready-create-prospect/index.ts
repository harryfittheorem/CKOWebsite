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
    const { firstName, lastName, email, phone, dateOfBirth } = await req.json();

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
    const clubreadyApiKey = Deno.env.get("CLUBREADY_API_KEY")!;
    const clubreadyStoreId = Deno.env.get("CLUBREADY_STORE_ID")!;
    const clubreadyApiUrl = Deno.env.get("CLUBREADY_API_URL")!;

    const supabase = createClient(supabaseUrl, supabaseKey);

    const startTime = Date.now();

    const prospectData = {
      storeId: parseInt(clubreadyStoreId),
      firstName,
      lastName,
      email,
      phone: phone || "",
      dateOfBirth: dateOfBirth || null,
    };

    const response = await fetch(`${clubreadyApiUrl}/users/prospects`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${clubreadyApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(prospectData),
    });

    const duration = Date.now() - startTime;
    const responseData = await response.json();

    await supabase.from("payment_logs").insert({
      endpoint: "/users/prospects",
      request_data: prospectData,
      response_data: responseData,
      status_code: response.status,
      duration_ms: duration,
    });

    if (!response.ok) {
      throw new Error(responseData.message || "Failed to create prospect");
    }

    const prospect = responseData.data;

    const { data: dbProspect, error: dbError } = await supabase
      .from("prospects")
      .insert({
        clubready_user_id: prospect.userId.toString(),
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
          clubreadyUserId: prospect.userId,
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
