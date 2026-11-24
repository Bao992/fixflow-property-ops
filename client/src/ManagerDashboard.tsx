import { useState } from "react";

const navItems = ["Overview", "Maintenance Requests", "Properties & Units", "Contractors", "AI Operations", "Insights", "Settings"];
const workOrders = [
  { unit: "Unit 4B — Active Water Ingress & Drain Surge", property: "Oakridge Crest Highrise", tenant: "Sarah Lindqvist", priority: "Critical", owner: "Marcus Vance", next: "Review & approve contractor estimate", tone: "red" },
  { unit: "Unit 7D — HVAC Compressor Failure / Heat Stress", property: "Highland Lofts", tenant: "Elena Ward", priority: "High", owner: "Marcus Vance", next: "Review landlord approval", tone: "amber" },
  { unit: "Unit 12C — HVAC Compressor Noise", property: "Oakridge Crest", tenant: "Alicia Reed", priority: "Medium", owner: "M. Vance", next: "Track contractor visit", tone: "blue" }
];

export function ManagerDashboard() {
  const [active, setActive] = useState("Overview");
  const [showNew, setShowNew] = useState(false);
  return <div className="app-shell">
    <aside className="sidebar">
      <div className="brand"><span className="brand-mark">F</span><span><b>FixFlow</b><small>OPS TELEMATICS</small></span><span className="pro">PRO</span></div>
      <p className="nav-label">SYSTEM NAVIGATION</p>
      <nav>{navItems.map((item, index) => <button key={item} className={active === item ? "nav-item selected" : "nav-item"} onClick={() => setActive(item)}><span>{["▦","◷","▤","♧","✣","⌁","⚙"][index]}</span>{item}{item === "AI Operations" && <em>LIVE</em>}{item === "Maintenance Requests" && <strong>7</strong>}</button>)}</nav>
      <div className="sidebar-foot"><span className="online-dot"/> System operational <b>v0.1.0</b></div>
    </aside>
    <main className="main">
      <header className="topbar"><div className="property-select">▦ &nbsp; All Properties (32 Units)⌄</div><input aria-label="Search" placeholder="Search units, work orders, contractors, serials..." /><button className="icon-button" aria-label="Notifications">♧</button><div className="profile"><span className="avatar">MV</span><span><b>Marcus Vance</b><small>Property Manager</small></span></div></header>
      <section className="page-heading"><div><h1>{active === "Overview" ? "Operations Command & Triage" : active}</h1><p>Live resolution tracking across 32 units · Marcus Vance (Lead Property Manager)</p><span className="live-pill"><i/> Telemetry Active · Automated Sync in 4m</span></div><div className="heading-actions"><button className="secondary">⇩ Export Ledger</button><button className="secondary">☷ Batch Triage</button><button className="primary" onClick={() => setShowNew(true)}>＋ New Maintenance Order</button></div></section>
      <section className="metrics">
        {[["ACTIVE WORK ORDERS","7","5 In Progress","2 In Triage","normal"],["IMMINENT SLA RISKS","2","NEARING BREACH","Unit 4B (<38m) · Unit 7D","red"],["PENDING APPROVALS","3","Total Over-Cap","$1,630.00","amber"],["AWAITING VERIFICATION","2","Tenant sign-off pending","1 Ready for Close","green"],["PORTFOLIO VELOCITY","34.2h","91% 1st-Fix","-4.1h vs resolution goal","normal"]].map(([label,value,a,b,tone]) => <article className="metric-card" key={label}><div className="metric-label">{label}</div><div className={"metric-value "+tone}>{value}</div><div className="metric-foot"><span>{a}</span><b>{b}</b></div></article>)}
      </section>
      <div className="section-title"><h2>⚠ Needs Your Attention: Operational Blockers</h2><span>2 Critical Overrides Required</span></div>
      <section className="blockers">{workOrders.slice(0,2).map(order => <article className={"blocker "+order.tone} key={order.unit}><div className="chips"><span>{order.priority.toUpperCase()} PRIORITY</span><span>OWNER: {order.owner}</span></div><h3>{order.unit}</h3><p>{order.property} · Tenant {order.tenant}</p><div className="blocker-note"><b>CURRENT BLOCKER</b><p>{order.tone === "red" ? "Contractor estimate exceeds the manager's automatic approval threshold. Manager review is required before dispatch." : "Landlord approval is pending. Follow-up is required before the contractor can proceed."}</p><b>NEXT REQUIRED ACTION</b><p>{order.next}</p></div><div className="card-actions"><button className="primary">{order.tone === "red" ? "Review Approval" : "Review Quote"}</button><button className="secondary">Open Workspace →</button></div></article>)}</section>
      <section className="lower-grid"><article className="panel"><div className="panel-heading"><h2>▤ Triage & Work Order Stream</h2><span>Real-time sync <i className="online-dot"/></span></div><div className="tabs"><button className="tab-active">All Active (7)</button><button>Urgent / SLA (2)</button><button>Awaiting Approval (3)</button><button>Awaiting Verification (2)</button></div><div className="orders">{workOrders.map(order =><div className="order-row" key={order.unit}><div><b>{order.unit}</b><small>{order.property}</small></div><span className={"status "+order.tone}>{order.priority}</span><span>{order.owner}</span><button className="text-button">Open →</button></div>)}</div></article><aside className="panel ai-panel"><div className="panel-heading"><h2>✣ Flow AI — Operations Coordinator</h2><span className="ai-tag">ADVISORY</span></div><p>Flow monitors and advises. Managers decide.</p><div className="ai-suggestion"><b>STALLED WORK · REVIEW REQUIRED</b><p>Unit 7D HVAC Compressor: landlord approval has been pending for 48 hours.</p><button className="secondary">Review recommendation</button></div><div className="ai-suggestion scout"><b>SCOUT AI — DIAGNOSTIC INTELLIGENCE</b><p>Unit 4B leak report suggests an urgent plumbing assessment. Human review required.</p><button className="secondary">Open Scout analysis</button></div></aside></section>
      <footer>FIXFLOW · HUMAN-LED OPERATIONS · AI RECOMMENDATIONS REQUIRE MANAGER REVIEW</footer>
    </main>
    {showNew && <div className="modal-backdrop" role="presentation"><section className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title"><button className="close" onClick={() => setShowNew(false)}>×</button><h2 id="modal-title">New Maintenance Order</h2><p>Start a maintenance request for a managed unit.</p><label>Unit reference<input placeholder="e.g. Oakridge Crest · Unit 4B"/></label><label>Issue summary<input placeholder="Describe the maintenance issue"/></label><div className="modal-actions"><button className="secondary" onClick={() => setShowNew(false)}>Cancel</button><button className="primary" onClick={() => setShowNew(false)}>Save draft</button></div></section></div>}
  </div>;
}

