// supabase/functions/create_teacher/index.ts
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.35.0/+esm';
import { corsHeaders } from '../_shared/cors.ts';

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

    const { teacherData, authData } = body;
    if (!teacherData || !authData) {
      return new Response(JSON.stringify({ error: "Missing teacherData or authData" }), {
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

    // Create Auth user (admin)
    const { data: authResult, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: authData.email,
      password: authData.password,
      email_confirm: true,
      user_metadata: {
        role: "teacher",
        full_name: teacherData.name,
      },
    });

    if (authError) {
      return new Response(JSON.stringify({ error: authError.message || authError }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    const newUserId = authResult.user?.id;
    if (!newUserId) {
      return new Response(JSON.stringify({ error: "Failed to obtain new user id" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      });
    }

    // Insert teacher profile
    const { error: profileError } = await supabaseAdmin
      .from("teachers")
      .insert([{ ...teacherData, user_id: newUserId }]);

    if (profileError) {
      return new Response(JSON.stringify({ error: profileError.message || profileError }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    return new Response(JSON.stringify({ success: true, userId: newUserId }), {
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
