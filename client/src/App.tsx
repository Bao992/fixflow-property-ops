import { FormEvent, useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { isSupabaseConfigured, supabase } from "./lib/supabase";
import { ManagerDashboard } from "./ManagerDashboard";

type AppRole = "manager" | "tenant";
type Profile = { id: string; role: AppRole; display_name: string | null };
type TenantUnit = { id: string; property_id: string; unit_label: string; description: string | null };
type TenantProperty = { id: string; name: string; address_line_1: string; locality: string | null; region: string | null };
type TenantRequest = { id: string; title: string; description: string; status: string; priority: string; created_at: string; unit_id: string };

function AuthScreen() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase) return;
    setBusy(true); setMessage("");
    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { display_name: name.trim() } } });
        if (error) throw error;
        setMessage(data.session ? "Your account has been created. Your access is set to Tenant until a manager links your account to a unit." : "Check your email to confirm your account. Your access will be Tenant by default until a manager links you to a unit.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "We could not complete that request. Please try again.");
    } finally { setBusy(false); }
  }

  return <main className="auth-layout">
    <section className="auth-story">
      <div className="auth-brand"><span className="brand-mark">F</span><span><b>FixFlow</b><small>PROPERTY OPERATIONS</small></span></div>
      <div className="auth-story-copy"><span className="eyebrow">PROPERTY CARE, IN MOTION</span><h1>Every issue has an owner.<br/><em>Every resolution has a record.</em></h1><p>One calm, accountable workspace for maintenance requests, people and properties.</p><div className="auth-proof"><span>01</span><div><b>Clear ownership</b><small>Know who is responsible and what happens next.</small></div></div><div className="auth-proof"><span>02</span><div><b>Human-led decisions</b><small>AI assists. Property managers stay in control.</small></div></div></div>
      <div className="auth-story-foot">FIXFLOW · HUMAN-LED PROPERTY OPERATIONS</div>
    </section>
    <section className="auth-panel-wrap"><div className="auth-panel"><div className="mobile-auth-brand"><span className="brand-mark">F</span><b>FixFlow</b></div><span className="eyebrow">{mode === "signin" ? "WELCOME BACK" : "GET STARTED"}</span><h2>{mode === "signin" ? "Sign in to FixFlow" : "Create your account"}</h2><p className="auth-subtitle">{mode === "signin" ? "Continue to your property operations workspace." : "Create a resident account to report and follow maintenance."}</p>
      <form onSubmit={submit} className="auth-form">{mode === "signup" && <label>Full name<input autoComplete="name" value={name} onChange={event => setName(event.target.value)} placeholder="Your name" required minLength={2}/></label>}<label>Email address<input type="email" autoComplete="email" value={email} onChange={event => setEmail(event.target.value)} placeholder="you@example.com" required/></label><label>Password<input type="password" autoComplete={mode === "signin" ? "current-password" : "new-password"} value={password} onChange={event => setPassword(event.target.value)} placeholder="At least 8 characters" required minLength={8}/></label><button className="auth-submit" type="submit" disabled={busy}>{busy ? "Please wait…" : mode === "signin" ? "Sign in" : "Create tenant account"}<span>→</span></button></form>
      {message && <div className="auth-message" role="status">{message}</div>}<p className="auth-switch">{mode === "signin" ? "New to FixFlow?" : "Already have an account?"} <button type="button" onClick={() => { setMode(mode === "signin" ? "signup" : "signin"); setMessage(""); }}>{mode === "signin" ? "Create an account" : "Sign in"}</button></p><div className="auth-security"><span>⌑</span> Your account and property access are protected by role-based security.</div></div></section>
  </main>;
}

function TenantWorkspace({ profile, onSignOut }: { profile: Profile; onSignOut: () => void }) {
  const [units, setUnits] = useState<TenantUnit[]>([]);
  const [properties, setProperties] = useState<TenantProperty[]>([]);
  const [requests, setRequests] = useState<TenantRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [unitId, setUnitId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

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

  async function submitRequest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase || !unitId) return;
    setBusy(true); setNotice("");
    const { error } = await supabase.from("maintenance_requests").insert({
      unit_id: unitId,
      created_by: profile.id,
      title: title.trim(),
      description: description.trim(),
    });
    if (error) setNotice(error.message);
    else { setTitle(""); setDescription(""); setNotice("Your maintenance request has been submitted."); await loadWorkspace(); }
    setBusy(false);
  }

  const propertyById = new Map(properties.map(property => [property.id, property]));
  const unitById = new Map(units.map(unit => [unit.id, unit]));
  return <main className="tenant-shell">
    <header className="tenant-topbar"><div className="auth-brand"><span className="brand-mark">F</span><span><b>FixFlow</b><small>RESIDENT PORTAL</small></span></div><div className="tenant-user"><span>{profile.display_name || "Resident"}</span><button onClick={onSignOut}>Sign out</button></div></header>
    <section className="tenant-welcome"><span className="eyebrow">YOUR HOME, YOUR UPDATES</span><h1>Hello{profile.display_name ? `, ${profile.display_name.split(" ")[0]}` : ""}.</h1><p>Report a maintenance issue and stay informed as it moves towards resolution.</p></section>
    {notice && <div className="workflow-notice tenant-notice" role="status">{notice}</div>}
    {loading ? <div className="tenant-empty"><h2>Loading your resident workspace…</h2></div> : units.length === 0 ? <section className="tenant-empty"><div className="tenant-empty-icon">⌂</div><h2>Your resident workspace is ready</h2><p>Your property manager must link your account to a unit before your maintenance requests and property details appear here.</p><span className="tenant-role">TENANT ACCESS · VERIFIED BY YOUR ACCOUNT PROFILE</span></section> : <section className="tenant-workspace-content">
      <article className="tenant-property-card"><span className="eyebrow">YOUR PROPERTY</span>{units.map(unit => { const property = propertyById.get(unit.property_id); return <div className="tenant-unit-row" key={unit.id}><div><h2>{property?.name || "Your property"}</h2><p>{[property?.address_line_1, property?.locality, property?.region].filter(Boolean).join(", ")}</p><span>{unit.unit_label}</span></div></div>; })}</article>
      <div className="tenant-request-layout"><article className="tenant-property-card"><h2>Report a maintenance issue</h2><p>Describe the problem clearly. Your property manager will review the request.</p><form className="workflow-form" onSubmit={submitRequest}><label>Unit<select value={unitId} onChange={event => setUnitId(event.target.value)} required>{units.map(unit => <option key={unit.id} value={unit.id}>{propertyById.get(unit.property_id)?.name || "Property"} · {unit.unit_label}</option>)}</select></label><label>Issue title<input value={title} onChange={event => setTitle(event.target.value)} placeholder="e.g. Leaking kitchen tap" required maxLength={160}/></label><label>Description<textarea value={description} onChange={event => setDescription(event.target.value)} placeholder="Tell us what happened and where…" required minLength={5} maxLength={10000}/></label><button className="primary" disabled={busy}>{busy ? "Submitting…" : "Submit maintenance request"}</button></form></article>
        <article className="tenant-property-card"><h2>Your maintenance requests</h2>{requests.length === 0 ? <p>You haven't submitted any maintenance requests yet.</p> : requests.map(request => <div className="tenant-request-card" key={request.id}><div><span className="workflow-status">{request.status}</span><small>{unitById.get(request.unit_id)?.unit_label || "Unit"} · {request.priority} priority</small></div><h3>{request.title}</h3><p>{request.description}</p><small>Submitted {new Date(request.created_at).toLocaleString()}</small></div>)}</article></div>
    </section>}
    <footer className="tenant-footer">FIXFLOW · Your maintenance journey, clearly tracked.</footer>
  </main>;
}

function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileError, setProfileError] = useState("");

  useEffect(() => {
    const client = supabase;
    if (!client) { setLoading(false); return; }
    let alive = true;
    const loadProfile = async (current: Session | null) => {
      if (!current) { if (alive) { setSession(null); setProfile(null); setProfileError(""); setLoading(false); } return; }
      if (alive) { setSession(current); setLoading(true); }
      const { data, error } = await client.from("profiles").select("id, role, display_name").eq("id", current.user.id).single();
      if (!alive) return;
      if (error) { setProfile(null); setProfileError("We could not load your access profile. Please contact your property manager or try again."); }
      else if (data.role !== "manager" && data.role !== "tenant") { setProfile(null); setProfileError("Your account has an unsupported access role."); }
      else { setProfile(data as Profile); setProfileError(""); }
      setLoading(false);
    };
    client.auth.getSession().then(({ data }) => { void loadProfile(data.session); });
    const { data: listener } = client.auth.onAuthStateChange((_event, nextSession) => { void loadProfile(nextSession); });
    return () => { alive = false; listener.subscription.unsubscribe(); };
  }, []);

  async function signOut() { if (supabase) await supabase.auth.signOut(); }
  if (!isSupabaseConfigured) return <main className="config-screen"><div className="config-card"><span className="brand-mark">F</span><h1>One quick setup step</h1><p>FixFlow needs its Supabase project settings before authentication can start.</p><code>client/.env.local</code><p>Add your project URL and publishable key, then restart the development server.</p></div></main>;
  if (loading) return <main className="loading-screen"><span className="brand-mark">F</span><p>Preparing your secure workspace…</p></main>;
  if (!session) return <AuthScreen />;
  if (profileError || !profile) return <main className="config-screen"><div className="config-card"><span className="brand-mark">F</span><h1>Access setup required</h1><p>{profileError || "Your profile is not available yet."}</p><p>New accounts are created with Tenant access. A trusted administrator must provision Manager access.</p><button className="auth-submit" onClick={() => void signOut()}>Sign out</button></div></main>;
  return profile.role === "manager" ? <><div className="authenticated-banner"><span>Signed in as {profile.display_name || "Manager"}</span><button onClick={() => void signOut()}>Sign out</button></div><ManagerDashboard /></> : <TenantWorkspace profile={profile} onSignOut={() => void signOut()} />;
}

export default App;
