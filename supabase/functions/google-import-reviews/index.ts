import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface RequestBody {
  location_slug: string;
  overwrite?: boolean;
}

interface GooglePlacesTextSearchResponse {
  candidates?: Array<{ place_id: string }>;
  status: string;
}

interface GooglePlaceDetailsResponse {
  result?: {
    reviews?: Array<{
      author_name: string;
      text: string;
      rating: number;
    }>;
    rating?: number;
    user_ratings_total?: number;
  };
  status: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const GOOGLE_API_KEY = Deno.env.get("GOOGLE_PLACES_API_KEY");
    if (!GOOGLE_API_KEY) {
      throw new Error("GOOGLE_PLACES_API_KEY not configured");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { location_slug, overwrite = false }: RequestBody = await req.json();

    if (!location_slug) {
      return new Response(
        JSON.stringify({ success: false, error: "location_slug is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch location details
    const { data: location, error: locationError } = await supabase
      .from("locations")
      .select("name, city, state")
      .eq("slug", location_slug)
      .maybeSingle();

    if (locationError || !location) {
      return new Response(
        JSON.stringify({ success: false, error: "Location not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Step 1: Find Place ID using Text Search
    const searchQuery = `CKO Kickboxing ${location.city} ${location.state}`;
    const textSearchUrl = `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=${encodeURIComponent(searchQuery)}&inputtype=textquery&fields=place_id&key=${GOOGLE_API_KEY}`;

    const textSearchResponse = await fetch(textSearchUrl);
    const textSearchData: GooglePlacesTextSearchResponse = await textSearchResponse.json();

    if (textSearchData.status !== "OK" || !textSearchData.candidates || textSearchData.candidates.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          imported: 0,
          message: "Location not found on Google",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const placeId = textSearchData.candidates[0].place_id;

    // Step 2: Get Place Details including reviews
    const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=reviews,rating,user_ratings_total&key=${GOOGLE_API_KEY}`;

    const detailsResponse = await fetch(detailsUrl);
    const detailsData: GooglePlaceDetailsResponse = await detailsResponse.json();

    if (detailsData.status !== "OK" || !detailsData.result) {
      return new Response(
        JSON.stringify({
          success: true,
          imported: 0,
          message: "Could not fetch place details",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const reviews = detailsData.result.reviews || [];
    const fiveStarReviews = reviews.filter((r) => r.rating === 5);

    if (fiveStarReviews.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          imported: 0,
          message: "No 5-star reviews found",
          place_id: placeId,
          overall_rating: detailsData.result.rating,
          total_reviews: detailsData.result.user_ratings_total,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Step 3: Optionally delete existing non-corporate testimonials
    if (overwrite) {
      await supabase
        .from("testimonials")
        .delete()
        .eq("location_slug", location_slug)
        .eq("is_corporate_default", false);
    }

    // Step 4: Insert 5-star reviews
    const testimonialsToInsert = fiveStarReviews.map((review, index) => ({
      location_slug,
      member_name: review.author_name,
      quote: review.text.length > 300 ? review.text.substring(0, 297) + "..." : review.text,
      rating: 5,
      display_order: index + 1,
      is_active: true,
      is_corporate_default: false,
      member_since: null,
    }));

    const { error: insertError } = await supabase
      .from("testimonials")
      .insert(testimonialsToInsert);

    if (insertError) {
      throw insertError;
    }

    return new Response(
      JSON.stringify({
        success: true,
        imported: fiveStarReviews.length,
        place_id: placeId,
        overall_rating: detailsData.result.rating,
        total_reviews: detailsData.result.user_ratings_total,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error importing Google reviews:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
