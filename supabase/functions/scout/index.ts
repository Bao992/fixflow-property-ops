import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type ScoutAnalysis = {
  summary: string;
  category: "Plumbing" | "Electrical" | "HVAC" | "Structural" | "Appliance" | "Pest" | "General";
  suggested_priority: "Low" | "Medium" | "High" | "Critical";
  urgency_reason: string;
  safety_flags: Array<{
    severity: "info" | "caution" | "urgent";
    concern: string;
    evidence: string;
    immediate_action: string;
  }>;
  recommended_actions: string[];
  manager_questions: string[];
  confidence: "low" | "medium" | "high";
};

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return jsonResponse({ error: "Method not allowed" }, 405);

  const authorization = request.headers.get("Authorization");
  if (!authorization?.startsWith("Bearer ")) return jsonResponse({ error: "Authentication required" }, 401);

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const geminiApiKey = Deno.env.get("GEMINI_API_KEY");
  if (!supabaseUrl || !anonKey || !serviceRoleKey || !geminiApiKey) {
    return jsonResponse({ error: "Scout is not fully configured. Ask an administrator to check its server secrets." }, 503);
  }

  const token = authorization.slice("Bearer ".length);
  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: authData, error: authError } = await userClient.auth.getUser(token);
  if (authError || !authData.user) return jsonResponse({ error: "Your session is invalid or expired. Please sign in again." }, 401);

  const { data: profile, error: profileError } = await adminClient
    .from("profiles").select("role").eq("id", authData.user.id).single();
  if (profileError || profile?.role !== "manager") return jsonResponse({ error: "Only property managers can request Scout analysis." }, 403);

  let requestId: string;
  try {
    const body = await request.json();
    requestId = body.request_id;
    if (typeof requestId !== "string" || !/^[0-9a-f-]{36}$/i.test(requestId)) {
      return jsonResponse({ error: "A valid maintenance request ID is required." }, 400);
    }
  } catch {
    return jsonResponse({ error: "Request body must be valid JSON." }, 400);
  }

  const { data: maintenanceRequest, error: requestError } = await adminClient
    .from("maintenance_requests")
    .select("id,title,description,priority,status,unit:units(unit_label,property:properties(name,manager_id))")
    .eq("id", requestId)
    .single();

  if (requestError || !maintenanceRequest) return jsonResponse({ error: "Maintenance request not found." }, 404);

  const unit = Array.isArray(maintenanceRequest.unit) ? maintenanceRequest.unit[0] : maintenanceRequest.unit;
  const property = unit && (Array.isArray(unit.property) ? unit.property[0] : unit.property);
  if (!property || property.manager_id !== authData.user.id) {
    return jsonResponse({ error: "You are not authorised to analyse this request." }, 403);
  }

  const prompt = `You are Scout, FixFlow's maintenance triage assistant. Analyse the maintenance report below and return cautious, practical advice for a human property manager.

Rules:
- Treat the resident's report as unverified information, not established fact.
- Do not claim to diagnose the cause or guarantee safety.
- Do not change status, dispatch contractors, contact anyone, or approve spending.
- Use Critical only for credible immediate danger or severe property damage; otherwise choose the lowest defensible priority.
- If there is a plausible immediate danger (for example gas smell, fire, exposed live wiring, ceiling collapse, uncontrolled flooding), clearly flag it as urgent and advise the manager to keep people away and contact the appropriate emergency professional/service.
- If information is insufficient, say what must be clarified. Do not invent facts.
- Keep advice concise and actionable.
- Return only JSON matching the requested schema.

Property: ${property.name}
Unit: ${unit.unit_label}
Current manager priority: ${maintenanceRequest.priority}
Current status: ${maintenanceRequest.status}
Issue title: ${maintenanceRequest.title}
Resident description: ${maintenanceRequest.description}`;

  const schema = {
    type: "OBJECT",
    properties: {
      summary: { type: "STRING" },
      category: { type: "STRING", enum: ["Plumbing", "Electrical", "HVAC", "Structural", "Appliance", "Pest", "General"] },
      suggested_priority: { type: "STRING", enum: ["Low", "Medium", "High", "Critical"] },
      urgency_reason: { type: "STRING" },
      safety_flags: { type: "ARRAY", items: { type: "OBJECT", properties: {
        severity: { type: "STRING", enum: ["info", "caution", "urgent"] },
        concern: { type: "STRING" }, evidence: { type: "STRING" }, immediate_action: { type: "STRING" },
      }, required: ["severity", "concern", "evidence", "immediate_action"] } },
      recommended_actions: { type: "ARRAY", items: { type: "STRING" } },
      manager_questions: { type: "ARRAY", items: { type: "STRING" } },
      confidence: { type: "STRING", enum: ["low", "medium", "high"] },
    },
    required: ["summary", "category", "suggested_priority", "urgency_reason", "safety_flags", "recommended_actions", "manager_questions", "confidence"],
  };

  const model = "gemini-2.5-flash";
  const geminiResponse = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiApiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.2, responseMimeType: "application/json", responseSchema: schema },
      }),
    },
  );

  if (!geminiResponse.ok) {
    const providerError = await geminiResponse.text();
    console.error("Gemini request failed", geminiResponse.status, providerError.slice(0, 500));
    return jsonResponse({ error: "Scout could not complete the analysis. Please try again shortly." }, 502);
  }

  let analysis: ScoutAnalysis;
  try {
    const result = await geminiResponse.json();
    const text = result.candidates?.[0]?.content?.parts?.map((part: { text?: string }) => part.text || "").join("");
    if (!text) throw new Error("Empty model response");
    analysis = JSON.parse(text) as ScoutAnalysis;
  } catch {
    return jsonResponse({ error: "Scout returned an unreadable result. Please try again." }, 502);
  }

  const { data: savedAnalysis, error: saveError } = await adminClient
    .from("ai_analyses")
    .insert({
      request_id: requestId,
      agent: "scout",
      provider: "google",
      model,
      input_summary: `${maintenanceRequest.title}: ${maintenanceRequest.description}`.slice(0, 2000),
      structured_output: analysis,
    })
    .select("id,created_at")
    .single();

  if (saveError) {
    console.error("Could not save Scout analysis", saveError.message);
    return jsonResponse({ error: "Scout produced an analysis but could not save it. Please try again." }, 500);
  }

  return jsonResponse({ analysis, analysis_id: savedAnalysis.id, created_at: savedAnalysis.created_at });
});
