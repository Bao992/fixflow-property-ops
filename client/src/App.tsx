import { FormEvent, useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { isSupabaseConfigured, supabase } from "./lib/supabase";
import { ManagerDashboard } from "./ManagerDashboard";
import { TenantWorkspace } from "./TenantWorkspace";

type AppRole = "manager" | "tenant";
type Profile = { id: string; role: AppRole; display_name: string | null };

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
