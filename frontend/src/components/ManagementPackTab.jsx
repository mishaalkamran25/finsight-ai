import { useState } from "react";
import { FileDown, Sparkles, TrendingUp, TrendingDown, AlertTriangle, CornerDownLeft } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, ReferenceLine,
} from "recharts";
import axios from "axios";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const fmtM    = (n) => n == null ? "—" : `$${(Math.abs(n) / 1e6).toFixed(1)}M`;
const fmtFull = (n) => n == null ? "—" : `$${Number(n).toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
const fmtPct  = (n) => n == null ? "—" : `${n > 0 ? "+" : ""}${Number(n).toFixed(1)}%`;

function KPICard({ label, actual, budget, variance, variancePct, costItem }) {
  // For cost items (COGS), unfavorable means OVER budget (positive variance)
  // For revenue/profit items, unfavorable means UNDER budget (negative variance)
  const isFavorable = costItem ? variance <= 0 : variance >= 0;
  const sentiment = variance === 0 ? "neutral" : isFavorable ? "favorable" : "unfavorable";
  return (
    <div className={`fs-kpi ${sentiment}`}>
      <p className="fs-kpi-label">{label}</p>
      <p className="fs-kpi-value">{fmtM(actual)}</p>
      {budget != null && <p className="fs-kpi-budget">Budget {fmtM(budget)}</p>}
      {variance != null && (
        <div className={`fs-kpi-variance ${isFavorable ? "pos" : "neg"}`}>
          {isFavorable ? <TrendingUp size={11} strokeWidth={2} /> : <TrendingDown size={11} strokeWidth={2} />}
          <span>{variance > 0 ? "+" : ""}{fmtM(variance)}&nbsp;({fmtPct(variancePct)})</span>
        </div>
      )}
    </div>
  );
}

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: "var(--navy-900)", border: "1px solid var(--navy-700)",
      padding: "10px 14px", fontFamily: "'DM Sans', sans-serif",
      fontSize: 12, color: "#E8EDF5",
    }}>
      <p style={{ marginBottom: 6, fontWeight: 600, color: "#fff" }}>{label}</p>
      {payload.map(p => (
        <p key={p.name} style={{ color: p.color, marginBottom: 2 }}>
          {p.name}: ${Number(p.value).toLocaleString()}
        </p>
      ))}
    </div>
  );
}

function NoData() {
  return (
    <div style={{
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      height: 400, textAlign: "center",
    }}>
      <div style={{
        width: 52, height: 52,
        border: "1px solid var(--stone-200)", background: "var(--stone-50)",
        display: "flex", alignItems: "center", justifyContent: "center",
        marginBottom: 20,
      }}>
        <CornerDownLeft size={20} color="var(--stone-300)" strokeWidth={1.5} />
      </div>
      <p style={{ fontFamily: "'Libre Baskerville', serif", fontSize: 16, fontWeight: 700, color: "var(--ink)", marginBottom: 8 }}>
        No dataset loaded
      </p>
      <p style={{ fontSize: 13, color: "var(--stone-400)", maxWidth: 320, lineHeight: 1.6 }}>
        Return to the Data Upload tab and load a file or the demo dataset to generate a management pack.
      </p>
    </div>
  );
}

export default function ManagementPackTab({ dataLoaded, metrics }) {
  const [commentary, setCommentary]   = useState("");
  const [generating, setGenerating]   = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [error, setError]             = useState("");

  if (!dataLoaded) return <NoData />;

  const accounts = metrics?.account_totals || [];
  const summary  = metrics?.summary || {};

  const find = (...terms) =>
    accounts.find(r => terms.some(t => (r.account || r.category || "").toLowerCase().includes(t)));

  const revenueRow = find("revenue");
  const cogsRow    = find("cost of goods", "cogs");
  const gpRow      = find("gross profit");
  const ebitdaRow  = find("ebitda");

  const kpis = [
    revenueRow && { label: "Net Revenue",  row: revenueRow, costItem: false },
    cogsRow    && { label: "COGS",         row: cogsRow,    costItem: true  },
    gpRow      && { label: "Gross Profit", row: gpRow,      costItem: false },
    ebitdaRow  && { label: "EBITDA",       row: ebitdaRow,  costItem: false },
  ].filter(Boolean);

  if (kpis.length === 0 && summary.total_actual != null) {
    kpis.push({
      label: "Total Actual",
      row: {
        actual: summary.total_actual,
        budget: summary.total_budget,
        variance_vs_budget: summary.total_variance_vs_budget,
        variance_pct_budget: summary.total_variance_pct,
      },
    });
  }

  const chartData = accounts
    .filter(r => r.budget != null && r.actual != null)
    .slice(0, 8)
    .map(r => ({
      name: (r.account || r.category || "").length > 16
        ? (r.account || r.category || "").slice(0, 16) + "…"
        : (r.account || r.category || ""),
      Actual: Math.round(r.actual),
      Budget: Math.round(r.budget),
      variance: r.variance_vs_budget || 0,
    }));

  const unfavorable = (metrics?.top_unfavorable || []).slice(0, 4);
  const favorable   = (metrics?.top_favorable   || []).slice(0, 4);

  const generateCommentary = async () => {
    setGenerating(true); setError("");
    try {
      const res = await axios.post(`${API}/api/generate-commentary`);
      setCommentary(res.data.commentary);
    } catch (e) {
      setError(e.response?.data?.detail || "Failed to generate commentary. Check the backend is running.");
    } finally { setGenerating(false); }
  };

  const downloadReport = async () => {
    setDownloading(true); setError("");
    try {
      const res = await axios.get(`${API}/api/download-report`, { responseType: "blob" });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement("a");
      a.href = url; a.download = "FinSight_Management_Pack.pptx"; a.click();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      setError("Download failed. Generate commentary first, then try again.");
    } finally { setDownloading(false); }
  };

  return (
    <div className="anim-in">

      {/* Header + action buttons */}
      <div className="fs-page-header" style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
        <div>
          <h1 className="fs-page-title">Management Reporting Pack</h1>
          <p className="fs-page-subtitle">
            Auto-generated executive report. Generate AI commentary, then download the PowerPoint.
          </p>
        </div>
        <div style={{ display: "flex", gap: 10, flexShrink: 0 }}>
          <button className="fs-btn fs-btn-secondary" onClick={generateCommentary} disabled={generating}>
            <Sparkles size={13} color={generating ? "var(--forest-600)" : undefined} />
            {generating ? "Generating…" : "Generate Commentary"}
          </button>
          <button className="fs-btn fs-btn-primary" onClick={downloadReport} disabled={downloading}>
            <FileDown size={13} />
            {downloading ? "Preparing…" : "Download PowerPoint"}
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="fs-alert error anim-in" style={{ marginBottom: 24 }}>
          <AlertTriangle size={14} style={{ marginTop: 1, flexShrink: 0 }} />
          <span>{error}</span>
        </div>
      )}

      {/* KPI row */}
      {kpis.length > 0 && (
        <div className="anim-in-1" style={{ marginBottom: 24 }}>
          <p className="fs-label" style={{ marginBottom: 12 }}>Key Performance Indicators</p>
          <div style={{ display: "grid", gridTemplateColumns: `repeat(${Math.min(kpis.length, 4)}, 1fr)`, gap: 12 }}>
            {kpis.map(({ label, row, costItem }) => (
              <KPICard
                key={label} label={label}
                actual={row.actual} budget={row.budget}
                variance={row.variance_vs_budget} variancePct={row.variance_pct_budget}
                costItem={costItem}
              />
            ))}
          </div>
        </div>
      )}

      {/* Chart + Variance spotlight */}
      <div className="anim-in-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 24 }}>

        {chartData.length > 0 && (
          <div className="fs-card">
            <div className="fs-card-header">
              <span className="fs-card-title">Actual vs. Budget by Line Item</span>
              <span style={{ fontSize: 10, color: "var(--stone-400)", fontFamily: "'IBM Plex Mono', monospace" }}>USD</span>
            </div>
            <div style={{ padding: "20px 16px 16px" }}>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={chartData} barGap={3} barSize={10}>
                  <XAxis dataKey="name"
                    tick={{ fill: "var(--stone-400)", fontSize: 10, fontFamily: "'DM Sans', sans-serif" }}
                    axisLine={{ stroke: "var(--stone-200)" }} tickLine={false} />
                  <YAxis
                    tick={{ fill: "var(--stone-400)", fontSize: 10, fontFamily: "'IBM Plex Mono', monospace" }}
                    axisLine={false} tickLine={false}
                    tickFormatter={v => `$${(v / 1e6).toFixed(1)}M`} />
                  <Tooltip content={<ChartTooltip />} />
                  <ReferenceLine y={0} stroke="var(--stone-200)" />
                  <Bar dataKey="Actual" fill="var(--navy-700)" radius={[2, 2, 0, 0]} />
                  <Bar dataKey="Budget" fill="var(--stone-300)" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
              <div style={{ display: "flex", gap: 16, justifyContent: "center", marginTop: 8 }}>
                {[{ color: "var(--navy-700)", label: "Actual" }, { color: "var(--stone-300)", label: "Budget" }].map(({ color, label }) => (
                  <div key={label} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                    <span style={{ width: 10, height: 10, background: color, display: "inline-block" }} />
                    <span style={{ fontSize: 10.5, color: "var(--stone-500)", fontFamily: "'DM Sans', sans-serif" }}>{label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="fs-card">
          <div className="fs-card-header">
            <span className="fs-card-title">Variance Spotlight</span>
          </div>
          <div style={{ padding: "16px 20px" }}>
            {unfavorable.length > 0 && (
              <>
                <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--crimson-600)", marginBottom: 8 }}>
                  Most Unfavorable
                </p>
                {unfavorable.map((r, i) => {
                  const barW = Math.min(Math.abs(r.variance_pct_budget ?? 0) * 2, 100);
                  return (
                    <div key={i} style={{ marginBottom: 10 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                        <span style={{ fontSize: 12, color: "var(--ink)" }}>{r.account || r.category}</span>
                        <span style={{ fontSize: 11, fontFamily: "'IBM Plex Mono', monospace", color: "var(--crimson-600)", fontWeight: 500 }}>
                          {fmtFull(r.variance_vs_budget)}
                        </span>
                      </div>
                      <div style={{ height: 3, background: "var(--stone-100)" }}>
                        <div style={{ height: 3, background: "var(--crimson-600)", width: `${barW}%`, transition: "width 0.6s ease" }} />
                      </div>
                    </div>
                  );
                })}
              </>
            )}
            {favorable.length > 0 && (
              <>
                <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--forest-600)", marginTop: 16, marginBottom: 8 }}>
                  Most Favorable
                </p>
                {favorable.map((r, i) => {
                  const barW = Math.min(Math.abs(r.variance_pct_budget ?? 0) * 2, 100);
                  return (
                    <div key={i} style={{ marginBottom: 10 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                        <span style={{ fontSize: 12, color: "var(--ink)" }}>{r.account || r.category}</span>
                        <span style={{ fontSize: 11, fontFamily: "'IBM Plex Mono', monospace", color: "var(--forest-600)", fontWeight: 500 }}>
                          +{fmtFull(r.variance_vs_budget)}
                        </span>
                      </div>
                      <div style={{ height: 3, background: "var(--stone-100)" }}>
                        <div style={{ height: 3, background: "var(--forest-600)", width: `${barW}%`, transition: "width 0.6s ease" }} />
                      </div>
                    </div>
                  );
                })}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Full variance table */}
      <div className="fs-card anim-in-3" style={{ marginBottom: 24, overflow: "hidden" }}>
        <div className="fs-card-header">
          <span className="fs-card-title">Budget vs. Actuals — Full Detail</span>
          <span style={{ fontSize: 10, color: "var(--stone-400)", fontFamily: "'IBM Plex Mono', monospace" }}>
            {accounts.length} line items
          </span>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table className="fs-table">
            <thead>
              <tr>
                <th>Account</th>
                <th className="right">Actual</th>
                {accounts[0]?.budget        != null && <th className="right">Budget</th>}
                {accounts[0]?.prior_period   != null && <th className="right">Prior Period</th>}
                {accounts[0]?.variance_vs_budget   != null && <th className="right">Var ($)</th>}
                {accounts[0]?.variance_pct_budget  != null && <th className="right">Var %</th>}
              </tr>
            </thead>
            <tbody>
              {accounts.slice(0, 14).map((row, i) => {
                const acct = (row.account || row.category || "").toLowerCase();
                const isRevOrProfit = /revenue|profit|ebitda|income|earnings/.test(acct);
                const fav = isRevOrProfit
                ? (row.variance_vs_budget ?? 0) >= 0
                : (row.variance_vs_budget ?? 0) <= 0;
                return (
                  <tr key={i}>
                    <td style={{ fontWeight: 500 }}>{row.account || row.category || "—"}</td>
                    <td className="mono">{fmtFull(row.actual)}</td>
                    {row.budget        != null && <td className="mono" style={{ color: "var(--stone-500)" }}>{fmtFull(row.budget)}</td>}
                    {row.prior_period  != null && <td className="mono" style={{ color: "var(--stone-500)" }}>{fmtFull(row.prior_period)}</td>}
                    {row.variance_vs_budget  != null && <td className={`mono ${fav ? "pos" : "neg"}`}>{fmtFull(row.variance_vs_budget)}</td>}
                    {row.variance_pct_budget != null && <td className={`mono ${fav ? "pos" : "neg"}`}>{fmtPct(row.variance_pct_budget)}</td>}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* AI Commentary */}
      {commentary ? (
        <div className="anim-in-4">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <p className="fs-label" style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <Sparkles size={11} color="var(--forest-600)" />
              AI-Generated Executive Commentary
            </p>
            <button className="fs-btn fs-btn-ghost" onClick={generateCommentary} disabled={generating} style={{ fontSize: 11 }}>
              {generating ? "Regenerating…" : "Regenerate"}
            </button>
          </div>
          <div className="fs-commentary">{commentary}</div>
        </div>
      ) : (
        <div style={{ border: "1px dashed var(--stone-300)", padding: "28px 32px", textAlign: "center", background: "var(--stone-50)" }}>
          <Sparkles size={20} color="var(--stone-300)" style={{ display: "block", margin: "0 auto 10px" }} />
          <p style={{ fontSize: 13, color: "var(--stone-400)", marginBottom: 14 }}>
            Click <strong style={{ color: "var(--ink)" }}>Generate Commentary</strong> above to produce
            an AI-written executive summary, key variance analysis, and management action recommendations.
          </p>
          <button className="fs-btn fs-btn-secondary" onClick={generateCommentary} disabled={generating}>
            <Sparkles size={13} />
            {generating ? "Generating…" : "Generate Commentary"}
          </button>
        </div>
      )}

    </div>
  );
}