import { useState, useRef, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import * as XLSX from "xlsx";

const T = 8412;
const fmt = (n) => typeof n === "number" ? n.toLocaleString("it-IT") : n;
const pct = (a, b) => ((a / b) * 100).toFixed(1);

const navy = "#003366", teal = "#006B77", white = "#FFFFFF";
const paleNavy = "#e6f0f7", paleTeal = "#e6f5f5";
const textDark = "#0c2d4f", textMid = "#4a6a8a", textLight = "#7a9ab8";
const red = "#c0392b", green = "#1a8a5c";

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

function TabButton({ active, color, children, onClick }) {
  return (
    <button onClick={onClick} style={{
      padding: "10px 20px", border: `1px solid ${active ? color : paleNavy}`,
      borderRadius: "8px", cursor: "pointer", fontSize: "13px", fontWeight: active ? 600 : 400,
      color: active ? white : textMid, background: active ? color : white,
      transition: "all 0.2s", whiteSpace: "nowrap",
    }}>{children}</button>
  );
}

// ═══ DATI REALISTICI TERNA — OPERAZIONI INTERNE ═══
// Contesto: Terna (~5.600 dipendenti) adotta un voicebot per gestire richieste interne
// Periodo: 30 giorni lavorativi
// ~280 chiamate/giorno = 8.412 totali

const intents = [
  { name: "Reset password / Accessi", full: 1124, partial: 85, none: 142, tot: 1351 },
  { name: "Ferie e permessi", full: 812, partial: 198, none: 245, tot: 1255 },
  { name: "Prenotazione sale riunioni", full: 634, partial: 42, none: 88, tot: 764 },
  { name: "Stato ticket IT", full: 489, partial: 112, none: 167, tot: 768 },
  { name: "Info busta paga / cedolino", full: 287, partial: 264, none: 98, tot: 649 },
  { name: "Guasti e manutenzione sede", full: 245, partial: 89, none: 134, tot: 468 },
  { name: "Reperibilità e turni", full: 198, partial: 156, none: 203, tot: 557 },
  { name: "Richiesta DPI / sicurezza", full: 176, partial: 67, none: 45, tot: 288 },
  { name: "Trasferte e rimborsi", full: 134, partial: 187, none: 112, tot: 433 },
  { name: "Stato ordini acquisto", full: 112, partial: 142, none: 89, tot: 343 },
].map(i => ({ ...i, pctFull: Math.round((i.full / i.tot) * 100), pctPartial: Math.round((i.partial / i.tot) * 100), pctNone: Math.round((i.none / i.tot) * 100) })).sort((a, b) => b.pctFull - a.pctFull);

const departments = [
  { name: "IT / Sistemi", v: 2119 }, { name: "Risorse Umane", v: 1904 },
  { name: "Facility / Servizi", v: 1232 }, { name: "Dispacciamento", v: 1089 },
  { name: "Acquisti / Procurement", v: 987 }, { name: "HSE / Sicurezza", v: 581 },
  { name: "Amministrazione", v: 500 },
];

// Deep-dive data — Gestite interamente
const cat100intents = [
  { name: "Reset password", v: 1124 }, { name: "Ferie/permessi", v: 812 },
  { name: "Sale riunioni", v: 634 }, { name: "Stato ticket IT", v: 489 },
  { name: "Info cedolino", v: 287 }, { name: "Guasti sede", v: 245 },
  { name: "Reperibilità", v: 198 }, { name: "DPI/sicurezza", v: 176 },
  { name: "Trasferte", v: 134 }, { name: "Ordini acquisto", v: 112 },
];
const cat100depts = [
  { name: "IT / Sistemi", v: 1613 }, { name: "Risorse Umane", v: 1099 },
  { name: "Facility", v: 879 }, { name: "Dispacciamento", v: 398 },
  { name: "HSE", v: 222 },
];

// Deep-dive data — Bot ha risposto, escalation
const cat50intents = [
  { name: "Info cedolino", v: 264 }, { name: "Ferie/permessi", v: 198 },
  { name: "Trasferte/rimborsi", v: 187 }, { name: "Reperibilità/turni", v: 156 },
  { name: "Ordini acquisto", v: 142 }, { name: "Stato ticket IT", v: 112 },
  { name: "Guasti sede", v: 89 }, { name: "Reset password", v: 85 },
  { name: "DPI/sicurezza", v: 67 }, { name: "Sale riunioni", v: 42 },
];
const cat50depts = [
  { name: "Risorse Umane", v: 462 }, { name: "Acquisti", v: 284 },
  { name: "Dispacciamento", v: 243 }, { name: "IT / Sistemi", v: 197 },
  { name: "Facility", v: 134 }, { name: "Amministrazione", v: 98 },
];

// Deep-dive data — Escalation immediata
const catImmIntents = [
  { name: "Richiesta operatore generico", v: 987 }, { name: "Problema complesso IT", v: 534 },
  { name: "Questione personale HR", v: 423 }, { name: "Emergenza operativa", v: 312 },
  { name: "Reclamo/segnalazione", v: 198 }, { name: "Altro", v: 82 },
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
  const [systemPrompt, setSystemPrompt] = useState(`Sei un analista esperto di voicebot per un progetto di operazioni interne Terna (operatore della rete elettrica nazionale ad alta tensione). Analizzi i dati delle conversazioni del voicebot per fornire insight utili al team.

REGOLE DI RISPOSTA:
- Rispondi SEMPRE in italiano naturale, con frasi complete e leggibili.
- MAI mostrare dati grezzi, campi tecnici, pipe "|" o formati CSV. Rielabora tutto in linguaggio naturale.
- Quando descrivi conversazioni specifiche, racconta cosa è successo come lo racconteresti a un collega.
- Quando dai numeri aggregati, presentali in modo chiaro con una lista ordinata e leggibile.
- Se la domanda chiede esempi specifici, descrivi 3-5 casi concreti in linguaggio naturale.
- Non inventare mai dati non presenti nel contesto.

GLOSSARIO:
- GESTITA_BOT_RISOLTA = conversazione gestita con successo dal bot, senza operatore
- GESTITA_BOT_CHIUSA = il bot ha interagito, l'utente ha chiuso senza chiedere operatore
- TRANSFER_IMMEDIATO = operatore chiesto al primo turno senza interazione col bot
- TRANSFER_POST_RISPOSTA = il bot ha risposto, l'utente ha comunque chiesto l'operatore
- TRANSFER_KB_MISS = il bot ha capito la domanda ma non aveva l'informazione
- TRANSFER_INCOMPRENSIONI = il bot non ha capito cosa diceva l'utente
- ABBANDONO = conversazione vuota o interrotta subito

CONTESTO TERNA:
- TSO italiano (Transmission System Operator) - gestione rete elettrica AT
- ~5.600 dipendenti distribuiti su tutto il territorio nazionale
- Aree: IT/Sistemi, HR, Facility Management, Dispacciamento, Procurement, HSE
- Il voicebot gestisce richieste interne dei dipendenti (non clienti esterni)`);
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
    const deptCount = count(xlsData, "area_richiedente");

    const botRisposte = xlsData.filter(r => r.bot_ha_risposto === 1 || r.bot_ha_risposto === true).length;
    const pertinenti = xlsData.filter(r => r.risposta_pertinente === 1 || r.risposta_pertinente === true).length;
    const totIncompr = xlsData.filter(r => r.num_incomprensioni > 0).length;
    const totKbMiss = xlsData.filter(r => r.num_kb_miss > 0).length;

    let summary = `RIEPILOGO DATASET (${xlsData.length} conversazioni):
Esiti: ${esitoCount.map(([k,v])=>`${k}:${v}`).join(", ")}
Intent principali: ${intentCount.slice(0,15).map(([k,v])=>`${k}:${v}`).join(", ")}
Aree richiedenti: ${deptCount.slice(0,10).map(([k,v])=>`${k}:${v}`).join(", ")}
Bot ha risposto: ${botRisposte}/${xlsData.length}
Risposte pertinenti: ${pertinenti}
Con incomprensioni: ${totIncompr}, Con KB miss: ${totKbMiss}`;

    let filtered = xlsData;
    const keywords = {
      "password": r => String(r.intent_principale || "").toLowerCase().includes("password"),
      "ferie": r => String(r.intent_principale || "").toLowerCase().includes("ferie"),
      "permess": r => String(r.intent_principale || "").toLowerCase().includes("permess"),
      "sala": r => String(r.intent_principale || "").toLowerCase().includes("sala"),
      "ticket": r => String(r.intent_principale || "").toLowerCase().includes("ticket"),
      "cedolino": r => String(r.intent_principale || "").toLowerCase().includes("cedolino"),
      "busta paga": r => String(r.intent_principale || "").toLowerCase().includes("cedolino"),
      "guast": r => String(r.intent_principale || "").toLowerCase().includes("guast"),
      "turni": r => String(r.intent_principale || "").toLowerCase().includes("turni"),
      "reperibilit": r => String(r.intent_principale || "").toLowerCase().includes("reperib"),
      "dpi": r => String(r.intent_principale || "").toLowerCase().includes("dpi"),
      "trasfert": r => String(r.intent_principale || "").toLowerCase().includes("trasfert"),
      "ordine": r => String(r.intent_principale || "").toLowerCase().includes("ordine"),
      "incomprension": r => r.num_incomprensioni > 0,
      "kb miss": r => r.esito === "TRANSFER_KB_MISS" || r.num_kb_miss > 0,
      "risolt": r => r.esito === "GESTITA_BOT_RISOLTA",
      "trasferit": r => r.esito?.startsWith?.("TRANSFER"),
      "immediat": r => r.esito === "TRANSFER_IMMEDIATO",
    };

    let filterApplied = "nessuno";
    for (const [kw, filterFn] of Object.entries(keywords)) {
      if (q.includes(kw)) {
        filtered = xlsData.filter(filterFn);
        filterApplied = `keyword "${kw}" -> ${filtered.length} righe`;
        break;
      }
    }

    const maxRows = 80;
    const sample = filtered.length > maxRows ? filtered.slice(0, maxRows) : filtered;
    const cols = ["esito","bot_ha_risposto","risposta_pertinente","num_turni_utili","num_incomprensioni","num_kb_miss","intent_principale","area_richiedente","motivo_trasferimento","note"];

    let detail = "";
    if (filtered.length < xlsData.length) {
      const compact = sample.map(r => {
        const parts = cols.map(c => {
          const v = r[c];
          if (v === undefined || v === null || v === "" || v === "NaN" || (typeof v === "number" && isNaN(v))) return null;
          return `${c}=${v}`;
        }).filter(Boolean);
        return parts.join("|");
      });
      detail = `\n\nDETTAGLIO FILTRATO (${filterApplied}, mostrate ${sample.length}/${filtered.length}):\n${compact.join("\n")}`;
    }

    return summary + detail;
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
            {xlsName && <span style={{ fontSize: "11px", opacity: 0.6, fontFamily: "'JetBrains Mono', monospace" }}>{xlsName} · {xlsData?.length} righe</span>}
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
                  }}>
                    &#128206; Clicca per caricare il file Excel delle conversazioni
                  </button>
                </div>
              )}
            </div>
          )}

          {keySet && xlsData && (
            <div style={{ marginBottom: "12px" }}>
              <button onClick={() => setShowPrompt(!showPrompt)} style={{
                background: "transparent", border: "none", cursor: "pointer", fontSize: "12px",
                color: textLight, display: "flex", alignItems: "center", gap: "6px", padding: "4px 0", marginBottom: showPrompt ? "8px" : "0",
              }}>
                <span style={{ transform: showPrompt ? "rotate(180deg)" : "rotate(0)", transition: "transform 0.2s" }}>&#9662;</span>
                {showPrompt ? "Nascondi prompt di sistema" : "Personalizza prompt di sistema"}
              </button>
              {showPrompt && (
                <div>
                  <textarea value={systemPrompt} onChange={e => setSystemPrompt(e.target.value)}
                    style={{
                      width: "100%", minHeight: "200px", padding: "12px", border: `1px solid ${paleNavy}`,
                      borderRadius: "8px", fontSize: "12px", fontFamily: "'JetBrains Mono', monospace",
                      color: textDark, lineHeight: 1.5, resize: "vertical",
                    }} />
                </div>
              )}
            </div>
          )}

          {messages.length > 0 && (
            <div style={{ maxHeight: "400px", overflowY: "auto", marginBottom: "12px", display: "flex", flexDirection: "column", gap: "10px" }}>
              {messages.map((m, i) => (
                <div key={i} style={{
                  padding: "10px 14px", borderRadius: "10px", fontSize: "13px", lineHeight: 1.6, whiteSpace: "pre-wrap",
                  ...(m.role === "user" ? { background: navy, color: white, marginLeft: "20%", borderBottomRightRadius: "4px" } :
                     m.role === "system" ? { background: paleNavy, color: textMid, fontStyle: "italic", textAlign: "center", fontSize: "12px" } :
                     { background: paleNavy, color: textDark, marginRight: "10%", borderBottomLeftRadius: "4px" }),
                }}>
                  {m.text}
                </div>
              ))}
              {loading && (
                <div style={{ background: paleNavy, color: textLight, padding: "10px 14px", borderRadius: "10px", fontSize: "12px", fontStyle: "italic" }}>
                  Analizzo i dati...
                </div>
              )}
              <div ref={chatEnd} />
            </div>
          )}

          {keySet && xlsData && (
            <div style={{ display: "flex", gap: "8px" }}>
              <input type="text" placeholder="Es: Quanti reset password vengono gestiti senza operatore?" value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && !loading) sendMessage(); }}
                style={{ flex: 1, padding: "10px 14px", border: `1px solid ${paleNavy}`, borderRadius: "8px", fontSize: "13px" }} />
              <button onClick={sendMessage} disabled={loading || !input.trim()} style={{
                padding: "10px 20px", border: "none", borderRadius: "8px",
                background: loading ? textLight : navy, color: white, fontSize: "13px", fontWeight: 600,
                cursor: loading ? "wait" : "pointer", opacity: !input.trim() ? 0.5 : 1,
              }}>Chiedi</button>
            </div>
          )}

          {keySet && xlsData && messages.length < 3 && (
            <div style={{ marginTop: "12px", display: "flex", flexWrap: "wrap", gap: "6px" }}>
              {[
                "Quanti reset password vengono gestiti autonomamente?",
                "Quali aree generano più escalation?",
                "Mostrami i casi di KB miss su ferie e permessi",
                "Qual è il tasso di successo per richieste IT?",
                "Quante conversazioni hanno 3+ incomprensioni?",
              ].map((q, i) => (
                <button key={i} onClick={() => { setInput(q); }} style={{
                  padding: "6px 12px", border: `1px solid ${paleNavy}`, borderRadius: "20px",
                  background: white, fontSize: "11px", color: textMid, cursor: "pointer",
                }}>{q}</button>
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
            TERNA · OPERAZIONI INTERNE — 1 MARZO – 11 APRILE 2026
          </div>
          <h1 style={{ fontSize: "clamp(22px, 4vw, 30px)", fontWeight: 700, margin: "0 0 12px", lineHeight: 1.3 }}>Report performance voicebot operazioni interne</h1>
          <p style={{ fontSize: "15px", opacity: 0.75, margin: "0 0 2rem", lineHeight: 1.6, maxWidth: "640px" }}>
            In 30 giorni lavorativi il voicebot ha gestito {fmt(T)} chiamate interne dei dipendenti Terna. Questo report mostra i risultati, dove il bot eccelle e i margini di miglioramento.
          </p>

          {/* Row 1: TOTALI */}
          <div style={{ fontSize: "11px", fontFamily: "'JetBrains Mono', monospace", opacity: 0.5, marginBottom: "6px", letterSpacing: "0.5px" }}>RIEPILOGO GIORNALIERO</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px", marginBottom: "20px" }}>
            {[
              { v: "~280", l: "Chiamate totali al giorno", sub: `${fmt(T)} in 30 giorni` },
              { v: "~196", l: "Il bot ha lavorato", hi: true, sub: "146 gestite + 50 parziali" },
              { v: "70,1%", l: "Tasso di intervento bot", hi: true, sub: "52,3% + 17,8%" },
              { v: "~2,5", l: "FTE totali equivalenti", hi: true, sub: "1,8 + 0,7 FTE" },
            ].map((m, i) => (
              <div key={i} style={{ background: "rgba(255,255,255,0.12)", borderRadius: "10px", padding: "14px 16px", backdropFilter: "blur(4px)" }}>
                <div style={{ fontSize: "22px", fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", color: m.hi ? "#4dd0a0" : white }}>{m.v}</div>
                <div style={{ fontSize: "12px", opacity: 0.7, marginTop: "4px" }}>{m.l}</div>
                {m.sub && <div style={{ fontSize: "10px", opacity: 0.5, marginTop: "2px" }}>{m.sub}</div>}
              </div>
            ))}
          </div>

          {/* Row 2: Gestite senza operatore */}
          <div style={{ fontSize: "10px", fontFamily: "'JetBrains Mono', monospace", opacity: 0.4, marginBottom: "5px", letterSpacing: "0.5px" }}>RICHIESTE GESTITE AUTONOMAMENTE DAL VOICEBOT</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "8px", marginBottom: "12px" }}>
            {[
              { v: "~146", l: "Al giorno", sub: "4.401 in 30 giorni" },
              { v: "~7,3h", l: "Ore risparmiate al giorno", hi: true, sub: "stima 3 min/chiamata" },
              { v: "~1,8", l: "FTE equivalenti", hi: true, sub: "operatori a tempo pieno" },
            ].map((m, i) => (
              <div key={i} style={{ background: "rgba(255,255,255,0.07)", borderRadius: "8px", padding: "10px 12px" }}>
                <div style={{ fontSize: "17px", fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", color: m.hi ? "#4dd0a0" : white }}>{m.v}</div>
                <div style={{ fontSize: "11px", opacity: 0.6, marginTop: "3px" }}>{m.l}</div>
                {m.sub && <div style={{ fontSize: "9px", opacity: 0.4, marginTop: "2px" }}>{m.sub}</div>}
              </div>
            ))}
          </div>

          {/* Row 3: Bot ha risposto, escalation */}
          <div style={{ fontSize: "10px", fontFamily: "'JetBrains Mono', monospace", opacity: 0.4, marginBottom: "5px", letterSpacing: "0.5px" }}>RICHIESTE GESTITE DAL BOT CON SUCCESSIVA ESCALATION A OPERATORE</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "8px" }}>
            {[
              { v: "~50", l: "Al giorno", sub: "1.497 in 30 giorni" },
              { v: "~1,7h", l: "Ore di interazione bot/giorno", hi: true, sub: "stima 2 min/chiamata" },
              { v: "~0,7", l: "FTE equivalenti", hi: true, sub: "operatori a tempo pieno" },
            ].map((m, i) => (
              <div key={i} style={{ background: "rgba(255,255,255,0.05)", borderRadius: "8px", padding: "10px 12px", borderLeft: `2px solid #4dd0a0` }}>
                <div style={{ fontSize: "17px", fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", color: m.hi ? "#4dd0a0" : white }}>{m.v}</div>
                <div style={{ fontSize: "11px", opacity: 0.6, marginTop: "3px" }}>{m.l}</div>
                {m.sub && <div style={{ fontSize: "9px", opacity: 0.4, marginTop: "2px" }}>{m.sub}</div>}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: "880px", margin: "0 auto", padding: "2rem 1.5rem 3rem" }}>

        {/* ═══ 1. DIVISIONE ═══ */}
        <div style={{ marginBottom: "3rem" }}>
          <h2 style={{ fontSize: "18px", fontWeight: 600, margin: "0 0 8px", color: navy }}>1. Come si dividono le {fmt(T)} chiamate interne</h2>
          <p style={{ fontSize: "14px", color: textMid, lineHeight: 1.7, margin: "0 0 1.25rem" }}>Ogni chiamata rientra in una di tre categorie, in base a quanto il bot è stato coinvolto nella risoluzione.</p>

          <div style={{ display: "flex", height: "44px", borderRadius: "10px", overflow: "hidden", marginBottom: "12px", border: `1px solid ${paleNavy}` }}>
            <div style={{ width: "52.3%", background: navy, display: "flex", alignItems: "center", justifyContent: "center" }}><span style={{ fontSize: "12px", fontWeight: 600, color: white }}>52,3%</span></div>
            <div style={{ width: "17.8%", background: teal, display: "flex", alignItems: "center", justifyContent: "center" }}><span style={{ fontSize: "11px", fontWeight: 600, color: white }}>17,8%</span></div>
            <div style={{ width: "29.9%", background: paleNavy, display: "flex", alignItems: "center", justifyContent: "center" }}><span style={{ fontSize: "12px", fontWeight: 600, color: textMid }}>29,9%</span></div>
          </div>
          <div style={{ display: "flex", gap: "20px", flexWrap: "wrap", marginBottom: "1.25rem" }}>
            {[{ c: navy, l: "Gestite interamente dal bot" }, { c: teal, l: "Bot ha risposto, dipendente chiede operatore" }, { c: paleNavy, l: "Escalation immediata", border: true }].map((lg, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <div style={{ width: 12, height: 12, borderRadius: "3px", background: lg.c, border: lg.border ? `1px solid ${textLight}` : "none" }} />
                <span style={{ fontSize: "12px", color: textMid }}>{lg.l}</span>
              </div>
            ))}
          </div>

          {/* 3 summary cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: "12px", marginBottom: "1.25rem" }}>
            {[
              { val: 4401, title: "Gestite interamente dal bot", desc: "Il bot ha ricevuto la richiesta, risposto e concluso. Nessun operatore necessario.", sub: `${fmt(2654)} risolte dal bot · ${fmt(1747)} chiuse dal dipendente`, c: navy, dd: "100" },
              { val: 1497, title: "Bot ha risposto, escalation a operatore", desc: "Il bot ha interagito col dipendente ma la richiesta richiedeva intervento umano o il dipendente ha preferito un operatore.", sub: `${fmt(876)} scelta dipendente · ${fmt(412)} info mancanti · ${fmt(209)} incomprensioni`, c: teal, dd: "50" },
              { val: 2514, title: "Escalation immediata a operatore", desc: "Il dipendente ha chiesto subito l'operatore, senza interagire col bot.", sub: `${fmt(2514)} richieste operatore al 1° turno`, c: textLight, dd: "0" },
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
                  {deepDive === card.dd ? "Chiudi approfondimento" : "Approfondisci"}
                </button>
              </div>
            ))}
          </div>

          {/* ═══ DEEP DIVE: 100% GESTITE ══�� */}
          {deepDive === "100" && (
            <div style={{ border: `2px solid ${navy}`, borderRadius: "12px", padding: "1.5rem", marginBottom: "1.5rem", background: `${paleNavy}40` }}>
              <h3 style={{ fontSize: "16px", fontWeight: 600, color: navy, margin: "0 0 6px" }}>Approfondimento: {fmt(4401)} richieste gestite interamente</h3>
              <p style={{ fontSize: "13px", color: textMid, margin: "0 0 1.25rem", lineHeight: 1.6 }}>
                Il bot ha ricevuto la richiesta, ha fornito le informazioni o eseguito l'operazione, e ha concluso la conversazione senza necessità di intervento umano. In media queste conversazioni durano 1,8 turni.
              </p>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: "10px", marginBottom: "1.25rem" }}>
                <Metric value={fmt(2654)} label="Risolte dal bot" sub="Operazione completata" />
                <Metric value={fmt(1747)} label="Chiuse dal dipendente" sub="Info ricevute, chiude autonomamente" />
                <Metric value="1,8" label="Turni medi" sub="Conversazioni rapide" />
                <Metric value={fmt(Math.round(4401/30))} label="Al giorno" sub="Media su 30 giorni" />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "1.25rem" }}>
                <div style={{ border: `1px solid ${paleNavy}`, borderRadius: "10px", padding: "1.25rem", background: white }}>
                  <div style={{ fontSize: "14px", fontWeight: 600, color: navy, marginBottom: "12px" }}>Tipologie di richieste gestite</div>
                  <ResponsiveContainer width="100%" height={320}>
                    <BarChart data={cat100intents} layout="vertical" margin={{ left: 10, right: 16 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={paleNavy} horizontal={false} />
                      <XAxis type="number" tick={{ fill: textLight, fontSize: 11 }} axisLine={false} tickLine={false} />
                      <YAxis type="category" dataKey="name" tick={{ fill: textDark, fontSize: 11 }} width={110} axisLine={false} tickLine={false} />
                      <Tooltip content={<CT />} />
                      <Bar dataKey="v" name="Conversazioni" fill={navy} radius={[0, 4, 4, 0]} barSize={14} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div style={{ border: `1px solid ${paleNavy}`, borderRadius: "10px", padding: "1.25rem", background: white }}>
                  <div style={{ fontSize: "14px", fontWeight: 600, color: navy, marginBottom: "12px" }}>Per area aziendale (gestite dal bot)</div>
                  <ResponsiveContainer width="100%" height={320}>
                    <BarChart data={cat100depts} layout="vertical" margin={{ left: 10, right: 16 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={paleNavy} horizontal={false} />
                      <XAxis type="number" tick={{ fill: textLight, fontSize: 11 }} axisLine={false} tickLine={false} />
                      <YAxis type="category" dataKey="name" tick={{ fill: textDark, fontSize: 11 }} width={110} axisLine={false} tickLine={false} />
                      <Tooltip content={<CT />} />
                      <Bar dataKey="v" name="Richieste" fill={navy} radius={[0, 4, 4, 0]} barSize={14} fillOpacity={0.7} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <ExBlock title="Esempi reali di richieste gestite dal bot" items={[
                { tag: "Reset password", text: "\"Ho dimenticato la password di SAP\" — il bot verifica l'identità tramite matricola e email, genera un link di reset e lo invia. 2 turni, risolta." },
                { tag: "Ferie", text: "\"Quanti giorni di ferie mi restano?\" — il bot chiede la matricola, accede al sistema HR: \"Le restano 12 giorni di ferie e 4 di permesso ROL. Vuole che le invii il dettaglio via email?\" Chiusa in 2 turni." },
                { tag: "Sala riunioni", text: "\"Prenota la sala Volta per domani dalle 10 alle 12\" — il bot verifica disponibilità: \"Sala Volta disponibile. Confermo la prenotazione a suo nome per il 15 marzo, ore 10-12.\" 1 turno." },
                { tag: "Stato ticket", text: "\"A che punto è il mio ticket INC-4521?\" — il bot consulta ServiceNow: \"Il ticket INC-4521 è in stato 'In lavorazione', assegnato al team Reti. Tempo stimato di risoluzione: entro domani.\"" },
                { tag: "DPI", text: "\"Ho bisogno di un casco nuovo per il cantiere di Foggia\" — il bot: \"Ho registrato la richiesta DPI: casco di sicurezza, sede Foggia. Il magazzino la contatterà entro 24h per il ritiro.\"" },
              ]} />

              <div style={{ background: paleNavy, borderRadius: "10px", padding: "1rem 1.25rem", fontSize: "13px", color: navy, lineHeight: 1.6, borderLeft: `4px solid ${navy}` }}>
                <strong>Il bot eccelle su reset password (1.124), ferie/permessi (812) e prenotazione sale (634).</strong> Sono operazioni ripetitive e ben strutturate dove l'automazione porta il massimo valore. L'area IT genera il volume maggiore (1.613 richieste gestite).
              </div>
            </div>
          )}

          {/* ═══ DEEP DIVE: 50% GESTITE ═══ */}
          {deepDive === "50" && (
            <div style={{ border: `2px solid ${teal}`, borderRadius: "12px", padding: "1.5rem", marginBottom: "1.5rem", background: `${paleTeal}40` }}>
              <h3 style={{ fontSize: "16px", fontWeight: 600, color: teal, margin: "0 0 6px" }}>Approfondimento: {fmt(1497)} richieste con escalation dopo interazione</h3>
              <p style={{ fontSize: "13px", color: textMid, margin: "0 0 1.25rem", lineHeight: 1.6 }}>
                Il bot ha risposto o tentato di rispondere, ma il dipendente ha richiesto l'intervento di un operatore. In {fmt(876)} casi per scelta del dipendente, in {fmt(412)} per informazioni mancanti nella KB, e in {fmt(209)} per incomprensioni.
              </p>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: "10px", marginBottom: "1.25rem" }}>
                <Metric value={fmt(876)} label="Scelta del dipendente" sub="Il bot ha risposto ma serve conferma" />
                <Metric value={fmt(412)} label="Info mancanti nella KB" sub="Il bot ha capito ma non aveva risposta" />
                <Metric value={fmt(209)} label="Incomprensioni" sub="Il bot non ha capito la richiesta" />
                <Metric value="87,2%" label="Risposte pertinenti" sub={`Su ${fmt(876)} valutate`} />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "1.25rem" }}>
                <div style={{ border: `1px solid ${paleNavy}`, borderRadius: "10px", padding: "1.25rem", background: white }}>
                  <div style={{ fontSize: "14px", fontWeight: 600, color: navy, marginBottom: "12px" }}>Argomenti con escalation</div>
                  <ResponsiveContainer width="100%" height={320}>
                    <BarChart data={cat50intents} layout="vertical" margin={{ left: 10, right: 16 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={paleNavy} horizontal={false} />
                      <XAxis type="number" tick={{ fill: textLight, fontSize: 11 }} axisLine={false} tickLine={false} />
                      <YAxis type="category" dataKey="name" tick={{ fill: textDark, fontSize: 11 }} width={120} axisLine={false} tickLine={false} />
                      <Tooltip content={<CT />} />
                      <Bar dataKey="v" name="Conversazioni" fill={teal} radius={[0, 4, 4, 0]} barSize={14} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div style={{ border: `1px solid ${paleNavy}`, borderRadius: "10px", padding: "1.25rem", background: white }}>
                  <div style={{ fontSize: "14px", fontWeight: 600, color: navy, marginBottom: "12px" }}>Per area aziendale</div>
                  <ResponsiveContainer width="100%" height={320}>
                    <BarChart data={cat50depts} layout="vertical" margin={{ left: 10, right: 16 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={paleNavy} horizontal={false} />
                      <XAxis type="number" tick={{ fill: textLight, fontSize: 11 }} axisLine={false} tickLine={false} />
                      <YAxis type="category" dataKey="name" tick={{ fill: textDark, fontSize: 11 }} width={120} axisLine={false} tickLine={false} />
                      <Tooltip content={<CT />} />
                      <Bar dataKey="v" name="Richieste" fill={teal} radius={[0, 4, 4, 0]} barSize={14} fillOpacity={0.7} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <ExBlock title="Esempi: il bot risponde, il dipendente chiede l'operatore" items={[
                { tag: "Cedolino", text: "\"Non capisco la voce 'indennità trasferta' sul cedolino di febbraio\" — il bot spiega la composizione generale, ma il dipendente vuole un dettaglio specifico sulla propria posizione: \"Preferisco parlare con l'ufficio paghe.\"" },
                { tag: "Ferie", text: "\"Posso spostare le ferie già approvate dal 20 al 27 marzo?\" — il bot: \"La modifica di ferie già approvate richiede l'autorizzazione del responsabile. Vuole che la metta in contatto con l'ufficio HR?\" — \"Sì, grazie.\"" },
                { tag: "Trasferta", text: "\"Devo organizzare una trasferta a Palermo per la prossima settimana, tratta Roma-Palermo\" — il bot fornisce la procedura standard, ma il dipendente ha esigenze particolari: \"Ho bisogno di un'auto a noleggio anche lì, mi passi qualcuno.\"" },
                { tag: "Reperibilità", text: "\"Chi è reperibile stasera per la zona Centro?\" — il bot consulta il sistema turni ma non trova il dato aggiornato: \"Mi risulta che il piano reperibilità di questa settimana non è ancora stato pubblicato. La metto in contatto col dispatching.\"" },
                { tag: "Ordine", text: "\"Stato dell'ordine OA-2024-1187 per i trasformatori\" — il bot trova l'ordine: \"L'OA è in stato 'In attesa conferma fornitore'\" — il dipendente vuole sollecitare: \"Passami l'ufficio acquisti per favore.\"" },
              ]} />

              <div style={{ background: paleTeal, borderRadius: "10px", padding: "1rem 1.25rem", fontSize: "13px", color: "#004d55", lineHeight: 1.6, borderLeft: `4px solid ${teal}` }}>
                <strong>Le info cedolino dominano (264 casi) seguite da ferie/permessi (198) e trasferte (187).</strong> Sono temi dove il dipendente cerca conferma umana per la propria situazione specifica — il bot fornisce informazioni generali corrette, ma serve un operatore per i casi particolari.
              </div>
            </div>
          )}

          {/* ═══ DEEP DIVE: 0% GESTITE ═���═ */}
          {deepDive === "0" && (
            <div style={{ border: `2px solid ${textLight}`, borderRadius: "12px", padding: "1.5rem", marginBottom: "1.5rem", background: `${paleNavy}40` }}>
              <h3 style={{ fontSize: "16px", fontWeight: 600, color: navy, margin: "0 0 6px" }}>Approfondimento: {fmt(2514)} richieste — escalation immediata</h3>
              <p style={{ fontSize: "13px", color: textMid, margin: "0 0 1.25rem", lineHeight: 1.6 }}>
                Il dipendente ha chiesto subito di parlare con un operatore, senza dare al bot la possibilità di rispondere. Non è un limite del bot — è una scelta dell'utente, spesso legata a problemi complessi o urgenze.
              </p>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: "10px", marginBottom: "1.25rem" }}>
                <Metric value={fmt(2514)} label="Totale escalation immediate" sub={`${pct(2514, T)}% di tutte le chiamate`} />
                <Metric value={fmt(Math.round(2514/30))} label="Al giorno" sub="Media su 30 giorni" />
                <Metric value="0 turni" label="Interazione col bot" sub="Nessuna opportunità di risposta" />
              </div>

              <div style={{ border: `1px solid ${paleNavy}`, borderRadius: "10px", padding: "1.25rem", marginBottom: "1.25rem", background: white }}>
                <div style={{ fontSize: "14px", fontWeight: 600, color: navy, marginBottom: "4px" }}>Motivi dell'escalation immediata</div>
                <div style={{ fontSize: "12px", color: textLight, marginBottom: "14px" }}>{fmt(2514)} conversazioni — il dipendente non ha interagito col bot</div>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={catImmIntents} layout="vertical" margin={{ left: 10, right: 16 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={paleNavy} horizontal={false} />
                    <XAxis type="number" tick={{ fill: textLight, fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis type="category" dataKey="name" tick={{ fill: textDark, fontSize: 11 }} width={160} axisLine={false} tickLine={false} />
                    <Tooltip content={<CT />} />
                    <Bar dataKey="v" name="Richieste" fill={textLight} radius={[0, 4, 4, 0]} barSize={14} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <ExBlock title="Esempi: escalation immediata" items={[
                { tag: "Generico", text: "\"Operatore, per favore\" — primo e unico messaggio. Il dipendente non specifica il motivo." },
                { tag: "IT complesso", text: "\"Ho un problema con la VPN che non si collega alla rete SCADA, devo parlare con qualcuno del NOC\" — il dipendente sa che è un problema che richiede intervento tecnico diretto." },
                { tag: "HR personale", text: "\"Devo parlare con l'ufficio del personale per una questione riservata\" — il dipendente non vuole esporre il problema a un bot." },
                { tag: "Emergenza", text: "\"C'è un guasto sulla linea 380kV Foggia-Benevento, mi passi subito il centro di controllo\" — emergenza operativa che richiede intervento immediato." },
                { tag: "Segnalazione", text: "\"Voglio fare una segnalazione sulla sicurezza del cantiere di Torino\" — il dipendente preferisce parlare con una persona per una segnalazione sensibile." },
              ]} />

              <div style={{ background: paleNavy, borderRadius: "10px", padding: "1rem 1.25rem", fontSize: "13px", color: navy, lineHeight: 1.6, borderLeft: `4px solid ${textLight}` }}>
                <strong>Le {fmt(2514)} escalation immediate rappresentano il 29,9% del totale</strong> — una percentuale significativamente più bassa rispetto a scenari B2C (dove supera il 50%). I dipendenti Terna interagiscono più volentieri col bot per le operazioni standard. Le escalation immediate sono concentrate su problemi IT complessi (534), questioni HR personali (423) e emergenze operative (312).
              </div>
            </div>
          )}

          {/* Insight box */}
          <div style={{ background: paleNavy, borderRadius: "10px", padding: "1rem 1.25rem", fontSize: "13px", color: navy, lineHeight: 1.6, borderLeft: `4px solid ${navy}` }}>
            <strong>Lettura chiave:</strong> il bot interviene efficacemente nel <strong>70,1% delle chiamate</strong> ({fmt(4401 + 1497)} su {fmt(T)}). Solo il 29,9% richiede escalation immediata — un dato molto positivo per un contesto enterprise interno dove i dipendenti conoscono il sistema e ne sfruttano le capacità.
          </div>

          {/* Abandonment note */}
          <div style={{ display: "flex", gap: "12px", alignItems: "flex-start", marginTop: "12px", padding: "12px 16px", background: white, border: `1px solid ${paleNavy}`, borderRadius: "10px" }}>
            <div style={{ fontSize: "12px", fontFamily: "'JetBrains Mono', monospace", color: textLight, minWidth: "fit-content", marginTop: "1px" }}>~0%</div>
            <div style={{ fontSize: "13px", color: textMid, lineHeight: 1.6 }}>
              <strong style={{ color: textDark }}>Abbandoni trascurabili:</strong> in un contesto interno aziendale gli abbandoni sono quasi inesistenti. I dipendenti chiamano con un obiettivo preciso e portano a termine l'interazione.
            </div>
          </div>
        </div>


        {/* ═══ 2. ARGOMENTI ═══ */}
        <div style={{ marginBottom: "3rem" }}>
          <h2 style={{ fontSize: "18px", fontWeight: 600, margin: "0 0 8px", color: navy }}>2. Su quali richieste il bot è più efficace</h2>
          <p style={{ fontSize: "14px", color: textMid, lineHeight: 1.7, margin: "0 0 1.25rem" }}>Per ogni tipologia di richiesta, quante vengono gestite interamente dal bot, quante parzialmente (il bot risponde ma segue escalation) e quante richiedono escalation immediata.</p>

          <div style={{ border: `1px solid ${paleNavy}`, borderRadius: "12px", overflow: "hidden", marginBottom: "1.5rem" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
              <thead>
                <tr style={{ background: navy, color: white }}>
                  <th style={{ textAlign: "left", padding: "12px 16px", fontWeight: 600, fontSize: "12px" }}>Tipologia richiesta</th>
                  <th style={{ textAlign: "right", padding: "12px 10px", fontWeight: 600, fontSize: "11px" }}>Gestite bot</th>
                  <th style={{ textAlign: "right", padding: "12px 10px", fontWeight: 600, fontSize: "11px" }}>Parziali</th>
                  <th style={{ textAlign: "right", padding: "12px 10px", fontWeight: 600, fontSize: "11px" }}>Escalation</th>
                  <th style={{ textAlign: "right", padding: "12px 10px", fontWeight: 600, fontSize: "11px" }}>Totale</th>
                  <th style={{ textAlign: "left", padding: "12px 16px", fontWeight: 600, fontSize: "11px", width: "22%" }}>Gestione bot</th>
                </tr>
              </thead>
              <tbody>
                {intents.map((it, i) => (
                  <tr key={i} style={{ background: i % 2 === 0 ? white : paleNavy }}>
                    <td style={{ padding: "10px 16px", fontWeight: 600, color: navy, fontSize: "12px" }}>{it.name}</td>
                    <td style={{ padding: "10px 10px", textAlign: "right", fontFamily: "'JetBrains Mono', monospace", color: navy, fontSize: "12px" }}>{fmt(it.full)}</td>
                    <td style={{ padding: "10px 10px", textAlign: "right", fontFamily: "'JetBrains Mono', monospace", color: teal, fontSize: "12px" }}>{fmt(it.partial)}</td>
                    <td style={{ padding: "10px 10px", textAlign: "right", fontFamily: "'JetBrains Mono', monospace", color: textLight, fontSize: "12px" }}>{fmt(it.none)}</td>
                    <td style={{ padding: "10px 10px", textAlign: "right", fontFamily: "'JetBrains Mono', monospace", fontSize: "12px" }}>{fmt(it.tot)}</td>
                    <td style={{ padding: "10px 16px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <div style={{ flex: 1, height: "10px", background: "#e0e8f0", borderRadius: "5px", overflow: "hidden", display: "flex" }}>
                          <div style={{ height: "100%", width: it.pctFull + "%", background: navy, borderRadius: "5px 0 0 5px" }} />
                          <div style={{ height: "100%", width: it.pctPartial + "%", background: teal }} />
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
              {[{ c: navy, l: "Gestite interamente" }, { c: teal, l: "Parziali (bot ha risposto)" }, { c: "#c8d8e8", l: "Escalation immediata" }].map((lg, i) => (
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
                <YAxis type="category" dataKey="name" tick={{ fill: textDark, fontSize: 12 }} width={170} axisLine={false} tickLine={false} />
                <Tooltip content={<CT />} />
                <Bar dataKey="full" name="Gestite interamente" stackId="a" fill={navy} barSize={16} />
                <Bar dataKey="partial" name="Parziali" stackId="a" fill={teal} barSize={16} />
                <Bar dataKey="none" name="Escalation" stackId="a" fill="#c8d8e8" barSize={16} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div style={{ background: paleNavy, borderRadius: "10px", padding: "1rem 1.25rem", fontSize: "13px", color: navy, lineHeight: 1.6, borderLeft: `4px solid ${teal}` }}>
            <strong>Il bot gestisce interamente l'83% dei reset password, l'83% delle prenotazioni sale e il 65% delle richieste ferie.</strong> Per le info cedolino il tasso di gestione autonoma è più basso (44%) perché le richieste sono spesso su situazioni personali complesse. Le trasferte (31%) hanno il margine di miglioramento maggiore — arricchendo la KB con le policy specifiche Terna si può aumentare significativamente.
          </div>
        </div>


        {/* ═══ 3. INCOMPRENSIONI ═══ */}
        <div style={{ marginBottom: "3rem" }}>
          <h2 style={{ fontSize: "18px", fontWeight: 600, margin: "0 0 8px", color: navy }}>3. Incomprensioni e recupero</h2>
          <p style={{ fontSize: "14px", color: textMid, lineHeight: 1.7, margin: "0 0 1.25rem" }}>
            Un'incomprensione si verifica quando il bot non capisce la richiesta — per terminologia tecnica (codici SAP, sigle impianti), accenti regionali nel parlato, o richieste ambigue. Non tutte portano a escalation: in molti casi il bot si riprende.
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: "12px", marginBottom: "1.5rem" }}>
            <Metric value={fmt(987)} label="Conversazioni con incomprensioni" sub={`${pct(987, T)}% del totale`} />
            <Metric value={fmt(612)} label="Gestite comunque dal bot" sub="Il bot si è ripreso" />
            <Metric value={fmt(209)} label="Escalation per incomprensione" sub="Il bot non è riuscito" />
            <Metric value={fmt(134)} label="Con 3+ incomprensioni" sub="Escalation forzata" />
          </div>

          <div style={{ border: `1px solid ${paleNavy}`, borderRadius: "12px", overflow: "hidden", marginBottom: "1.5rem" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
              <thead>
                <tr style={{ background: navy, color: white }}>
                  <th style={{ textAlign: "left", padding: "12px 16px", fontWeight: 600, fontSize: "12px" }}>Incomprensioni</th>
                  <th style={{ textAlign: "right", padding: "12px 16px", fontWeight: 600, fontSize: "12px" }}>Totale</th>
                  <th style={{ textAlign: "right", padding: "12px 16px", fontWeight: 600, fontSize: "12px", color: "#8bb8e8" }}>Gestite dal bot</th>
                  <th style={{ textAlign: "right", padding: "12px 16px", fontWeight: 600, fontSize: "12px", color: "#f8c8c0" }}>Escalation</th>
                  <th style={{ textAlign: "left", padding: "12px 16px", fontWeight: 600, fontSize: "12px", width: "28%" }}>Tasso di recupero</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { label: "1 incomprensione", total: 598, bot: 423, transfer: 175, recovery: 71 },
                  { label: "2 incomprensioni", total: 245, bot: 145, transfer: 100, recovery: 59 },
                  { label: "3 incomprensioni", total: 112, bot: 38, transfer: 74, recovery: 34 },
                  { label: "4+ incomprensioni", total: 32, bot: 6, transfer: 26, recovery: 19 },
                ].map((row, i) => (
                  <tr key={i} style={{ background: i % 2 === 0 ? white : paleNavy }}>
                    <td style={{ padding: "10px 16px", fontWeight: 600, color: navy }}>{row.label}</td>
                    <td style={{ padding: "10px 16px", textAlign: "right", fontFamily: "'JetBrains Mono', monospace" }}>{fmt(row.total)}</td>
                    <td style={{ padding: "10px 16px", textAlign: "right", fontFamily: "'JetBrains Mono', monospace", color: navy }}>{fmt(row.bot)}</td>
                    <td style={{ padding: "10px 16px", textAlign: "right", fontFamily: "'JetBrains Mono', monospace", color: red }}>{fmt(row.transfer)}</td>
                    <td style={{ padding: "10px 16px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <div style={{ flex: 1, height: "10px", background: "#e0e8f0", borderRadius: "5px", overflow: "hidden" }}>
                          <div style={{ height: "100%", width: row.recovery + "%", background: row.recovery >= 50 ? navy : row.recovery >= 30 ? teal : red, borderRadius: "5px" }} />
                        </div>
                        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "12px", minWidth: "32px", textAlign: "right", fontWeight: 600, color: row.recovery >= 50 ? navy : row.recovery >= 30 ? teal : red }}>{row.recovery}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ border: `1px solid ${paleNavy}`, borderRadius: "12px", padding: "1.25rem", marginBottom: "1.5rem" }}>
            <div style={{ fontSize: "14px", fontWeight: 600, color: navy, marginBottom: "4px" }}>Esito per numero di incomprensioni</div>
            <div style={{ display: "flex", gap: "16px", marginBottom: "14px" }}>
              {[{ c: navy, l: "Gestite dal bot (recuperate)" }, { c: "#c8d8e8", l: "Escalation a operatore" }].map((lg, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <div style={{ width: 10, height: 10, borderRadius: "2px", background: lg.c }} />
                  <span style={{ fontSize: "12px", color: textMid }}>{lg.l}</span>
                </div>
              ))}
            </div>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={[
                { name: "1 incomprensione", bot: 423, transfer: 175 },
                { name: "2 incomprensioni", bot: 145, transfer: 100 },
                { name: "3 incomprensioni", bot: 38, transfer: 74 },
                { name: "4+", bot: 6, transfer: 26 },
              ]} layout="vertical" margin={{ left: 10, right: 16 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={paleNavy} horizontal={false} />
                <XAxis type="number" tick={{ fill: textLight, fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" tick={{ fill: textDark, fontSize: 12 }} width={120} axisLine={false} tickLine={false} />
                <Tooltip content={<CT />} />
                <Bar dataKey="bot" name="Gestite dal bot" stackId="a" fill={navy} barSize={18} />
                <Bar dataKey="transfer" name="Escalation" stackId="a" fill="#c8d8e8" barSize={18} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <ExBlock title="Esempi: 1 incomprensione, il bot si riprende" items={[
            { tag: "Ticket IT", text: "\"Ho un problema con il INC quattro cinque due uno\" — il bot non riconosce il formato vocale del numero ticket — l'utente ripete: \"INC-4521\" — il bot capisce e fornisce lo stato." },
            { tag: "Impianto", text: "\"Stato della SE Villavalle\" — il bot: \"Non ho trovato un impianto con quel nome\" — il dipendente: \"La stazione elettrica di Villavalle, Terni\" — il bot trova il dato corretto." },
            { tag: "SAP", text: "\"Apri una RDA sul centro di costo tre zero sette\" — il bot non interpreta il codice — il dipendente specifica: \"Centro di costo 307, divisione Lazio\" — il bot procede correttamente." },
          ]} />
          <ExBlock title="Esempi: 3+ incomprensioni, escalation forzata" items={[
            { tag: "Codice SAP", text: "\"Devo verificare il COGE sulla WBS L punto tre punto quattro punto sette\" — il bot non riesce a ricostruire il codice WBS dal parlato. Dopo 3 tentativi: \"La metto in contatto con un collega.\"" },
            { tag: "Tecnico", text: "\"Controllare lo stato del TA sulla morsettiera secondaria del TR1 a Montalto\" — terminologia troppo specialistica. Il bot chiede chiarimenti ma il dipendente si frustra: \"Passami il centro di controllo.\"" },
            { tag: "Matricola", text: "\"La mia matricola è la TRN zero zero tre quattro sette otto\" — il bot confonde le cifre pronunciate a voce, prova a chiedere conferma ma continua a sbagliare l'interpretazione. Escalation dopo 4 tentativi." },
          ]} />

          <div style={{ background: paleNavy, borderRadius: "10px", padding: "1rem 1.25rem", fontSize: "13px", color: navy, lineHeight: 1.6, borderLeft: `4px solid ${navy}` }}>
            <strong>Il bot recupera nel 62% dei casi con incomprensioni.</strong> Le principali cause sono: codici SAP/WBS pronunciati a voce (difficili da interpretare), nomi di impianti e sigle tecniche. Suggerimento: integrare un dizionario di sigle e codici Terna per ridurre le incomprensioni del 30-40%.
          </div>
        </div>


        {/* ═══ 4. AREE DI MIGLIORAMENTO ═══ */}
        <div style={{ marginBottom: "3rem" }}>
          <h2 style={{ fontSize: "18px", fontWeight: 600, margin: "0 0 8px", color: navy }}>4. Aree di miglioramento prioritarie</h2>
          <p style={{ fontSize: "14px", color: textMid, lineHeight: 1.7, margin: "0 0 1.25rem" }}>Tre ambiti dove interventi mirati possono aumentare significativamente il tasso di gestione autonoma.</p>
          {[
            { letter: "A", q: "Knowledge base: policy HR e trasferte", ctx: `${fmt(412)} chiamate dove il bot ha capito la domanda ma non aveva l'informazione. Il 45% riguarda policy specifiche su ferie, permessi, e procedure trasferte.`, opt: "Integrare nella KB: regolamento ferie, policy trasferte, tabelle rimborsi, procedure di richiesta permessi speciali.", c: navy },
            { letter: "B", q: "Dizionario terminologia tecnica Terna", ctx: `${fmt(134)} escalation forzate per incomprensioni multiple — quasi tutte legate a codici SAP, WBS, nomi impianti e sigle (SE, CP, TR, TA).`, opt: "Creare un glossario di sigle, nomi impianti, codici WBS e centri di costo integrato nel modello vocale.", c: teal },
            { letter: "C", q: "Integrazione sistemi: SAP HR e ServiceNow", ctx: `Il bot oggi accede a dati parziali. Integrando SAP HR (residuo ferie, cedolino) e ServiceNow (ticket, asset) in tempo reale si possono gestire il 60% delle escalation per \"scelta dipendente\".`, opt: "API real-time verso SAP HCM per dati personali e ServiceNow per gestione ticket end-to-end.", c: red },
          ].map((s, i) => (
            <div key={i} style={{ background: white, border: `1px solid ${paleNavy}`, borderRadius: "12px", padding: "1.25rem", marginBottom: "12px", borderLeft: `5px solid ${s.c}` }}>
              <div style={{ display: "flex", gap: "16px" }}>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "22px", fontWeight: 700, color: s.c, minWidth: "32px" }}>{s.letter}</div>
                <div>
                  <div style={{ fontSize: "15px", fontWeight: 600, color: navy, marginBottom: "6px" }}>{s.q}</div>
                  <div style={{ fontSize: "13px", color: textMid, lineHeight: 1.6, marginBottom: "10px" }}>{s.ctx}</div>
                  <div style={{ fontSize: "13px", color: textDark, lineHeight: 1.6, fontStyle: "italic", background: paleNavy, padding: "10px 14px", borderRadius: "8px" }}>{s.opt}</div>
                </div>
              </div>
            </div>
          ))}
        </div>


        {/* ═══ 5. STIMA IMPATTO OPERATIVO ═══ */}
        <div style={{ marginBottom: "3rem" }}>
          <h2 style={{ fontSize: "18px", fontWeight: 600, margin: "0 0 8px", color: navy }}>5. Stima impatto operativo</h2>
          <p style={{ fontSize: "14px", color: textMid, lineHeight: 1.7, margin: "0 0 1.25rem" }}>
            Il voicebot interviene in circa 196 chiamate al giorno. L'impatto si divide tra richieste gestite interamente (3 min/chiamata) e quelle con interazione parziale prima dell'escalation (2 min/chiamata).
          </p>

          <div style={{ fontSize: "12px", fontWeight: 600, color: navy, marginBottom: "6px" }}>Richieste gestite autonomamente</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: "12px", marginBottom: "1.25rem" }}>
            <Metric value="~146" label="Chiamate/giorno" sub="4.401 in 30 giorni" />
            <Metric value="~438 min" label="Minuti risparmiati/giorno" sub="146 x 3 min" />
            <Metric value="~7,3h" label="Ore risparmiate/giorno" sub="equivalente operatore" />
            <Metric value="~1,8 FTE" label="Operatori equivalenti" sub="su turno 8h" />
          </div>

          <div style={{ fontSize: "12px", fontWeight: 600, color: teal, marginBottom: "6px" }}>Interazioni parziali (tempo risparmiato al primo livello)</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: "12px", marginBottom: "1.25rem" }}>
            <Metric value="~50" label="Chiamate/giorno" sub="1.497 in 30 giorni" />
            <Metric value="~100 min" label="Minuti di interazione bot" sub="50 x 2 min" />
            <Metric value="~1,7h" label="Ore di interazione bot/giorno" sub="tempo gestito dal bot" />
            <Metric value="~0,7 FTE" label="Operatori equivalenti" sub="su turno 8h" />
          </div>

          <div style={{ border: `1px solid ${paleNavy}`, borderRadius: "12px", padding: "1.25rem", marginBottom: "1.5rem", background: paleNavy }}>
            <div style={{ fontSize: "14px", fontWeight: 600, color: navy, marginBottom: "12px" }}>Impatto operativo totale</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: "12px" }}>
              {[
                { v: "~196", l: "Chiamate gestite dal bot/giorno", sub: "146 + 50" },
                { v: "~538 min", l: "Minuti totali/giorno", sub: "438 + 100" },
                { v: "~9h", l: "Ore totali/giorno", sub: "7,3h + 1,7h" },
                { v: "~2,5 FTE", l: "Operatori equivalenti totali", sub: "1,8 + 0,7" },
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
            <div style={{ fontSize: "14px", fontWeight: 600, color: navy, marginBottom: "12px" }}>Proiezione con interventi di miglioramento</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: "12px" }}>
              {[
                { scenario: "Situazione attuale", calls: "~196", hours: "~9h", fte: "~2,5", c: textLight },
                { scenario: "Con KB arricchita + dizionario", calls: "~235", hours: "~11,5h", fte: "~3,2", c: teal },
                { scenario: "Con integrazione SAP/ServiceNow", calls: "~260", hours: "~13h", fte: "~3,8", c: navy },
              ].map((s, i) => (
                <div key={i} style={{ background: white, border: `1px solid ${paleNavy}`, borderRadius: "10px", padding: "1rem", borderTop: `4px solid ${s.c}` }}>
                  <div style={{ fontSize: "12px", fontWeight: 600, color: s.c, marginBottom: "10px" }}>{s.scenario}</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    {[
                      { l: "Chiamate/giorno", v: s.calls },
                      { l: "Ore risparmiate", v: s.hours },
                      { l: "FTE equivalenti", v: s.fte },
                    ].map((r, j) => (
                      <div key={j} style={{ display: "flex", justifyContent: "space-between", fontSize: "13px" }}>
                        <span style={{ color: textMid }}>{r.l}</span>
                        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 600, color: navy }}>{r.v}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ background: paleTeal, borderRadius: "10px", padding: "1rem 1.25rem", fontSize: "13px", color: "#004d55", lineHeight: 1.6, borderLeft: `4px solid ${teal}` }}>
            <strong>Il voicebot equivale già oggi a ~2,5 operatori a tempo pieno.</strong> Con l'arricchimento della KB e il dizionario tecnico il risparmio sale a 3,2 FTE. L'integrazione real-time con SAP e ServiceNow porterebbe a quasi 4 FTE equivalenti — un impatto molto significativo per le operations interne.
          </div>
        </div>


        {/* ═══ 6. PIANO OPERATIVO ═══ */}
        <div style={{ marginBottom: "2rem" }}>
          <h2 style={{ fontSize: "18px", fontWeight: 600, margin: "0 0 8px", color: navy }}>6. Piano operativo e prossimi passi</h2>
          <div style={{ border: `1px solid ${paleNavy}`, borderRadius: "12px", overflow: "hidden" }}>
            {[
              { n: "01", t: "Arricchire la KB con policy HR e procedure trasferte", d: `Aggiungere regolamento ferie, tabelle rimborsi, procedure permessi speciali. Impatto diretto su ${fmt(412)} chiamate con KB miss.`, tag: "Priorità alta", c: red },
              { n: "02", t: "Integrare dizionario terminologia Terna", d: "Glossario di sigle (SE, CP, TR, TA), codici WBS, centri di costo, nomi impianti. Riduzione stimata del 35% delle incomprensioni.", tag: "Priorità alta", c: red },
              { n: "03", t: "Collegamento API SAP HCM (residui ferie, cedolino)", d: "Accesso real-time ai dati personali del dipendente per rispondere su ferie residue, voci cedolino, storico presenze.", tag: "Priorità alta", c: teal },
              { n: "04", t: "Integrazione ServiceNow (ticket, asset, change)", d: "Gestione end-to-end dei ticket IT: apertura, aggiornamento stato, chiusura. Gestione asset e richieste hardware.", tag: "Priorità media", c: teal },
              { n: "05", t: "Estensione a nuovi use case: fleet e travel", d: "Prenotazione auto aziendali, gestione travel request, integrazione con il sistema di expense management.", tag: "Prossimo passo", c: navy },
              { n: "06", t: "Rollout multicanale: Teams + app mobile", d: "Estendere il voicebot come chatbot su Microsoft Teams e app mobile interna per copertura h24.", tag: "Medio termine", c: navy },
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

      {/* ═══ AI CHAT PANEL ═══ */}
      <AiChat />

      <div style={{ background: navy, color: white, padding: "1.5rem", textAlign: "center" }}>
        <div style={{ fontSize: "13px", opacity: 0.7 }}>Report realizzato da <strong style={{ color: "#4dd0a0" }}>Ellysse</strong> · Divisione AI conversazionale di Maps Group</div>
      </div>
    </div>
  );
}
