import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "./lib/supabase";
import { ScoutPanel } from "./ScoutPanel";

type PropertyRow = {
  id: string;
  name: string;
  address_line_1: string;
  locality: string | null;
  region: string | null;
};
type UnitRow = { id: string; property_id: string; unit_label: string; active: boolean };
type RequestStatus = "Submitted" | "Under Review" | "Awaiting Contractor" | "Awaiting Approval" | "Approved" | "In Progress" | "Awaiting Verification" | "Completed" | "Rejected" | "Cancelled";
type RequestRow = {
  id: string;
  title: string;
  description: string;
  status: RequestStatus;
  priority: "Low" | "Medium" | "High" | "Critical";
  created_at: string;
  unit_id: string;
  created_by: string;
};
type TenantLinkResult = { tenant_id: string; display_name: string | null; unit_id: string };
const statuses: RequestStatus[] = ["Submitted", "Under Review", "Awaiting Contractor", "Awaiting Approval", "Approved", "In Progress", "Awaiting Verification", "Completed", "Rejected", "Cancelled"];

export function ManagerDashboard() {
  const [active, setActive] = useState("Overview");
  const [properties, setProperties] = useState<PropertyRow[]>([]);
  const [units, setUnits] = useState<UnitRow[]>([]);
  const [requests, setRequests] = useState<RequestRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [propertyName, setPropertyName] = useState("");
  const [address, setAddress] = useState("");
  const [locality, setLocality] = useState("");
  const [region, setRegion] = useState("");
  const [unitPropertyId, setUnitPropertyId] = useState("");
  const [unitLabel, setUnitLabel] = useState("");
  const [linkUnitId, setLinkUnitId] = useState("");
  const [tenantEmail, setTenantEmail] = useState("");
  const [statusDrafts, setStatusDrafts] = useState<Record<string, RequestStatus>>({});
  const [notesDrafts, setNotesDrafts] = useState<Record<string, string>>({});

  const loadData = useCallback(async () => {
    if (!supabase) return;
    setLoading(true);
    const [propertyResult, unitResult, requestResult] = await Promise.all([
      supabase.from("properties").select("id,name,address_line_1,locality,region").order("created_at", { ascending: false }),
      supabase.from("units").select("id,property_id,unit_label,active").order("unit_label"),
      supabase.from("maintenance_requests").select("id,title,description,status,priority,created_at,unit_id,created_by").order("created_at", { ascending: false }),
    ]);
    const firstError = propertyResult.error || unitResult.error || requestResult.error;
    if (firstError) setNotice(firstError.message);
    setProperties((propertyResult.data || []) as PropertyRow[]);
    setUnits((unitResult.data || []) as UnitRow[]);
    setRequests((requestResult.data || []) as RequestRow[]);
    setLoading(false);
  }, []);

  useEffect(() => { void loadData(); }, [loadData]);

  const propertyById = useMemo(() => new Map(properties.map(property => [property.id, property])), [properties]);
  const unitById = useMemo(() => new Map(units.map(unit => [unit.id, unit])), [units]);
  const activeRequests = requests.filter(request => !["Completed", "Rejected", "Cancelled"].includes(request.status));

  async function createProperty(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase) return;
    setBusy(true); setNotice("");
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) { setNotice("Your manager session could not be verified. Please sign in again."); setBusy(false); return; }
    const { error } = await supabase.from("properties").insert({
      manager_id: userData.user.id,
      name: propertyName.trim(),
      address_line_1: address.trim(),
      locality: locality.trim() || null,
      region: region.trim() || null,
      country_code: "ZA",
      timezone: "Africa/Johannesburg",
      currency_code: "ZAR",
    });
    if (error) setNotice(error.message);
    else { setPropertyName(""); setAddress(""); setLocality(""); setRegion(""); setNotice("Property created successfully."); await loadData(); }
    setBusy(false);
  }

  async function createUnit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase) return;
    setBusy(true); setNotice("");
    const { error } = await supabase.from("units").insert({ property_id: unitPropertyId, unit_label: unitLabel.trim() });
    if (error) setNotice(error.message);
    else { setUnitLabel(""); setNotice("Unit created successfully."); await loadData(); }
    setBusy(false);
  }

  async function linkTenant(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase) return;
    setBusy(true); setNotice("");
    const { data, error } = await supabase.rpc("manager_link_tenant_by_email", {
      target_unit_id: linkUnitId,
      tenant_email: tenantEmail.trim(),
    });
    if (error) setNotice(error.message);
    else {
      const linked = (Array.isArray(data) ? data[0] : data) as TenantLinkResult | null;
      setNotice(linked ? `Tenant ${linked.display_name || linked.tenant_id} linked to the selected unit.` : "Tenant linked successfully.");
      setTenantEmail("");
      await loadData();
    }
    setBusy(false);
  }

  async function updateRequest(request: RequestRow) {
    if (!supabase) return;
    setBusy(true); setNotice("");
    const nextStatus = statusDrafts[request.id] || request.status;
    const note = notesDrafts[request.id]?.trim();
    const { data: userData } = await supabase.auth.getUser();
    const update: Record<string, string | null> = { status: nextStatus, updated_at: new Date().toISOString() };
    if (note) update.manager_notes = note;
    if (nextStatus === "Completed") {
      if (!userData.user) { setNotice("Your manager session could not be verified."); setBusy(false); return; }
      update.verified_by = userData.user.id;
      update.verified_at = new Date().toISOString();
    }
    const { error } = await supabase.from("maintenance_requests").update(update).eq("id", request.id);
    if (error) setNotice(error.message);
    else { setNotice("Maintenance request updated."); setNotesDrafts(current => ({ ...current, [request.id]: "" })); await loadData(); }
    setBusy(false);
  }

  const navItems = ["Overview", "Properties & Units", "Maintenance Requests", "AI Scout"];
  return <div className="app-shell">
    <aside className="sidebar">
      <div className="brand"><span className="brand-mark">F</span><span><b>FixFlow</b><small>PROPERTY OPERATIONS</small></span><span className="pro">MVP</span></div>
      <p className="nav-label">WORKSPACE</p>
      <nav>{navItems.map((item, index) => <button key={item} className={active === item ? "nav-item selected" : "nav-item"} onClick={() => setActive(item)}><span>{["▦", "▤", "◷"][index]}</span>{item}{item === "Maintenance Requests" && <strong>{activeRequests.length}</strong>}</button>)}</nav>
      <div className="sidebar-foot"><span className="online-dot"/> Live Supabase data <b>v0.2.0</b></div>
    </aside>
    <main className="main">
      <header className="topbar"><div className="property-select">▦ &nbsp; {properties.length} Properties · {units.length} Units</div><div className="profile"><span className="avatar">FM</span><span><b>FixFlow Manager</b><small>Property Manager</small></span></div></header>
      <section className="page-heading"><div><h1>{active === "Overview" ? "Property Operations" : active}</h1><p>Manage properties, connect residents and keep maintenance moving.</p><span className="live-pill"><i/> Connected to your secured workspace</span></div></section>
      {notice && <div className="workflow-notice" role="status">{notice}</div>}
      {loading ? <div className="workflow-panel">Loading your property operations…</div> : <>
        {active === "Overview" && <section className="workflow-metrics">
          <article><small>PROPERTIES</small><strong>{properties.length}</strong></article>
          <article><small>UNITS</small><strong>{units.length}</strong></article>
          <article><small>OPEN REQUESTS</small><strong>{activeRequests.length}</strong></article>
          <article><small>COMPLETED</small><strong>{requests.filter(request => request.status === "Completed").length}</strong></article>
          <article className="workflow-panel workflow-intro"><h2>Your operations start here</h2><p>Create a property, add its units, then link an existing tenant account. Residents can submit maintenance requests once linked.</p><button className="primary" onClick={() => setActive("Properties & Units")}>Manage properties and units →</button></article>
          <article className="workflow-panel"><h2>Latest maintenance activity</h2>{requests.slice(0, 4).length === 0 ? <p>No maintenance requests have been submitted yet.</p> : requests.slice(0, 4).map(request => <div className="workflow-list-row" key={request.id}><div><b>{request.title}</b><small>{unitById.get(request.unit_id)?.unit_label || "Unit"} · {request.priority}</small></div><span className="workflow-status">{request.status}</span></div>)}</article>
        </section>}
        {active === "Properties & Units" && <section className="workflow-columns">
          <article className="workflow-panel"><h2>Create a property</h2><p>Add a property to your managed portfolio.</p><form className="workflow-form" onSubmit={createProperty}>
            <label>Property name<input value={propertyName} onChange={event => setPropertyName(event.target.value)} placeholder="e.g. Lebowakgomo Gardens" required maxLength={120}/></label>
            <label>Street address<input value={address} onChange={event => setAddress(event.target.value)} placeholder="Street and number" required/></label>
            <label>Town / locality<input value={locality} onChange={event => setLocality(event.target.value)} placeholder="e.g. Polokwane"/></label>
            <label>Province / region<input value={region} onChange={event => setRegion(event.target.value)} placeholder="e.g. Limpopo"/></label>
            <button className="primary" disabled={busy}>{busy ? "Saving…" : "Create property"}</button>
          </form></article>
          <article className="workflow-panel"><h2>Add a unit</h2><p>Units belong to a property and are uniquely labelled within it.</p><form className="workflow-form" onSubmit={createUnit}>
            <label>Property<select value={unitPropertyId} onChange={event => setUnitPropertyId(event.target.value)} required><option value="">Choose a property</option>{properties.map(property => <option key={property.id} value={property.id}>{property.name}</option>)}</select></label>
            <label>Unit label<input value={unitLabel} onChange={event => setUnitLabel(event.target.value)} placeholder="e.g. Flat 2, Unit 4B" required maxLength={80}/></label>
            <button className="primary" disabled={busy || properties.length === 0}>{busy ? "Saving…" : "Add unit"}</button>
          </form></article>
          <article className="workflow-panel workflow-wide"><h2>Link a tenant to a unit</h2><p>The tenant must already have registered and confirmed their FixFlow account. Linking is restricted to units you manage.</p><form className="workflow-inline-form" onSubmit={linkTenant}>
            <label>Unit<select value={linkUnitId} onChange={event => setLinkUnitId(event.target.value)} required><option value="">Choose a unit</option>{units.filter(unit => unit.active).map(unit => <option key={unit.id} value={unit.id}>{propertyById.get(unit.property_id)?.name || "Property"} · {unit.unit_label}</option>)}</select></label>
            <label>Tenant email<input type="email" value={tenantEmail} onChange={event => setTenantEmail(event.target.value)} placeholder="tenant@example.com" required/></label>
            <button className="primary" disabled={busy || units.length === 0}>{busy ? "Linking…" : "Link tenant"}</button>
          </form></article>
          <article className="workflow-panel workflow-wide"><h2>Your properties and units</h2>{properties.length === 0 ? <p>No properties yet. Create your first property above.</p> : properties.map(property => <div className="property-card" key={property.id}><div><b>{property.name}</b><small>{[property.address_line_1, property.locality, property.region].filter(Boolean).join(", ")}</small></div><div className="unit-chips">{units.filter(unit => unit.property_id === property.id).map(unit => <span key={unit.id}>{unit.unit_label}{!unit.active ? " · Inactive" : ""}</span>)}{units.every(unit => unit.property_id !== property.id) && <small>No units added yet</small>}</div></div>)}</article>
        </section>}
        {active === "Maintenance Requests" && <section className="workflow-panel"><h2>Maintenance request queue</h2><p>Review resident reports and record the next status. Mark a request Completed only after the work has been verified.</p>{requests.length === 0 ? <p>No maintenance requests yet. Once a linked tenant submits an issue, it will appear here.</p> : requests.map(request => <article className="request-manager-card" key={request.id}><div className="request-manager-heading"><div><small>{propertyById.get(unitById.get(request.unit_id)?.property_id || "")?.name || "Property"} · {unitById.get(request.unit_id)?.unit_label || "Unit"}</small><h3>{request.title}</h3></div><span className={"priority-pill " + request.priority.toLowerCase()}>{request.priority}</span></div><p>{request.description}</p><div className="request-meta">Submitted {new Date(request.created_at).toLocaleString()} · {request.status}</div><div className="workflow-inline-form"><label>Update status<select value={statusDrafts[request.id] || request.status} onChange={event => setStatusDrafts(current => ({ ...current, [request.id]: event.target.value as RequestStatus }))}>{statuses.map(status => <option key={status}>{status}</option>)}</select></label><label>Manager note<input value={notesDrafts[request.id] || ""} onChange={event => setNotesDrafts(current => ({ ...current, [request.id]: event.target.value }))} placeholder="Optional update for your records"/></label><button className="primary" disabled={busy} onClick={() => void updateRequest(request)}>Save update</button></div></article>)}</section>}
        {active === "AI Scout" && <ScoutPanel requests={requests.map(request => ({ id: request.id, title: request.title, description: request.description, status: request.status, priority: request.priority }))} />}
      </>}
      <footer>FIXFLOW · HUMAN-LED PROPERTY OPERATIONS · MANAGER DECISIONS STAY WITH PEOPLE</footer>
    </main>
  </div>;
}
