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
    const { email, phone } = await req.json();

    if (!email && !phone) {
      return new Response(
        JSON.stringify({ error: "Email or phone is required" }),
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
    const clubreadyChainId = config.chain_id;
    const clubreadyStoreId = config.store_id;
    const clubreadyApiUrl = config.api_url;

    const startTime = Date.now();

    const searchParams = new URLSearchParams({
      ApiKey: clubreadyApiKey,
      StoreId: clubreadyStoreId,
      ChainId: clubreadyChainId,
    });

    if (email) {
      searchParams.append("Email", email);
    }
    if (phone) {
      searchParams.append("Phone", phone);
    }

    const response = await fetch(
      `${clubreadyApiUrl}/users/find?${searchParams}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    const duration = Date.now() - startTime;
    const responseText = await response.text();

    let responseData;
    try {
      responseData = JSON.parse(responseText);
    } catch {
      responseData = { raw: responseText };
    }

    await supabase.from("payment_logs").insert({
      endpoint: "/users/find",
      request_data: { email, phone, storeId: clubreadyStoreId, chainId: clubreadyChainId },
      response_data: responseData,
      status_code: response.status,
      duration_ms: duration,
    });

    if (!response.ok) {
      throw new Error(responseData.Message || responseData.message || "Failed to search user");
    }

    const users = Array.isArray(responseData) ? responseData : [];
    const prospect = users.length > 0 ? users[0] : null;

    if (prospect && prospect.UserId) {
      await supabase.from("prospects").upsert({
        clubready_user_id: prospect.UserId.toString(),
        email: prospect.Email || email,
        phone: prospect.Phone || phone,
        first_name: prospect.FirstName || "",
        last_name: prospect.LastName || "",
        last_synced_at: new Date().toISOString(),
      }, {
        onConflict: "clubready_user_id"
      });
    }

    return new Response(
      JSON.stringify({
        found: !!prospect,
        prospect: prospect ? {
          userId: prospect.UserId,
          email: prospect.Email,
          phone: prospect.Phone,
          firstName: prospect.FirstName,
          lastName: prospect.LastName,
        } : null
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
