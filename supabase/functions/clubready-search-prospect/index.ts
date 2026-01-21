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
      storeId: clubreadyStoreId,
    });

    if (email) {
      searchParams.append("email", email);
    }
    if (phone) {
      searchParams.append("phone", phone);
    }

    const response = await fetch(
      `${clubreadyApiUrl}/users/prospects/search?${searchParams}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    const duration = Date.now() - startTime;
    const responseData = await response.json();

    await supabase.from("payment_logs").insert({
      endpoint: "/users/prospects/search",
      request_data: { email, phone, storeId: clubreadyStoreId },
      response_data: responseData,
      status_code: response.status,
      duration_ms: duration,
    });

    if (!response.ok) {
      throw new Error(responseData.message || "Failed to search prospect");
    }

    const prospect = responseData.data || null;

    if (prospect && prospect.userId) {
      await supabase.from("prospects").upsert({
        clubready_user_id: prospect.userId.toString(),
        email: prospect.email,
        phone: prospect.phone,
        first_name: prospect.firstName,
        last_name: prospect.lastName,
        last_synced_at: new Date().toISOString(),
      }, {
        onConflict: "clubready_user_id"
      });
    }

    return new Response(
      JSON.stringify({
        found: !!prospect,
        prospect: prospect
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
