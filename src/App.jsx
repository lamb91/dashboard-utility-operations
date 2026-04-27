import { useState, useRef, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import * as XLSX from "xlsx";

const T = 6840;
const fmt = (n) => typeof n === "number" ? n.toLocaleString("it-IT") : n;
const pct = (a, b) => ((a / b) * 100).toFixed(1);

const navy = "#003366", orange = "#F7941F", white = "#FFFFFF";
const paleNavy = "#e6f0f7", paleOrange = "#fff5e6";
const textDark = "#0c2d4f", textMid = "#4a6a8a", textLight = "#7a9ab8";
const red = "#c0392b";

const CT = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: white, border: `1px solid ${paleNavy}`, borderRadius: "8px", padding: "10px 14px", fontSize: "12px", fontFamily: "'JetBrains Mono', monospace", boxShadow: "0 2px 8px rgba(0,51,102,0.1)" }}>
      <div style={{ color: textMid, marginBottom: "4px" }}>{label}</div>
      {payload.map((p, i) => <div key={i} style={{ color: textDark }}>{p.name}: {typeof p.value === "number" ? fmt(p.value) : p.value}{p.unit || ""}</div>)}
    </div>
  );
};

function Metric({ value, label, sub }) {
  return (
    <div style={{ background: paleNavy, borderRadius: "10px", padding: "1rem" }}>
      <div style={{ fontSize: "13px", color: textMid }}>{label}</div>
      <div style={{ fontSize: "24px", fontWeight: 600, fontFamily: "'JetBrains Mono', monospace", color: navy, marginTop: "4px" }}>{value}</div>
      {sub && <div style={{ fontSize: "12px", color: textLight, marginTop: "4px" }}>{sub}</div>}
    </div>
  );
}

function ExBlock({ title, items }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ border: `1px solid ${paleNavy}`, borderRadius: "10px", overflow: "hidden", marginBottom: "12px" }}>
      <button onClick={() => setOpen(!open)} style={{ width: "100%", display: "flex", alignItems: "center", padding: "12px 16px", border: "none", background: paleNavy, cursor: "pointer", textAlign: "left", gap: "8px" }}>
        <span style={{ flex: 1, fontSize: "13px", fontWeight: 600, color: navy }}>{title}</span>
        <span style={{ fontSize: "12px", color: textLight }}>{items.length} esempi</span>
        <span style={{ color: textLight, transform: open ? "rotate(180deg)" : "rotate(0)", transition: "transform 0.2s" }}>&#9662;</span>
      </button>
      {open && <div style={{ padding: "8px 16px 16px", background: white }}>
        {items.map((ex, i) => (
          <div key={i} style={{ padding: "8px 0", borderTop: i > 0 ? `1px solid ${paleNavy}` : "none", fontSize: "13px", color: textMid, lineHeight: 1.6 }}>
            <span style={{ fontWeight: 600, color: navy }}>{ex.tag}:</span> {ex.text}
          </div>
        ))}
      </div>}
    </div>
  );
}

// ═══ DATI REALISTICI TERNA — OPERAZIONI INTERNE ═══
// 3 use case principali:
//   1. Assistente Manutenzione Campo (ticket, anomalie, impianti)
//   2. Dispatcher Turni & Reperibilità (turni, disponibilità, assenze)
//   3. Report Vocale / Morning Briefing (digest operativo, KPI, alert)
//
// Periodo: 30 giorni lavorativi (~228 chiamate/giorno = 6.840 totali)

const intents = [
  { name: "Apertura ticket manutenzione", full: 987, partial: 134, none: 98, tot: 1219 },
  { name: "Stato ticket / intervento", full: 724, partial: 89, none: 112, tot: 925 },
  { name: "Chiusura ticket campo", full: 612, partial: 67, none: 45, tot: 724 },
  { name: "Reperibilità zona/turno", full: 534, partial: 78, none: 167, tot: 779 },
  { name: "Morning briefing operativo", full: 489, partial: 56, none: 34, tot: 579 },
  { name: "Registrazione assenza/cambio turno", full: 312, partial: 145, none: 89, tot: 546 },
  { name: "Anomalia impianto (segnalazione)", full: 287, partial: 156, none: 134, tot: 577 },
  { name: "KPI rete / stato linee", full: 234, partial: 67, none: 45, tot: 346 },
  { name: "Notifica team / escalation", full: 178, partial: 98, none: 78, tot: 354 },
  { name: "Disponibilità squadre intervento", full: 156, partial: 112, none: 123, tot: 391 },
].map(i => ({ ...i, pctFull: Math.round((i.full / i.tot) * 100), pctPartial: Math.round((i.partial / i.tot) * 100), pctNone: Math.round((i.none / i.tot) * 100) })).sort((a, b) => b.pctFull - a.pctFull);

const useCases = [
  { name: "Manutenzione Campo", v: 2868 },
  { name: "Turni & Reperibilità", v: 1716 },
  { name: "Briefing & Report", v: 925 },
  { name: "Anomalie & Alert", v: 931 },
  { name: "Altro", v: 400 },
];

// Deep-dive: gestite interamente
const cat100intents = [
  { name: "Apertura ticket", v: 987 }, { name: "Stato ticket", v: 724 },
  { name: "Chiusura ticket", v: 612 }, { name: "Reperibilità", v: 534 },
  { name: "Morning briefing", v: 489 }, { name: "Cambio turno", v: 312 },
  { name: "Anomalia impianto", v: 287 }, { name: "KPI rete", v: 234 },
  { name: "Notifica team", v: 178 }, { name: "Disponibilità squadre", v: 156 },
];
const cat100cases = [
  { name: "Manutenzione Campo", v: 2323 }, { name: "Turni & Reperibilità", v: 1002 },
  { name: "Briefing & Report", v: 723 }, { name: "Anomalie & Alert", v: 465 },
];

// Deep-dive: bot ha risposto + escalation
const cat50intents = [
  { name: "Anomalia impianto", v: 156 }, { name: "Cambio turno", v: 145 },
  { name: "Apertura ticket", v: 134 }, { name: "Disponibilità squadre", v: 112 },
  { name: "Notifica team", v: 98 }, { name: "Stato ticket", v: 89 },
  { name: "Reperibilità", v: 78 }, { name: "Chiusura ticket", v: 67 },
  { name: "KPI rete", v: 67 }, { name: "Morning briefing", v: 56 },
];
const cat50cases = [
  { name: "Manutenzione Campo", v: 401 }, { name: "Turni & Reperibilità", v: 335 },
  { name: "Anomalie & Alert", v: 154 }, { name: "Briefing & Report", v: 112 },
];

// Deep-dive: escalation immediata
const catImmIntents = [
  { name: "Emergenza operativa", v: 312 }, { name: "Problema complesso impianto", v: 234 },
  { name: "Richiesta operatore generico", v: 198 }, { name: "Coordinamento multi-squadra", v: 123 },
  { name: "Questione personale/HR", v: 89 }, { name: "Altro", v: 44 },
];

// ═══ AI CHAT COMPONENT ═══
function AiChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [keySet, setKeySet] = useState(false);
  const [xlsData, setXlsData] = useState(null);
  const [xlsName, setXlsName] = useState("");
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);
  const [systemPrompt, setSystemPrompt] = useState(`Sei un analista esperto di voicebot per le operazioni interne di Terna (TSO italiano — gestore della rete elettrica ad alta tensione). Analizzi i dati delle conversazioni del voicebot per fornire insight utili al team operations.

CONTESTO:
- Terna gestisce ~75.000 km di linee AT/AAT e oltre 900 stazioni elettriche
- Il voicebot serve tecnici sul campo, dispatcher, capoturno e dirigenti operations
- 3 use case principali: Manutenzione Campo, Turni & Reperibilità, Morning Briefing

REGOLE DI RISPOSTA:
- Rispondi SEMPRE in italiano naturale, con frasi complete
- MAI mostrare dati grezzi o formati CSV
- Quando descrivi conversazioni, racconta come a un collega
- Non inventare mai dati non presenti nel contesto

GLOSSARIO:
- GESTITA_BOT = richiesta gestita interamente dal voicebot
- ESCALATION_POST_RISPOSTA = il bot ha risposto ma serve intervento umano
- ESCALATION_IMMEDIATA = operatore chiesto subito (emergenze, casi complessi)
- SE = Stazione Elettrica, CP = Cabina Primaria, TR = Trasformatore
- KPI rete = indicatori performance (SAIDI, SAIFI, disponibilità linee)`);
  const chatEnd = useRef(null);
  const fileRef = useRef(null);

  useEffect(() => { chatEnd.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const parseExcel = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const wb = XLSX.read(new Uint8Array(e.target.result), { type: "array" });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(ws);
      setXlsData(rows);
      setXlsName(file.name);
      setMessages(prev => [...prev, { role: "system", text: `File caricato: ${file.name} — ${rows.length} righe. Puoi fare domande sui dati.` }]);
    };
    reader.readAsArrayBuffer(file);
  };

  const buildContext = (question) => {
    if (!xlsData) return "";
    const q = question.toLowerCase();
    const count = (arr, key) => {
      const c = {};
      arr.forEach(r => { const v = r[key]; if (v && v !== "NaN" && String(v).trim()) { const k = String(v).trim(); c[k] = (c[k] || 0) + 1; } });
      return Object.entries(c).sort((a, b) => b[1] - a[1]);
    };
    const esitoCount = count(xlsData, "esito");
    const intentCount = count(xlsData, "intent_principale");
    let summary = `RIEPILOGO DATASET (${xlsData.length} conversazioni):\nEsiti: ${esitoCount.map(([k,v])=>`${k}:${v}`).join(", ")}\nIntent: ${intentCount.slice(0,15).map(([k,v])=>`${k}:${v}`).join(", ")}`;
    let filtered = xlsData;
    const keywords = {
      "ticket": r => String(r.intent_principale || "").toLowerCase().includes("ticket"),
      "manutenz": r => String(r.intent_principale || "").toLowerCase().includes("manutenz"),
      "reperibilit": r => String(r.intent_principale || "").toLowerCase().includes("reperib"),
      "turni": r => String(r.intent_principale || "").toLowerCase().includes("turni"),
      "briefing": r => String(r.intent_principale || "").toLowerCase().includes("briefing"),
      "anomali": r => String(r.intent_principale || "").toLowerCase().includes("anomali"),
      "kpi": r => String(r.intent_principale || "").toLowerCase().includes("kpi"),
      "emergenz": r => r.esito === "ESCALATION_IMMEDIATA",
    };
    for (const [kw, filterFn] of Object.entries(keywords)) {
      if (q.includes(kw)) { filtered = xlsData.filter(filterFn); break; }
    }
    const maxRows = 80;
    const sample = filtered.length > maxRows ? filtered.slice(0, maxRows) : filtered;
    if (filtered.length < xlsData.length) {
      const cols = ["esito","intent_principale","impianto","severita","zona","note"];
      const compact = sample.map(r => cols.map(c => { const v = r[c]; return (v && v !== "NaN") ? `${c}=${v}` : null; }).filter(Boolean).join("|"));
      summary += `\n\nDETTAGLIO (${filtered.length} righe filtrate, ${sample.length} mostrate):\n${compact.join("\n")}`;
    }
    return summary;
  };

  const sendMessage = async () => {
    if (!input.trim() || !apiKey || !xlsData) return;
    const q = input.trim();
    setInput("");
    setMessages(prev => [...prev, { role: "user", text: q }]);
    setLoading(true);
    try {
      const context = buildContext(q);
      const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash-lite",
          messages: [
            { role: "system", content: `${systemPrompt}\n\nContesto dati:\n${context}` },
            ...messages.filter(m => m.role !== "system").slice(-6).map(m => ({ role: m.role, content: m.text })),
            { role: "user", content: q },
          ],
          max_tokens: 1500,
        }),
      });
      const data = await res.json();
      const reply = data.choices?.[0]?.message?.content || data.error?.message || "Errore nella risposta.";
      setMessages(prev => [...prev, { role: "assistant", text: reply }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: "assistant", text: `Errore: ${err.message}` }]);
    }
    setLoading(false);
  };

  if (!isOpen) {
    return (
      <div style={{ maxWidth: "880px", margin: "0 auto", padding: "0 1.5rem 2rem" }}>
        <button onClick={() => setIsOpen(true)} style={{
          width: "100%", padding: "16px", border: `2px solid ${navy}`, borderRadius: "12px",
          background: paleNavy, cursor: "pointer", fontSize: "14px", fontWeight: 600, color: navy,
          display: "flex", alignItems: "center", justifyContent: "center", gap: "10px",
        }}>
          <span style={{ fontSize: "20px" }}>&#128172;</span>
          Chiedi ai dati — interroga il dettaglio delle conversazioni con l'AI
        </button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "880px", margin: "0 auto", padding: "0 1.5rem 2rem" }}>
      <div style={{ border: `2px solid ${navy}`, borderRadius: "12px", overflow: "hidden" }}>
        <div style={{ background: navy, color: white, padding: "14px 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ fontSize: "18px" }}>&#128172;</span>
            <span style={{ fontSize: "14px", fontWeight: 600 }}>Chiedi ai dati</span>
            {xlsName && <span style={{ fontSize: "11px", opacity: 0.6, fontFamily: "'JetBrains Mono', monospace" }}>{xlsName}</span>}
          </div>
          <button onClick={() => setIsOpen(false)} style={{ background: "transparent", border: "none", color: white, fontSize: "18px", cursor: "pointer", opacity: 0.6 }}>&#10005;</button>
        </div>
        <div style={{ padding: "1.25rem", background: white }}>
          {(!keySet || !xlsData) && (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "16px" }}>
              {!keySet && (
                <div style={{ display: "flex", gap: "8px" }}>
                  <input type="password" placeholder="API key OpenRouter" value={apiKey}
                    onChange={e => setApiKey(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter" && apiKey.trim()) setKeySet(true); }}
                    style={{ flex: 1, padding: "10px 14px", border: `1px solid ${paleNavy}`, borderRadius: "8px", fontSize: "13px", fontFamily: "'JetBrains Mono', monospace" }} />
                  <button onClick={() => { if (apiKey.trim()) setKeySet(true); }} style={{
                    padding: "10px 20px", border: "none", borderRadius: "8px", background: navy, color: white, fontSize: "13px", fontWeight: 600, cursor: "pointer",
                  }}>Salva</button>
                </div>
              )}
              {keySet && !xlsData && (
                <div>
                  <input type="file" ref={fileRef} accept=".xlsx,.xls,.csv" style={{ display: "none" }}
                    onChange={e => { if (e.target.files[0]) parseExcel(e.target.files[0]); }} />
                  <button onClick={() => fileRef.current?.click()} style={{
                    width: "100%", padding: "20px", border: `2px dashed ${paleNavy}`, borderRadius: "8px",
                    background: `${paleNavy}60`, cursor: "pointer", fontSize: "13px", color: textMid, fontWeight: 500,
                  }}>&#128206; Carica il file Excel delle conversazioni</button>
                </div>
              )}
            </div>
          )}
          {keySet && xlsData && (
            <div style={{ marginBottom: "12px" }}>
              <button onClick={() => setShowPrompt(!showPrompt)} style={{ background: "transparent", border: "none", cursor: "pointer", fontSize: "12px", color: textLight, display: "flex", alignItems: "center", gap: "6px", padding: "4px 0" }}>
                <span style={{ transform: showPrompt ? "rotate(180deg)" : "rotate(0)", transition: "transform 0.2s" }}>&#9662;</span>
                {showPrompt ? "Nascondi prompt" : "Personalizza prompt di sistema"}
              </button>
              {showPrompt && <textarea value={systemPrompt} onChange={e => setSystemPrompt(e.target.value)} style={{ width: "100%", minHeight: "180px", padding: "12px", border: `1px solid ${paleNavy}`, borderRadius: "8px", fontSize: "12px", fontFamily: "'JetBrains Mono', monospace", color: textDark, lineHeight: 1.5, resize: "vertical", marginTop: "8px" }} />}
            </div>
          )}
          {messages.length > 0 && (
            <div style={{ maxHeight: "400px", overflowY: "auto", marginBottom: "12px", display: "flex", flexDirection: "column", gap: "10px" }}>
              {messages.map((m, i) => (
                <div key={i} style={{ padding: "10px 14px", borderRadius: "10px", fontSize: "13px", lineHeight: 1.6, whiteSpace: "pre-wrap",
                  ...(m.role === "user" ? { background: navy, color: white, marginLeft: "20%", borderBottomRightRadius: "4px" } :
                     m.role === "system" ? { background: paleNavy, color: textMid, fontStyle: "italic", textAlign: "center", fontSize: "12px" } :
                     { background: paleNavy, color: textDark, marginRight: "10%", borderBottomLeftRadius: "4px" }),
                }}>{m.text}</div>
              ))}
              {loading && <div style={{ background: paleNavy, color: textLight, padding: "10px 14px", borderRadius: "10px", fontSize: "12px", fontStyle: "italic" }}>Analizzo i dati...</div>}
              <div ref={chatEnd} />
            </div>
          )}
          {keySet && xlsData && (
            <div style={{ display: "flex", gap: "8px" }}>
              <input type="text" placeholder="Es: Quanti ticket sono stati aperti da campo?" value={input}
                onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key === "Enter" && !loading) sendMessage(); }}
                style={{ flex: 1, padding: "10px 14px", border: `1px solid ${paleNavy}`, borderRadius: "8px", fontSize: "13px" }} />
              <button onClick={sendMessage} disabled={loading || !input.trim()} style={{ padding: "10px 20px", border: "none", borderRadius: "8px", background: loading ? textLight : navy, color: white, fontSize: "13px", fontWeight: 600, cursor: loading ? "wait" : "pointer", opacity: !input.trim() ? 0.5 : 1 }}>Chiedi</button>
            </div>
          )}
          {keySet && xlsData && messages.length < 3 && (
            <div style={{ marginTop: "12px", display: "flex", flexWrap: "wrap", gap: "6px" }}>
              {["Quanti ticket manutenzione aperti da campo?", "Chi era reperibile nella zona Sud ieri?", "Anomalie con severità alta questa settimana?", "Quanti briefing completati senza escalation?"].map((q, i) => (
                <button key={i} onClick={() => setInput(q)} style={{ padding: "6px 12px", border: `1px solid ${paleNavy}`, borderRadius: "20px", background: white, fontSize: "11px", color: textMid, cursor: "pointer" }}>{q}</button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [deepDive, setDeepDive] = useState(null);

  return (
    <div style={{ minHeight: "100vh", background: white, color: textDark, fontFamily: "'IBM Plex Sans', system-ui, sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;700&display=swap" rel="stylesheet" />

      {/* ═══ HERO ═══ */}
      <div style={{ background: `linear-gradient(135deg, ${navy} 0%, #004d80 100%)`, color: white, padding: "2.5rem 1.5rem 2rem" }}>
        <div style={{ maxWidth: "880px", margin: "0 auto" }}>
          <div style={{ fontSize: "12px", fontFamily: "'JetBrains Mono', monospace", opacity: 0.6, marginBottom: "12px", letterSpacing: "1px" }}>
            TERNA · OPERATIONS — 1 MARZO – 11 APRILE 2026
          </div>
          <h1 style={{ fontSize: "clamp(22px, 4vw, 30px)", fontWeight: 700, margin: "0 0 12px", lineHeight: 1.3 }}>Voicebot Operations — Report Performance</h1>
          <p style={{ fontSize: "15px", opacity: 0.75, margin: "0 0 2rem", lineHeight: 1.6, maxWidth: "640px" }}>
            In 30 giorni il voicebot ha gestito {fmt(T)} interazioni operative — dai tecnici in campo ai dispatcher, fino ai briefing quotidiani per il management.
          </p>

          {/* KPI headline */}
          <div style={{ fontSize: "11px", fontFamily: "'JetBrains Mono', monospace", opacity: 0.5, marginBottom: "6px", letterSpacing: "0.5px" }}>RIEPILOGO GIORNALIERO</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px", marginBottom: "20px" }}>
            {[
              { v: "~228", l: "Interazioni totali / giorno", sub: `${fmt(T)} in 30 giorni` },
              { v: "~173", l: "Il bot ha lavorato", hi: true, sub: "147 gestite + 33 parziali" },
              { v: "73,2%", l: "Tasso di gestione bot", hi: true, sub: "64,5% auton. + 14,7% parz." },
              { v: "~2,2", l: "FTE equivalenti risparmiati", hi: true, sub: "1,8 + 0,4 FTE" },
            ].map((m, i) => (
              <div key={i} style={{ background: "rgba(255,255,255,0.12)", borderRadius: "10px", padding: "14px 16px" }}>
                <div style={{ fontSize: "22px", fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", color: m.hi ? orange : white }}>{m.v}</div>
                <div style={{ fontSize: "12px", opacity: 0.7, marginTop: "4px" }}>{m.l}</div>
                {m.sub && <div style={{ fontSize: "10px", opacity: 0.5, marginTop: "2px" }}>{m.sub}</div>}
              </div>
            ))}
          </div>

          {/* Use case breakdown */}
          <div style={{ fontSize: "10px", fontFamily: "'JetBrains Mono', monospace", opacity: 0.4, marginBottom: "5px", letterSpacing: "0.5px" }}>PER CASO D'USO</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "8px" }}>
            {[
              { v: fmt(2868), l: "Manutenzione Campo", sub: "Apertura/stato/chiusura ticket", icon: "&#128295;" },
              { v: fmt(1716), l: "Turni & Reperibilità", sub: "Disponibilità, cambi turno, assenze", icon: "&#128197;" },
              { v: fmt(925), l: "Briefing & Report", sub: "Morning briefing, KPI, alert", icon: "&#128202;" },
            ].map((m, i) => (
              <div key={i} style={{ background: "rgba(255,255,255,0.07)", borderRadius: "8px", padding: "12px 14px", borderLeft: `2px solid ${orange}` }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ fontSize: "16px" }} dangerouslySetInnerHTML={{ __html: m.icon }} />
                  <div>
                    <div style={{ fontSize: "18px", fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", color: orange }}>{m.v}</div>
                    <div style={{ fontSize: "11px", opacity: 0.7, marginTop: "2px" }}>{m.l}</div>
                    <div style={{ fontSize: "9px", opacity: 0.4, marginTop: "1px" }}>{m.sub}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: "880px", margin: "0 auto", padding: "2rem 1.5rem 3rem" }}>

        {/* ═══ 1. DIVISIONE ═══ */}
        <div style={{ marginBottom: "3rem" }}>
          <h2 style={{ fontSize: "18px", fontWeight: 600, margin: "0 0 8px", color: navy }}>1. Come si dividono le {fmt(T)} interazioni</h2>
          <p style={{ fontSize: "14px", color: textMid, lineHeight: 1.7, margin: "0 0 1.25rem" }}>Ogni interazione rientra in tre categorie, in base al livello di coinvolgimento del voicebot nella risoluzione.</p>

          <div style={{ display: "flex", height: "44px", borderRadius: "10px", overflow: "hidden", marginBottom: "12px", border: `1px solid ${paleNavy}` }}>
            <div style={{ width: "64.5%", background: navy, display: "flex", alignItems: "center", justifyContent: "center" }}><span style={{ fontSize: "12px", fontWeight: 600, color: white }}>64,5%</span></div>
            <div style={{ width: "14.7%", background: orange, display: "flex", alignItems: "center", justifyContent: "center" }}><span style={{ fontSize: "11px", fontWeight: 600, color: white }}>14,7%</span></div>
            <div style={{ width: "14.6%", background: paleNavy, display: "flex", alignItems: "center", justifyContent: "center" }}><span style={{ fontSize: "12px", fontWeight: 600, color: textMid }}>14,6%</span></div>
          </div>
          <div style={{ display: "flex", gap: "20px", flexWrap: "wrap", marginBottom: "1.25rem" }}>
            {[{ c: navy, l: "Gestite interamente dal bot" }, { c: orange, l: "Bot ha risposto, segue escalation" }, { c: paleNavy, l: "Escalation immediata (emergenze/complessi)", border: true }].map((lg, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <div style={{ width: 12, height: 12, borderRadius: "3px", background: lg.c, border: lg.border ? `1px solid ${textLight}` : "none" }} />
                <span style={{ fontSize: "12px", color: textMid }}>{lg.l}</span>
              </div>
            ))}
          </div>

          {/* 3 cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: "12px", marginBottom: "1.25rem" }}>
            {[
              { val: 4413, title: "Gestite interamente dal bot", desc: "Il voicebot ha completato l'operazione end-to-end: apertura ticket, consultazione turni, erogazione briefing.", sub: `${fmt(2868)} manutenzione · ${fmt(1002)} turni · ${fmt(543)} briefing/altro`, c: navy, dd: "100" },
              { val: 1002, title: "Bot ha risposto, escalation", desc: "Il bot ha fornito informazioni o avviato il processo, ma il caso richiedeva intervento umano per complessità o autorizzazione.", sub: `${fmt(534)} casi complessi · ${fmt(312)} KB miss · ${fmt(156)} incomprensioni`, c: orange, dd: "50" },
              { val: 1000, title: "Escalation immediata", desc: "Emergenze operative, guasti critici, coordinamento multi-squadra — richiesto subito il centro di controllo o un responsabile.", sub: `${fmt(1000)} richieste dirette al 1° turno`, c: textLight, dd: "0" },
            ].map((card, i) => (
              <div key={i} style={{ background: white, border: `1px solid ${paleNavy}`, borderRadius: "12px", padding: "1.25rem", borderLeft: `5px solid ${card.c}` }}>
                <div style={{ fontSize: "26px", fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", color: card.c }}>{fmt(card.val)}</div>
                <div style={{ fontSize: "14px", fontWeight: 600, color: card.c === textLight ? textDark : card.c, margin: "6px 0 8px" }}>{card.title}</div>
                <div style={{ fontSize: "13px", color: textMid, lineHeight: 1.5 }}>{card.desc}</div>
                <div style={{ fontSize: "12px", color: textLight, marginTop: "10px", lineHeight: 1.5 }}>{card.sub}</div>
                <button onClick={() => setDeepDive(deepDive === card.dd ? null : card.dd)} style={{
                  marginTop: "12px", padding: "6px 14px", border: `1px solid ${card.c === textLight ? paleNavy : card.c}`,
                  borderRadius: "6px", background: deepDive === card.dd ? (card.c === textLight ? navy : card.c) : white,
                  color: deepDive === card.dd ? white : (card.c === textLight ? navy : card.c),
                  fontSize: "12px", fontWeight: 600, cursor: "pointer", transition: "all 0.2s",
                }}>
                  {deepDive === card.dd ? "Chiudi" : "Approfondisci"}
                </button>
              </div>
            ))}
          </div>

          {/* DEEP DIVE: GESTITE */}
          {deepDive === "100" && (
            <div style={{ border: `2px solid ${navy}`, borderRadius: "12px", padding: "1.5rem", marginBottom: "1.5rem", background: `${paleNavy}40` }}>
              <h3 style={{ fontSize: "16px", fontWeight: 600, color: navy, margin: "0 0 6px" }}>Approfondimento: {fmt(4413)} interazioni gestite end-to-end</h3>
              <p style={{ fontSize: "13px", color: textMid, margin: "0 0 1.25rem", lineHeight: 1.6 }}>
                Il voicebot ha completato l'intero ciclo operativo senza intervento umano. Tempo medio di interazione: 1,4 turni per i briefing, 2,1 turni per i ticket manutenzione.
              </p>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: "10px", marginBottom: "1.25rem" }}>
                <Metric value={fmt(2323)} label="Ticket manutenzione" sub="Aperti, aggiornati o chiusi" />
                <Metric value={fmt(1002)} label="Turni & reperibilità" sub="Consultati o modificati" />
                <Metric value={fmt(723)} label="Briefing erogati" sub="Morning briefing + KPI" />
                <Metric value={fmt(Math.round(4413/30))} label="Al giorno" sub="Media su 30 giorni" />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "1.25rem" }}>
                <div style={{ border: `1px solid ${paleNavy}`, borderRadius: "10px", padding: "1.25rem", background: white }}>
                  <div style={{ fontSize: "14px", fontWeight: 600, color: navy, marginBottom: "12px" }}>Per tipologia di richiesta</div>
                  <ResponsiveContainer width="100%" height={320}>
                    <BarChart data={cat100intents} layout="vertical" margin={{ left: 10, right: 16 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={paleNavy} horizontal={false} />
                      <XAxis type="number" tick={{ fill: textLight, fontSize: 11 }} axisLine={false} tickLine={false} />
                      <YAxis type="category" dataKey="name" tick={{ fill: textDark, fontSize: 11 }} width={120} axisLine={false} tickLine={false} />
                      <Tooltip content={<CT />} />
                      <Bar dataKey="v" name="Interazioni" fill={navy} radius={[0, 4, 4, 0]} barSize={14} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div style={{ border: `1px solid ${paleNavy}`, borderRadius: "10px", padding: "1.25rem", background: white }}>
                  <div style={{ fontSize: "14px", fontWeight: 600, color: navy, marginBottom: "12px" }}>Per caso d'uso</div>
                  <ResponsiveContainer width="100%" height={320}>
                    <BarChart data={cat100cases} layout="vertical" margin={{ left: 10, right: 16 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={paleNavy} horizontal={false} />
                      <XAxis type="number" tick={{ fill: textLight, fontSize: 11 }} axisLine={false} tickLine={false} />
                      <YAxis type="category" dataKey="name" tick={{ fill: textDark, fontSize: 11 }} width={140} axisLine={false} tickLine={false} />
                      <Tooltip content={<CT />} />
                      <Bar dataKey="v" name="Interazioni" fill={navy} radius={[0, 4, 4, 0]} barSize={16} fillOpacity={0.75} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <ExBlock title="Esempi: Manutenzione Campo — gestite dal bot" items={[
                { tag: "Apertura ticket", text: "\"Ho un guasto all'isolatore sulla linea 132kV, impianto SE-Milano-Nord-03, priorita alta\" — il bot raccoglie severita, codice impianto, descrizione anomalia. Riepiloga: \"Ticket MNT-4892 aperto, severita alta, impianto SE-MI-N03, isolatore danneggiato. Confermo?\" — \"Confermo\" — \"Ticket registrato, protocollo inviato via SMS.\"" },
                { tag: "Stato ticket", text: "\"A che punto e il ticket MNT-4756 sulla SE di Foggia?\" — bot: \"Il ticket MNT-4756 e in stato 'Squadra assegnata'. Intervento previsto domani ore 7:00, squadra Rossi. Vuole dettagli?\"" },
                { tag: "Chiusura ticket", text: "\"Chiudo il ticket MNT-4801, intervento completato, sostituito sezionatore fase R\" — bot: \"Confermo chiusura MNT-4801. Lavoro: sostituzione sezionatore fase R. Durata intervento?\" — \"3 ore\" — \"Registrato. Ticket chiuso con protocollo.\"" },
              ]} />
              <ExBlock title="Esempi: Turni & Reperibilita — gestite dal bot" items={[
                { tag: "Reperibilita", text: "\"Chi e reperibile stanotte per la zona Lombardia?\" — bot: \"Reperibile zona Lombardia questa notte: Ing. Marco Ferretti, cell. 345-XXXXXXX, confermato attivo dalle 20:00. Vuole che lo notifichi?\"" },
                { tag: "Cambio turno", text: "\"Registra assenza last-minute di Bianchi per domani, turno mattina Centro\" — bot: \"Registro assenza Bianchi, 16 marzo, turno 06-14 zona Centro. Il sostituto designato e Verdi. Confermo la sostituzione?\" — \"Si\" — \"Fatto, Verdi notificato.\"" },
              ]} />
              <ExBlock title="Esempi: Morning Briefing — gestite dal bot" items={[
                { tag: "Briefing", text: "\"Dammi il briefing di oggi\" — bot: \"Buongiorno. Situazione ore 7:30: 3 anomalie attive (1 critica su linea 380kV Foggia-Benevento), 7 interventi in corso, SAIDI ieri 12,3 minuti (sotto soglia). Alert: manutenzione programmata sulla SE Torino-Nord dalle 14. Vuole approfondire?\"" },
                { tag: "KPI", text: "\"Come sta andando la disponibilita rete questa settimana?\" — bot: \"Disponibilita rete settimanale: 99,87% (target 99,9%). SAIFI: 0,12 interruzioni/utente. 2 eventi non programmati martedi sulla direttrice Adriatica. Trend stabile rispetto a settimana precedente.\"" },
              ]} />

              <div style={{ background: paleNavy, borderRadius: "10px", padding: "1rem 1.25rem", fontSize: "13px", color: navy, lineHeight: 1.6, borderLeft: `4px solid ${navy}` }}>
                <strong>La manutenzione campo genera il 53% del volume gestito autonomamente.</strong> Il bot eccelle nell'apertura ticket strutturata (987 gestiti su 1.219 totali = 81%) e nella consultazione stato interventi (78%). I briefing hanno il tasso di successo piu alto (84%) perche sono interazioni informative one-shot.
              </div>
            </div>
          )}

          {/* DEEP DIVE: PARZIALI */}
          {deepDive === "50" && (
            <div style={{ border: `2px solid ${orange}`, borderRadius: "12px", padding: "1.5rem", marginBottom: "1.5rem", background: `${paleOrange}40` }}>
              <h3 style={{ fontSize: "16px", fontWeight: 600, color: orange, margin: "0 0 6px" }}>Approfondimento: {fmt(1002)} interazioni con escalation dopo risposta</h3>
              <p style={{ fontSize: "13px", color: textMid, margin: "0 0 1.25rem", lineHeight: 1.6 }}>
                Il bot ha fornito informazioni o avviato il processo, ma la complessita del caso ha richiesto intervento umano. In {fmt(534)} casi per complessita operativa, in {fmt(312)} per informazioni mancanti, in {fmt(156)} per incomprensioni.
              </p>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: "10px", marginBottom: "1.25rem" }}>
                <Metric value={fmt(534)} label="Complessita operativa" sub="Serve decisione umana" />
                <Metric value={fmt(312)} label="Info mancanti (KB miss)" sub="Bot ha capito ma non aveva il dato" />
                <Metric value={fmt(156)} label="Incomprensioni" sub="Terminologia tecnica non riconosciuta" />
                <Metric value="87,2%" label="Risposte pertinenti" sub="Prima dell'escalation" />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "1.25rem" }}>
                <div style={{ border: `1px solid ${paleNavy}`, borderRadius: "10px", padding: "1.25rem", background: white }}>
                  <div style={{ fontSize: "14px", fontWeight: 600, color: navy, marginBottom: "12px" }}>Argomenti con escalation</div>
                  <ResponsiveContainer width="100%" height={320}>
                    <BarChart data={cat50intents} layout="vertical" margin={{ left: 10, right: 16 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={paleNavy} horizontal={false} />
                      <XAxis type="number" tick={{ fill: textLight, fontSize: 11 }} axisLine={false} tickLine={false} />
                      <YAxis type="category" dataKey="name" tick={{ fill: textDark, fontSize: 11 }} width={130} axisLine={false} tickLine={false} />
                      <Tooltip content={<CT />} />
                      <Bar dataKey="v" name="Interazioni" fill={orange} radius={[0, 4, 4, 0]} barSize={14} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div style={{ border: `1px solid ${paleNavy}`, borderRadius: "10px", padding: "1.25rem", background: white }}>
                  <div style={{ fontSize: "14px", fontWeight: 600, color: navy, marginBottom: "12px" }}>Per caso d'uso</div>
                  <ResponsiveContainer width="100%" height={320}>
                    <BarChart data={cat50cases} layout="vertical" margin={{ left: 10, right: 16 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={paleNavy} horizontal={false} />
                      <XAxis type="number" tick={{ fill: textLight, fontSize: 11 }} axisLine={false} tickLine={false} />
                      <YAxis type="category" dataKey="name" tick={{ fill: textDark, fontSize: 11 }} width={140} axisLine={false} tickLine={false} />
                      <Tooltip content={<CT />} />
                      <Bar dataKey="v" name="Interazioni" fill={orange} radius={[0, 4, 4, 0]} barSize={16} fillOpacity={0.75} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <ExBlock title="Esempi: il bot risponde, serve escalation" items={[
                { tag: "Anomalia complessa", text: "\"Segnalo anomalia termica sul TR2 della SE Brescia-Est, temperatura olio 87 gradi\" — bot registra l'anomalia e severita, ma: \"Questa temperatura supera la soglia di allerta. Consiglio escalation immediata al centro di controllo. La metto in contatto?\" — \"Si, subito.\"" },
                { tag: "Coordinamento", text: "\"Ho bisogno di una seconda squadra per l'intervento sulla 220kV Latina-Garigliano\" — bot verifica disponibilita: \"Squadra Napoli-2 disponibile ma richiede autorizzazione del capoturno per spostamento inter-zona. La collego?\"" },
                { tag: "KB miss", text: "\"Qual e la procedura per il collaudo post-sostituzione di un TA induttivo?\" — bot: \"Non ho la procedura specifica per collaudo TA induttivi nella documentazione disponibile. La metto in contatto con l'ingegneria di manutenzione?\"" },
                { tag: "Turno", text: "\"Devo spostare la reperibilita di 3 persone per la prossima settimana, zona Nord-Ovest\" — bot: \"Per modifiche multiple al piano reperibilita serve l'approvazione del responsabile area. Vuole che inoltri la richiesta o preferisce parlare direttamente?\"" },
              ]} />

              <div style={{ background: paleOrange, borderRadius: "10px", padding: "1rem 1.25rem", fontSize: "13px", color: "#7a5500", lineHeight: 1.6, borderLeft: `4px solid ${orange}` }}>
                <strong>Le anomalie impianto dominano le escalation (156 casi)</strong> — sono situazioni dove il bot raccoglie correttamente i dati ma la severita richiede decisione umana. I KB miss (312) sono concentrati su procedure tecniche specialistiche non ancora documentate nella knowledge base.
              </div>
            </div>
          )}

          {/* DEEP DIVE: IMMEDIATA */}
          {deepDive === "0" && (
            <div style={{ border: `2px solid ${textLight}`, borderRadius: "12px", padding: "1.5rem", marginBottom: "1.5rem", background: `${paleNavy}40` }}>
              <h3 style={{ fontSize: "16px", fontWeight: 600, color: navy, margin: "0 0 6px" }}>Approfondimento: {fmt(1000)} escalation immediate</h3>
              <p style={{ fontSize: "13px", color: textMid, margin: "0 0 1.25rem", lineHeight: 1.6 }}>
                Situazioni in cui il personale ha chiesto subito il collegamento con un operatore umano o il centro di controllo. Sono prevalentemente emergenze operative o problemi che richiedono coordinamento in tempo reale.
              </p>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: "10px", marginBottom: "1.25rem" }}>
                <Metric value={fmt(1000)} label="Escalation immediate" sub={`${pct(1000, T)}% del totale`} />
                <Metric value={fmt(Math.round(1000/30))} label="Al giorno" sub="Media su 30 giorni" />
                <Metric value="78%" label="Emergenze/critici" sub="Giustamente escalati" />
              </div>

              <div style={{ border: `1px solid ${paleNavy}`, borderRadius: "10px", padding: "1.25rem", marginBottom: "1.25rem", background: white }}>
                <div style={{ fontSize: "14px", fontWeight: 600, color: navy, marginBottom: "12px" }}>Motivi escalation immediata</div>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={catImmIntents} layout="vertical" margin={{ left: 10, right: 16 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={paleNavy} horizontal={false} />
                    <XAxis type="number" tick={{ fill: textLight, fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis type="category" dataKey="name" tick={{ fill: textDark, fontSize: 11 }} width={180} axisLine={false} tickLine={false} />
                    <Tooltip content={<CT />} />
                    <Bar dataKey="v" name="Richieste" fill={textLight} radius={[0, 4, 4, 0]} barSize={14} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <ExBlock title="Esempi: escalation immediate (giustificate)" items={[
                { tag: "Emergenza", text: "\"Guasto critico sulla 380kV Foggia-Benevento, serve il centro di controllo immediatamente\" — emergenza di rete che richiede coordinamento in tempo reale." },
                { tag: "Impianto complesso", text: "\"Ho un problema sul sistema di protezione differenziale del TR1 a Montalto, non risponde ai comandi da remoto\" — situazione che richiede ingegnere specializzato." },
                { tag: "Multi-squadra", text: "\"Devo coordinare 3 squadre per lo switch sulla direttrice Tirrenica, passami il dispatching\" — coordinamento che richiede autorizzazioni incrociate." },
                { tag: "Sicurezza", text: "\"Infortunio sul cantiere linea 150kV Sassari, serve ambulanza e responsabile HSE\" — emergenza sicurezza con protocollo dedicato." },
              ]} />

              <div style={{ background: paleNavy, borderRadius: "10px", padding: "1rem 1.25rem", fontSize: "13px", color: navy, lineHeight: 1.6, borderLeft: `4px solid ${textLight}` }}>
                <strong>Il 78% delle escalation immediate e giustificato</strong> — emergenze operative e situazioni che richiedono decisione umana in tempo reale. Solo il 22% (richieste generiche + questioni HR) potrebbe essere intercettato dal bot con un messaggio di benvenuto piu efficace.
              </div>
            </div>
          )}

          {/* Insight finale sezione 1 */}
          <div style={{ background: paleNavy, borderRadius: "10px", padding: "1rem 1.25rem", fontSize: "13px", color: navy, lineHeight: 1.6, borderLeft: `4px solid ${navy}` }}>
            <strong>Lettura chiave:</strong> il voicebot gestisce autonomamente il <strong>64,5%</strong> delle interazioni operative. Le escalation immediate (14,6%) sono in larga parte emergenze legittime — non un fallimento del bot ma un corretto triage. Il margine di miglioramento e sulle <strong>{fmt(1002)} interazioni parziali</strong>, dove arricchire la KB e le integrazioni puo convertire parte di queste in gestioni autonome.
          </div>
        </div>


        {/* ═══ 2. ARGOMENTI ═══ */}
        <div style={{ marginBottom: "3rem" }}>
          <h2 style={{ fontSize: "18px", fontWeight: 600, margin: "0 0 8px", color: navy }}>2. Efficacia per tipologia di richiesta</h2>
          <p style={{ fontSize: "14px", color: textMid, lineHeight: 1.7, margin: "0 0 1.25rem" }}>Per ogni tipo di operazione, il tasso di gestione autonoma, parziale ed escalation.</p>

          <div style={{ border: `1px solid ${paleNavy}`, borderRadius: "12px", overflow: "hidden", marginBottom: "1.5rem" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
              <thead>
                <tr style={{ background: navy, color: white }}>
                  <th style={{ textAlign: "left", padding: "12px 16px", fontWeight: 600, fontSize: "12px" }}>Operazione</th>
                  <th style={{ textAlign: "right", padding: "12px 10px", fontWeight: 600, fontSize: "11px" }}>Gestite</th>
                  <th style={{ textAlign: "right", padding: "12px 10px", fontWeight: 600, fontSize: "11px" }}>Parziali</th>
                  <th style={{ textAlign: "right", padding: "12px 10px", fontWeight: 600, fontSize: "11px" }}>Escalation</th>
                  <th style={{ textAlign: "right", padding: "12px 10px", fontWeight: 600, fontSize: "11px" }}>Tot</th>
                  <th style={{ textAlign: "left", padding: "12px 16px", fontWeight: 600, fontSize: "11px", width: "20%" }}>Autonomia bot</th>
                </tr>
              </thead>
              <tbody>
                {intents.map((it, i) => (
                  <tr key={i} style={{ background: i % 2 === 0 ? white : paleNavy }}>
                    <td style={{ padding: "10px 16px", fontWeight: 600, color: navy, fontSize: "12px" }}>{it.name}</td>
                    <td style={{ padding: "10px 10px", textAlign: "right", fontFamily: "'JetBrains Mono', monospace", color: navy, fontSize: "12px" }}>{fmt(it.full)}</td>
                    <td style={{ padding: "10px 10px", textAlign: "right", fontFamily: "'JetBrains Mono', monospace", color: orange, fontSize: "12px" }}>{fmt(it.partial)}</td>
                    <td style={{ padding: "10px 10px", textAlign: "right", fontFamily: "'JetBrains Mono', monospace", color: textLight, fontSize: "12px" }}>{fmt(it.none)}</td>
                    <td style={{ padding: "10px 10px", textAlign: "right", fontFamily: "'JetBrains Mono', monospace", fontSize: "12px" }}>{fmt(it.tot)}</td>
                    <td style={{ padding: "10px 16px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <div style={{ flex: 1, height: "10px", background: "#e0e8f0", borderRadius: "5px", overflow: "hidden", display: "flex" }}>
                          <div style={{ height: "100%", width: it.pctFull + "%", background: navy, borderRadius: "5px 0 0 5px" }} />
                          <div style={{ height: "100%", width: it.pctPartial + "%", background: orange }} />
                        </div>
                        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "11px", minWidth: "28px", textAlign: "right", fontWeight: 600, color: navy }}>{it.pctFull}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ border: `1px solid ${paleNavy}`, borderRadius: "12px", padding: "1.25rem", marginBottom: "1.5rem" }}>
            <div style={{ fontSize: "14px", fontWeight: 600, color: navy, marginBottom: "4px" }}>Confronto visivo</div>
            <div style={{ display: "flex", gap: "16px", marginBottom: "14px" }}>
              {[{ c: navy, l: "Gestite interamente" }, { c: orange, l: "Parziali" }, { c: "#c8d8e8", l: "Escalation" }].map((lg, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <div style={{ width: 10, height: 10, borderRadius: "2px", background: lg.c }} />
                  <span style={{ fontSize: "12px", color: textMid }}>{lg.l}</span>
                </div>
              ))}
            </div>
            <ResponsiveContainer width="100%" height={380}>
              <BarChart data={intents} layout="vertical" margin={{ left: 10, right: 16 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={paleNavy} horizontal={false} />
                <XAxis type="number" tick={{ fill: textLight, fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" tick={{ fill: textDark, fontSize: 12 }} width={200} axisLine={false} tickLine={false} />
                <Tooltip content={<CT />} />
                <Bar dataKey="full" name="Gestite" stackId="a" fill={navy} barSize={16} />
                <Bar dataKey="partial" name="Parziali" stackId="a" fill={orange} barSize={16} />
                <Bar dataKey="none" name="Escalation" stackId="a" fill="#c8d8e8" barSize={16} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div style={{ background: paleNavy, borderRadius: "10px", padding: "1rem 1.25rem", fontSize: "13px", color: navy, lineHeight: 1.6, borderLeft: `4px solid ${orange}` }}>
            <strong>Morning briefing (84%) e apertura ticket (81%) hanno i tassi di autonomia piu alti</strong> — sono operazioni strutturate e ripetitive, ideali per il voicebot. La disponibilita squadre (40%) e le anomalie impianto (50%) hanno margini di crescita: richiedono integrazione con i sistemi di asset management e protocolli di severita piu granulari.
          </div>
        </div>


        {/* ═══ 3. INCOMPRENSIONI ═══ */}
        <div style={{ marginBottom: "3rem" }}>
          <h2 style={{ fontSize: "18px", fontWeight: 600, margin: "0 0 8px", color: navy }}>3. Incomprensioni e terminologia tecnica</h2>
          <p style={{ fontSize: "14px", color: textMid, lineHeight: 1.7, margin: "0 0 1.25rem" }}>
            Le incomprensioni nel contesto Terna sono quasi esclusivamente legate a: codici impianto pronunciati a voce (SE-MI-N03), sigle tecniche (TA, TV, TR, SPG), numeri di ticket, e coordinate operative. Il bot recupera nel 65% dei casi.
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: "12px", marginBottom: "1.5rem" }}>
            <Metric value={fmt(623)} label="Conversazioni con incomprensioni" sub={`${pct(623, T)}% del totale`} />
            <Metric value={fmt(405)} label="Recuperate dal bot" sub="65% tasso di recupero" />
            <Metric value={fmt(156)} label="Escalation per incomprensione" sub="Non recuperate" />
            <Metric value={fmt(62)} label="Con 3+ incomprensioni" sub="Escalation forzata" />
          </div>

          <div style={{ border: `1px solid ${paleNavy}`, borderRadius: "12px", padding: "1.25rem", marginBottom: "1.5rem" }}>
            <div style={{ fontSize: "14px", fontWeight: 600, color: navy, marginBottom: "12px" }}>Cause principali di incomprensione</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: "10px" }}>
              {[
                { v: "38%", l: "Codici impianto", desc: "SE-MI-N03, CP-RM-12" },
                { v: "27%", l: "Sigle tecniche", desc: "TA, TV, TR, SPG, DCS" },
                { v: "21%", l: "Numeri ticket/OdL", desc: "MNT-4892, OdL-2024-187" },
                { v: "14%", l: "Altro", desc: "Accenti, rumore campo" },
              ].map((item, i) => (
                <div key={i} style={{ background: paleNavy, borderRadius: "8px", padding: "12px", textAlign: "center" }}>
                  <div style={{ fontSize: "22px", fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", color: navy }}>{item.v}</div>
                  <div style={{ fontSize: "12px", fontWeight: 600, color: textDark, marginTop: "4px" }}>{item.l}</div>
                  <div style={{ fontSize: "11px", color: textLight, marginTop: "2px" }}>{item.desc}</div>
                </div>
              ))}
            </div>
          </div>

          <ExBlock title="Esempi: incomprensione recuperata (1 tentativo)" items={[
            { tag: "Codice impianto", text: "\"Guasto sulla esse e milano nord zero tre\" — bot: \"Intende l'impianto SE-Milano-Nord-03?\" — \"Si esatto\" — bot procede con apertura ticket." },
            { tag: "Ticket", text: "\"Stato del emme enne ti quattro sette cinque sei\" — bot non riconosce — l'utente ripete: \"MNT-4756\" — bot trova e risponde." },
            { tag: "Sigla", text: "\"Problema sul ti a della fase erre\" — bot: \"Si riferisce al Trasformatore Amperometrico (TA) sulla fase R?\" — \"Si\" — bot registra." },
          ]} />
          <ExBlock title="Esempi: 3+ incomprensioni, escalation forzata" items={[
            { tag: "Rumore campo", text: "Tecnico su traliccio con vento forte — il bot non riesce a interpretare il parlato per 3 volte consecutive. \"Mi passi il centro, qui non si sente niente.\"" },
            { tag: "Codice WBS", text: "\"WBS elle punto tre punto quattro punto sette barra due\" — il bot confonde le cifre e i separatori. Dopo 3 tentativi l'utente chiede operatore." },
            { tag: "Multi-sigla", text: "\"Verifica il DCS del TR1 lato AT della SE BO-EST\" — troppi acronimi concatenati, il bot perde il contesto. Escalation." },
          ]} />

          <div style={{ background: paleNavy, borderRadius: "10px", padding: "1rem 1.25rem", fontSize: "13px", color: navy, lineHeight: 1.6, borderLeft: `4px solid ${navy}` }}>
            <strong>Soluzione proposta:</strong> integrare un dizionario di sigle Terna (impianti, componenti, codici WBS) nel modello vocale. Stima: riduzione del 40% delle incomprensioni, con impatto diretto su ~250 conversazioni/mese che oggi richiedono escalation.
          </div>
        </div>


        {/* ═══ 4. IMPATTO OPERATIVO ═══ */}
        <div style={{ marginBottom: "3rem" }}>
          <h2 style={{ fontSize: "18px", fontWeight: 600, margin: "0 0 8px", color: navy }}>4. Impatto operativo e risparmio</h2>
          <p style={{ fontSize: "14px", color: textMid, lineHeight: 1.7, margin: "0 0 1.25rem" }}>
            Il voicebot gestisce ~173 interazioni/giorno. L'impatto si misura in tempo risparmiato agli operatori del centro di controllo, ai dispatcher e ai responsabili di area.
          </p>

          <div style={{ border: `1px solid ${paleNavy}`, borderRadius: "12px", padding: "1.25rem", marginBottom: "1.5rem", background: paleNavy }}>
            <div style={{ fontSize: "14px", fontWeight: 600, color: navy, marginBottom: "12px" }}>Risparmio operativo attuale</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: "12px" }}>
              {[
                { v: "~147", l: "Interazioni autonome/giorno", sub: "4.413 in 30 giorni" },
                { v: "~7,4h", l: "Ore risparmiate/giorno", sub: "147 x 3 min medi" },
                { v: "~1,8 FTE", l: "Operatori equivalenti", sub: "Su turno 8h" },
                { v: "~54h", l: "Risparmio settimanale", sub: "37h gestite + 17h parziali" },
              ].map((m, i) => (
                <div key={i} style={{ background: white, borderRadius: "8px", padding: "12px" }}>
                  <div style={{ fontSize: "20px", fontWeight: 600, fontFamily: "'JetBrains Mono', monospace", color: navy }}>{m.v}</div>
                  <div style={{ fontSize: "12px", color: textMid, marginTop: "4px" }}>{m.l}</div>
                  <div style={{ fontSize: "11px", color: textLight, marginTop: "2px" }}>{m.sub}</div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ border: `1px solid ${paleNavy}`, borderRadius: "12px", padding: "1.25rem", marginBottom: "1.5rem" }}>
            <div style={{ fontSize: "14px", fontWeight: 600, color: navy, marginBottom: "12px" }}>Proiezione con miglioramenti</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: "12px" }}>
              {[
                { scenario: "Situazione attuale", calls: "~147/g", hours: "~7,4h/g", fte: "~1,8", c: textLight },
                { scenario: "Con dizionario + KB arricchita", calls: "~178/g", hours: "~9,5h/g", fte: "~2,4", c: orange },
                { scenario: "Con integr. asset management", calls: "~198/g", hours: "~11h/g", fte: "~3,0", c: navy },
              ].map((s, i) => (
                <div key={i} style={{ background: white, border: `1px solid ${paleNavy}`, borderRadius: "10px", padding: "1rem", borderTop: `4px solid ${s.c}` }}>
                  <div style={{ fontSize: "12px", fontWeight: 600, color: s.c, marginBottom: "10px" }}>{s.scenario}</div>
                  {[
                    { l: "Interazioni/giorno", v: s.calls },
                    { l: "Ore risparmiate", v: s.hours },
                    { l: "FTE equivalenti", v: s.fte },
                  ].map((r, j) => (
                    <div key={j} style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", marginBottom: "4px" }}>
                      <span style={{ color: textMid }}>{r.l}</span>
                      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 600, color: navy }}>{r.v}</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>

          <div style={{ background: paleOrange, borderRadius: "10px", padding: "1rem 1.25rem", fontSize: "13px", color: "#7a5500", lineHeight: 1.6, borderLeft: `4px solid ${orange}` }}>
            <strong>Gia oggi il voicebot vale ~1,8 FTE.</strong> Con il dizionario tecnico e l'arricchimento KB si arriva a 2,4 FTE. L'integrazione con il sistema di asset management (per disponibilita squadre e storico interventi) porta a 3 FTE — un impatto molto rilevante considerando che opera h24 senza interruzioni.
          </div>
        </div>


        {/* ═══ 5. PROSSIMI PASSI ═══ */}
        <div style={{ marginBottom: "2rem" }}>
          <h2 style={{ fontSize: "18px", fontWeight: 600, margin: "0 0 8px", color: navy }}>5. Piano operativo e prossimi passi</h2>
          <div style={{ border: `1px solid ${paleNavy}`, borderRadius: "12px", overflow: "hidden" }}>
            {[
              { n: "01", t: "Dizionario terminologia Terna nel modello vocale", d: "Glossario di sigle impianto (SE, CP, TR, TA, TV, SPG), codici WBS, nomi stazioni elettriche. Riduzione stimata 40% delle incomprensioni.", tag: "Quick win", c: red },
              { n: "02", t: "Arricchimento KB: procedure manutenzione e collaudo", d: `Aggiungere procedure operative (collaudo TA, protocolli SPG, check-list post-intervento). Impatto diretto sulle ${fmt(312)} interazioni con KB miss.`, tag: "Priorita alta", c: red },
              { n: "03", t: "Integrazione asset management (impianti, squadre)", d: "API real-time verso il sistema asset per disponibilita squadre, storico interventi per impianto, piani manutenzione programmata.", tag: "Priorita alta", c: orange },
              { n: "04", t: "Noise cancellation per chiamate da campo", d: "Migliorare il riconoscimento vocale in condizioni di rumore (tralicci, sottostazioni). Riduzione stimata 60% delle escalation per rumore.", tag: "Priorita media", c: orange },
              { n: "05", t: "Estensione: gestione OdL (Ordini di Lavoro) end-to-end", d: "Il bot crea, assegna e chiude Ordini di Lavoro completi, inclusa la firma digitale vocale del responsabile.", tag: "Prossimo passo", c: navy },
              { n: "06", t: "Canale aggiuntivo: push notification + chat Teams", d: "Alert proattivi (anomalie critiche, scadenze turni) via push e gestione conversazionale su Teams per il personale d'ufficio.", tag: "Medio termine", c: navy },
            ].map((item, i) => (
              <div key={i} style={{ display: "flex", gap: "16px", padding: "1.25rem", borderTop: i > 0 ? `1px solid ${paleNavy}` : "none", background: i % 2 === 0 ? white : paleNavy }}>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "20px", fontWeight: 700, color: item.c, minWidth: "36px" }}>{item.n}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px", flexWrap: "wrap" }}>
                    <span style={{ fontSize: "14px", fontWeight: 600, color: navy }}>{item.t}</span>
                    <span style={{ fontSize: "11px", fontFamily: "'JetBrains Mono', monospace", fontWeight: 600, color: item.c, background: item.c + "18", padding: "3px 10px", borderRadius: "6px" }}>{item.tag}</span>
                  </div>
                  <div style={{ fontSize: "13px", color: textMid, lineHeight: 1.6 }}>{item.d}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* AI CHAT */}
      <AiChat />

      <div style={{ background: navy, color: white, padding: "1.5rem", textAlign: "center" }}>
        <div style={{ fontSize: "13px", opacity: 0.7 }}>Report realizzato da <strong style={{ color: orange }}>Ellysse</strong> · Divisione AI conversazionale di Maps Group</div>
      </div>
    </div>
  );
}
