import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface RequestBody {
  action: "invite" | "revoke" | "delete";
  email?: string;
  location_slug?: string;
  user_id?: string;
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
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error("Missing environment variables");
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const { action, email, location_slug, user_id }: RequestBody = await req.json();

    if (action === "invite") {
      if (!email || !location_slug) {
        return new Response(
          JSON.stringify({ error: "Email and location_slug are required for invite action" }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return new Response(
          JSON.stringify({ error: "Invalid email format" }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      const { data: existingUser, error: checkError } = await supabase.auth.admin.listUsers();

      if (checkError) {
        throw checkError;
      }

      const userExists = existingUser.users.find(u => u.email === email);

      let userId: string;

      if (userExists) {
        userId = userExists.id;

        const { data: existingAccess } = await supabase
          .from("user_locations")
          .select("*")
          .eq("user_id", userId)
          .eq("location_slug", location_slug)
          .maybeSingle();

        if (existingAccess) {
          return new Response(
            JSON.stringify({ error: "User already has access to this location" }),
            {
              status: 400,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        }
      } else {
        const tempPassword = crypto.randomUUID();

        const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
          email,
          password: tempPassword,
          email_confirm: true,
        });

        if (createError) {
          throw createError;
        }

        if (!newUser.user) {
          throw new Error("Failed to create user");
        }

        userId = newUser.user.id;

        const { error: profileError } = await supabase
          .from("user_profiles")
          .insert({
            id: userId,
            role: "franchisee",
            location_slug: location_slug,
          });

        if (profileError) {
          await supabase.auth.admin.deleteUser(userId);
          throw profileError;
        }
      }

      const { error: locationError } = await supabase
        .from("user_locations")
        .insert({
          user_id: userId,
          location_slug: location_slug,
        });

      if (locationError) {
        if (!userExists) {
          await supabase.auth.admin.deleteUser(userId);
        }
        throw locationError;
      }

      return new Response(
        JSON.stringify({ success: true, user_id: userId }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (action === "revoke") {
      if (!user_id || !location_slug) {
        return new Response(
          JSON.stringify({ error: "user_id and location_slug are required for revoke action" }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      const { error: deleteError } = await supabase
        .from("user_locations")
        .delete()
        .eq("user_id", user_id)
        .eq("location_slug", location_slug);

      if (deleteError) {
        throw deleteError;
      }

      const { data: remainingLocations } = await supabase
        .from("user_locations")
        .select("*")
        .eq("user_id", user_id);

      if (!remainingLocations || remainingLocations.length === 0) {
        await supabase.auth.admin.deleteUser(user_id);

        const { error: profileDeleteError } = await supabase
          .from("user_profiles")
          .delete()
          .eq("id", user_id);

        if (profileDeleteError) {
          console.error("Failed to delete user profile:", profileDeleteError);
        }
      }

      return new Response(
        JSON.stringify({ success: true }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (action === "delete") {
      if (!user_id) {
        return new Response(
          JSON.stringify({ error: "user_id is required for delete action" }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      const { error: deleteError } = await supabase.auth.admin.deleteUser(user_id);

      if (deleteError) {
        throw deleteError;
      }

      return new Response(
        JSON.stringify({ success: true }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    return new Response(
      JSON.stringify({ error: "Invalid action. Must be 'invite', 'revoke', or 'delete'" }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );

  } catch (error) {
    console.error("Error in manage-franchisee-user:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
