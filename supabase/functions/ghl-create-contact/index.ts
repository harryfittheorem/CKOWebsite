import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface LeadData {
  id: string;
  name: string;
  phone: string;
  email: string;
  location_slug: string;
  source: string;
}

interface SupabaseWebhookPayload {
  type: string;
  table: string;
  schema: string;
  record: LeadData;
  old_record: null;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body: SupabaseWebhookPayload = await req.json();

    if (body.type !== "INSERT" || !body.record) {
      return new Response(
        JSON.stringify({ message: "Not an INSERT event" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const leadData: LeadData = body.record;
    console.log("Processing lead:", leadData.id, leadData.name, leadData.location_slug);

    const { data: location, error: locationError } = await supabase
      .from("locations")
      .select("ghl_webhook_url, clubready_api_key, clubready_site_id")
      .eq("slug", leadData.location_slug)
      .maybeSingle();

    if (locationError) {
      console.error("Error fetching location:", locationError);
      return new Response(
        JSON.stringify({ error: "Failed to fetch location" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const nameParts = leadData.name.trim().split(/\s+/);
    const firstName = nameParts[0];
    const lastName = nameParts.length > 1 ? nameParts.slice(1).join(" ") : "";
    const digitsOnly = leadData.phone.replace(/\D/g, "");
    const formattedPhone = digitsOnly.length === 10 ? `+1${digitsOnly}` : `+${digitsOnly}`;

    if (location?.ghl_webhook_url) {
      const webhookPayload = {
        firstName,
        lastName,
        email: leadData.email,
        phone: formattedPhone,
        source: leadData.source || "website",
        location: leadData.location_slug,
      };

      console.log("Posting to GHL webhook for:", leadData.location_slug);

      const ghlResponse = await fetch(location.ghl_webhook_url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(webhookPayload),
      });

      if (ghlResponse.ok) {
        console.log("GHL webhook success");
        await supabase.from("leads").update({ ghl_push_status: "success" }).eq("id", leadData.id);
      } else {
        const errorText = await ghlResponse.text();
        console.error("GHL webhook error:", ghlResponse.status, errorText);
        await supabase.from("leads").update({ ghl_push_status: "failed" }).eq("id", leadData.id);
      }
    } else {
      console.warn(`No GHL webhook URL for ${leadData.location_slug} - skipping GHL`);
    }

    if (location?.clubready_api_key && location?.clubready_site_id) {
      console.log("Creating ClubReady prospect for:", leadData.location_slug);

      const crFormData = new URLSearchParams({
        ApiKey: location.clubready_api_key,
        StoreId: location.clubready_site_id,
        FirstName: firstName,
        LastName: lastName,
        Email: leadData.email,
        Phone: formattedPhone,
      });

      const crResponse = await fetch(
        "https://api.clubready.com/api/v2/sales/agreement/addNewUser",
        {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: crFormData.toString(),
        }
      );

      if (crResponse.ok) {
        const crData = await crResponse.json();
        console.log("ClubReady prospect created:", crData.UserId);
      } else {
        const crError = await crResponse.text();
        console.error("ClubReady error:", crResponse.status, crError);
      }
    } else {
      console.warn(`No ClubReady credentials for ${leadData.location_slug} - skipping ClubReady`);
    }

    return new Response(
      JSON.stringify({ success: true, message: "Lead processed" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in ghl-create-contact:", error);
    return new Response(
      JSON.stringify({ success: true, message: "Lead saved but processing error occurred" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
