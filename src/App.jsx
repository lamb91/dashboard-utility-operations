import { useState, useRef, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid, PieChart, Pie } from "recharts";

const T = 21599;
const fmt = (n) => typeof n === "number" ? n.toLocaleString("it-IT") : n;
const pct = (a, b) => ((a / b) * 100).toFixed(1);

const navy = "#083866", orange = "#F7941F", white = "#FFFFFF";
const paleNavy = "#e8f0f8", paleOrange = "#fff5e6";
const textDark = "#0c2d4f", textMid = "#4a6a8a", textLight = "#7a9ab8";
const red = "#c0392b";

const CT = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: white, border: `1px solid ${paleNavy}`, borderRadius: "8px", padding: "10px 14px", fontSize: "12px", fontFamily: "'JetBrains Mono', monospace", boxShadow: "0 2px 8px rgba(8,56,102,0.1)" }}>
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
        <span style={{ color: textLight, transform: open ? "rotate(180deg)" : "rotate(0)", transition: "transform 0.2s" }}>▾</span>
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

const intents = [
  { name: "Prezzo prodotto", bot: 322, op: 66, tot: 388 },
  { name: "Offerte e promozioni", bot: 146, op: 55, tot: 201 },
  { name: "Disponibilità prodotto", bot: 1912, op: 729, tot: 2641 },
  { name: "Info prodotto", bot: 685, op: 361, tot: 1046 },
  { name: "Stato ordine", bot: 929, op: 530, tot: 1459 },
  { name: "Info pagamento", bot: 134, op: 101, tot: 235 },
  { name: "Info negozio", bot: 313, op: 306, tot: 619 },
  { name: "Consegna e modifiche", bot: 104, op: 134, tot: 238 },
  { name: "Assistenza tecnica", bot: 337, op: 1233, tot: 1570 },
  { name: "Reso e rimborso", bot: 56, op: 223, tot: 279 },
].map(i => ({ ...i, pctBot: Math.round((i.bot / i.tot) * 100) })).sort((a, b) => b.pctBot - a.pctBot);

const products = [
  { name: "Lavatrice", v: 330 }, { name: "Telefono", v: 138 }, { name: "TV/Televisore", v: 197 },
  { name: "Computer", v: 104 }, { name: "Lavastoviglie", v: 96 }, { name: "Frigorifero", v: 83 },
];

// Deep-dive data
const cat100intents = [
  { name: "Disponibilità", v: 1911 }, { name: "Stato ordine", v: 929 }, { name: "Altro", v: 913 },
  { name: "Info prodotto", v: 678 }, { name: "Assist. tecnica", v: 333 }, { name: "Prezzo", v: 322 },
  { name: "Info negozio", v: 312 }, { name: "Offerte", v: 146 }, { name: "Info pagamento", v: 134 },
  { name: "Consegna", v: 104 },
];
const cat100products = [
  { name: "Lavatrice", v: 72 }, { name: "Frigorifero", v: 23 }, { name: "Lavastoviglie", v: 22 },
  { name: "Televisore", v: 19 }, { name: "Computer", v: 19 }, { name: "Telefono", v: 16 },
  { name: "Smartphone", v: 13 },
];

const cat50intents = [
  { name: "Assist. tecnica", v: 728 }, { name: "Altro", v: 376 }, { name: "Disponibilità", v: 307 },
  { name: "Info prodotto", v: 206 }, { name: "Stato ordine", v: 189 }, { name: "Reso/Rimborso", v: 179 },
  { name: "Op. con motivo", v: 166 }, { name: "Persona specifica", v: 144 },
  { name: "Info negozio", v: 124 }, { name: "Garanzia", v: 117 },
];
const cat50products = [
  { name: "Lavatrice", v: 193 }, { name: "Telefono", v: 80 }, { name: "Lavastoviglie", v: 54 },
  { name: "Televisore", v: 52 }, { name: "Frigorifero", v: 51 }, { name: "Computer", v: 43 },
  { name: "Asciugatrice", v: 29 },
];

const catImmIntents = [
  { name: "Op. senza motivo", v: 6222 }, { name: "Punto vendita", v: 1478 },
  { name: "Persona specifica", v: 1165 }, { name: "Op. con motivo", v: 700 },
  { name: "Assist. tecnica", v: 356 }, { name: "Info negozio", v: 86 },
];
const catKBintents = [
  { name: "Disponibilità", v: 309 }, { name: "Stato ordine", v: 199 }, { name: "Altro", v: 148 },
  { name: "Op. senza motivo", v: 141 }, { name: "Info prodotto", v: 113 },
  { name: "Assist. tecnica", v: 93 }, { name: "Info negozio", v: 70 },
];
const catKBproducts = [
  { name: "Lavatrice", v: 46 }, { name: "Televisore", v: 19 }, { name: "Lavastoviglie", v: 15 },
  { name: "Frigo", v: 13 }, { name: "Computer", v: 11 }, { name: "Frigorifero", v: 10 },
];

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
  const chatEnd = useRef(null);
  const fileRef = useRef(null);

  useEffect(() => { chatEnd.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const parseExcel = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const script = document.createElement("script");
      script.src = "https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js";
      script.onload = () => {
        const wb = window.XLSX.read(new Uint8Array(e.target.result), { type: "array" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows = window.XLSX.utils.sheet_to_json(ws);
        setXlsData(rows);
        setXlsName(file.name);
        setMessages(prev => [...prev, { role: "system", text: `File caricato: ${file.name} — ${rows.length} righe. Puoi fare domande sui dati.` }]);
      };
      if (!window.XLSX) document.head.appendChild(script);
      else {
        const wb = window.XLSX.read(new Uint8Array(e.target.result), { type: "array" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows = window.XLSX.utils.sheet_to_json(ws);
        setXlsData(rows);
        setXlsName(file.name);
        setMessages(prev => [...prev, { role: "system", text: `File caricato: ${file.name} — ${rows.length} righe. Puoi fare domande sui dati.` }]);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const buildContext = (question) => {
    if (!xlsData) return "";
    const q = question.toLowerCase();
    let filtered = xlsData;
    const keywords = {
      "kb_miss": r => r.esito === "TRANSFER_KB_MISS" || r.num_kb_miss > 0,
      "kb miss": r => r.esito === "TRANSFER_KB_MISS" || r.num_kb_miss > 0,
      "knowledge base": r => r.esito === "TRANSFER_KB_MISS" || r.num_kb_miss > 0,
      "mancant": r => r.esito === "TRANSFER_KB_MISS" || r.num_kb_miss > 0,
      "incomprension": r => r.num_incomprensioni > 0 || r.esito === "TRANSFER_INCOMPRENSIONI",
      "non capito": r => r.num_incomprensioni > 0,
      "risolt": r => r.esito === "GESTITA_BOT_RISOLTA",
      "chiuse": r => r.esito === "GESTITA_BOT_CHIUSA",
      "gestite": r => r.esito === "GESTITA_BOT_RISOLTA" || r.esito === "GESTITA_BOT_CHIUSA",
      "trasferit": r => r.esito?.startsWith("TRANSFER"),
      "immediat": r => r.esito === "TRANSFER_IMMEDIATO",
      "post risposta": r => r.esito === "TRANSFER_POST_RISPOSTA",
      "operatore": r => r.intent_principale?.includes("operatore"),
      "abbandono": r => r.esito === "ABBANDONO",
      "lavatrice": r => String(r.prodotto_menzionato || "").toLowerCase().includes("lavatrice"),
      "telefon": r => String(r.prodotto_menzionato || "").toLowerCase().includes("telefon"),
      "tv": r => String(r.prodotto_menzionato || "").toLowerCase().match(/\b(tv|televisor|television)\b/i),
      "frigorifero": r => String(r.prodotto_menzionato || "").toLowerCase().includes("frigo"),
      "computer": r => String(r.prodotto_menzionato || "").toLowerCase().includes("computer"),
      "disponibilit": r => r.intent_principale === "disponibilita_prodotto",
      "prezzo": r => r.intent_principale === "prezzo_prodotto",
      "ordine": r => r.intent_principale === "stato_ordine",
      "assistenza": r => r.intent_principale === "assistenza_tecnica",
      "reso": r => r.intent_principale === "reso_rimborso",
      "offert": r => r.intent_principale === "offerte_promozioni",
      "garanzia": r => r.intent_principale === "garanzia",
      "negozio": r => r.intent_principale === "info_negozio" || r.intent_principale === "operatore_punto_vendita",
      "pertinent": r => r.risposta_pertinente === 1 || r.risposta_pertinente === 0,
    };

    for (const [kw, filterFn] of Object.entries(keywords)) {
      if (q.includes(kw)) {
        filtered = xlsData.filter(filterFn);
        break;
      }
    }

    if (filtered.length === xlsData.length && filtered.length > 500) {
      filtered = xlsData.slice(0, 200);
    }

    const maxRows = 150;
    const sample = filtered.length > maxRows ? filtered.slice(0, maxRows) : filtered;
    const cols = ["esito","bot_ha_risposto","risposta_pertinente","num_turni_utili","num_incomprensioni","num_kb_miss","intent_principale","intent_dettaglio","motivo_trasferimento","prodotto_menzionato","note"];
    const compact = sample.map(r => {
      const parts = cols.map(c => {
        const v = r[c];
        if (v === undefined || v === null || v === "" || v === "NaN" || (typeof v === "number" && isNaN(v))) return null;
        return `${c}=${v}`;
      }).filter(Boolean);
      return parts.join("|");
    });

    return `Dataset: ${xlsData.length} conversazioni totali.\nFiltro applicato: ${filtered.length} righe trovate (mostrate ${sample.length}).\nColonne: ${cols.join(", ")}\n\nDati:\n${compact.join("\n")}`;
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
          model: "google/gemini-2.5-flash-lite-preview",
          messages: [
            { role: "system", content: `Sei un analista esperto di voicebot. Rispondi in italiano in modo chiaro e conciso basandoti SOLO sui dati forniti. Se fai calcoli, mostra i numeri. Se i dati non contengono l'informazione richiesta, dillo chiaramente. Non inventare dati.\n\nContesto dati:\n${context}` },
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
          <span style={{ fontSize: "20px" }}>💬</span>
          Chiedi ai dati — interroga il dettaglio delle conversazioni con l'AI
        </button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "880px", margin: "0 auto", padding: "0 1.5rem 2rem" }}>
      <div style={{ border: `2px solid ${navy}`, borderRadius: "12px", overflow: "hidden" }}>
        {/* Header */}
        <div style={{ background: navy, color: white, padding: "14px 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ fontSize: "18px" }}>💬</span>
            <span style={{ fontSize: "14px", fontWeight: 600 }}>Chiedi ai dati</span>
            {xlsName && <span style={{ fontSize: "11px", opacity: 0.6, fontFamily: "'JetBrains Mono', monospace" }}>{xlsName} · {xlsData?.length} righe</span>}
          </div>
          <button onClick={() => setIsOpen(false)} style={{ background: "transparent", border: "none", color: white, fontSize: "18px", cursor: "pointer", opacity: 0.6 }}>✕</button>
        </div>

        <div style={{ padding: "1.25rem", background: white }}>
          {/* Setup: API key + file */}
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
                    📎 Clicca per caricare il file Excel delle conversazioni
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Chat messages */}
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

          {/* Input */}
          {keySet && xlsData && (
            <div style={{ display: "flex", gap: "8px" }}>
              <input type="text" placeholder="Es: Quali prodotti causano più KB miss?" value={input}
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

          {/* Suggested questions */}
          {keySet && xlsData && messages.length < 3 && (
            <div style={{ marginTop: "12px", display: "flex", flexWrap: "wrap", gap: "6px" }}>
              {[
                "Quali prodotti causano più KB miss?",
                "Quante conversazioni sulla lavatrice sono state risolte?",
                "Mostrami i casi di incomprensione sullo stato ordine",
                "Qual è il tasso di successo per le richieste di prezzo?",
                "Quante conversazioni hanno 3+ incomprensioni?",
              ].map((q, i) => (
                <button key={i} onClick={() => { setInput(q); }} style={{
                  padding: "6px 12px", border: `1px solid ${paleNavy}`, borderRadius: "20px",
                  background: white, fontSize: "11px", color: textMid, cursor: "pointer",
                  transition: "all 0.15s",
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
      <div style={{ background: navy, color: white, padding: "2.5rem 1.5rem 2rem" }}>
        <div style={{ maxWidth: "880px", margin: "0 auto" }}>
          <div style={{ fontSize: "12px", fontFamily: "'JetBrains Mono', monospace", opacity: 0.6, marginBottom: "12px", letterSpacing: "1px" }}>
            DIMO · EURONICS — 17 FEBBRAIO – 13 MARZO 2026
          </div>
          <h1 style={{ fontSize: "clamp(22px, 4vw, 30px)", fontWeight: 700, margin: "0 0 12px", lineHeight: 1.3 }}>Report performance voicebot</h1>
          <p style={{ fontSize: "15px", opacity: 0.75, margin: "0 0 2rem", lineHeight: 1.6, maxWidth: "640px" }}>
            In 25 giorni il voicebot ha gestito {fmt(T)} chiamate. Questo report mostra i risultati, dove il bot eccelle e i margini di miglioramento.
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "12px" }}>
            {[
              { v: "~860", l: "Chiamate al giorno" },
              { v: "~240", l: "Gestite senza operatore" },
              { v: "~12h", l: "Ore risparmiate al giorno", hi: true, sub: "stima 3 min/chiamata" },
              { v: "~1,5", l: "FTE equivalenti", hi: true, sub: "operatori a tempo pieno" },
              { v: "79,4%", l: "Risposte pertinenti", hi: true },
            ].map((m, i) => (
              <div key={i} style={{ background: "rgba(255,255,255,0.1)", borderRadius: "10px", padding: "14px 16px" }}>
                <div style={{ fontSize: "22px", fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", color: m.hi ? orange : white }}>{m.v}</div>
                <div style={{ fontSize: "12px", opacity: 0.7, marginTop: "4px" }}>{m.l}</div>
                {m.sub && <div style={{ fontSize: "10px", opacity: 0.5, marginTop: "2px" }}>{m.sub}</div>}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: "880px", margin: "0 auto", padding: "2rem 1.5rem 3rem" }}>

        {/* ═══ 1. DIVISIONE ═══ */}
        <div style={{ marginBottom: "3rem" }}>
          <h2 style={{ fontSize: "18px", fontWeight: 600, margin: "0 0 8px", color: navy }}>1. Come si dividono le {fmt(T)} chiamate</h2>
          <p style={{ fontSize: "14px", color: textMid, lineHeight: 1.7, margin: "0 0 1.25rem" }}>Ogni chiamata rientra in una di tre categorie, in base a quanto il bot è stato coinvolto.</p>

          <div style={{ display: "flex", height: "44px", borderRadius: "10px", overflow: "hidden", marginBottom: "12px", border: `1px solid ${paleNavy}` }}>
            <div style={{ width: "27.9%", background: navy, display: "flex", alignItems: "center", justifyContent: "center" }}><span style={{ fontSize: "12px", fontWeight: 600, color: white }}>27,9%</span></div>
            <div style={{ width: "23.9%", background: orange, display: "flex", alignItems: "center", justifyContent: "center" }}><span style={{ fontSize: "11px", fontWeight: 600, color: white }}>23,9%</span></div>
            <div style={{ width: "46.9%", background: paleNavy, display: "flex", alignItems: "center", justifyContent: "center" }}><span style={{ fontSize: "12px", fontWeight: 600, color: textMid }}>46,9%</span></div>
          </div>
          <div style={{ display: "flex", gap: "20px", flexWrap: "wrap", marginBottom: "1.25rem" }}>
            {[{ c: navy, l: "Gestite interamente dal bot" }, { c: orange, l: "Bot ha risposto, utente sceglie operatore" }, { c: paleNavy, l: "Il bot non ha potuto intervenire", border: true }].map((lg, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <div style={{ width: 12, height: 12, borderRadius: "3px", background: lg.c, border: lg.border ? `1px solid ${textLight}` : "none" }} />
                <span style={{ fontSize: "12px", color: textMid }}>{lg.l}</span>
              </div>
            ))}
          </div>

          {/* 3 summary cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: "12px", marginBottom: "1.25rem" }}>
            {[
              { val: 6019, title: "Gestite interamente dal bot", desc: "Il bot ha risposto dall'inizio alla fine. Nessun operatore necessario.", sub: `${fmt(1898)} risolte · ${fmt(4121)} chiuse dall'utente`, c: navy, dd: "100" },
              { val: 5170, title: "Bot ha risposto, utente ha scelto operatore", desc: "Il bot ha interagito con l'utente — fornendo informazioni o tentando di rispondere — ma l'utente è stato trasferito a un operatore.", sub: `${fmt(2938)} scelta utente · ${fmt(1333)} info mancanti · ${fmt(899)} incomprensioni`, c: orange, dd: "50" },
              { val: 10136, title: "Il bot non ha potuto intervenire", desc: "L'utente ha chiesto l'operatore al primo turno, senza dare al bot la possibilità di rispondere.", sub: `${fmt(10136)} richieste operatore al 1° turno`, c: textLight, dd: "0" },
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

          {/* ═══ DEEP DIVE: 100% GESTITE ═══ */}
          {deepDive === "100" && (
            <div style={{ border: `2px solid ${navy}`, borderRadius: "12px", padding: "1.5rem", marginBottom: "1.5rem", background: `${paleNavy}40` }}>
              <h3 style={{ fontSize: "16px", fontWeight: 600, color: navy, margin: "0 0 6px" }}>Approfondimento: {fmt(6019)} conversazioni gestite interamente</h3>
              <p style={{ fontSize: "13px", color: textMid, margin: "0 0 1.25rem", lineHeight: 1.6 }}>
                Il bot ha ricevuto la richiesta, ha risposto e ha concluso la conversazione. L'utente non ha avuto bisogno di un operatore. In media le conversazioni risolte durano 1,6 turni — il bot è rapido ed efficiente.
              </p>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: "10px", marginBottom: "1.25rem" }}>
                <Metric value={fmt(1898)} label="Risolte completamente" sub="Risposta data, utente soddisfatto" />
                <Metric value={fmt(4121)} label="Chiuse dall'utente" sub="Info ricevute, utente chiude" />
                <Metric value="1,6" label="Turni medi (risolte)" sub="Conversazioni rapide" />
                <Metric value={fmt(Math.round(6019/25))} label="Al giorno" sub="Media su 25 giorni" />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "1.25rem" }}>
                <div style={{ border: `1px solid ${paleNavy}`, borderRadius: "10px", padding: "1.25rem", background: white }}>
                  <div style={{ fontSize: "14px", fontWeight: 600, color: navy, marginBottom: "12px" }}>Argomenti più gestiti</div>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={cat100intents} layout="vertical" margin={{ left: 10, right: 16 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={paleNavy} horizontal={false} />
                      <XAxis type="number" tick={{ fill: textLight, fontSize: 11 }} axisLine={false} tickLine={false} />
                      <YAxis type="category" dataKey="name" tick={{ fill: textDark, fontSize: 11 }} width={100} axisLine={false} tickLine={false} />
                      <Tooltip content={<CT />} />
                      <Bar dataKey="v" name="Conversazioni" fill={navy} radius={[0, 4, 4, 0]} barSize={14} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div style={{ border: `1px solid ${paleNavy}`, borderRadius: "10px", padding: "1.25rem", background: white }}>
                  <div style={{ fontSize: "14px", fontWeight: 600, color: navy, marginBottom: "12px" }}>Prodotti più richiesti (risolte)</div>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={cat100products} layout="vertical" margin={{ left: 10, right: 16 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={paleNavy} horizontal={false} />
                      <XAxis type="number" tick={{ fill: textLight, fontSize: 11 }} axisLine={false} tickLine={false} />
                      <YAxis type="category" dataKey="name" tick={{ fill: textDark, fontSize: 11 }} width={90} axisLine={false} tickLine={false} />
                      <Tooltip content={<CT />} />
                      <Bar dataKey="v" name="Menzioni" fill={navy} radius={[0, 4, 4, 0]} barSize={14} fillOpacity={0.7} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <ExBlock title="Esempi reali di conversazioni risolte dal bot" items={[
                { tag: "Prezzo", text: "\"Quanto costa l'iPhone 16 Pro da 256 giga?\" — il bot propone i modelli disponibili, l'utente sceglie, il bot fornisce il prezzo. 3 turni, risolta." },
                { tag: "Stato ordine", text: "\"Vorrei sapere lo stato della mia riparazione\" — il bot chiede numero documento e data, recupera le informazioni, conferma la data di ritiro. 4 turni." },
                { tag: "Disponibilità", text: "\"Avete il frigorifero Hisense del volantino?\" — il bot conferma la disponibilità in negozio e fornisce i dettagli del prodotto. 2 turni." },
                { tag: "Info prodotto", text: "\"Cerco cartucce per stampante HP Envy 6000\" — il bot guida la ricerca, propone modelli compatibili. 4 turni." },
                { tag: "Info pagamento", text: "\"Si può comprare a rate un frigorifero?\" — il bot spiega le opzioni di finanziamento disponibili. 2 turni." },
              ]} />

              <div style={{ background: paleNavy, borderRadius: "10px", padding: "1rem 1.25rem", fontSize: "13px", color: navy, lineHeight: 1.6, borderLeft: `4px solid ${navy}` }}>
                <strong>Il bot eccelle su disponibilità (1.911 gestite), stato ordine (929) e info prodotto (678).</strong> Il prodotto più richiesto nelle conversazioni risolte è la lavatrice (72), seguita da frigorifero (23) e lavastoviglie (22).
              </div>
            </div>
          )}

          {/* ═══ DEEP DIVE: 50% GESTITE ═══ */}
          {deepDive === "50" && (
            <div style={{ border: `2px solid ${orange}`, borderRadius: "12px", padding: "1.5rem", marginBottom: "1.5rem", background: `${paleOrange}40` }}>
              <h3 style={{ fontSize: "16px", fontWeight: 600, color: orange, margin: "0 0 6px" }}>Approfondimento: {fmt(5170)} conversazioni dove il bot ha interagito</h3>
              <p style={{ fontSize: "13px", color: textMid, margin: "0 0 1.25rem", lineHeight: 1.6 }}>
                In queste conversazioni il bot ha risposto alle richieste dell'utente o ha tentato di farlo, ma l'utente è stato comunque trasferito a un operatore. I motivi sono diversi: in {fmt(2938)} casi l'utente ha scelto volontariamente l'operatore dopo aver ricevuto risposta, in {fmt(1333)} il bot non aveva l'informazione nella knowledge base, e in {fmt(899)} il bot non ha capito la richiesta.
              </p>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: "10px", marginBottom: "1.25rem" }}>
                <Metric value={fmt(2938)} label="Scelta utente dopo risposta" sub="Il bot ha risposto correttamente" />
                <Metric value={fmt(1333)} label="Info mancanti nella KB" sub="Il bot ha capito ma non aveva la risposta" />
                <Metric value={fmt(899)} label="Incomprensioni linguistiche" sub="Il bot non ha capito la richiesta" />
                <Metric value="90,4%" label="Risposte pertinenti" sub={`Su ${fmt(2782)} valutate (scelta utente)`} />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "1.25rem" }}>
                <div style={{ border: `1px solid ${paleNavy}`, borderRadius: "10px", padding: "1.25rem", background: white }}>
                  <div style={{ fontSize: "14px", fontWeight: 600, color: navy, marginBottom: "12px" }}>Argomenti più frequenti</div>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={cat50intents} layout="vertical" margin={{ left: 10, right: 16 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={paleNavy} horizontal={false} />
                      <XAxis type="number" tick={{ fill: textLight, fontSize: 11 }} axisLine={false} tickLine={false} />
                      <YAxis type="category" dataKey="name" tick={{ fill: textDark, fontSize: 11 }} width={110} axisLine={false} tickLine={false} />
                      <Tooltip content={<CT />} />
                      <Bar dataKey="v" name="Conversazioni" fill={orange} radius={[0, 4, 4, 0]} barSize={14} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div style={{ border: `1px solid ${paleNavy}`, borderRadius: "10px", padding: "1.25rem", background: white }}>
                  <div style={{ fontSize: "14px", fontWeight: 600, color: navy, marginBottom: "12px" }}>Prodotti più menzionati</div>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={cat50products} layout="vertical" margin={{ left: 10, right: 16 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={paleNavy} horizontal={false} />
                      <XAxis type="number" tick={{ fill: textLight, fontSize: 11 }} axisLine={false} tickLine={false} />
                      <YAxis type="category" dataKey="name" tick={{ fill: textDark, fontSize: 11 }} width={90} axisLine={false} tickLine={false} />
                      <Tooltip content={<CT />} />
                      <Bar dataKey="v" name="Menzioni" fill={orange} radius={[0, 4, 4, 0]} barSize={14} fillOpacity={0.7} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div style={{ border: `1px solid ${paleNavy}`, borderRadius: "10px", padding: "1.25rem", marginBottom: "1.25rem", background: white }}>
                <div style={{ fontSize: "14px", fontWeight: 600, color: navy, marginBottom: "12px" }}>Perché l'utente chiede l'operatore dopo la risposta del bot</div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: "10px" }}>
                  {[
                    { v: fmt(2718), l: "Richiesta diretta", pct: "92,5%", desc: "L'utente vuole parlare con una persona" },
                    { v: fmt(93), l: "Conferma umana", pct: "3,2%", desc: "Vuole conferma di ciò che ha detto il bot" },
                    { v: fmt(84), l: "Persona specifica", pct: "2,9%", desc: "Chiede una persona per nome" },
                  ].map((m, i) => (
                    <div key={i} style={{ background: paleNavy, borderRadius: "8px", padding: "12px" }}>
                      <div style={{ fontSize: "20px", fontWeight: 600, fontFamily: "'JetBrains Mono', monospace", color: navy }}>{m.v}</div>
                      <div style={{ fontSize: "12px", fontWeight: 600, color: textDark, marginTop: "4px" }}>{m.l} ({m.pct})</div>
                      <div style={{ fontSize: "11px", color: textLight, marginTop: "2px" }}>{m.desc}</div>
                    </div>
                  ))}
                </div>
              </div>

              <ExBlock title="Esempi reali: il bot risponde, l'utente sceglie l'operatore" items={[
                { tag: "Assistenza", text: "\"La lavatrice che ho comprato non funziona\" — il bot spiega la procedura di assistenza, ma l'utente preferisce conferma da un operatore prima di procedere." },
                { tag: "Reso", text: "\"Nella friggitrice manca un pezzo\" — il bot spiega come fare il reso. L'utente preferisce gestire la pratica con una persona." },
                { tag: "Ritiro", text: "\"Cercavo questa lavatrice per ritirarla in negozio\" — il bot conferma la disponibilità, ma l'utente vuole organizzare il ritiro col punto vendita." },
                { tag: "Garanzia", text: "\"Il telefono si è rotto dopo 6 mesi\" — il bot spiega la garanzia, ma l'utente chiede di parlare con qualcuno per gestire il caso." },
                { tag: "Persona", text: "\"Mi passi Roberto del bancone smartphone\" — il bot non può collegare a una persona. Trasferimento inevitabile." },
              ]} />

              <div style={{ background: paleOrange, borderRadius: "10px", padding: "1rem 1.25rem", fontSize: "13px", color: "#7a5500", lineHeight: 1.6, borderLeft: `4px solid ${orange}` }}>
                <strong>L'assistenza tecnica domina (728 casi).</strong> Seguono disponibilità (307) e resi (179). Sono argomenti dove il cliente cerca conferma umana — non un fallimento del bot. La lavatrice è il prodotto più menzionato (193 volte).
              </div>
            </div>
          )}

          {/* ═══ DEEP DIVE: 0% GESTITE ═══ */}
          {deepDive === "0" && (
            <div style={{ border: `2px solid ${textLight}`, borderRadius: "12px", padding: "1.5rem", marginBottom: "1.5rem", background: `${paleNavy}40` }}>
              <h3 style={{ fontSize: "16px", fontWeight: 600, color: navy, margin: "0 0 6px" }}>Approfondimento: {fmt(10136)} conversazioni — operatore al primo turno</h3>
              <p style={{ fontSize: "13px", color: textMid, margin: "0 0 1.25rem", lineHeight: 1.6 }}>
                In queste conversazioni l'utente ha chiesto immediatamente di parlare con un operatore, senza dare al bot nessuna possibilità di rispondere. Non è un limite del bot — è una scelta dell'utente.
              </p>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: "10px", marginBottom: "1.25rem" }}>
                <Metric value={fmt(10136)} label="Totale richieste al 1° turno" sub={`${pct(10136, T)}% di tutte le conversazioni`} />
                <Metric value={fmt(Math.round(10136/25))} label="Al giorno" sub="Media su 25 giorni" />
                <Metric value="0 turni" label="Interazione col bot" sub="Nessuna opportunità di risposta" />
              </div>

              {/* Sub-section: immediate */}
              <div style={{ border: `1px solid ${paleNavy}`, borderRadius: "10px", padding: "1.25rem", marginBottom: "1.25rem", background: white }}>
                <div style={{ fontSize: "14px", fontWeight: 600, color: navy, marginBottom: "4px" }}>Operatore al primo turno: perché lo chiedono</div>
                <div style={{ fontSize: "12px", color: textLight, marginBottom: "14px" }}>{fmt(10136)} conversazioni — l'utente non ha interagito col bot</div>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={catImmIntents} layout="vertical" margin={{ left: 10, right: 16 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={paleNavy} horizontal={false} />
                    <XAxis type="number" tick={{ fill: textLight, fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis type="category" dataKey="name" tick={{ fill: textDark, fontSize: 11 }} width={110} axisLine={false} tickLine={false} />
                    <Tooltip content={<CT />} />
                    <Bar dataKey="v" name="Richieste" fill={textLight} radius={[0, 4, 4, 0]} barSize={14} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <ExBlock title="Esempi: richiesta immediata di operatore" items={[
                { tag: "Senza motivo", text: "\"Vorrei parlare con un operatore\" — primo e unico messaggio, senza specificare il motivo della chiamata." },
                { tag: "Punto vendita", text: "\"Mi passi il negozio per favore\" — l'utente vuole essere collegato al punto vendita, non ricevere informazioni." },
                { tag: "Persona specifica", text: "\"Devo parlare col direttore\" / \"Mi passi Gianluca del reparto TV\" — richiesta di una persona per nome o ruolo." },
                { tag: "Con motivo", text: "\"Ho bisogno di parlare con qualcuno per un reso\" — specifica il motivo ma vuole comunque l'operatore subito." },
                { tag: "Assistenza", text: "\"La lavatrice è rotta, passatemi qualcuno\" — chiede direttamente l'operatore per un problema tecnico." },
              ]} />

              <div style={{ background: paleNavy, borderRadius: "10px", padding: "1rem 1.25rem", fontSize: "13px", color: navy, lineHeight: 1.6, borderLeft: `4px solid ${textLight}` }}>
                <strong>Queste {fmt(10136)} chiamate rappresentano il 46,9% del totale.</strong> L'utente decide di parlare con un operatore prima ancora di sapere cosa può fare il bot. Migliorare il messaggio di benvenuto e comunicare le capacità del voicebot è il modo più diretto per ridurre questa percentuale.
              </div>
            </div>
          )}

          {/* Insight box after cards/deep-dives */}
          <div style={{ background: paleNavy, borderRadius: "10px", padding: "1rem 1.25rem", fontSize: "13px", color: navy, lineHeight: 1.6, borderLeft: `4px solid ${navy}` }}>
            <strong>Lettura chiave:</strong> nelle prime due categorie il bot ha effettivamente lavorato — ha risposto o tentato di rispondere. Questo avviene nel <strong>51,8% delle chiamate</strong> ({fmt(6019 + 5170)} su {fmt(T)}). Nella terza, {fmt(10136)} sono utenti che chiedono l'operatore come prima cosa: non è un limite del bot, è una scelta del cliente.
          </div>

          {/* Abandonment note */}
          <div style={{ display: "flex", gap: "12px", alignItems: "flex-start", marginTop: "12px", padding: "12px 16px", background: white, border: `1px solid ${paleNavy}`, borderRadius: "10px" }}>
            <div style={{ fontSize: "12px", fontFamily: "'JetBrains Mono', monospace", color: textLight, minWidth: "fit-content", marginTop: "1px" }}>1,3%</div>
            <div style={{ fontSize: "13px", color: textMid, lineHeight: 1.6 }}>
              <strong style={{ color: textDark }}>Abbandoni ({fmt(274)} conversazioni):</strong> chiamate in cui l'utente non ha interagito — conversazioni vuote ({fmt(141)}), saluti senza richiesta ({fmt(103)}), interruzioni precoci ({fmt(23)}) o silenzi ({fmt(7)}). Un tasso fisiologico e molto basso, indice di una buona esperienza iniziale del voicebot.
            </div>
          </div>
        </div>


        {/* ═══ 2. ARGOMENTI ═══ */}
        <div style={{ marginBottom: "3rem" }}>
          <h2 style={{ fontSize: "18px", fontWeight: 600, margin: "0 0 8px", color: navy }}>2. Su quali argomenti il bot è più efficace</h2>
          <p style={{ fontSize: "14px", color: textMid, lineHeight: 1.7, margin: "0 0 1.25rem" }}>Per ogni tipo di richiesta, quante vengono gestite dal bot e quante passano a un operatore.</p>

          <div style={{ border: `1px solid ${paleNavy}`, borderRadius: "12px", overflow: "hidden", marginBottom: "1.5rem" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
              <thead>
                <tr style={{ background: navy, color: white }}>
                  <th style={{ textAlign: "left", padding: "12px 16px", fontWeight: 600, fontSize: "12px" }}>Argomento</th>
                  <th style={{ textAlign: "right", padding: "12px 16px", fontWeight: 600, fontSize: "12px" }}>Bot</th>
                  <th style={{ textAlign: "right", padding: "12px 16px", fontWeight: 600, fontSize: "12px" }}>Operatore</th>
                  <th style={{ textAlign: "right", padding: "12px 16px", fontWeight: 600, fontSize: "12px" }}>Totale</th>
                  <th style={{ textAlign: "left", padding: "12px 16px", fontWeight: 600, fontSize: "12px", width: "28%" }}>Efficacia</th>
                </tr>
              </thead>
              <tbody>
                {intents.map((it, i) => (
                  <tr key={i} style={{ background: i % 2 === 0 ? white : paleNavy }}>
                    <td style={{ padding: "10px 16px", fontWeight: 600, color: navy }}>{it.name}</td>
                    <td style={{ padding: "10px 16px", textAlign: "right", fontFamily: "'JetBrains Mono', monospace", color: navy }}>{fmt(it.bot)}</td>
                    <td style={{ padding: "10px 16px", textAlign: "right", fontFamily: "'JetBrains Mono', monospace", color: textLight }}>{fmt(it.op)}</td>
                    <td style={{ padding: "10px 16px", textAlign: "right", fontFamily: "'JetBrains Mono', monospace" }}>{fmt(it.tot)}</td>
                    <td style={{ padding: "10px 16px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <div style={{ flex: 1, height: "10px", background: "#e0e8f0", borderRadius: "5px", overflow: "hidden" }}>
                          <div style={{ height: "100%", width: it.pctBot + "%", background: it.pctBot >= 50 ? navy : it.pctBot >= 30 ? orange : red, borderRadius: "5px" }} />
                        </div>
                        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "12px", minWidth: "32px", textAlign: "right", fontWeight: 600, color: it.pctBot >= 50 ? navy : it.pctBot >= 30 ? orange : red }}>{it.pctBot}%</span>
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
              {[{ c: navy, l: "Gestite dal bot" }, { c: "#c8d8e8", l: "Passate a operatore" }].map((lg, i) => (
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
                <YAxis type="category" dataKey="name" tick={{ fill: textDark, fontSize: 12 }} width={140} axisLine={false} tickLine={false} />
                <Tooltip content={<CT />} />
                <Bar dataKey="bot" name="Gestite dal bot" stackId="a" fill={navy} barSize={16} />
                <Bar dataKey="op" name="Passate a operatore" stackId="a" fill="#c8d8e8" barSize={16} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div style={{ background: paleNavy, borderRadius: "10px", padding: "1rem 1.25rem", fontSize: "13px", color: navy, lineHeight: 1.6, borderLeft: `4px solid ${orange}` }}>
            <strong>Il bot gestisce l'83% delle richieste su prezzi, il 73% sulle offerte e il 72% sulla disponibilità.</strong> Assistenza tecnica e resi sono argomenti dove il cliente preferisce naturalmente la conferma di una persona.
          </div>
        </div>


        {/* ═══ 3. MARGINI ═══ */}
        <div style={{ marginBottom: "3rem" }}>
          <h2 style={{ fontSize: "18px", fontWeight: 600, margin: "0 0 8px", color: navy }}>3. Dove si può migliorare</h2>
          <p style={{ fontSize: "14px", color: textMid, lineHeight: 1.7, margin: "0 0 1.25rem" }}>
            I limiti reali del sistema sono le informazioni mancanti e le incomprensioni. Insieme rappresentano il <strong style={{ color: navy }}>{pct(1333 + 899, T)}%</strong> del totale.
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "1.5rem" }}>
            <div style={{ background: white, border: `1px solid ${paleNavy}`, borderRadius: "12px", padding: "1.25rem", borderLeft: `5px solid ${red}` }}>
              <div style={{ fontSize: "26px", fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", color: red }}>{fmt(1333)}</div>
              <div style={{ fontSize: "14px", fontWeight: 600, margin: "6px 0 8px" }}>Informazioni mancanti</div>
              <div style={{ fontSize: "13px", color: textMid, lineHeight: 1.5 }}>Il bot ha capito la domanda ma non aveva la risposta. Si risolve arricchendo il catalogo nella knowledge base.</div>
            </div>
            <div style={{ background: white, border: `1px solid ${paleNavy}`, borderRadius: "12px", padding: "1.25rem", borderLeft: `5px solid ${orange}` }}>
              <div style={{ fontSize: "26px", fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", color: orange }}>{fmt(899)}</div>
              <div style={{ fontSize: "14px", fontWeight: 600, margin: "6px 0 8px" }}>Incomprensioni linguistiche</div>
              <div style={{ fontSize: "13px", color: textMid, lineHeight: 1.5 }}>Il bot non ha capito l'utente. Spesso codici modello o pronunce non standard.</div>
            </div>
          </div>
          <div style={{ border: `1px solid ${paleNavy}`, borderRadius: "12px", padding: "1.25rem", marginBottom: "1.5rem" }}>
            <div style={{ fontSize: "14px", fontWeight: 600, color: navy, marginBottom: "14px" }}>Prodotti più richiesti quando manca l'informazione</div>
            <ResponsiveContainer width="100%" height={230}>
              <BarChart data={products} layout="vertical" margin={{ left: 10, right: 16 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={paleNavy} horizontal={false} />
                <XAxis type="number" tick={{ fill: textLight, fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" tick={{ fill: textDark, fontSize: 12 }} width={100} axisLine={false} tickLine={false} />
                <Tooltip content={<CT />} />
                <Bar dataKey="v" name="Menzioni" fill={red} radius={[0, 4, 4, 0]} barSize={14} fillOpacity={0.7}>
                  {products.map((_, i) => <Cell key={i} fill={i < 3 ? red : textLight} fillOpacity={i < 3 ? 0.8 : 0.4} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>


        {/* ═══ 4. INCOMPRENSIONI ═══ */}
        <div style={{ marginBottom: "3rem" }}>
          <h2 style={{ fontSize: "18px", fontWeight: 600, margin: "0 0 8px", color: navy }}>4. Cosa significa "incomprensione" in una conversazione</h2>
          <p style={{ fontSize: "14px", color: textMid, lineHeight: 1.7, margin: "0 0 1.25rem" }}>
            Un'incomprensione si verifica quando il bot non riesce a capire cosa ha detto l'utente — per esempio un nome di prodotto pronunciato in modo non standard, un codice modello, o una frase in dialetto. Non tutte le incomprensioni portano a un trasferimento: in molti casi il bot si riprende e conclude comunque la conversazione.
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: "12px", marginBottom: "1.5rem" }}>
            <Metric value={fmt(2203)} label="Conversazioni con incomprensioni" sub={`${pct(2203, T)}% del totale`} />
            <Metric value={fmt(1072)} label="Gestite comunque dal bot" sub="Il bot si è ripreso" />
            <Metric value={fmt(899)} label="Trasferite per incomprensione" sub="Il bot non è riuscito" />
            <Metric value={fmt(269)} label="Con 3+ incomprensioni consecutive" sub="Trasferimento forzato" />
          </div>

          {/* Distribution table */}
          <div style={{ border: `1px solid ${paleNavy}`, borderRadius: "12px", overflow: "hidden", marginBottom: "1.5rem" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
              <thead>
                <tr style={{ background: navy, color: white }}>
                  <th style={{ textAlign: "left", padding: "12px 16px", fontWeight: 600, fontSize: "12px" }}>Incomprensioni nella conversazione</th>
                  <th style={{ textAlign: "right", padding: "12px 16px", fontWeight: 600, fontSize: "12px" }}>Totale</th>
                  <th style={{ textAlign: "right", padding: "12px 16px", fontWeight: 600, fontSize: "12px", color: "#8bb8e8" }}>Gestite dal bot</th>
                  <th style={{ textAlign: "right", padding: "12px 16px", fontWeight: 600, fontSize: "12px", color: "#f8c8c0" }}>Trasferite</th>
                  <th style={{ textAlign: "left", padding: "12px 16px", fontWeight: 600, fontSize: "12px", width: "28%" }}>Tasso di recupero</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { label: "1 incomprensione", total: 1369, bot: 795, transfer: 574, recovery: 58 },
                  { label: "2 incomprensioni", total: 481, bot: 200, transfer: 281, recovery: 42 },
                  { label: "3 incomprensioni", total: 341, bot: 71, transfer: 270, recovery: 21 },
                  { label: "4+ incomprensioni", total: 12, bot: 6, transfer: 6, recovery: 50 },
                ].map((row, i) => (
                  <tr key={i} style={{ background: i % 2 === 0 ? white : paleNavy }}>
                    <td style={{ padding: "10px 16px", fontWeight: 600, color: navy }}>{row.label}</td>
                    <td style={{ padding: "10px 16px", textAlign: "right", fontFamily: "'JetBrains Mono', monospace" }}>{fmt(row.total)}</td>
                    <td style={{ padding: "10px 16px", textAlign: "right", fontFamily: "'JetBrains Mono', monospace", color: navy }}>{fmt(row.bot)}</td>
                    <td style={{ padding: "10px 16px", textAlign: "right", fontFamily: "'JetBrains Mono', monospace", color: red }}>{fmt(row.transfer)}</td>
                    <td style={{ padding: "10px 16px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <div style={{ flex: 1, height: "10px", background: "#e0e8f0", borderRadius: "5px", overflow: "hidden" }}>
                          <div style={{ height: "100%", width: row.recovery + "%", background: row.recovery >= 50 ? navy : row.recovery >= 30 ? orange : red, borderRadius: "5px" }} />
                        </div>
                        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "12px", minWidth: "32px", textAlign: "right", fontWeight: 600, color: row.recovery >= 50 ? navy : row.recovery >= 30 ? orange : red }}>{row.recovery}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Visual: stacked bar */}
          <div style={{ border: `1px solid ${paleNavy}`, borderRadius: "12px", padding: "1.25rem", marginBottom: "1.5rem" }}>
            <div style={{ fontSize: "14px", fontWeight: 600, color: navy, marginBottom: "4px" }}>Esito per numero di incomprensioni</div>
            <div style={{ display: "flex", gap: "16px", marginBottom: "14px" }}>
              {[{ c: navy, l: "Gestite dal bot (recuperate)" }, { c: "#c8d8e8", l: "Trasferite a operatore" }].map((lg, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <div style={{ width: 10, height: 10, borderRadius: "2px", background: lg.c }} />
                  <span style={{ fontSize: "12px", color: textMid }}>{lg.l}</span>
                </div>
              ))}
            </div>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={[
                { name: "1 incomprensione", bot: 795, transfer: 574 },
                { name: "2 incomprensioni", bot: 200, transfer: 281 },
                { name: "3 incomprensioni", bot: 71, transfer: 270 },
                { name: "4+", bot: 6, transfer: 6 },
              ]} layout="vertical" margin={{ left: 10, right: 16 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={paleNavy} horizontal={false} />
                <XAxis type="number" tick={{ fill: textLight, fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" tick={{ fill: textDark, fontSize: 12 }} width={120} axisLine={false} tickLine={false} />
                <Tooltip content={<CT />} />
                <Bar dataKey="bot" name="Gestite dal bot" stackId="a" fill={navy} barSize={18} />
                <Bar dataKey="transfer" name="Trasferite" stackId="a" fill="#c8d8e8" barSize={18} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Focus: 3+ consecutive → forced transfer */}
          <div style={{ border: `2px solid ${red}`, borderRadius: "12px", padding: "1.25rem", marginBottom: "1.5rem", background: `${red}08` }}>
            <div style={{ fontSize: "14px", fontWeight: 600, color: red, marginBottom: "8px" }}>Focus: 3+ incomprensioni consecutive → trasferimento forzato</div>
            <p style={{ fontSize: "13px", color: textMid, lineHeight: 1.6, margin: "0 0 1rem" }}>
              Quando il bot non riesce a capire l'utente per 3 volte di seguito, la conversazione viene trasferita automaticamente a un operatore. Questo è avvenuto in <strong style={{ color: red }}>{fmt(269)} conversazioni</strong> — l'1,2% del totale.
            </p>
            <div style={{ fontSize: "13px", fontWeight: 600, color: navy, marginBottom: "8px" }}>Argomenti più frequenti nei trasferimenti forzati:</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(5, minmax(0, 1fr))", gap: "8px", marginBottom: "1rem" }}>
              {[
                { l: "Stato ordine", v: 67 }, { l: "Op. senza motivo", v: 56 },
                { l: "Disponibilità", v: 35 }, { l: "Altro", v: 26 }, { l: "Persona specifica", v: 17 },
              ].map((item, i) => (
                <div key={i} style={{ background: white, border: `1px solid ${paleNavy}`, borderRadius: "8px", padding: "10px", textAlign: "center" }}>
                  <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "18px", fontWeight: 600, color: navy }}>{item.v}</div>
                  <div style={{ fontSize: "11px", color: textMid, marginTop: "2px" }}>{item.l}</div>
                </div>
              ))}
            </div>
          </div>

          <ExBlock title="Esempi: 1 incomprensione, il bot si riprende e gestisce" items={[
            { tag: "Info prodotto", text: "L'utente chiede un modello specifico. Il bot non capisce il nome al primo tentativo, ma alla seconda richiesta riesce a trovare il prodotto e risponde correttamente." },
            { tag: "Prezzo", text: "L'utente pronuncia un codice modello in modo non standard. Il bot chiede di ripetere, capisce al secondo tentativo e fornisce il prezzo." },
            { tag: "Stato ordine", text: "L'utente fornisce il numero documento in formato non riconosciuto. Il bot chiede di ripetere cifra per cifra e riesce a recuperare l'ordine." },
          ]} />
          <ExBlock title="Esempi: 2 incomprensioni, esito misto" items={[
            { tag: "Disponibilità", text: "L'utente chiede un prodotto con una pronuncia dialettale. Il bot non capisce per due volte, poi l'utente riformula in modo più chiaro e il bot risponde." },
            { tag: "Stato ordine", text: "L'utente fornisce la data in formato non riconosciuto e poi il codice bolletta in modo poco chiaro. Dopo due incomprensioni il bot chiede l'operatore." },
          ]} />
          <ExBlock title="Esempi: 3+ incomprensioni → trasferimento forzato" items={[
            { tag: "Persona specifica", text: "L'utente chiede di parlare con un operatore specifico. Il bot non capisce il nome dopo 3 tentativi e trasferisce automaticamente." },
            { tag: "Stato ordine", text: "L'utente cerca di fornire i dati dell'ordine ma il bot non riesce a capire né il numero documento né la data. Dopo 3 tentativi, trasferimento." },
            { tag: "Disponibilità", text: "L'utente chiede la disponibilità di una fotocamera Kodak FZ55. Il bot non riconosce il codice modello dopo 3 tentativi e trasferisce." },
            { tag: "Disponibilità", text: "L'utente chiede prezzo e disponibilità di un prodotto specifico, ma il bot non comprende le richieste ripetute e trasferisce dopo 3 incomprensioni." },
          ]} />

          <div style={{ background: paleNavy, borderRadius: "10px", padding: "1rem 1.25rem", fontSize: "13px", color: navy, lineHeight: 1.6, borderLeft: `4px solid ${navy}` }}>
            <strong>Il bot recupera nel 49% dei casi con incomprensioni.</strong> Su {fmt(2203)} conversazioni con almeno un'incomprensione, {fmt(1072)} vengono comunque gestite senza operatore. Le incomprensioni che portano a trasferimento forzato (3+ consecutive) sono solo {fmt(269)}, l'1,2% del totale. I casi più critici riguardano lo stato ordine (67) e la disponibilità prodotto (35) — spesso legati a codici modello o numeri documento difficili da pronunciare.
          </div>
        </div>


        {/* ═══ 5. DOMANDE ═══ */}
        <div style={{ marginBottom: "3rem" }}>
          <h2 style={{ fontSize: "18px", fontWeight: 600, margin: "0 0 8px", color: navy }}>5. Le domande per voi</h2>
          <p style={{ fontSize: "14px", color: textMid, lineHeight: 1.7, margin: "0 0 1.25rem" }}>Il voicebot funziona e risponde ai vostri clienti. Il passo successivo è decidere insieme come gestire tre situazioni specifiche.</p>
          {[
            { letter: "A", q: "Quando il cliente chiede subito l'operatore", ctx: `Succede nel 46,9% delle chiamate (${fmt(10136)}). L'utente non dà al bot la possibilità di rispondere.`, opt: "Il bot deve trasferire subito? Oppure chiedere prima il motivo della chiamata e provare a rispondere?", c: navy },
            { letter: "B", q: "Quando il bot risponde ma il cliente vuole comunque l'operatore", ctx: `Succede in ${fmt(2938)} chiamate. Il bot ha dato le informazioni (nel 90% dei casi in modo pertinente), ma il cliente preferisce conferma umana.`, opt: "Il bot deve trasferire? Proporre una richiamata? Chiedere se serve qualcos'altro?", c: orange },
            { letter: "C", q: "Quando il bot non ha l'informazione richiesta", ctx: `Succede in ${fmt(1333)} chiamate. Il bot capisce la domanda ma non trova la risposta.`, opt: "Il bot deve trasferire direttamente? Suggerire il sito web? Proporre il contatto via email?", c: red },
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


        {/* ═══ 5. STRATEGIE DI INTERVENTO ═══ */}
        <div style={{ marginBottom: "3rem" }}>
          <h2 style={{ fontSize: "18px", fontWeight: 600, margin: "0 0 8px", color: navy }}>6. Strategie di intervento sul trasferimento</h2>
          <p style={{ fontSize: "14px", color: textMid, lineHeight: 1.7, margin: "0 0 1.25rem" }}>
            Per ridurre i trasferimenti non necessari, proponiamo cinque livelli di intervento progressivi — dal più leggero al più incisivo. Ogni livello può essere attivato singolarmente o in combinazione.
          </p>

          <div style={{ border: `1px solid ${paleNavy}`, borderRadius: "12px", overflow: "hidden", marginBottom: "1.5rem" }}>
            {[
              { n: "1", tag: "Soft", c: "#2e86c1", t: "Dissuasione gentile del trasferimento", points: [
                "Il bot propone più volte l'interazione prima di trasferire",
                "Comunica all'utente i possibili tempi di attesa per l'operatore",
                "Suggerisce le alternative disponibili (\"Posso aiutarti subito con molte richieste, vuoi provare?\")",
                "Impatto atteso: riduzione del 10-15% dei trasferimenti immediati",
              ]},
              { n: "2", tag: "Media", c: orange, t: "Interazione minima obbligatoria", points: [
                "L'utente non può parlare col negozio se non dopo almeno 3 interazioni positive col voicebot",
                "Il bot dimostra le sue capacità prima di cedere il controllo",
                "L'utente che ha un motivo specifico viene comunque trasferito, ma dopo aver visto cosa può fare il bot",
                "Impatto atteso: riduzione del 20-30% dei trasferimenti, con aumento della soddisfazione",
              ]},
              { n: "3", tag: "Hard", c: red, t: "Disabilitazione trasferimento al negozio", points: [
                "Il trasferimento diretto al negozio viene disabilitato",
                "Il bot gestisce tutte le richieste, trasferendo solo per limiti oggettivi (KB miss, incomprensioni)",
                "L'utente viene guidato verso soluzioni alternative per le richieste non gestibili",
                "Impatto atteso: drastica riduzione dei trasferimenti, richiede KB molto completa",
              ]},
              { n: "4", tag: "Asincrono", c: navy, t: "Gestione asincrona delle richieste", points: [
                "a) Raccolta richiesta per gestione in backoffice: \"Lasciami un messaggio e un collega ti richiamerà appena si libera\"",
                "b) Notifica WhatsApp: \"Ti scriviamo su WhatsApp appena l'operatore si libera\"",
                "c) Prenotazione richiamata: l'utente prenota uno slot e viene richiamato",
                "d) Reindirizzamento email: \"Scrivi a assistenza@dimostore.it e ti risponderemo\"",
                "Impatto atteso: elimina le attese, migliora l'esperienza, riduce il carico in tempo reale",
              ]},
              { n: "5", tag: "Strutturale", c: "#1a5276", t: "Customer care centralizzato per tutti i negozi", points: [
                "Concentrare la gestione telefonica in un unico customer care dedicato",
                "Il voicebot diventa il primo livello di triage per tutti i punti vendita",
                "Gli operatori specializzati gestiscono solo i casi complessi che il bot non può risolvere",
                "Impatto atteso: standardizzazione del servizio, ottimizzazione delle risorse, dati centralizzati",
              ]},
            ].map((item, i) => (
              <div key={i} style={{ padding: "1.25rem", borderTop: i > 0 ? `1px solid ${paleNavy}` : "none", background: i % 2 === 0 ? white : paleNavy }}>
                <div style={{ display: "flex", gap: "16px", alignItems: "flex-start" }}>
                  <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "20px", fontWeight: 700, color: item.c, minWidth: "36px" }}>{item.n}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px", flexWrap: "wrap" }}>
                      <span style={{ fontSize: "14px", fontWeight: 600, color: navy }}>{item.t}</span>
                      <span style={{ fontSize: "11px", fontFamily: "'JetBrains Mono', monospace", fontWeight: 600, color: item.c, background: item.c + "18", padding: "3px 10px", borderRadius: "6px" }}>{item.tag}</span>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                      {item.points.map((p, j) => (
                        <div key={j} style={{ display: "flex", gap: "8px", alignItems: "flex-start", fontSize: "13px", color: textMid, lineHeight: 1.6 }}>
                          <span style={{ color: item.c, marginTop: "2px", fontSize: "8px" }}>●</span>
                          <span>{p}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div style={{ background: paleNavy, borderRadius: "10px", padding: "1rem 1.25rem", fontSize: "13px", color: navy, lineHeight: 1.6, borderLeft: `4px solid ${navy}` }}>
            <strong>Consigliamo di partire dal livello 1 (soft) e dal livello 4 (asincrono)</strong>, che insieme offrono il miglior rapporto tra impatto e rischio. I livelli 2 e 3 possono essere attivati progressivamente in base ai risultati ottenuti. Il livello 5 è una decisione strategica a medio termine.
          </div>
        </div>


        {/* ═══ 6. STIMA IMPATTO OPERATIVO (FTE) ═══ */}
        <div style={{ marginBottom: "3rem" }}>
          <h2 style={{ fontSize: "18px", fontWeight: 600, margin: "0 0 8px", color: navy }}>7. Stima impatto operativo</h2>
          <p style={{ fontSize: "14px", color: textMid, lineHeight: 1.7, margin: "0 0 1.25rem" }}>
            Il voicebot gestisce circa 240 chiamate al giorno senza operatore. Stimando una durata media di 3 minuti per chiamata, il risparmio operativo è significativo.
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: "12px", marginBottom: "1.5rem" }}>
            <Metric value="~240" label="Chiamate gestite/giorno" sub="senza operatore" />
            <Metric value="~720 min" label="Minuti risparmiati/giorno" sub="240 × 3 min" />
            <Metric value="~12h" label="Ore lavoro risparmiate/giorno" sub="equivalente operatore" />
            <Metric value="~1,5 FTE" label="Operatori equivalenti" sub="su turno 8h" />
          </div>

          <div style={{ border: `1px solid ${paleNavy}`, borderRadius: "12px", padding: "1.25rem", marginBottom: "1.5rem" }}>
            <div style={{ fontSize: "14px", fontWeight: 600, color: navy, marginBottom: "12px" }}>Proiezione con le strategie di intervento</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: "12px" }}>
              {[
                { scenario: "Situazione attuale", calls: "~240", hours: "~12h", fte: "~1,5", c: textLight },
                { scenario: "Con livelli 1+4 (soft + asincrono)", calls: "~340", hours: "~17h", fte: "~2,1", c: orange },
                { scenario: "Con livelli 1-4 combinati", calls: "~450", hours: "~22,5h", fte: "~2,8", c: navy },
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

          <div style={{ background: paleOrange, borderRadius: "10px", padding: "1rem 1.25rem", fontSize: "13px", color: "#7a5500", lineHeight: 1.6, borderLeft: `4px solid ${orange}` }}>
            <strong>Con le strategie soft e asincrone (livelli 1+4) il risparmio può salire a oltre 2 FTE.</strong> Combinando tutti i livelli di intervento, il voicebot potrebbe gestire fino a 450 chiamate al giorno, equivalenti a quasi 3 operatori a tempo pieno.
          </div>
        </div>


        {/* ═══ 7. TOKEN E OTTIMIZZAZIONE COSTI ═══ */}
        <div style={{ marginBottom: "3rem" }}>
          <h2 style={{ fontSize: "18px", fontWeight: 600, margin: "0 0 8px", color: navy }}>8. Token e ottimizzazione costi</h2>
          <p style={{ fontSize: "14px", color: textMid, lineHeight: 1.7, margin: "0 0 1.25rem" }}>
            L'utilizzo dei token (il "carburante" dell'intelligenza artificiale) è un fattore importante per la sostenibilità economica del servizio. Ecco la situazione attuale e la proposta di ottimizzazione.
          </p>

          <div style={{ border: `1px solid ${paleNavy}`, borderRadius: "12px", overflow: "hidden", marginBottom: "1.5rem" }}>
            <div style={{ background: navy, color: white, padding: "14px 20px", fontSize: "14px", fontWeight: 600 }}>Situazione attuale</div>
            {[
              { icon: "📊", t: "Stima iniziale molto contenuta", d: "La stima iniziale del consumo di token era basata su una base dati (catalogo aziendale) significativamente più piccola rispetto a quella effettivamente caricata. Il volume reale di dati da processare ha superato le previsioni iniziali." },
              { icon: "🔄", t: "Interazione su più temi", d: "Il voicebot gestisce argomenti molto diversi tra loro — disponibilità, ordini, prezzi, assistenza, informazioni negozio — che sono stati introdotti gradualmente. Ogni tema aggiuntivo aumenta il contesto che il modello deve processare ad ogni turno." },
              { icon: "🎯", t: "Livello di comprensione e risposta molto elevato", d: "Il modello di intelligenza artificiale utilizzato garantisce un'elevata qualità nelle risposte (79,4% di pertinenza), ma richiede un consumo di token superiore rispetto a modelli meno performanti." },
              { icon: "🗣️", t: "Scelta di voci di livello superiore", d: "Le voci di sintesi vocale selezionate per il voicebot sono di qualità premium, offrendo un'esperienza più naturale all'utente ma con un costo unitario più alto." },
            ].map((item, i) => (
              <div key={i} style={{ display: "flex", gap: "14px", padding: "1rem 1.25rem", borderTop: `1px solid ${paleNavy}`, background: i % 2 === 0 ? white : paleNavy, alignItems: "flex-start" }}>
                <span style={{ fontSize: "20px", marginTop: "2px" }}>{item.icon}</span>
                <div>
                  <div style={{ fontSize: "13px", fontWeight: 600, color: navy, marginBottom: "4px" }}>{item.t}</div>
                  <div style={{ fontSize: "13px", color: textMid, lineHeight: 1.6 }}>{item.d}</div>
                </div>
              </div>
            ))}
          </div>

          <div style={{ border: `1px solid ${orange}40`, borderRadius: "12px", overflow: "hidden", marginBottom: "1.5rem" }}>
            <div style={{ background: orange, color: white, padding: "14px 20px", fontSize: "14px", fontWeight: 600 }}>Proposta di ottimizzazione: Smart RAG</div>
            <div style={{ padding: "1.25rem" }}>
              <p style={{ fontSize: "14px", color: textMid, lineHeight: 1.7, margin: "0 0 1rem" }}>
                Proponiamo l'introduzione di un sistema di <strong style={{ color: navy }}>Smart RAG</strong> (Retrieval-Augmented Generation intelligente) che riduce significativamente il consumo di token ottimizzando il modo in cui il voicebot accede al catalogo.
              </p>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "1rem" }}>
                <div style={{ background: paleNavy, borderRadius: "10px", padding: "1rem" }}>
                  <div style={{ fontSize: "13px", fontWeight: 600, color: navy, marginBottom: "8px" }}>Come funziona oggi</div>
                  <div style={{ fontSize: "13px", color: textMid, lineHeight: 1.6 }}>
                    Ad ogni turno il modello riceve l'intero contesto del catalogo per trovare la risposta. Questo significa processare migliaia di token anche per domande semplici.
                  </div>
                </div>
                <div style={{ background: paleOrange, borderRadius: "10px", padding: "1rem" }}>
                  <div style={{ fontSize: "13px", fontWeight: 600, color: "#7a5500", marginBottom: "8px" }}>Come funzionerà con Smart RAG</div>
                  <div style={{ fontSize: "13px", color: textMid, lineHeight: 1.6 }}>
                    Il sistema cerca prima le informazioni rilevanti e passa al modello solo la porzione necessaria. Riduce drasticamente i token per turno, mantenendo la stessa qualità di risposta.
                  </div>
                </div>
              </div>

              <div style={{ background: white, border: `1px solid ${paleNavy}`, borderRadius: "10px", padding: "1rem" }}>
                <div style={{ fontSize: "13px", fontWeight: 600, color: navy, marginBottom: "8px" }}>Impatto atteso</div>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  {[
                    "Riduzione significativa del consumo di token per conversazione",
                    "Mantenimento dello stesso livello di qualità delle risposte",
                    "Possibile lieve aumento del numero di turni per conversazione (il bot potrebbe fare una domanda in più per affinare la ricerca)",
                    "Tempo di risposta più rapido grazie al contesto ridotto",
                  ].map((p, i) => (
                    <div key={i} style={{ display: "flex", gap: "8px", alignItems: "flex-start", fontSize: "13px", color: textMid, lineHeight: 1.6 }}>
                      <span style={{ color: orange, marginTop: "2px", fontSize: "8px" }}>●</span>
                      <span>{p}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div style={{ background: paleNavy, borderRadius: "10px", padding: "1rem 1.25rem", fontSize: "13px", color: navy, lineHeight: 1.6, borderLeft: `4px solid ${navy}` }}>
            <strong>Lo Smart RAG è la soluzione tecnica che consigliamo</strong> per ottimizzare il rapporto costi/qualità del servizio. L'implementazione non richiede modifiche al flusso conversazionale visibile all'utente: è una ottimizzazione trasparente lato infrastruttura.
          </div>
        </div>


        {/* ═══ 8. PIANO OPERATIVO ═══ */}
        <div style={{ marginBottom: "2rem" }}>
          <h2 style={{ fontSize: "18px", fontWeight: 600, margin: "0 0 8px", color: navy }}>9. Piano operativo</h2>
          <div style={{ border: `1px solid ${paleNavy}`, borderRadius: "12px", overflow: "hidden" }}>
            {[
              { n: "01", t: "Arricchire la knowledge base", d: `Aggiungere informazioni sui prodotti più richiesti. Può risolvere una parte significativa delle ${fmt(1333)} chiamate senza risposta.`, tag: "Priorità alta", c: red },
              { n: "02", t: "Implementare Smart RAG", d: "Ridurre il consumo di token ottimizzando l'accesso al catalogo, senza impatto sulla qualità delle risposte.", tag: "Priorità alta", c: red },
              { n: "03", t: "Attivare strategia soft + asincrona (livelli 1+4)", d: "Dissuasione gentile del trasferimento e gestione asincrona delle richieste. Il primo passo per ridurre i trasferimenti non necessari.", tag: "Priorità alta", c: orange },
              { n: "04", t: "Affinare la pertinenza delle risposte", d: "Il 9,6% delle risposte valutate non è pertinente. Migliorando prompt e matching si può alzare la qualità.", tag: "Priorità media", c: orange },
              { n: "05", t: "Configurare i livelli di intervento 2-3", d: "Sulla base dei risultati dei primi interventi, attivare progressivamente i livelli più incisivi.", tag: "Prossimo passo", c: navy },
              { n: "06", t: "Valutare customer care centralizzato", d: "Analizzare la fattibilità di concentrare la gestione telefonica in un unico punto per tutti i negozi.", tag: "Medio termine", c: navy },
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
        <div style={{ fontSize: "13px", opacity: 0.7 }}>Report realizzato da <strong style={{ color: orange }}>Ellysse</strong> · Divisione AI conversazionale di Maps Group</div>
      </div>
    </div>
  );
}
// update
