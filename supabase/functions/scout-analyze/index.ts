import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": Deno.env.get("SCOUT_ALLOWED_ORIGIN") ?? "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type ScoutResult = {
  category: string;
  urgency: "Low" | "Medium" | "High" | "Critical";
  summary: string;
  safety_flags: string[];
  recommended_actions: string[];
  questions_for_manager: string[];
  reasoning: string;
  confidence: "low" | "medium" | "high";
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

const TRANSIENT_PROVIDER_STATUSES = new Set([429, 500, 502, 503, 504]);

async function generateWithModel(
  model: string,
  apiKey: string,
  prompt: string,
  maxAttempts: number,
): Promise<Response> {
  let lastResponse: Response | null = null;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            generationConfig: { responseMimeType: "application/json", temperature: 0.2 },
          }),
        },
      );

      if (response.ok || !TRANSIENT_PROVIDER_STATUSES.has(response.status) || attempt === maxAttempts - 1) {
        return response;
      }

      lastResponse = response;
      const retryAfter = Number(response.headers.get("Retry-After"));
      const delayMs = Number.isFinite(retryAfter) && retryAfter > 0
        ? Math.min(retryAfter * 1000, 5000)
        : 700 * (2 ** attempt);
      await response.body?.cancel();
      console.warn(`Scout model ${model} returned HTTP ${response.status}; retrying in ${delayMs}ms (attempt ${attempt + 1}/${maxAttempts}).`);
      await new Promise(resolve => setTimeout(resolve, delayMs));
    } catch (error) {
      console.error(`Scout network error for model ${model}`, error);
      if (attempt === maxAttempts - 1) {
        throw error;
      }
      await new Promise(resolve => setTimeout(resolve, 700 * (2 ** attempt)));
    }
  }

  return lastResponse ?? new Response("Provider request failed", { status: 503 });
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return jsonResponse({ error: "Method not allowed" }, 405);

  const authorization = request.headers.get("Authorization");
  if (!authorization?.startsWith("Bearer ")) return jsonResponse({ error: "Authentication required" }, 401);

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const geminiKey = Deno.env.get("GEMINI_API_KEY");
  const model = Deno.env.get("GEMINI_MODEL") ?? "gemini-3.5-flash-lite";
  const fallbackModel = Deno.env.get("GEMINI_FALLBACK_MODEL") ?? "gemini-3.1-flash-lite";
  if (!supabaseUrl || !anonKey || !geminiKey) {
    return jsonResponse({ error: "Scout is not configured. Ask the administrator to check its server secrets." }, 503);
  }

  const supabase = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authorization } },
    auth: { persistSession: false, autoRefreshToken: false },
  });

  try {
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) return jsonResponse({ error: "Your session could not be verified." }, 401);

    const { data: profile, error: profileError } = await supabase
      .from("profiles").select("role").eq("id", userData.user.id).single();
    if (profileError || profile?.role !== "manager") return jsonResponse({ error: "Only property managers can run Scout." }, 403);

    const payload = await request.json().catch(() => null) as { request_id?: string } | null;
    const requestId = payload?.request_id;
    if (!requestId || typeof requestId !== "string" || requestId.length > 80) {
      return jsonResponse({ error: "A valid maintenance request ID is required." }, 400);
    }

    const { data: maintenance, error: requestError } = await supabase
      .from("maintenance_requests")
      .select("id,title,description,category,priority,status,unit_id,units!inner(property_id,properties!inner(manager_id,name))")
      .eq("id", requestId)
      .single();
    if (requestError || !maintenance) return jsonResponse({ error: "Maintenance request not found or inaccessible." }, 404);

    const unit = Array.isArray(maintenance.units) ? maintenance.units[0] : maintenance.units;
    const property = unit && (Array.isArray(unit.properties) ? unit.properties[0] : unit.properties);
    if (!property || property.manager_id !== userData.user.id) {
      return jsonResponse({ error: "You do not manage this maintenance request." }, 403);
    }

    const prompt = `You are Scout, FixFlow's cautious maintenance triage assistant. Analyse the resident's report and return ONLY valid JSON matching this schema:
{
  "category": "short trade/category label",
  "urgency": "Low|Medium|High|Critical",
  "summary": "one or two sentence factual summary",
  "safety_flags": ["specific potential hazard, or an empty array"],
  "recommended_actions": ["practical next steps for the property manager"],
  "questions_for_manager": ["important missing facts to confirm"],
  "reasoning": "brief explanation tied to evidence in the report",
  "confidence": "low|medium|high"
}
Rules: Do not diagnose beyond the evidence. Do not invent facts, costs, legal duties, or contractor availability. Treat immediate danger indicators (fire, gas smell, sparking/exposed live wiring, structural collapse, uncontrolled flooding near electricity) cautiously and recommend urgent human assessment/emergency services as appropriate. If details are insufficient, lower confidence and ask questions. Urgency is a recommendation, not a database priority change. Never change status, approve spending, contact anyone, or claim work is completed.

Property: ${property.name}
Current status: ${maintenance.status}
Resident title: ${maintenance.title}
Resident description: ${maintenance.description}
Existing category: ${maintenance.category ?? "Not set"}
Existing priority: ${maintenance.priority}`;

    let modelUsed = model;
    let modelResponse = await generateWithModel(model, geminiKey, prompt, 3);

    if (!modelResponse.ok && TRANSIENT_PROVIDER_STATUSES.has(modelResponse.status) && fallbackModel && fallbackModel !== model) {
      const primaryStatus = modelResponse.status;
      const providerError = await modelResponse.text();
      console.error("Scout primary model remained unavailable after retries", primaryStatus, providerError.slice(0, 500));
      console.warn(`Scout switching to configured fallback model ${fallbackModel}.`);
      modelUsed = fallbackModel;
      modelResponse = await generateWithModel(fallbackModel, geminiKey, prompt, 2);
    }

    if (!modelResponse.ok) {
      const providerError = await modelResponse.text();
      console.error("Scout provider error", modelUsed, modelResponse.status, providerError.slice(0, 500));
      const isTransient = TRANSIENT_PROVIDER_STATUSES.has(modelResponse.status);
      return jsonResponse({
        error: isTransient
          ? "Scout is temporarily busy. Your request is safe; please try again in a few moments."
          : "Scout could not complete the analysis. Please check the model configuration and try again.",
      }, isTransient ? 503 : 502);
    }

    const modelPayload = await modelResponse.json();
    const text = modelPayload?.candidates?.[0]?.content?.parts?.map((part: { text?: string }) => part.text ?? "").join("");
    if (typeof text !== "string" || !text.trim()) return jsonResponse({ error: "Scout returned an empty analysis." }, 502);

    let analysis: ScoutResult;
    try {
      analysis = JSON.parse(text) as ScoutResult;
    } catch {
      return jsonResponse({ error: "Scout returned an unreadable result. Please try again." }, 502);
    }

    const allowedUrgencies = ["Low", "Medium", "High", "Critical"];
    const allowedConfidence = ["low", "medium", "high"];
    if (
      typeof analysis.category !== "string" || typeof analysis.summary !== "string" ||
      !allowedUrgencies.includes(analysis.urgency) || !allowedConfidence.includes(analysis.confidence) ||
      !Array.isArray(analysis.safety_flags) || !Array.isArray(analysis.recommended_actions) ||
      !Array.isArray(analysis.questions_for_manager) || typeof analysis.reasoning !== "string"
    ) return jsonResponse({ error: "Scout's response did not match the expected format." }, 502);

    const structuredOutput = {
      ...analysis,
      safety_flags: analysis.safety_flags.slice(0, 8).map(String),
      recommended_actions: analysis.recommended_actions.slice(0, 8).map(String),
      questions_for_manager: analysis.questions_for_manager.slice(0, 8).map(String),
    };

    const { data: saved, error: saveError } = await supabase.from("ai_analyses").insert({
      request_id: maintenance.id,
      agent: "scout",
      provider: "google",
      model: modelUsed,
      input_summary: `${maintenance.title}: ${maintenance.description.slice(0, 1500)}`,
      structured_output: structuredOutput,
    }).select("id,created_at").single();
    if (saveError) {
      console.error("Scout analysis save failed", saveError.message);
      return jsonResponse({ error: "Analysis completed but could not be saved. Please check database permissions." }, 500);
    }

    return jsonResponse({ analysis: structuredOutput, saved_at: saved.created_at, model: modelUsed });
  } catch (error) {
    console.error("Scout unexpected error", error);
    return jsonResponse({ error: "Scout encountered an unexpected error." }, 500);
  }
});
