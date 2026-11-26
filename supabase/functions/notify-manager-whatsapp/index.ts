import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": Deno.env.get("SCOUT_ALLOWED_ORIGIN") ?? "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function response(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return response({ error: "Method not allowed" }, 405);
  const authorization = request.headers.get("Authorization");
  if (!authorization?.startsWith("Bearer ")) return response({ error: "Authentication required" }, 401);

  const url = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const token = Deno.env.get("WHATSAPP_ACCESS_TOKEN");
  const phoneNumberId = Deno.env.get("WHATSAPP_PHONE_NUMBER_ID");
  const templateName = Deno.env.get("WHATSAPP_TEMPLATE_NAME");
  const graphVersion = Deno.env.get("WHATSAPP_GRAPH_API_VERSION") ?? "v22.0";
  const language = Deno.env.get("WHATSAPP_TEMPLATE_LANGUAGE") ?? "en";
  const appBaseUrl = Deno.env.get("APP_BASE_URL") ?? "https://fixflow.app";
  if (!url || !anonKey || !serviceKey || !token || !phoneNumberId || !templateName) {
    return response({ delivered: false, configured: false, message: "WhatsApp notifications are not configured yet." }, 503);
  }

  const userClient = createClient(url, anonKey, { global: { headers: { Authorization: authorization } }, auth: { persistSession: false, autoRefreshToken: false } });
  const admin = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });

  try {
    const { data: authData, error: authError } = await userClient.auth.getUser();
    if (authError || !authData.user) return response({ error: "Session could not be verified." }, 401);
    const body = await request.json().catch(() => null) as { request_id?: unknown } | null;
    const requestId = body?.request_id;
    if (typeof requestId !== "string" || !/^[0-9a-f-]{36}$/i.test(requestId)) return response({ error: "A valid request ID is required." }, 400);

    const { data: maintenance, error: maintenanceError } = await userClient
      .from("maintenance_requests")
      .select("id,title,description,created_by,unit_id,units!inner(unit_label,property_id,properties!inner(id,name,manager_id))")
      .eq("id", requestId).single();
    if (maintenanceError || !maintenance) return response({ error: "Request not found or inaccessible." }, 404);
    const unit = Array.isArray(maintenance.units) ? maintenance.units[0] : maintenance.units;
    const property = unit && (Array.isArray(unit.properties) ? unit.properties[0] : unit.properties);
    if (!property) return response({ error: "Property details are unavailable." }, 404);

    const { data: profile } = await userClient.from("profiles").select("role").eq("id", authData.user.id).single();
    const managerCaller = profile?.role === "manager" && property.manager_id === authData.user.id;
    const tenantCaller = profile?.role === "tenant" && maintenance.created_by === authData.user.id;
    if (!managerCaller && !tenantCaller) return response({ error: "You cannot notify this property's manager." }, 403);

    const { data: settings, error: settingsError } = await admin.from("manager_notification_settings")
      .select("whatsapp_number,enabled").eq("manager_id", property.manager_id).maybeSingle();
    if (settingsError || !settings?.enabled || !settings.whatsapp_number) {
      return response({ delivered: false, configured: true, message: "The property manager has not enabled WhatsApp notifications." }, 200);
    }

    const { data: analysisRows } = await admin.from("ai_analyses")
      .select("structured_output").eq("request_id", requestId).eq("agent", "scout")
      .order("created_at", { ascending: false }).limit(1);
    const analysis = analysisRows?.[0]?.structured_output as Record<string, unknown> | undefined;
    const urgency = typeof analysis?.urgency === "string" ? analysis.urgency : "Pending review";
    const summary = typeof analysis?.summary === "string" ? analysis.summary : maintenance.description.slice(0, 240);
    const reportUrl = `${appBaseUrl.replace(/\/$/, "")}/`;

    const graphResponse = await fetch(`https://graph.facebook.com/${graphVersion}/${phoneNumberId}/messages`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: settings.whatsapp_number.replace(/^\+/, ""),
        type: "template",
        template: {
          name: templateName,
          language: { code: language },
          components: [{
            type: "body",
            parameters: [
              { type: "text", text: String(property.name).slice(0, 120) },
              { type: "text", text: String(unit.unit_label).slice(0, 80) },
              { type: "text", text: String(maintenance.title).slice(0, 160) },
              { type: "text", text: urgency.slice(0, 40) },
              { type: "text", text: summary.slice(0, 500) },
              { type: "text", text: reportUrl },
            ],
          }],
        },
      }),
    });
    const result = await graphResponse.json().catch(() => ({}));
    if (!graphResponse.ok) {
      console.error("WhatsApp delivery failed", graphResponse.status, JSON.stringify(result).slice(0, 1000));
      return response({ delivered: false, message: "WhatsApp could not deliver this notification. The maintenance request remains saved." }, 502);
    }
    return response({ delivered: true, message_id: result?.messages?.[0]?.id ?? null });
  } catch (error) {
    console.error("WhatsApp notification error", error);
    return response({ delivered: false, message: "Notification failed. The maintenance request remains saved." }, 500);
  }
});
