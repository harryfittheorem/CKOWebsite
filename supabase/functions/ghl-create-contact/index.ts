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

interface GHLContactRequest {
  firstName: string;
  lastName?: string;
  phone: string;
  email: string;
  locationId: string;
  tags: string[];
  source: string;
}

interface GHLContactResponse {
  contact: {
    id: string;
  };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const ghlApiKey = Deno.env.get("GHL_API_KEY");

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("Missing Supabase credentials");
      return new Response(
        JSON.stringify({ error: "Server configuration error" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const leadData: LeadData = await req.json();
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
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (!location || !location.ghl_location_id) {
      console.warn(`No GHL location ID for ${leadData.location_slug} - skipping GHL push`);
      return new Response(
        JSON.stringify({
          success: true,
          message: "Location not configured for GHL"
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const nameParts = leadData.name.trim().split(/\s+/);
    const firstName = nameParts[0];
    const lastName = nameParts.length > 1 ? nameParts.slice(1).join(" ") : undefined;

    const digitsOnly = leadData.phone.replace(/\D/g, "");
    const formattedPhone = digitsOnly.length === 10 ? `+1${digitsOnly}` : `+${digitsOnly}`;

    if (!ghlApiKey) {
      console.warn("GHL_API_KEY not configured - skipping GHL push");
      return new Response(
        JSON.stringify({
          success: true,
          message: "GHL not configured"
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const ghlPayload: GHLContactRequest = {
      firstName,
      lastName,
      phone: formattedPhone,
      email: leadData.email,
      locationId: location.ghl_location_id,
      tags: ["website-lead", "free-class"],
      source: leadData.source,
    };

    console.log("Pushing to GHL:", ghlPayload);

    const ghlResponse = await fetch("https://services.leadconnectorhq.com/contacts/", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${ghlApiKey}`,
        "Version": "2021-07-28",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(ghlPayload),
    });

    if (ghlResponse.ok) {
      const ghlData: GHLContactResponse = await ghlResponse.json();
      const contactId = ghlData.contact?.id;

      console.log("GHL success, contact ID:", contactId);

      const { error: updateError } = await supabase
        .from("leads")
        .update({
          ghl_push_status: "success",
          ghl_contact_id: contactId,
        })
        .eq("id", leadData.id);

      if (updateError) {
        console.error("Error updating lead with GHL success:", updateError);
      }

      return new Response(
        JSON.stringify({
          success: true,
          contactId,
          message: "Contact created in GHL"
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    } else {
      const errorText = await ghlResponse.text();
      console.error("GHL API error:", ghlResponse.status, errorText);

      const { error: updateError } = await supabase
        .from("leads")
        .update({
          ghl_push_status: "failed",
        })
        .eq("id", leadData.id);

      if (updateError) {
        console.error("Error updating lead with GHL failure:", updateError);
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: "Lead saved but GHL push failed"
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
  } catch (error) {
    console.error("Error in ghl-create-contact:", error);
    return new Response(
      JSON.stringify({
        success: true,
        message: "Lead saved but processing error occurred"
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
