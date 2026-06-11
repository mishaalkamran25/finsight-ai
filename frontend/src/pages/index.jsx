import Head from "next/head";
import { useState } from "react";
import { TrendingUp, Upload, MessageSquare, FileBarChart, CheckCircle } from "lucide-react";
import UploadTab from "../components/UploadTab";
import CopilotTab from "../components/CopilotTab";
import ManagementPackTab from "../components/ManagementPackTab";

const NAV = [
  { id: "upload",  label: "Data Upload",     icon: Upload,        step: "01" },
  { id: "copilot", label: "FP&A Copilot",    icon: MessageSquare, step: "02" },
  { id: "pack",    label: "Management Pack", icon: FileBarChart,  step: "03" },
];

const BREADCRUMBS = {
  upload:  "Data Upload",
  copilot: "FP&A Copilot",
  pack:    "Management Pack",
};

export default function Home() {
  const [tab, setTab]             = useState("upload");
  const [sessionData, setSession] = useState(null);

  const handleLoaded = (data) => {
    setSession(data);
    setTab("copilot");
  };

  return (
    <>
      <Head>
        <title>FinSight AI — FP&A Intelligence Platform</title>
        <meta name="description" content="AI-powered FP&A copilot and management reporting" />
      </Head>

      <div className="fs-shell">

        {/* ── Sidebar ── */}
        <aside className="fs-sidebar">

          <div className="fs-sidebar-logo">
            <div className="fs-logo-mark">
              <div className="fs-logo-icon">
                <TrendingUp size={15} color="#FDFCF9" strokeWidth={2} />
              </div>
              <span className="fs-logo-wordmark">FinSight<span> AI</span></span>
            </div>
            <div className="fs-logo-tagline">FP&amp;A Intelligence Platform</div>
          </div>

          <nav className="fs-nav">
            <div className="fs-nav-label" style={{ marginBottom: 12 }}>Workflow</div>
            {NAV.map(({ id, label, icon: Icon, step }) => {
              const isActive   = tab === id;
              const isComplete = id === "upload" && !!sessionData;
              return (
                <button
                  key={id}
                  onClick={() => setTab(id)}
                  className={`fs-nav-item ${isActive ? "active" : ""} ${isComplete ? "complete" : ""}`}
                >
                  <span className="fs-nav-step">{isComplete ? "✓" : step}</span>
                  <span style={{ flex: 1 }}>{label}</span>
                  {isComplete && (
                    <CheckCircle size={11} color="var(--forest-400)" style={{ opacity: 0.8 }} />
                  )}
                </button>
              );
            })}

            <div style={{ height: 1, background: "var(--navy-800)", margin: "20px 24px" }} />

            <div style={{ padding: "0 24px" }}>
              <p style={{ fontSize: 11, lineHeight: 1.65, color: "var(--navy-500)", fontFamily: "'DM Sans', sans-serif" }}>
                Upload a P&L, budget vs. actuals, or forecast file. The AI copilot answers
                questions grounded in your data. Generate a management pack in one click.
              </p>
            </div>
          </nav>

          <div className="fs-sidebar-dataset">
            {sessionData ? (
              <div className="fs-dataset-pill">
                <div style={{ display: "flex", alignItems: "center", marginBottom: 6 }}>
                  <span className="fs-dataset-dot" />
                  <span style={{ fontSize: 9, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--forest-400)", fontFamily: "'DM Sans', sans-serif" }}>
                    Dataset Active
                  </span>
                </div>
                <p style={{ fontSize: 10.5, color: "var(--navy-500)", fontFamily: "'IBM Plex Mono', monospace", lineHeight: 1.4, wordBreak: "break-all" }}>
                  {sessionData.filename?.length > 32 ? sessionData.filename.slice(0, 32) + "…" : sessionData.filename}
                </p>
                <p style={{ fontSize: 10, color: "var(--navy-600)", marginTop: 4, fontFamily: "'DM Sans', sans-serif" }}>
                  {sessionData.rows} rows · {sessionData.columns?.length} columns
                </p>
              </div>
            ) : (
              <div style={{ border: "1px dashed var(--navy-800)", padding: "10px 12px", fontSize: 10.5, color: "var(--navy-700)", fontFamily: "'DM Sans', sans-serif" }}>
                No dataset loaded
              </div>
            )}
            <div style={{ marginTop: 16, paddingTop: 12, borderTop: "1px solid var(--navy-800)", fontSize: 9, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--navy-700)", fontFamily: "'DM Sans', sans-serif" }}>
              FinSight AI · v1.0
            </div>
          </div>
        </aside>

        {/* ── Main ── */}
        <div className="fs-main">

          <header className="fs-topbar" style={{ justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span className="fs-breadcrumb">FinSight AI</span>
              <span className="fs-breadcrumb-sep">/</span>
              <span className="fs-breadcrumb fs-breadcrumb-active">{BREADCRUMBS[tab]}</span>
            </div>

            {sessionData?.metrics?.summary && (
              <div style={{ display: "flex", alignItems: "center", gap: 20, fontSize: 11, fontFamily: "'IBM Plex Mono', monospace", color: "var(--stone-400)" }}>
                <span>
                  Actual&nbsp;
                  <strong style={{ color: "var(--ink)", fontWeight: 500 }}>
                    ${(sessionData.metrics.summary.total_actual / 1e6).toFixed(1)}M
                  </strong>
                </span>
                <span>
                  Budget&nbsp;
                  <strong style={{ color: "var(--stone-500)", fontWeight: 500 }}>
                    ${(sessionData.metrics.summary.total_budget / 1e6).toFixed(1)}M
                  </strong>
                </span>
                <span style={{
                  color: sessionData.metrics.summary.total_variance_vs_budget >= 0 ? "var(--forest-600)" : "var(--crimson-600)",
                  fontWeight: 500,
                }}>
                  {sessionData.metrics.summary.total_variance_vs_budget >= 0 ? "▲" : "▼"}&nbsp;
                  {Math.abs(sessionData.metrics.summary.total_variance_pct).toFixed(1)}% vs Budget
                </span>
              </div>
            )}
          </header>

          <main className="fs-page">
            <div style={{ display: tab === "upload"  ? "block" : "none" }}>
              <UploadTab onDataLoaded={handleLoaded} existingData={sessionData} />
            </div>
            <div style={{ display: tab === "copilot" ? "block" : "none" }}>
              <CopilotTab dataLoaded={!!sessionData} />
            </div>
            <div style={{ display: tab === "pack" ? "block" : "none" }}>
              <ManagementPackTab dataLoaded={!!sessionData} metrics={sessionData?.metrics} />
            </div>
          </main>

        </div>
      </div>
    </>
  );
}