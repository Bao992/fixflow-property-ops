import { FormEvent, useEffect, useMemo, useState } from "react";
import type { Profile } from "./types";
import { supabase } from "./lib/supabase";

type TenantUnit = { id: string; property_id: string; unit_label: string; description: string | null };
type TenantProperty = { id: string; name: string; address_line_1: string; locality: string | null; region: string | null };
type TenantRequest = { id: string; title: string; description: string; status: string; priority: string; created_at: string; unit_id: string };
type EvidenceFile = { file: File; preview: string };

const MAX_FILES = 4;
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/heic"];

export function TenantWorkspace({ profile, onSignOut }: { profile: Profile; onSignOut: () => void }) {
  const [units, setUnits] = useState<TenantUnit[]>([]);
  const [properties, setProperties] = useState<TenantProperty[]>([]);
  const [requests, setRequests] = useState<TenantRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [unitId, setUnitId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [evidence, setEvidence] = useState<EvidenceFile[]>([]);

  async function loadWorkspace() {
    if (!supabase) return;
    setLoading(true);
    const { data: links, error: linkError } = await supabase.from("unit_tenants").select("unit_id").eq("tenant_id", profile.id).eq("active", true).is("end_at", null);
    if (linkError) { setNotice(linkError.message); setLoading(false); return; }
    const linkedUnitIds = (links || []).map(link => link.unit_id as string);
    if (linkedUnitIds.length === 0) { setUnits([]); setProperties([]); setRequests([]); setLoading(false); return; }
    const { data: unitData, error: unitError } = await supabase.from("units").select("id,property_id,unit_label,description").in("id", linkedUnitIds);
    if (unitError) setNotice(unitError.message);
    const loadedUnits = (unitData || []) as TenantUnit[];
    setUnits(loadedUnits);
    if (!unitId && loadedUnits[0]) setUnitId(loadedUnits[0].id);
    const propertyIds = [...new Set(loadedUnits.map(unit => unit.property_id))];
    const [propertyResult, requestResult] = await Promise.all([
      supabase.from("properties").select("id,name,address_line_1,locality,region").in("id", propertyIds),
      supabase.from("maintenance_requests").select("id,title,description,status,priority,created_at,unit_id").eq("created_by", profile.id).order("created_at", { ascending: false }),
    ]);
    if (propertyResult.error) setNotice(propertyResult.error.message);
    if (requestResult.error) setNotice(requestResult.error.message);
    setProperties((propertyResult.data || []) as TenantProperty[]);
    setRequests((requestResult.data || []) as TenantRequest[]);
    setLoading(false);
  }

  useEffect(() => { void loadWorkspace(); }, [profile.id]);
  useEffect(() => () => evidence.forEach(item => URL.revokeObjectURL(item.preview)), [evidence]);

  function addEvidence(files: FileList | null) {
    if (!files) return;
    const selected = Array.from(files);
    if (evidence.length + selected.length > MAX_FILES) { setNotice(`You can attach up to ${MAX_FILES} photos to one request.`); return; }
    const invalid = selected.find(file => !ACCEPTED_TYPES.includes(file.type) || file.size > MAX_FILE_SIZE);
    if (invalid) { setNotice("Use JPEG, PNG, WebP or HEIC photos up to 5 MB each."); return; }
    setEvidence(current => [...current, ...selected.map(file => ({ file, preview: URL.createObjectURL(file) }))]);
    setNotice("");
  }

  function removeEvidence(index: number) {
    setEvidence(current => current.filter((_, itemIndex) => itemIndex !== index));
  }

  async function submitRequest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase || !unitId) return;
    setBusy(true); setNotice("");
    let requestId: string | null = null;
    try {
      const { data: created, error: createError } = await supabase.from("maintenance_requests").insert({
        unit_id: unitId, created_by: profile.id, title: title.trim(), description: description.trim(),
      }).select("id").single();
      if (createError || !created) throw createError || new Error("The request could not be created.");
      requestId = created.id as string;

      for (const item of evidence) {
        const extension = item.file.name.split(".").pop()?.toLowerCase() || "jpg";
        const path = `${requestId}/${crypto.randomUUID()}.${extension}`;
        const { error: uploadError } = await supabase.storage.from("maintenance-evidence").upload(path, item.file, {
          contentType: item.file.type, upsert: false,
        });
        if (uploadError) throw new Error(`Your request was saved, but a photo could not be uploaded: ${uploadError.message}`);
        const { error: metadataError } = await supabase.from("request_attachments").insert({
          request_id: requestId, uploader_id: profile.id, storage_path: path,
          mime_type: item.file.type, file_size_bytes: item.file.size,
        });
        if (metadataError) throw new Error(`Your request was saved, but photo details could not be recorded: ${metadataError.message}`);
      }

      const submittedWithPhotos = evidence.length > 0;
      setTitle(""); setDescription(""); setEvidence([]);
      setNotice(submittedWithPhotos ? "Your maintenance request and photos were submitted. Scout is analysing the report…" : "Your maintenance request was submitted. Scout is analysing the report…");
      const { error: scoutError } = await supabase.functions.invoke("scout-analyze", { body: { request_id: requestId } });
      const { data: notificationResult, error: notificationError } = await supabase.functions.invoke("notify-manager-whatsapp", { body: { request_id: requestId } });
      const notificationMessage = notificationError
        ? "WhatsApp alert is not configured or could not be delivered yet."
        : notificationResult?.delivered
          ? "The property manager was notified on WhatsApp."
          : notificationResult?.message || "WhatsApp notification is not enabled for this property manager.";
      setNotice([
        "Your maintenance request has been saved.",
        scoutError ? "Scout analysis could not run yet; the manager can retry it from the dashboard." : "Scout has analysed the report for the property manager.",
        notificationMessage,
      ].join(" "));
      await loadWorkspace();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "We could not submit your request. Please try again.");
      if (requestId) await loadWorkspace();
    } finally { setBusy(false); }
  }

  const propertyById = useMemo(() => new Map(properties.map(property => [property.id, property])), [properties]);
  const unitById = useMemo(() => new Map(units.map(unit => [unit.id, unit])), [units]);
  return <main className="tenant-shell">
    <header className="tenant-topbar"><div className="auth-brand"><span className="brand-mark">F</span><span><b>FixFlow</b><small>RESIDENT PORTAL</small></span></div><div className="tenant-user"><span>{profile.display_name || "Resident"}</span><button onClick={onSignOut}>Sign out</button></div></header>
    <section className="tenant-welcome"><span className="eyebrow">YOUR HOME, YOUR UPDATES</span><h1>Hello{profile.display_name ? `, ${profile.display_name.split(" ")[0]}` : ""}.</h1><p>Report a maintenance issue and stay informed as it moves towards resolution.</p></section>
    {notice && <div className="workflow-notice tenant-notice" role="status">{notice}</div>}
    {loading ? <div className="tenant-empty"><h2>Loading your resident workspace…</h2></div> : units.length === 0 ? <section className="tenant-empty"><div className="tenant-empty-icon">⌂</div><h2>Your resident workspace is ready</h2><p>Your property manager must link your account to a unit before your maintenance requests and property details appear here.</p><span className="tenant-role">TENANT ACCESS · VERIFIED BY YOUR ACCOUNT PROFILE</span></section> : <section className="tenant-workspace-content">
      <article className="tenant-property-card"><span className="eyebrow">YOUR PROPERTY</span>{units.map(unit => { const property = propertyById.get(unit.property_id); return <div className="tenant-unit-row" key={unit.id}><div><h2>{property?.name || "Your property"}</h2><p>{[property?.address_line_1, property?.locality, property?.region].filter(Boolean).join(", ")}</p><span>{unit.unit_label}</span></div></div>; })}</article>
      <div className="tenant-request-layout"><article className="tenant-property-card"><h2>Report a maintenance issue</h2><p>Describe the problem and attach photos so your property manager can understand what needs attention.</p><form className="workflow-form" onSubmit={submitRequest}>
        <label>Unit<select value={unitId} onChange={event => setUnitId(event.target.value)} required>{units.map(unit => <option key={unit.id} value={unit.id}>{propertyById.get(unit.property_id)?.name || "Property"} · {unit.unit_label}</option>)}</select></label>
        <label>Issue title<input value={title} onChange={event => setTitle(event.target.value)} placeholder="e.g. Leaking kitchen tap" required maxLength={160}/></label>
        <label>Description<textarea value={description} onChange={event => setDescription(event.target.value)} placeholder="Tell us what happened, where it is, and when you first noticed it…" required minLength={5} maxLength={10000}/></label>
        <div className="evidence-picker"><div><b>Photo evidence</b><p>Add up to {MAX_FILES} photos (5 MB each). Avoid including people or private documents.</p></div><label className="evidence-upload"> <span>📷 Take or choose photos</span><input type="file" accept="image/jpeg,image/png,image/webp,image/heic" capture="environment" multiple onChange={event => { addEvidence(event.target.files); event.currentTarget.value = ""; }} /></label>
        {evidence.length > 0 && <div className="evidence-grid">{evidence.map((item, index) => <div className="evidence-preview" key={item.preview}><img src={item.preview} alt={`Maintenance evidence ${index + 1}`}/><button type="button" onClick={() => removeEvidence(index)} aria-label={`Remove photo ${index + 1}`}>×</button></div>)}</div>}
        </div><button className="primary" disabled={busy}>{busy ? "Submitting…" : "Submit maintenance request"}</button></form></article>
        <article className="tenant-property-card"><h2>Your maintenance requests</h2>{requests.length === 0 ? <p>You haven't submitted any maintenance requests yet.</p> : requests.map(request => <div className="tenant-request-card" key={request.id}><div><span className="workflow-status">{request.status}</span><small>{unitById.get(request.unit_id)?.unit_label || "Unit"} · {request.priority} priority</small></div><h3>{request.title}</h3><p>{request.description}</p><small>Submitted {new Date(request.created_at).toLocaleString()}</small></div>)}</article></div>
    </section>}
    <footer className="tenant-footer">FIXFLOW · Your maintenance journey, clearly tracked.</footer>
  </main>;
}
