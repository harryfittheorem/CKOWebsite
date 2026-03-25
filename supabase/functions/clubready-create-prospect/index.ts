import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { logApiCall, sanitizeRequestBody } from "../_shared/logger.ts";

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

  const startTime = Date.now();
  let apiUrl = "";
  let requestBody: any = {};
  let httpStatus = 500;

  try {
    requestBody = await req.json();
    const { firstName, lastName, email, phone, dateOfBirth, packageId, address, city, state, zip, gender, locationSlug } = requestBody;

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

    if (!locationSlug) {
      return new Response(
        JSON.stringify({ error: "locationSlug is required" }),
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

    const clubreadyApiKey = Deno.env.get("CLUBREADY_API_KEY");
    if (!clubreadyApiKey) {
      const duration = Date.now() - startTime;
      await logApiCall(supabase, {
        endpoint: "/sales/agreement/addNewUser",
        step: "create_prospect",
        api_url: "N/A",
        request_body: sanitizeRequestBody(requestBody),
        http_status: 500,
        error_message: "CLUBREADY_API_KEY not configured in Supabase secrets",
        duration_ms: duration,
      });

      return new Response(
        JSON.stringify({ error: "ClubReady API key not configured" }),
        {
          status: 500,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const { data: location, error: locationError } = await supabase
      .from("locations")
      .select("clubready_site_id")
      .eq("slug", locationSlug)
      .maybeSingle();

    if (locationError || !location || !location.clubready_site_id) {
      const duration = Date.now() - startTime;
      await logApiCall(supabase, {
        endpoint: "/sales/agreement/addNewUser",
        step: "create_prospect",
        api_url: "N/A",
        request_body: sanitizeRequestBody(requestBody),
        http_status: 404,
        error_message: `Location not found or missing clubready_site_id for slug: ${locationSlug}`,
        error_details: locationError,
        duration_ms: duration,
      });

      return new Response(
        JSON.stringify({ error: "Location not found or ClubReady site ID not configured" }),
        {
          status: 404,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const clubreadyStoreId = location.clubready_site_id;
    const clubreadyChainId = "56";
    const clubreadyApiUrl = "https://api.clubready.com/api/v2";

    const formData = new URLSearchParams({
      ApiKey: clubreadyApiKey,
      ChainId: clubreadyChainId,
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
    if (address) {
      formData.append("Address", address);
    }
    if (city) {
      formData.append("City", city);
    }
    if (state) {
      formData.append("State", state);
    }
    if (zip) {
      formData.append("Zip", zip);
    }
    if (gender) {
      formData.append("Gender", gender);
    }

    const clientIp = req.headers.get("x-forwarded-for") || "127.0.0.1";
    apiUrl = `${clubreadyApiUrl}/sales/agreement/addNewUser`;

    const requestHeaders: Record<string, string> = {
      "Content-Type": "application/x-www-form-urlencoded",
      "X-Forwarded-For": clientIp,
    };

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: requestHeaders,
      body: formData.toString(),
    });

    httpStatus = response.status;
    const duration = Date.now() - startTime;
    const responseText = await response.text();

    let responseData;
    try {
      responseData = JSON.parse(responseText);
    } catch {
      responseData = { raw: responseText };
    }

    await logApiCall(supabase, {
      endpoint: "/sales/agreement/addNewUser",
      step: "create_prospect",
      api_url: apiUrl,
      request_headers: { "Content-Type": "application/x-www-form-urlencoded" },
      request_body: sanitizeRequestBody({
        firstName,
        lastName,
        email,
        phone,
        dateOfBirth,
        address,
        city,
        state,
        zip,
        gender,
        chainId: clubreadyChainId,
        storeId: clubreadyStoreId,
      }),
      response_data: responseData,
      http_status: httpStatus,
      error_message: !response.ok ? (responseData.Message || responseData.message || "Failed to create user") : undefined,
      error_details: !response.ok ? responseData : undefined,
      duration_ms: duration,
      clubready_request_id: response.headers.get("X-Request-Id") || undefined,
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
    const duration = Date.now() - startTime;
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    await logApiCall(supabase, {
      endpoint: "/sales/agreement/addNewUser",
      step: "create_prospect",
      api_url: apiUrl || "N/A",
      request_body: sanitizeRequestBody(requestBody),
      http_status: httpStatus,
      error_message: error.message,
      error_details: { error: error.toString(), stack: error.stack },
      duration_ms: duration,
    });

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
