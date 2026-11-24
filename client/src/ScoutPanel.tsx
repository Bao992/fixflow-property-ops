import { useState } from "react";
import { supabase } from "./lib/supabase";

type RequestOption = { id: string; title: string; description: string; status: string; priority: string };
type ScoutAnalysis = {
  category: string;
  urgency: "Low" | "Medium" | "High" | "Critical";
  summary: string;
  safety_flags: string[];
  recommended_actions: string[];
  questions_for_manager: string[];
  reasoning: string;
  confidence: "low" | "medium" | "high";
};

export function ScoutPanel({ requests }: { requests: RequestOption[] }) {
  const [requestId, setRequestId] = useState("");
  const [analysis, setAnalysis] = useState<ScoutAnalysis | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [savedAt, setSavedAt] = useState("");

  async function runScout() {
    if (!supabase || !requestId) return;
    setBusy(true); setError(""); setAnalysis(null); setSavedAt("");
    const { data, error: invokeError } = await supabase.functions.invoke("scout-analyze", { body: { request_id: requestId } });
    if (invokeError) setError(invokeError.message || "Scout could not analyse this request.");
    else if (data?.error) setError(data.error);
    else if (data?.analysis) { setAnalysis(data.analysis as ScoutAnalysis); setSavedAt(data.saved_at || ""); }
    else setError("Scout returned an unexpected response.");
    setBusy(false);
  }

  return <section className="workflow-panel scout-panel">
    <div className="scout-heading"><div><span className="scout-kicker">FIXFLOW INTELLIGENCE</span><h2>Scout · Maintenance triage</h2><p>Turn a resident's report into a clear, reviewable maintenance assessment.</p></div><span className="scout-avatar">S</span></div>
    <div className="scout-callout">Scout is advisory only. It will not change request status, priority, approvals or contractor assignments.</div>
    {requests.length === 0 ? <p>No maintenance requests are available to analyse yet.</p> : <div className="scout-controls"><label>Choose a maintenance request<select value={requestId} onChange={event => { setRequestId(event.target.value); setAnalysis(null); setError(""); }}><option value="">Select a request</option>{requests.map(request => <option key={request.id} value={request.id}>{request.title} · {request.status}</option>)}</select></label><button className="primary" disabled={!requestId || busy} onClick={() => void runScout()}>{busy ? "Scout is analysing…" : "✦ Analyse with Scout"}</button></div>}
    {error && <div className="workflow-notice scout-error" role="alert">{error}</div>}
    {analysis && <div className="scout-result" aria-live="polite">
      <div className="scout-result-top"><div><small>ANALYSIS COMPLETE</small><h3>{analysis.category}</h3></div><span className={`scout-urgency ${analysis.urgency.toLowerCase()}`}>{analysis.urgency} suggested urgency</span></div>
      <p className="scout-summary">{analysis.summary}</p>
      <div className="scout-result-grid">
        <article><h4>Safety flags</h4>{analysis.safety_flags.length ? <ul>{analysis.safety_flags.map((item, i) => <li key={i}>{item}</li>)}</ul> : <p>No specific safety flags identified in the supplied report.</p>}</article>
        <article><h4>Recommended actions</h4>{analysis.recommended_actions.length ? <ul>{analysis.recommended_actions.map((item, i) => <li key={i}>{item}</li>)}</ul> : <p>No actions returned.</p>}</article>
        <article><h4>Questions to confirm</h4>{analysis.questions_for_manager.length ? <ul>{analysis.questions_for_manager.map((item, i) => <li key={i}>{item}</li>)}</ul> : <p>No additional questions returned.</p>}</article>
        <article><h4>Why Scout suggests this</h4><p>{analysis.reasoning}</p><span className="scout-confidence">Confidence: {analysis.confidence}</span></article>
      </div>
      {savedAt && <small className="scout-saved">Saved to the request's AI analysis history · {new Date(savedAt).toLocaleString()}</small>}
    </div>}
  </section>;
}
