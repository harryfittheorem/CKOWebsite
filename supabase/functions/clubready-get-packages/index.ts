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
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const url = new URL(req.url);
    const locationSlug = url.searchParams.get("location_slug");

    let query = supabase
      .from("packages")
      .select("*")
      .eq("is_active", true);

    if (locationSlug) {
      query = query.eq("location_slug", locationSlug);
    }

    const { data: packages, error } = await query.order("display_order", { ascending: true });

    if (error) {
      throw error;
    }

    let locationData = null;
    if (locationSlug) {
      const { data: location, error: locationError } = await supabase
        .from("locations")
        .select("clubready_site_id, name")
        .eq("slug", locationSlug)
        .maybeSingle();

      if (!locationError && location) {
        locationData = location;
      }
    }

    return new Response(
      JSON.stringify({ packages, location: locationData }),
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
