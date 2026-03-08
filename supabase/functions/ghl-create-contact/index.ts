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
    const agencyToken = Deno.env.get("GHL_AGENCY_TOKEN");
    const companyId = Deno.env.get("GHL_COMPANY_ID");

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    if (!agencyToken || !companyId) {
      console.error("GHL_AGENCY_TOKEN or GHL_COMPANY_ID not configured");
      return new Response(
        JSON.stringify({ error: "GHL agency credentials not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

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
      .select("ghl_location_id")
      .eq("slug", leadData.location_slug)
      .maybeSingle();

    if (locationError) {
      console.error("Error fetching location:", locationError);
      return new Response(
        JSON.stringify({ error: "Failed to fetch location" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!location?.ghl_location_id) {
      console.warn(`No GHL location ID for ${leadData.location_slug} - skipping`);
      return new Response(
        JSON.stringify({ success: true, message: "Location not configured for GHL" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Getting location token for:", location.ghl_location_id);
    const tokenResponse = await fetch(
      "https://services.leadconnectorhq.com/oauth/locationToken",
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${agencyToken}`,
          "Content-Type": "application/json",
          "Version": "2021-07-28",
        },
        body: JSON.stringify({
          locationId: location.ghl_location_id,
          companyId: companyId,
        }),
      }
    );

    if (!tokenResponse.ok) {
      const errText = await tokenResponse.text();
      console.error("Failed to get location token:", tokenResponse.status, errText);
      await supabase.from("leads").update({ ghl_push_status: "failed" }).eq("id", leadData.id);
      return new Response(
        JSON.stringify({ success: true, message: "Failed to get GHL location token" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { access_token: locationToken } = await tokenResponse.json();
    console.log("Location token obtained successfully");

    const nameParts = leadData.name.trim().split(/\s+/);
    const firstName = nameParts[0];
    const lastName = nameParts.length > 1 ? nameParts.slice(1).join(" ") : undefined;
    const digitsOnly = leadData.phone.replace(/\D/g, "");
    const formattedPhone = digitsOnly.length === 10 ? `+1${digitsOnly}` : `+${digitsOnly}`;

    const ghlPayload: Record<string, any> = {
      firstName,
      phone: formattedPhone,
      email: leadData.email,
      locationId: location.ghl_location_id,
      tags: ["website-lead", "free-class"],
      source: leadData.source,
    };
    if (lastName) ghlPayload.lastName = lastName;

    const ghlResponse = await fetch("https://services.leadconnectorhq.com/contacts/", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${locationToken}`,
        "Content-Type": "application/json",
        "Version": "2021-07-28",
      },
      body: JSON.stringify(ghlPayload),
    });

    if (ghlResponse.ok) {
      const ghlData = await ghlResponse.json();
      const contactId = ghlData.contact?.id;
      console.log("GHL contact created:", contactId);

      await supabase
        .from("leads")
        .update({ ghl_push_status: "success", ghl_contact_id: contactId })
        .eq("id", leadData.id);

      return new Response(
        JSON.stringify({ success: true, contactId, message: "Contact created in GHL" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } else {
      const errorText = await ghlResponse.text();
      console.error("GHL API error:", ghlResponse.status, errorText);
      await supabase.from("leads").update({ ghl_push_status: "failed" }).eq("id", leadData.id);
      return new Response(
        JSON.stringify({ success: true, message: "Lead saved but GHL push failed" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  } catch (error) {
    console.error("Error in ghl-create-contact:", error);
    return new Response(
      JSON.stringify({ success: true, message: "Lead saved but processing error occurred" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
