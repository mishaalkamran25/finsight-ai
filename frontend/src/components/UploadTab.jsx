import { useState, useRef } from "react";
import { CloudUpload, Database, CheckCircle, AlertTriangle, FileSpreadsheet, ArrowRight, Table } from "lucide-react";
import axios from "axios";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const COL_MAP = [
  { col: "Account",     aliases: "Line Item, Description, GL Account, Name" },
  { col: "Category",    aliases: "Type, Group, Section, Class" },
  { col: "Month",       aliases: "Period, Date, Fiscal Period" },
  { col: "Actual",      aliases: "Actuals, Amount, YTD Actual" },
  { col: "Budget",      aliases: "Plan, Target, Budgeted" },
  { col: "Prior_Period",aliases: "Prior, PY, Last Year, Previous Period" },
  { col: "Forecast",    aliases: "Fcst, Latest Estimate, LE" },
];

export default function UploadTab({ onDataLoaded }) {
  const [drag, setDrag]     = useState(false);
  const [loading, setLoad]  = useState(false);
  const [error, setError]   = useState("");
  const [loaded, setLoaded] = useState(null);
  const ref                 = useRef();

  const process = async (file) => {
    setLoad(true); setError("");
    const fd = new FormData();
    fd.append("file", file);
    try {
      const r = await axios.post(`${API}/api/upload`, fd);
      setLoaded(r.data); onDataLoaded(r.data);
    } catch (e) { setError(e.response?.data?.detail || "Upload failed. Check your file format."); }
    finally { setLoad(false); }
  };

  const loadDemo = async () => {
    setLoad(true); setError("");
    try {
      const r = await axios.post(`${API}/api/demo`);
      setLoaded(r.data); onDataLoaded(r.data);
    } catch (e) { setError(e.response?.data?.detail || "Could not load demo dataset."); }
    finally { setLoad(false); }
  };

  const s = loaded?.metrics?.summary;

  return (
    <div className="anim-in" style={{ maxWidth: 820 }}>

      {/* Page header */}
      <div className="fs-page-header">
        <h1 className="fs-page-title">Load Financial Data</h1>
        <p className="fs-page-subtitle">
          Upload a P&L, budget vs. actuals, or forecast export. The parser handles CSV and Excel
          with automatic column detection — no template required.
        </p>
      </div>

      {/* Two-column upload options */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 28 }}>

        {/* Drop zone */}
        <div>
          <p className="fs-label" style={{ marginBottom: 10 }}>Upload a file</p>
          <div
            className={`fs-dropzone ${drag ? "drag" : ""}`}
            style={{ minHeight: 200 }}
            onDragOver={e => { e.preventDefault(); setDrag(true); }}
            onDragLeave={() => setDrag(false)}
            onDrop={e => { e.preventDefault(); setDrag(false); process(e.dataTransfer.files[0]); }}
            onClick={() => ref.current.click()}
          >
            <input ref={ref} type="file" style={{ display:"none" }} accept=".csv,.xlsx,.xls"
              onChange={e => process(e.target.files[0])} />

            {/* Icon */}
            <div style={{
              width: 52, height: 52,
              border: "1px solid var(--stone-300)",
              background: "#fff",
              display: "flex", alignItems: "center", justifyContent: "center",
              marginBottom: 16,
            }}>
              <CloudUpload size={22} color="var(--navy-700)" strokeWidth={1.5} />
            </div>

            <p style={{ fontSize: 13, fontWeight: 500, color: "var(--ink)", marginBottom: 4 }}>
              Drop file here or click to browse
            </p>
            <p style={{ fontSize: 11, color: "var(--stone-400)" }}>
              CSV · XLSX · XLS &nbsp;·&nbsp; Max 10 MB
            </p>
          </div>
        </div>

        {/* Demo dataset card */}
        <div>
          <p className="fs-label" style={{ marginBottom: 10 }}>Or use demo data</p>
          <div className="fs-card" style={{ minHeight: 200, display: "flex", flexDirection: "column", padding: 24 }}>

            {/* Badge */}
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 5,
              background: "var(--forest-muted)",
              border: "1px solid #A8D8C0",
              padding: "3px 10px",
              marginBottom: 14, alignSelf: "flex-start",
            }}>
              <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--forest-700)" }}>
                Demo Dataset
              </span>
            </div>

            <p style={{ fontFamily: "'Libre Baskerville', serif", fontSize: 15, fontWeight: 700, color: "var(--ink)", marginBottom: 8 }}>
              Meridian Consumer Goods
            </p>
            <p style={{ fontSize: 12, color: "var(--stone-500)", lineHeight: 1.65, marginBottom: 20, flex: 1 }}>
              A realistic 6-month P&L with Revenue, COGS, Gross Profit, Sales &amp; Marketing,
              G&amp;A, R&amp;D, and EBITDA. Full budget vs. actuals and prior period included.
            </p>

            <button className="fs-btn fs-btn-secondary" onClick={loadDemo} disabled={loading}
              style={{ alignSelf: "flex-start" }}>
              <Database size={13} />
              Load Demo Dataset
            </button>
          </div>
        </div>
      </div>

      {/* Column reference */}
      <div style={{
        background: "var(--stone-50)",
        border: "1px solid var(--stone-200)",
        marginBottom: 24,
      }}>
        <div className="fs-card-header">
          <span className="fs-card-title" style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <Table size={12} /> Accepted Column Names — Auto-Detected
          </span>
        </div>
        <div style={{ padding: "16px 20px" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <thead>
              <tr>
                <th style={{ textAlign:"left", padding:"4px 12px 4px 0", color:"var(--stone-400)", fontSize:10, fontWeight:600, letterSpacing:"0.1em", textTransform:"uppercase" }}>Standard Column</th>
                <th style={{ textAlign:"left", padding:"4px 0", color:"var(--stone-400)", fontSize:10, fontWeight:600, letterSpacing:"0.1em", textTransform:"uppercase" }}>Also recognized as</th>
              </tr>
            </thead>
            <tbody>
              {COL_MAP.map(({ col, aliases }) => (
                <tr key={col}>
                  <td style={{ padding:"5px 12px 5px 0", verticalAlign:"top" }}>
                    <span className="fs-tag">{col}</span>
                  </td>
                  <td style={{ padding:"5px 0", color:"var(--stone-400)", fontSize:11, lineHeight:1.5 }}>
                    {aliases}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="fs-alert info" style={{ marginBottom: 16 }}>
          <div style={{ display:"flex", gap:4, marginTop:1 }}>
            {[0,1,2].map(i => (
              <span key={i} className={["blink","blink-2","blink-3"][i]} style={{
                width:5, height:5, borderRadius:"50%",
                background:"var(--navy-600)", display:"inline-block",
              }} />
            ))}
          </div>
          <span>Parsing file and computing financial metrics…</span>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="fs-alert error" style={{ marginBottom: 16 }}>
          <AlertTriangle size={14} style={{ marginTop:1, flexShrink:0 }} />
          <span>{error}</span>
        </div>
      )}

      {/* Success */}
      {loaded && (
        <div className="anim-in fs-card" style={{ borderLeft: "3px solid var(--forest-600)" }}>
          <div className="fs-card-header">
            <span style={{ display:"flex", alignItems:"center", gap:7, fontSize:13, fontWeight:600, color:"var(--forest-700)" }}>
              <CheckCircle size={14} color="var(--forest-600)" />
              Dataset loaded successfully
            </span>
          </div>
          <div className="fs-card-body">
            <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:10 }}>
              <FileSpreadsheet size={13} color="var(--stone-400)" />
              <span style={{ fontSize:13, color:"var(--ink)", fontWeight:500 }}>{loaded.filename}</span>
            </div>
            <p style={{ fontSize:11, color:"var(--stone-400)", marginBottom:20, fontFamily:"'IBM Plex Mono', monospace" }}>
              {loaded.rows} rows &nbsp;·&nbsp; Columns: {loaded.columns?.join(", ")}
            </p>

            {/* Summary metrics */}
            {s && (
              <div style={{ display:"flex", gap:32, marginBottom:24, paddingBottom:20, borderBottom:"1px solid var(--stone-100)" }}>
                {s.total_actual != null && (
                  <div>
                    <p className="fs-kpi-label">Total Actual</p>
                    <p className="fs-mono" style={{ fontSize:20, fontWeight:500, color:"var(--ink)" }}>
                      ${(s.total_actual/1e6).toFixed(1)}M
                    </p>
                  </div>
                )}
                {s.total_budget != null && (
                  <div>
                    <p className="fs-kpi-label">Total Budget</p>
                    <p className="fs-mono" style={{ fontSize:20, fontWeight:500, color:"var(--stone-500)" }}>
                      ${(s.total_budget/1e6).toFixed(1)}M
                    </p>
                  </div>
                )}
                {s.total_variance_vs_budget != null && (
                  <div>
                    <p className="fs-kpi-label">Variance vs Budget</p>
                    <p className="fs-mono" style={{
                      fontSize:20, fontWeight:500,
                      color: s.total_variance_vs_budget >= 0 ? "var(--forest-600)" : "var(--crimson-600)",
                    }}>
                      {s.total_variance_vs_budget >= 0 ? "+" : ""}
                      ${(s.total_variance_vs_budget/1e6).toFixed(1)}M
                      <span style={{ fontSize:12, marginLeft:6 }}>
                        ({s.total_variance_pct > 0 ? "+" : ""}{s.total_variance_pct}%)
                      </span>
                    </p>
                  </div>
                )}
              </div>
            )}

            <button className="fs-btn fs-btn-primary" onClick={() => onDataLoaded(loaded)}>
              Proceed to FP&amp;A Copilot <ArrowRight size={13} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
