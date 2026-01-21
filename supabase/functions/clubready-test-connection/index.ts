import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
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
    const clubreadyApiKey = Deno.env.get("CLUBREADY_API_KEY");
    const clubreadyChainId = Deno.env.get("CLUBREADY_CHAIN_ID");
    const clubreadyStoreId = Deno.env.get("CLUBREADY_STORE_ID");
    const clubreadyApiUrl = Deno.env.get("CLUBREADY_API_URL");

    if (!clubreadyApiKey || !clubreadyChainId || !clubreadyStoreId || !clubreadyApiUrl) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Missing ClubReady configuration",
          config: {
            hasApiKey: !!clubreadyApiKey,
            hasChainId: !!clubreadyChainId,
            hasStoreId: !!clubreadyStoreId,
            hasApiUrl: !!clubreadyApiUrl
          }
        }),
        {
          status: 500,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const searchParams = new URLSearchParams({
      ApiKey: clubreadyApiKey,
      ChainId: clubreadyChainId,
      storeId: clubreadyStoreId,
      email: "test@example.com"
    });

    const startTime = Date.now();
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

    return new Response(
      JSON.stringify({
        success: response.ok,
        statusCode: response.status,
        duration: `${duration}ms`,
        message: response.ok
          ? "ClubReady API connection successful!"
          : "ClubReady API returned an error",
        config: {
          apiUrl: clubreadyApiUrl,
          chainId: clubreadyChainId,
          storeId: clubreadyStoreId
        },
        response: responseData
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        message: "Failed to connect to ClubReady API"
      }),
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
