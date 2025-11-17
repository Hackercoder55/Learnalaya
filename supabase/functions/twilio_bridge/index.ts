// supabase/functions/twilio_bridge/index.ts
import { corsHeaders } from "../_shared/cors.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json().catch(() => null);
    if (!body) {
      return new Response(JSON.stringify({ error: "Missing JSON body" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    const action = body.action || "";
    const accountSid = Deno.env.get("TWILIO_ACCOUNT_SID") || "";
    const authToken = Deno.env.get("TWILIO_AUTH_TOKEN") || "";
    const verifyServiceSid = Deno.env.get("TWILIO_VERIFY_SERVICE_SID") || "";
    const whatsappFrom = Deno.env.get("TWILIO_WHATSAPP_FROM") || "";
    const smsFrom = Deno.env.get("TWILIO_SMS_FROM") || "";

    if (!accountSid || !authToken) {
      throw new Error("Twilio credentials not configured in function secrets.");
    }

    const basicAuth = "Basic " + btoa(`${accountSid}:${authToken}`);

    // Helper to POST form data to Twilio Messages API
    async function sendTwilioMessage(params: Record<string, string>) {
      const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
      const bodyData = new URLSearchParams(params);
      const resp = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: basicAuth,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: bodyData.toString(),
      });
      const json = await resp.json();
      if (!resp.ok) throw new Error(JSON.stringify(json));
      return json;
    }

    // Actions:
    // 1) send_whatsapp -> { to, message }
    // 2) start_otp -> { to, channel } // channel = 'sms' or 'whatsapp'
    // 3) check_otp -> { to, code }
    // 4) send_sms -> { to, message }
    if (action === "send_whatsapp") {
      const to = body.to; // e.g. +919999999999
      const message = body.message;
      if (!to || !message) {
        return new Response(JSON.stringify({ error: "Missing to or message" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        });
      }
      // Twilio WhatsApp uses 'whatsapp:+<number>' format
      const toWp = to.startsWith("whatsapp:") ? to : `whatsapp:${to}`;
      const from = whatsappFrom.startsWith("whatsapp:") ? whatsappFrom : `whatsapp:${whatsappFrom}`;

      const msg = await sendTwilioMessage({
        To: toWp,
        From: from,
        Body: message,
      });

      return new Response(JSON.stringify({ success: true, result: msg }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "send_sms") {
      const to = body.to;
      const message = body.message;
      if (!to || !message) {
        return new Response(JSON.stringify({ error: "Missing to or message" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        });
      }
      if (!smsFrom) throw new Error("TWILIO_SMS_FROM not set");
      const msg = await sendTwilioMessage({
        To: to,
        From: smsFrom,
        Body: message,
      });
      return new Response(JSON.stringify({ success: true, result: msg }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "start_otp") {
      // Use Twilio Verify API to send OTP
      const to = body.to; // e.g. +919999999999
      const channel = body.channel || "sms"; // 'sms' or 'whatsapp'
      if (!verifyServiceSid) throw new Error("TWILIO_VERIFY_SERVICE_SID not configured.");
      if (!to) {
        return new Response(JSON.stringify({ error: "Missing 'to' phone number" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        });
      }
      const url = `https://verify.twilio.com/v2/Services/${verifyServiceSid}/Verifications`;
      const data = new URLSearchParams({ To: to, Channel: channel });
      const resp = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: basicAuth,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: data.toString(),
      });
      const json = await resp.json();
      if (!resp.ok) {
        return new Response(JSON.stringify({ error: json }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: resp.status,
        });
      }
      return new Response(JSON.stringify({ success: true, result: json }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "check_otp") {
      const to = body.to;
      const code = body.code;
      if (!verifyServiceSid) throw new Error("TWILIO_VERIFY_SERVICE_SID not configured.");
      if (!to || !code) {
        return new Response(JSON.stringify({ error: "Missing 'to' or 'code'" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        });
      }
      const url = `https://verify.twilio.com/v2/Services/${verifyServiceSid}/VerificationCheck`;
      const data = new URLSearchParams({ To: to, Code: code });
      const resp = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: basicAuth,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: data.toString(),
      });
      const json = await resp.json();
      if (!resp.ok) {
        return new Response(JSON.stringify({ error: json }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: resp.status,
        });
      }
      // json.status will be 'pending' or 'approved'
      return new Response(JSON.stringify({ success: true, result: json }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message || String(err) }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
