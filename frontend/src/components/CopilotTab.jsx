import { useState, useRef, useEffect } from "react";
import { Send, CornerDownLeft, Info } from "lucide-react";
import axios from "axios";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const SUGGESTED = [
  "What drove the unfavorable OPEX variance?",
  "Which line items are most over budget?",
  "Summarize overall performance for the CFO.",
  "Where is margin pressure coming from?",
  "What should management investigate this period?",
  "How did COGS trend month over month?",
];

function Message({ m, index }) {
  const isUser = m.role === "user";
  return (
    <div
      className="anim-in"
      style={{
        animationDelay: `${index * 0.04}s`,
        display: "flex",
        flexDirection: isUser ? "row-reverse" : "row",
        alignItems: "flex-start",
        gap: 12,
        marginBottom: 20,
      }}
    >
      <div
        className={`fs-chat-avatar ${isUser ? "user" : "assistant"}`}
        style={{ flexShrink: 0 }}
      >
        {isUser ? "YOU" : "AI"}
      </div>
      <div className={`fs-chat-bubble ${m.error ? "error" : isUser ? "user" : "assistant"}`}>
        <pre style={{
          margin: 0,
          fontFamily: "'DM Sans', sans-serif",
          fontSize: 13,
          lineHeight: 1.75,
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
        }}>
          {m.content}
        </pre>
      </div>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 20 }}>
      <div className="fs-chat-avatar assistant">AI</div>
      <div className="fs-chat-bubble assistant" style={{ padding: "14px 18px" }}>
        <div style={{ display: "flex", gap: 5, alignItems: "center", height: 16 }}>
          {[0, 1, 2].map(i => (
            <span
              key={i}
              className={["blink", "blink-2", "blink-3"][i]}
              style={{
                width: 5, height: 5,
                borderRadius: "50%",
                background: "var(--navy-600)",
                display: "inline-block",
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function EmptyState({ onSelect }) {
  return (
    <div style={{ paddingTop: 8 }}>
      <p className="fs-label" style={{ marginBottom: 12 }}>Suggested questions</p>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        {SUGGESTED.map(q => (
          <button
            key={q}
            onClick={() => onSelect(q)}
            style={{
              textAlign: "left",
              padding: "12px 14px",
              background: "#fff",
              border: "1px solid var(--stone-200)",
              cursor: "pointer",
              fontSize: 12.5,
              color: "var(--ink)",
              lineHeight: 1.55,
              fontFamily: "'DM Sans', sans-serif",
              transition: "border-color 0.15s, background 0.15s",
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = "var(--navy-600)";
              e.currentTarget.style.background  = "var(--stone-50)";
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = "var(--stone-200)";
              e.currentTarget.style.background  = "#fff";
            }}
          >
            {q}
          </button>
        ))}
      </div>
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
        border: "1px solid var(--stone-200)",
        background: "var(--stone-50)",
        display: "flex", alignItems: "center", justifyContent: "center",
        marginBottom: 20,
      }}>
        <CornerDownLeft size={20} color="var(--stone-300)" strokeWidth={1.5} />
      </div>
      <p style={{
        fontFamily: "'Libre Baskerville', serif",
        fontSize: 16, fontWeight: 700, color: "var(--ink)", marginBottom: 8,
      }}>
        No dataset loaded
      </p>
      <p style={{ fontSize: 13, color: "var(--stone-400)", maxWidth: 320, lineHeight: 1.6 }}>
        Return to the Data Upload tab and load a file or the demo dataset to begin analysis.
      </p>
    </div>
  );
}

export default function CopilotTab({ dataLoaded }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput]       = useState("");
  const [loading, setLoading]   = useState(false);
  const bottomRef               = useRef();
  const textareaRef             = useRef();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const send = async (text) => {
    const msg = (text || input).trim();
    if (!msg || loading) return;
    setInput("");
    const userMsg    = { role: "user", content: msg };
    const newHistory = [...messages, userMsg];
    setMessages(newHistory);
    setLoading(true);
    try {
      const res = await axios.post(`${API}/api/copilot`, {
        message: msg,
        history: messages,
      });
      setMessages([...newHistory, { role: "assistant", content: res.data.response }]);
    } catch (e) {
      setMessages([...newHistory, {
        role: "assistant",
        content: `Error: ${e.response?.data?.detail || "Could not reach the AI service. Please try again."}`,
        error: true,
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  if (!dataLoaded) return <NoData />;

  const hasMessages = messages.length > 0;

  return (
    <div className="anim-in" style={{ display: "flex", gap: 32, alignItems: "flex-start" }}>

      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
        <div className="fs-page-header">
          <h1 className="fs-page-title">FP&A Copilot</h1>
          <p className="fs-page-subtitle">
            Ask plain-English questions about your data. Every answer is grounded
            exclusively in the uploaded file — no numbers are invented.
          </p>
        </div>

        <div style={{ marginBottom: 24, minHeight: 200 }}>
          {!hasMessages && <EmptyState onSelect={send} />}
          {messages.map((m, i) => <Message key={i} m={m} index={i} />)}
          {loading && <TypingIndicator />}
          <div ref={bottomRef} />
        </div>

        <div style={{
          border: "1px solid var(--stone-300)",
          background: "#fff",
          display: "flex",
          alignItems: "flex-end",
          position: "sticky",
          bottom: 24,
        }}>
          <textarea
            ref={textareaRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask a finance question — e.g. What drove the COGS variance in Q2?"
            rows={2}
            style={{
              flex: 1,
              padding: "13px 16px",
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 13,
              color: "var(--ink)",
              background: "transparent",
              border: "none",
              outline: "none",
              resize: "none",
              lineHeight: 1.6,
            }}
          />
          <button
            onClick={() => send()}
            disabled={!input.trim() || loading}
            style={{
              width: 48,
              alignSelf: "stretch",
              background: input.trim() && !loading ? "var(--forest-600)" : "var(--stone-100)",
              border: "none",
              borderLeft: "1px solid var(--stone-200)",
              cursor: input.trim() && !loading ? "pointer" : "not-allowed",
              display: "flex", alignItems: "center", justifyContent: "center",
              transition: "background 0.15s",
              flexShrink: 0,
            }}
          >
            <Send
              size={15}
              color={input.trim() && !loading ? "#fff" : "var(--stone-400)"}
              strokeWidth={1.8}
            />
          </button>
        </div>

        <p style={{
          fontSize: 10.5,
          color: "var(--stone-400)",
          marginTop: 8,
          fontFamily: "'DM Sans', sans-serif",
          letterSpacing: "0.02em",
        }}>
          ENTER to send · SHIFT + ENTER for new line
        </p>
      </div>

      <div style={{ width: 220, flexShrink: 0 }}>
        <p className="fs-label" style={{ marginBottom: 12 }}>How it works</p>
        <div className="fs-card" style={{ marginBottom: 16 }}>
          <div style={{ padding: "14px 16px" }}>
            {[
              { step: "01", text: "Your file is parsed and all financial metrics are pre-calculated deterministically." },
              { step: "02", text: "Your question is sent to the AI with those calculations as grounding context." },
              { step: "03", text: "The AI explains the findings — it cannot invent numbers not in your data." },
            ].map(({ step, text }) => (
              <div key={step} style={{ display: "flex", gap: 10, marginBottom: 14 }}>
                <span style={{
                  fontFamily: "'IBM Plex Mono', monospace",
                  fontSize: 9, fontWeight: 500,
                  color: "var(--forest-600)",
                  marginTop: 2, flexShrink: 0,
                }}>
                  {step}
                </span>
                <p style={{ fontSize: 11.5, color: "var(--stone-500)", lineHeight: 1.65 }}>
                  {text}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="fs-alert info" style={{ flexDirection: "column", gap: 6 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <Info size={12} style={{ flexShrink: 0 }} />
            <span style={{ fontWeight: 600, fontSize: 11 }}>Guardrails active</span>
          </div>
          <p style={{ fontSize: 11, lineHeight: 1.6, paddingLeft: 18 }}>
            If the data is insufficient to answer a question, the AI will say so rather than speculate.
          </p>
        </div>

        {hasMessages && (
          <button
            onClick={() => setMessages([])}
            className="fs-btn fs-btn-ghost"
            style={{ width: "100%", justifyContent: "center", marginTop: 12, fontSize: 11.5 }}
          >
            Clear conversation
          </button>
        )}
      </div>

    </div>
  );
}