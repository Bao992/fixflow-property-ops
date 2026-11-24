import { useEffect, useState } from "react";
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
type ScoutHistoryItem = {
  id: string;
  agent: string;
  provider: string | null;
  model: string | null;
  structured_output: ScoutAnalysis;
  created_at: string;
  review_outcome: "accepted" | "edited" | "dismissed" | null;
};

export function ScoutPanel({ requests }: { requests: RequestOption[] }) {
  const [requestId, setRequestId] = useState("");
  const [analysis, setAnalysis] = useState<ScoutAnalysis | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [savedAt, setSavedAt] = useState("");
  const [history, setHistory] = useState<ScoutHistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState("");
  const [selectedHistoryId, setSelectedHistoryId] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function loadHistory() {
      if (!supabase || !requestId) {
        setHistory([]);
        setHistoryLoading(false);
        setHistoryError("");
        setSelectedHistoryId("");
        return;
      }
      setHistoryLoading(true);
      setHistoryError("");
      const { data, error: queryError } = await supabase
        .from("ai_analyses")
        .select("id, agent, provider, model, structured_output, created_at, review_outcome")
        .eq("request_id", requestId)
        .order("created_at", { ascending: false })
        .limit(20);
      if (cancelled) return;
      if (queryError) {
        setHistory([]);
        setHistoryError("Could not load analysis history. Check your manager access and try again.");
      } else {
        const items = (data ?? []) as ScoutHistoryItem[];
        setHistory(items);
        if (items.length > 0) {
          setSelectedHistoryId(items[0].id);
          setAnalysis(items[0].structured_output);
          setSavedAt(items[0].created_at);
        } else {
          setSelectedHistoryId("");
          setAnalysis(null);
          setSavedAt("");
        }
      }
      setHistoryLoading(false);
    }
    void loadHistory();
    return () => { cancelled = true; };
  }, [requestId]);

  async function runScout() {
    if (!supabase || !requestId) return;
    setBusy(true);
    setError("");
    const { data, error: invokeError } = await supabase.functions.invoke("scout-analyze", { body: { request_id: requestId } });
    if (invokeError) {
      setError(invokeError.message || "Scout could not analyse this request.");
      setBusy(false);
      return;
    }
    if (data?.error) {
      setError(data.error);
      setBusy(false);
      return;
    }
    if (!data?.analysis) {
      setError("Scout returned an unexpected response.");
      setBusy(false);
      return;
    }
    setAnalysis(data.analysis as ScoutAnalysis);
    setSavedAt(data.saved_at || "");
    const { data: rows, error: queryError } = await supabase
      .from("ai_analyses")
      .select("id, agent, provider, model, structured_output, created_at, review_outcome")
      .eq("request_id", requestId)
      .order("created_at", { ascending: false })
      .limit(20);
    if (queryError) {
      setHistoryError("The analysis was saved, but history could not be refreshed.");
    } else {
      const items = (rows ?? []) as ScoutHistoryItem[];
      setHistory(items);
      if (items.length > 0) setSelectedHistoryId(items[0].id);
    }
    setBusy(false);
  }

  function selectHistory(id: string) {
    setSelectedHistoryId(id);
    const item = history.find(entry => entry.id === id);
    if (item) {
      setAnalysis(item.structured_output);
      setSavedAt(item.created_at);
      setError("");
    }
  }

  const selectedHistory = history.find(item => item.id === selectedHistoryId);

  return <section className="workflow-panel scout-panel">
    <div className="scout-heading"><div><span className="scout-kicker">FIXFLOW INTELLIGENCE</span><h2>Scout · Maintenance triage</h2><p>Turn a resident's report into a clear, reviewable maintenance assessment.</p></div><span className="scout-avatar">S</span></div>
    <div className="scout-callout">Scout is advisory only. It will not change request status, priority, approvals or contractor assignments.</div>
    {requests.length === 0 ? <p>No maintenance requests are available to analyse yet.</p> : <div className="scout-controls"><label>Choose a maintenance request<select value={requestId} onChange={event => { setRequestId(event.target.value); setAnalysis(null); setSavedAt(""); setError(""); }}><option value="">Select a request</option>{requests.map(request => <option key={request.id} value={request.id}>{request.title} · {request.status}</option>)}</select></label><button className="primary" disabled={!requestId || busy} onClick={() => void runScout()}>{busy ? "Scout is analysing…" : "✦ Analyse with Scout"}</button></div>}
    {error && <div className="workflow-notice scout-error" role="alert">{error}</div>}
    {requestId && <div className="scout-history">
      <div className="scout-history-heading"><div><h3>Analysis history</h3><p>Previous Scout assessments for this request</p></div><span>{history.length} / 20</span></div>
      {historyLoading ? <p className="scout-history-state">Loading saved analyses…</p> : historyError ? <p className="scout-history-state scout-history-error" role="alert">{historyError}</p> : history.length === 0 ? <p className="scout-history-state">No saved analyses yet. Run Scout to create the first assessment.</p> : <div className="scout-history-list">
        {history.map(item => <button type="button" key={item.id} className={item.id === selectedHistoryId ? "scout-history-item selected" : "scout-history-item"} onClick={() => selectHistory(item.id)}>
          <span><b>{item.structured_output?.category || "Maintenance assessment"}</b><small>{new Date(item.created_at).toLocaleString()}</small></span>
          <span className={"scout-history-urgency " + (item.structured_output?.urgency || "low").toLowerCase()}>{item.structured_output?.urgency || "Unknown"}</span>
        </button>)}
      </div>}
    </div>}
    {analysis && <div className="scout-result" aria-live="polite">
      <div className="scout-result-top"><div><small>{selectedHistory ? "SAVED ANALYSIS" : "ANALYSIS COMPLETE"}</small><h3>{analysis.category}</h3></div><span className={`scout-urgency ${analysis.urgency.toLowerCase()}`}>{analysis.urgency} suggested urgency</span></div>
      <p className="scout-summary">{analysis.summary}</p>
      <div className="scout-result-grid">
        <article><h4>Safety flags</h4>{analysis.safety_flags.length ? <ul>{analysis.safety_flags.map((item, i) => <li key={i}>{item}</li>)}</ul> : <p>No specific safety flags identified in the supplied report.</p>}</article>
        <article><h4>Recommended actions</h4>{analysis.recommended_actions.length ? <ul>{analysis.recommended_actions.map((item, i) => <li key={i}>{item}</li>)}</ul> : <p>No actions returned.</p>}</article>
        <article><h4>Questions to confirm</h4>{analysis.questions_for_manager.length ? <ul>{analysis.questions_for_manager.map((item, i) => <li key={i}>{item}</li>)}</ul> : <p>No additional questions returned.</p>}</article>
        <article><h4>Why Scout suggests this</h4><p>{analysis.reasoning}</p><span className="scout-confidence">Confidence: {analysis.confidence}</span></article>
      </div>
      {savedAt && <small className="scout-saved">Saved to the request's AI analysis history · {new Date(savedAt).toLocaleString()}</small>}
      {selectedHistory?.provider && <small className="scout-history-meta">Provider: {selectedHistory.provider}{selectedHistory.model ? ` · Model: ${selectedHistory.model}` : ""}</small>}
    </div>}
  </section>;
}
