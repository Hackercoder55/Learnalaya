// supabase/functions/create_parent_and_student/index.ts
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.35.0/+esm';
import { corsHeaders } from "../_shared/cors.ts";


Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json().catch(() => null);
    if (!body) {
      return new Response(JSON.stringify({ error: "Invalid or missing JSON body" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    const { parentData, studentData } = body;
    if (!parentData || !studentData) {
      return new Response(JSON.stringify({ error: "Missing parentData or studentData" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      return new Response(JSON.stringify({ error: "Server misconfiguration: missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      });
    }

    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Create or fetch parent user by phone (phone-based auth)
    let user;
    let { data: createdUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      phone: parentData.phone,
      phone_confirm: true,
      user_metadata: {
        role: "parent",
        full_name: parentData.name,
      },
    });

    if (authError) {
      // handle already exists case
      if (authError.message && authError.message.includes("phone number already exists")) {
        const { data: listData, error: listError } = await supabaseAdmin.auth.admin.listUsers({ phone: parentData.phone });
        if (listError) throw listError;
        user = listData.users[0];
      } else {
        return new Response(JSON.stringify({ error: authError.message || authError }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        });
      }
    } else {
      user = createdUser.user;
    }

    if (!user || !user.id) {
      return new Response(JSON.stringify({ error: "Failed to create or find parent user" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      });
    }

    // Insert student and link to parent user id
    const { error: studentError } = await supabaseAdmin
      .from("students")
      .insert([{ ...studentData, parent_user_id: user.id }]);

    if (studentError) {
      return new Response(JSON.stringify({ error: studentError.message || studentError }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    return new Response(JSON.stringify({ success: true, parentId: user.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message || String(error) }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
