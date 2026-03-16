import { useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend, CartesianGrid } from "recharts";

const T = 21599, days = 25;
const cat100 = { total: 6019, resolved: 1898, closed: 4121 };
const cat50 = { total: 2938, pertinent: 2514, notPertinent: 268 };
const cat0 = { total: 12368, immediate: 10136, kbMiss: 1333, linguistic: 899 };
const abandoned = 274;
const botWorked = cat100.total + cat50.total; // 8957
const fmt = (n) => typeof n === "number" ? n.toLocaleString("it-IT") : n;
const pct = (a, b) => ((a / b) * 100).toFixed(1);

const successIntents = [
  { name: "Prezzo", managed: 322, total: 388 },
  { name: "Offerte", managed: 146, total: 201 },
  { name: "Disponibilità", managed: 1912, total: 2641 },
  { name: "Info prodotto", managed: 685, total: 1046 },
  { name: "Stato ordine", managed: 929, total: 1459 },
  { name: "Info pagamento", managed: 134, total: 235 },
  { name: "Info negozio", managed: 313, total: 619 },
  { name: "Consegna", managed: 104, total: 238 },
].map(i => ({ ...i, pct: Math.round((i.managed / i.total) * 100), transferred: i.total - i.managed })).sort((a, b) => b.pct - a.pct);

const products = [
  { name: "Lavatrice", v: 330 }, { name: "Telefono", v: 138 }, { name: "Televisore", v: 107 },
  { name: "Computer", v: 104 }, { name: "Lavastoviglie", v: 96 }, { name: "TV", v: 90 },
  { name: "Frigorifero", v: 83 }, { name: "Asciugatrice", v: 43 },
];

const examples100 = [
  { intent: "Prezzo", detail: "Utente chiede prezzo iPhone 16 Pro 256GB. Bot risponde con modelli disponibili, utente sceglie, bot fornisce il prezzo. Conversazione risolta in 3 turni." },
  { intent: "Stato ordine", detail: "Utente verifica stato riparazione macchinetta caffè. Bot raccoglie numero documento, recupera info, conferma data ritiro. Risolta in 4 turni." },
  { intent: "Disponibilità", detail: "Utente cerca frigorifero Hisense da volantino. Bot conferma disponibilità e fornisce dettagli. Risolta in 2 turni." },
  { intent: "Info prodotto", detail: "Utente cerca cartucce per stampante HP Envy 6000. Bot guida la ricerca, propone modelli compatibili. Risolta in 4 turni." },
  { intent: "Info pagamento", detail: "Utente chiede acquisto a rate per frigorifero. Bot spiega opzioni di finanziamento disponibili. Risolta in 2 turni." },
];

const examples50 = [
  { intent: "Assistenza tecnica", detail: "Utente segnala problema con lavatrice acquistata. Bot fornisce info sull'assistenza, ma l'utente preferisce parlare con un operatore per avere conferma." },
  { intent: "Reso/Rimborso", detail: "Utente ha friggitrice con pezzo mancante. Bot spiega la procedura di reso, l'utente chiede comunque l'operatore per gestire il caso specifico." },
  { intent: "Disponibilità", detail: "Utente cerca lavatrice specifica per ritiro in negozio. Bot conferma disponibilità, ma l'utente vuole parlare col punto vendita per organizzare il ritiro." },
  { intent: "Consegna", detail: "Utente vuole modificare indirizzo consegna elettrodomestico. Bot fornisce le indicazioni, ma l'utente preferisce conferma umana per sicurezza." },
  { intent: "Persona specifica", detail: "Utente cerca 'Roberto del bancone smartphone'. Bot risponde ma non può collegare a una persona. Trasferimento inevitabile." },
];

const examples0 = [
  { intent: "Operatore senza motivo", detail: "'Vorrei parlare con un operatore' — primo messaggio, senza specificare il motivo. Il bot non ha avuto modo di intervenire." },
  { intent: "Punto vendita", detail: "'Mi passi il negozio per favore' — l'utente vuole essere collegato direttamente al punto vendita." },
  { intent: "Persona specifica", detail: "'Devo parlare col direttore' / 'Mi passi Gianluca del reparto TV' — richiesta di persona per nome o ruolo." },
  { intent: "KB miss", detail: "Utente chiede disponibilità TV TCL 65 pollici. Il bot capisce la domanda ma non trova il prodotto nella knowledge base. Trasferito dopo 6 tentativi." },
  { intent: "Incomprensione", detail: "Utente pronuncia modello fotocamera Kodak FZ55. Il bot non riesce a capire il codice dopo 3 tentativi. Trasferito." },
];

const examplesKB = [
  { product: "TV TCL", detail: "Utente chiede specifico modello, bot non lo trova nella KB dopo 6 tentativi." },
  { product: "Logitech Z906", detail: "Sistema audio richiesto, nessun risultato nel catalogo." },
  { product: "VHF nautici", detail: "Prodotto fuori categoria — il bot non ha info sulla nautica." },
  { product: "Orari filiale Parma", detail: "Utente chiede orari apertura specifica filiale — info non presente in KB." },
  { product: "Alimentatore 20V", detail: "Richiesta molto specifica (20V 2.25A connettore tondo 5.5mm) — troppo di dettaglio per la KB attuale." },
];

const CT = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "#161b22", border: "1px solid #30363d", borderRadius: "8px", padding: "10px 14px", fontSize: "12px", fontFamily: "'JetBrains Mono', monospace" }}>
      <div style={{ color: "#8b949e", marginBottom: "4px" }}>{label}</div>
      {payload.map((p, i) => <div key={i} style={{ color: p.fill || p.color || "#c9d1d9" }}>{p.name}: {typeof p.value === "number" ? fmt(p.value) : p.value}{p.unit || ""}</div>)}
    </div>
  );
};

function Card({ children, style }) { return <div style={{ background: "#0d1117", border: "1px solid #21262d", borderRadius: "12px", padding: "22px", ...style }}>{children}</div>; }
function Num({ value, label, sub, color = "#58a6ff" }) {
  return <Card><div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "28px", fontWeight: 700, color, lineHeight: 1 }}>{value}</div><div style={{ fontSize: "12px", fontWeight: 600, color: "#c9d1d9", marginTop: "8px" }}>{label}</div>{sub && <div style={{ fontSize: "11px", color: "#484f58", marginTop: "4px", lineHeight: 1.4 }}>{sub}</div>}</Card>;
}
function Insight({ color = "#58a6ff", children }) { return <div style={{ padding: "16px 18px", background: color + "0a", borderRadius: "10px", borderLeft: `3px solid ${color}`, fontSize: "13px", color: "#8b949e", lineHeight: 1.65 }}>{children}</div>; }

function ExampleBlock({ examples, color = "#58a6ff", title }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ background: "#161b22", border: "1px solid #21262d", borderRadius: "10px", overflow: "hidden", marginBottom: "12px" }}>
      <button onClick={() => setOpen(!open)} style={{ width: "100%", display: "flex", alignItems: "center", gap: "10px", padding: "14px 18px", border: "none", background: "transparent", cursor: "pointer", textAlign: "left" }}>
        <span style={{ fontSize: "14px" }}>📋</span>
        <span style={{ flex: 1, fontSize: "13px", fontWeight: 600, color: "#c9d1d9" }}>{title}</span>
        <span style={{ fontSize: "11px", fontFamily: "'JetBrains Mono', monospace", color: "#484f58" }}>{examples.length} esempi</span>
        <span style={{ color: "#484f58", fontSize: "14px", transform: open ? "rotate(180deg)" : "rotate(0)", transition: "transform 0.2s" }}>▾</span>
      </button>
      {open && (
        <div style={{ padding: "0 18px 16px", display: "flex", flexDirection: "column", gap: "10px" }}>
          {examples.map((ex, i) => (
            <div key={i} style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "10px", color, background: color + "15", padding: "3px 6px", borderRadius: "4px", minWidth: "fit-content", marginTop: "2px" }}>{ex.intent || ex.product}</span>
              <span style={{ fontSize: "12px", color: "#8b949e", lineHeight: 1.5 }}>{ex.detail}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const tabs = [
  { id: "overview", label: "1. Panoramica" },
  { id: "cat100", label: "2. Gestite 100%" },
  { id: "cat50", label: "3. Gestite 50%" },
  { id: "cat0", label: "4. Non gestite" },
  { id: "next", label: "5. Prossimi passi" },
];

export default function App() {
  const [tab, setTab] = useState("overview");

  return (
    <div style={{ minHeight: "100vh", background: "#010409", color: "#c9d1d9", fontFamily: "'IBM Plex Sans', system-ui, sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;700&display=swap" rel="stylesheet" />

      {/* HEADER */}
      <div style={{ background: "#0d1117", borderBottom: "1px solid #21262d", padding: "32px 20px 24px" }}>
        <div style={{ maxWidth: "980px", margin: "0 auto" }}>
          <div style={{ display: "flex", gap: "8px", marginBottom: "10px", flexWrap: "wrap" }}>
            {["DIMO · EURONICS", "17 FEB – 13 MAR 2026", `${fmt(T)} CONVERSAZIONI`].map((t, i) => (
              <span key={i} style={{ fontSize: "10px", fontFamily: "'JetBrains Mono', monospace", color: i === 0 ? "#58a6ff" : "#484f58", background: i === 0 ? "#58a6ff12" : "#161b22", padding: "3px 8px", borderRadius: "4px", letterSpacing: "1.5px" }}>{t}</span>
            ))}
          </div>
          <h1 style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "clamp(18px, 3.5vw, 26px)", fontWeight: 700, margin: 0, color: "#e6edf3", lineHeight: 1.3 }}>
            Il bot interviene attivamente nel <span style={{ color: "#3fb950" }}>41,5%</span> delle conversazioni
          </h1>
          <p style={{ fontSize: "13px", color: "#484f58", margin: "8px 0 0", maxWidth: "700px", lineHeight: 1.5 }}>
            Su {fmt(T)} chiamate, in {fmt(botWorked)} il voicebot ha risposto e fornito informazioni. Nel restante 57,2% l'utente ha scelto l'operatore senza dare al bot la possibilità di intervenire.
          </p>
        </div>
      </div>

      {/* TABS */}
      <div style={{ maxWidth: "980px", margin: "20px auto 0", padding: "0 16px" }}>
        <div style={{ display: "flex", gap: "2px", background: "#0d1117", borderRadius: "10px", padding: "3px", border: "1px solid #21262d", overflowX: "auto" }}>
          {tabs.map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              flex: 1, padding: "10px 6px", border: "none", borderRadius: "8px", cursor: "pointer",
              fontFamily: "'IBM Plex Sans', sans-serif", fontSize: "11px", fontWeight: tab === t.id ? 600 : 400,
              color: tab === t.id ? "#010409" : "#484f58", background: tab === t.id ? "#58a6ff" : "transparent",
              transition: "all 0.2s", whiteSpace: "nowrap",
            }}>{t.label}</button>
          ))}
        </div>
      </div>

      <div style={{ maxWidth: "980px", margin: "24px auto 0", padding: "0 16px 48px" }}>

        {/* ═══ 1. PANORAMICA ═══ */}
        {tab === "overview" && (
          <div>
            <h2 style={{ fontSize: "18px", fontWeight: 700, color: "#e6edf3", margin: "0 0 6px" }}>Tre tipi di conversazione</h2>
            <p style={{ fontSize: "12px", color: "#484f58", margin: "0 0 16px" }}>Ogni chiamata ricade in una di tre categorie in base al livello di gestione del voicebot.</p>

            {/* 3-way stacked bar */}
            <Card style={{ marginBottom: "16px" }}>
              <ResponsiveContainer width="100%" height={70}>
                <BarChart data={[{ a: cat100.total, b: cat50.total, c: cat0.total, d: abandoned }]} layout="vertical" margin={{ left: 0, right: 0 }}>
                  <XAxis type="number" hide /><YAxis type="category" hide />
                  <Tooltip content={<CT />} />
                  <Bar dataKey="a" name="100% gestite dal bot" stackId="s" fill="#3fb950" barSize={36} />
                  <Bar dataKey="b" name="Gestite parzialmente" stackId="s" fill="#d29922" barSize={36} />
                  <Bar dataKey="c" name="Non gestite dal bot" stackId="s" fill="#484f58" barSize={36} />
                  <Bar dataKey="d" name="Abbandono" stackId="s" fill="#161b22" barSize={36} />
                </BarChart>
              </ResponsiveContainer>
              <div style={{ display: "flex", gap: "16px", marginTop: "10px", flexWrap: "wrap" }}>
                {[
                  { c: "#3fb950", l: `100% gestite: ${fmt(cat100.total)} (${pct(cat100.total, T)}%)` },
                  { c: "#d29922", l: `Parziali: ${fmt(cat50.total)} (${pct(cat50.total, T)}%)` },
                  { c: "#484f58", l: `Non gestite: ${fmt(cat0.total)} (${pct(cat0.total, T)}%)` },
                  { c: "#161b22", l: `Abbandono: ${fmt(abandoned)} (${pct(abandoned, T)}%)` },
                ].map((l, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <div style={{ width: 10, height: 10, borderRadius: "50%", background: l.c, border: "1px solid #21262d" }} />
                    <span style={{ fontSize: "11px", color: "#8b949e" }}>{l.l}</span>
                  </div>
                ))}
              </div>
            </Card>

            {/* 3 main cards */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px", marginBottom: "16px" }}>
              <Card style={{ borderTop: "3px solid #3fb950", cursor: "pointer" }} onClick={() => setTab("cat100")}>
                <div style={{ fontSize: "10px", fontFamily: "'JetBrains Mono', monospace", color: "#3fb950", letterSpacing: "1.5px", marginBottom: "10px" }}>100% GESTITE</div>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "30px", fontWeight: 700, color: "#3fb950" }}>{fmt(cat100.total)}</div>
                <div style={{ fontSize: "12px", color: "#8b949e", marginTop: "6px", lineHeight: 1.5 }}>Il bot ha gestito la richiesta dall'inizio alla fine, senza operatore.</div>
                <div style={{ fontSize: "11px", color: "#484f58", marginTop: "8px" }}>→ Clicca per dettagli</div>
              </Card>
              <Card style={{ borderTop: "3px solid #d29922", cursor: "pointer" }} onClick={() => setTab("cat50")}>
                <div style={{ fontSize: "10px", fontFamily: "'JetBrains Mono', monospace", color: "#d29922", letterSpacing: "1.5px", marginBottom: "10px" }}>GESTITE PARZIALMENTE</div>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "30px", fontWeight: 700, color: "#d29922" }}>{fmt(cat50.total)}</div>
                <div style={{ fontSize: "12px", color: "#8b949e", marginTop: "6px", lineHeight: 1.5 }}>Il bot ha risposto, ma l'utente ha poi scelto l'operatore.</div>
                <div style={{ fontSize: "11px", color: "#484f58", marginTop: "8px" }}>→ Clicca per dettagli</div>
              </Card>
              <Card style={{ borderTop: "3px solid #484f58", cursor: "pointer" }} onClick={() => setTab("cat0")}>
                <div style={{ fontSize: "10px", fontFamily: "'JetBrains Mono', monospace", color: "#484f58", letterSpacing: "1.5px", marginBottom: "10px" }}>NON GESTITE</div>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "30px", fontWeight: 700, color: "#8b949e" }}>{fmt(cat0.total)}</div>
                <div style={{ fontSize: "12px", color: "#8b949e", marginTop: "6px", lineHeight: 1.5 }}>Operatore al primo turno, KB miss o incomprensioni.</div>
                <div style={{ fontSize: "11px", color: "#484f58", marginTop: "8px" }}>→ Clicca per dettagli</div>
              </Card>
            </div>

            <Insight color="#3fb950">
              <strong style={{ color: "#3fb950" }}>Il bicchiere mezzo pieno:</strong> il bot ha lavorato attivamente in {fmt(botWorked)} conversazioni ({pct(botWorked, T)}%). Delle {fmt(cat0.total)} "non gestite", la stragrande maggioranza ({fmt(cat0.immediate)}) sono utenti che hanno chiesto l'operatore al primo turno — il bot non ha avuto la possibilità di intervenire.
            </Insight>
          </div>
        )}

        {/* ═══ 2. 100% GESTITE ═══ */}
        {tab === "cat100" && (
          <div>
            <h2 style={{ fontSize: "18px", fontWeight: 700, color: "#3fb950", margin: "0 0 6px" }}>100% gestite dal bot: {fmt(cat100.total)} conversazioni</h2>
            <p style={{ fontSize: "12px", color: "#484f58", margin: "0 0 16px" }}>Il bot ha gestito la richiesta dall'inizio alla fine senza intervento umano.</p>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "16px" }}>
              <Num value={fmt(cat100.resolved)} label="Risolte completamente" sub="Risposta fornita, utente soddisfatto" color="#3fb950" />
              <Num value={fmt(cat100.closed)} label="Chiuse dall'utente" sub="Interazione avvenuta, utente chiude" color="#58a6ff" />
            </div>

            <Card style={{ marginBottom: "16px" }}>
              <div style={{ fontSize: "13px", fontWeight: 600, marginBottom: "4px" }}>Su quali argomenti il bot eccelle</div>
              <div style={{ fontSize: "11px", color: "#484f58", marginBottom: "16px" }}>Percentuale di richieste gestite senza operatore per argomento</div>
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={successIntents} layout="vertical" margin={{ left: 10, right: 16 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#21262d" horizontal={false} />
                  <XAxis type="number" domain={[0, 100]} tick={{ fill: "#484f58", fontSize: 11 }} axisLine={false} tickLine={false} unit="%" />
                  <YAxis type="category" dataKey="name" tick={{ fill: "#8b949e", fontSize: 11 }} width={110} axisLine={false} tickLine={false} />
                  <Tooltip content={<CT />} />
                  <Bar dataKey="pct" name="Gestite dal bot" fill="#3fb950" radius={[0, 4, 4, 0]} barSize={18} unit="%" />
                </BarChart>
              </ResponsiveContainer>
            </Card>

            <ExampleBlock title="Esempi reali di conversazioni risolte dal bot" examples={examples100} color="#3fb950" />

            <Insight color="#3fb950">
              <strong style={{ color: "#3fb950" }}>Il bot eccelle su prezzo (83%), offerte (73%), disponibilità (72%).</strong> Questi sono gli argomenti transazionali dove il voicebot dà il massimo valore. Su {fmt(2641)} richieste di disponibilità, {fmt(1912)} vengono gestite senza operatore.
            </Insight>
          </div>
        )}

        {/* ═══ 3. 50% GESTITE ═══ */}
        {tab === "cat50" && (
          <div>
            <h2 style={{ fontSize: "18px", fontWeight: 700, color: "#d29922", margin: "0 0 6px" }}>Gestite parzialmente: {fmt(cat50.total)} conversazioni</h2>
            <p style={{ fontSize: "12px", color: "#484f58", margin: "0 0 16px" }}>Il bot ha risposto e fornito informazioni, ma l'utente ha poi chiesto l'operatore. Non è un errore del bot — è una scelta dell'utente.</p>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px", marginBottom: "16px" }}>
              <Num value={fmt(cat50.pertinent)} label="Risposta pertinente" sub={`${pct(cat50.pertinent, cat50.total)}% — il bot ha fatto bene`} color="#3fb950" />
              <Num value={fmt(cat50.notPertinent)} label="Risposta non pertinente" sub={`${pct(cat50.notPertinent, cat50.total)}% — area di miglioramento`} color="#f85149" />
              <Num value="92,5%" label="Motivo: scelta utente" sub={`${fmt(2718)} su ${fmt(cat50.total)} chiedono operatore`} color="#d29922" />
            </div>

            <Card style={{ marginBottom: "16px" }}>
              <div style={{ fontSize: "13px", fontWeight: 600, marginBottom: "14px" }}>Argomenti più frequenti nelle conversazioni parziali</div>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={[
                  { name: "Assistenza tecnica", v: 728 }, { name: "Altro", v: 376 },
                  { name: "Disponibilità", v: 307 }, { name: "Info prodotto", v: 206 },
                  { name: "Stato ordine", v: 189 }, { name: "Reso/Rimborso", v: 179 },
                  { name: "Op. con motivo", v: 166 }, { name: "Persona specifica", v: 144 },
                ]} layout="vertical" margin={{ left: 10, right: 16 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#21262d" horizontal={false} />
                  <XAxis type="number" tick={{ fill: "#484f58", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="name" tick={{ fill: "#8b949e", fontSize: 11 }} width={120} axisLine={false} tickLine={false} />
                  <Tooltip content={<CT />} />
                  <Bar dataKey="v" name="Conversazioni" fill="#d29922" radius={[0, 4, 4, 0]} barSize={16} />
                </BarChart>
              </ResponsiveContainer>
            </Card>

            <ExampleBlock title="Esempi reali: il bot risponde, l'utente sceglie l'operatore" examples={examples50} color="#d29922" />

            <Insight color="#d29922">
              <strong style={{ color: "#d29922" }}>In queste {fmt(cat50.total)} conversazioni il bot ha lavorato.</strong> L'assistenza tecnica (728 casi) e i resi (179) sono gli argomenti dove l'utente preferisce conferma umana anche dopo aver ricevuto risposta. È un comportamento normale — come chiedere conferma a un collega dopo aver letto la procedura.
            </Insight>
          </div>
        )}

        {/* ═══ 4. NON GESTITE ═══ */}
        {tab === "cat0" && (
          <div>
            <h2 style={{ fontSize: "18px", fontWeight: 700, color: "#8b949e", margin: "0 0 6px" }}>Non gestite dal bot: {fmt(cat0.total)} conversazioni</h2>
            <p style={{ fontSize: "12px", color: "#484f58", margin: "0 0 16px" }}>L'utente è stato trasferito senza che il bot abbia potuto fornire informazioni utili.</p>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px", marginBottom: "16px" }}>
              <Card style={{ borderTop: "3px solid #484f58" }}>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "28px", fontWeight: 700, color: "#8b949e" }}>{fmt(cat0.immediate)}</div>
                <div style={{ fontSize: "12px", fontWeight: 600, color: "#c9d1d9", marginTop: "8px" }}>Operatore al 1° turno</div>
                <div style={{ fontSize: "11px", color: "#484f58", marginTop: "4px" }}>L'utente non ha dato al bot la possibilità di rispondere</div>
              </Card>
              <Card style={{ borderTop: "3px solid #f85149" }}>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "28px", fontWeight: 700, color: "#f85149" }}>{fmt(cat0.kbMiss)}</div>
                <div style={{ fontSize: "12px", fontWeight: 600, color: "#c9d1d9", marginTop: "8px" }}>Info mancante in KB</div>
                <div style={{ fontSize: "11px", color: "#484f58", marginTop: "4px" }}>Il bot ha capito ma non aveva l'informazione</div>
              </Card>
              <Card style={{ borderTop: "3px solid #f85149" }}>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "28px", fontWeight: 700, color: "#f85149" }}>{fmt(cat0.linguistic)}</div>
                <div style={{ fontSize: "12px", fontWeight: 600, color: "#c9d1d9", marginTop: "8px" }}>Incomprensioni linguistiche</div>
                <div style={{ fontSize: "11px", color: "#484f58", marginTop: "4px" }}>Il bot non ha capito cosa diceva l'utente</div>
              </Card>
            </div>

            <Card style={{ marginBottom: "16px" }}>
              <div style={{ fontSize: "13px", fontWeight: 600, marginBottom: "14px" }}>Perché chiedono subito l'operatore ({fmt(cat0.immediate)} casi)</div>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={[
                  { name: "Senza motivo", v: 6222 }, { name: "Punto vendita", v: 1478 },
                  { name: "Persona specifica", v: 1165 }, { name: "Con motivo", v: 700 },
                  { name: "Assistenza", v: 356 },
                ]} layout="vertical" margin={{ left: 10, right: 16 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#21262d" horizontal={false} />
                  <XAxis type="number" tick={{ fill: "#484f58", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="name" tick={{ fill: "#8b949e", fontSize: 11 }} width={110} axisLine={false} tickLine={false} />
                  <Tooltip content={<CT />} />
                  <Bar dataKey="v" name="Richieste" fill="#484f58" radius={[0, 4, 4, 0]} barSize={16} />
                </BarChart>
              </ResponsiveContainer>
            </Card>

            <ExampleBlock title="Esempi reali: richieste operatore al primo turno" examples={examples0.slice(0, 3)} color="#484f58" />
            <ExampleBlock title="Esempi reali: lacune knowledge base" examples={examplesKB} color="#f85149" />
            <ExampleBlock title="Esempi reali: incomprensioni linguistiche" examples={examples0.slice(3)} color="#f85149" />

            <Card style={{ marginBottom: "16px" }}>
              <div style={{ fontSize: "13px", fontWeight: 600, marginBottom: "14px" }}>Prodotti più menzionati nei trasferimenti</div>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={products} layout="vertical" margin={{ left: 10, right: 16 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#21262d" horizontal={false} />
                  <XAxis type="number" tick={{ fill: "#484f58", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="name" tick={{ fill: "#8b949e", fontSize: 11 }} width={90} axisLine={false} tickLine={false} />
                  <Tooltip content={<CT />} />
                  <Bar dataKey="v" name="Menzioni" fill="#d29922" radius={[0, 4, 4, 0]} barSize={16}>
                    {products.map((_, i) => <Cell key={i} fill={i < 3 ? "#d29922" : "#484f58"} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Card>

            <Insight color="#f85149">
              <strong style={{ color: "#f85149" }}>Gli errori reali del sistema sono {fmt(cat0.kbMiss + cat0.linguistic)}</strong> — il {pct(cat0.kbMiss + cat0.linguistic, T)}% del totale. Le {fmt(cat0.immediate)} richieste immediate di operatore non sono un fallimento del bot: l'utente ha scelto di non interagire. La domanda è: possiamo fare qualcosa per trattenerne una parte?
            </Insight>
          </div>
        )}

        {/* ═══ 5. PROSSIMI PASSI ═══ */}
        {tab === "next" && (
          <div>
            <h2 style={{ fontSize: "18px", fontWeight: 700, color: "#e6edf3", margin: "0 0 6px" }}>Prossimi passi</h2>
            <p style={{ fontSize: "12px", color: "#484f58", margin: "0 0 16px" }}>Il bot funziona. Definiamo insieme come gestire i casi specifici.</p>

            <Card style={{ marginBottom: "20px", borderTop: "3px solid #58a6ff" }}>
              <div style={{ fontSize: "13px", fontWeight: 600, color: "#58a6ff", marginBottom: "12px" }}>Sintesi</div>
              {[
                { icon: "✅", t: `Il bot interviene attivamente nel 41,5% delle conversazioni (${fmt(botWorked)} su ${fmt(T)}).` },
                { icon: "✅", t: "Quando risponde, è pertinente nel 79,4% dei casi." },
                { icon: "✅", t: "Eccelle su prezzo (83%), offerte (73%), disponibilità (72%)." },
                { icon: "⚠️", t: `${fmt(cat0.kbMiss + cat0.linguistic)} errori reali del sistema (${pct(cat0.kbMiss + cat0.linguistic, T)}% del totale).` },
                { icon: "📊", t: `${fmt(cat50.total + cat0.kbMiss)} conversazioni potenzialmente recuperabili con ottimizzazioni mirate.` },
              ].map((r, i) => (
                <div key={i} style={{ display: "flex", gap: "10px", alignItems: "flex-start", marginBottom: "8px" }}>
                  <span style={{ fontSize: "16px" }}>{r.icon}</span>
                  <span style={{ fontSize: "13px", color: "#c9d1d9", lineHeight: 1.5 }}>{r.t}</span>
                </div>
              ))}
            </Card>

            <div style={{ background: "linear-gradient(135deg, #0d1117, #161b22)", border: "2px solid #58a6ff40", borderRadius: "16px", padding: "32px 28px", marginBottom: "20px", textAlign: "center" }}>
              <div style={{ fontSize: "12px", fontFamily: "'JetBrains Mono', monospace", color: "#58a6ff", letterSpacing: "2px", marginBottom: "14px" }}>LA DOMANDA</div>
              <div style={{ fontSize: "clamp(18px, 3vw, 24px)", fontWeight: 700, color: "#e6edf3", lineHeight: 1.4, maxWidth: "600px", margin: "0 auto" }}>In queste situazioni, come volete che il bot si comporti?</div>
              <p style={{ fontSize: "13px", color: "#484f58", marginTop: "14px", maxWidth: "520px", margin: "14px auto 0", lineHeight: 1.6 }}>È un lavoro di affinamento operativo — come si farebbe con un operatore umano appena assunto.</p>
            </div>

            <Card style={{ marginBottom: "16px" }}>
              <div style={{ fontSize: "13px", fontWeight: 600, marginBottom: "16px", color: "#e6edf3" }}>Scenari da discutere</div>
              {[
                { n: "A", q: `Utente chiede subito l'operatore (${fmt(cat0.immediate)} casi)`, o: "Trasferire subito? Chiedere prima il motivo? Proporre cosa può fare il bot?", c: "#484f58" },
                { n: "B", q: `Bot risponde ma utente vuole operatore (${fmt(cat50.total)} casi)`, o: "Trasferire? Proporre richiamata? Chiedere se serve altro?", c: "#d29922" },
                { n: "C", q: `Info mancante nella knowledge base (${fmt(cat0.kbMiss)} casi)`, o: "Trasferire? Suggerire il sito? Proporre email?", c: "#f85149" },
                { n: "D", q: `Incomprensioni linguistiche (${fmt(cat0.linguistic)} casi)`, o: "Quanti tentativi? Offrire alternative? Trasferire prima?", c: "#f85149" },
              ].map((s, i) => (
                <div key={i} style={{ display: "flex", gap: "16px", padding: "14px 0", borderBottom: i < 3 ? "1px solid #21262d" : "none" }}>
                  <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "18px", fontWeight: 700, color: s.c, minWidth: "32px" }}>{s.n}</div>
                  <div>
                    <div style={{ fontSize: "13px", fontWeight: 600, color: "#e6edf3", marginBottom: "4px" }}>{s.q}</div>
                    <div style={{ fontSize: "12px", color: "#8b949e", fontStyle: "italic" }}>{s.o}</div>
                  </div>
                </div>
              ))}
            </Card>

            <Card>
              <div style={{ fontSize: "13px", fontWeight: 600, marginBottom: "16px", color: "#e6edf3" }}>Piano di intervento</div>
              {[
                { n: "01", t: "Arricchire la Knowledge Base", d: `Lavatrice (330 menzioni), telefono (138), televisore (107): ${fmt(cat0.kbMiss)} trasferimenti per info mancanti sono direttamente colmabili.`, tag: "ALTA", c: "#f85149" },
                { n: "02", t: "Riprogettare il welcome message", d: `Il 46,9% chiede operatore al primo turno. Un messaggio iniziale più efficace può trattenere parte di questi utenti.`, tag: "ALTA", c: "#f85149" },
                { n: "03", t: "Migliorare la pertinenza risposte", d: `Il 21% delle risposte non è pertinente. Affinare il prompt e il matching sulla KB.`, tag: "MEDIA", c: "#d29922" },
                { n: "04", t: "Monitoraggio e iterazione", d: "Tracciare settimanalmente: containment, pertinenza, KB miss per prodotto.", tag: "ONGOING", c: "#3fb950" },
              ].map((item, i) => (
                <div key={i} style={{ display: "flex", gap: "18px", padding: "16px 0", borderBottom: i < 3 ? "1px solid #21262d" : "none" }}>
                  <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "20px", fontWeight: 700, color: item.c, minWidth: "36px" }}>{item.n}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px", flexWrap: "wrap" }}>
                      <span style={{ fontSize: "13px", fontWeight: 600, color: "#e6edf3" }}>{item.t}</span>
                      <span style={{ fontSize: "9px", fontFamily: "'JetBrains Mono', monospace", fontWeight: 600, color: item.c, background: item.c + "15", padding: "3px 8px", borderRadius: "4px" }}>{item.tag}</span>
                    </div>
                    <div style={{ fontSize: "12px", color: "#8b949e", lineHeight: 1.6 }}>{item.d}</div>
                  </div>
                </div>
              ))}
            </Card>
          </div>
        )}
      </div>

      <div style={{ textAlign: "center", padding: "0 0 24px" }}>
        <span style={{ fontSize: "9px", fontFamily: "'JetBrains Mono', monospace", color: "#21262d", letterSpacing: "1.5px" }}>DIMO · EURONICS · VOICEBOT ANALYTICS · 17 FEB – 13 MAR 2026</span>
      </div>
    </div>
  );
}
