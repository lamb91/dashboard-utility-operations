import { useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend, CartesianGrid } from "recharts";

// ── DATA ──
const T = 21599, days = 25;
const gA = { resolved: 1898, closed: 4121, get total() { return this.resolved + this.closed; } };
const gB = { immediate: 10136, postReply: 2938, kbMiss: 1333, linguistic: 899, get total() { return this.immediate + this.postReply + this.kbMiss + this.linguistic; } };
const abandoned = 274;
const botReplied = 8679, botNoReply = 12919;
const pertinent = 6895, notPertinent = 1844;
const totalKbMiss = 3717;
const recoverable = 4271;
const dailyVol = Math.round(T / days), dailyManaged = Math.round(gA.total / days);
const savedH = ((dailyManaged * 3.5) / 60).toFixed(1);
const fte = ((dailyManaged * 3.5) / 60 / 8).toFixed(1);
const userChoice = gB.immediate + gB.postReply;
const systemLimit = gB.kbMiss + gB.linguistic;
const fmt = (n) => typeof n === "number" ? n.toLocaleString("it-IT") : n;
const pct = (a, b) => ((a / b) * 100).toFixed(1);

const successIntents = [
  { name: "Prezzo prodotto", managed: 322, total: 388 },
  { name: "Offerte/Promozioni", managed: 146, total: 201 },
  { name: "Disponibilità", managed: 1912, total: 2641 },
  { name: "Info prodotto", managed: 685, total: 1046 },
  { name: "Stato ordine", managed: 929, total: 1459 },
  { name: "Info pagamento", managed: 134, total: 235 },
  { name: "Info negozio", managed: 313, total: 619 },
  { name: "Consegna/Modifica", managed: 104, total: 238 },
  { name: "Assistenza tecnica", managed: 337, total: 1570 },
].map(i => ({ ...i, pct: Math.round((i.managed / i.total) * 100), transferred: i.total - i.managed })).sort((a, b) => b.pct - a.pct);

const products = [
  { name: "Lavatrice", v: 330 }, { name: "Telefono", v: 138 }, { name: "Televisore", v: 107 },
  { name: "Computer", v: 104 }, { name: "Lavastoviglie", v: 96 }, { name: "TV", v: 90 },
  { name: "Frigorifero", v: 83 }, { name: "Elettrodomestici", v: 72 }, { name: "Asciugatrice", v: 43 },
];

const operatorBreakdown = [
  { name: "Senza motivo", v: 6683, pct: 62.5 },
  { name: "Punto vendita", v: 1635, pct: 15.3 },
  { name: "Persona specifica", v: 1384, pct: 12.9 },
  { name: "Con motivo esplicito", v: 971, pct: 9.1 },
];

const abandonDetail = [
  { name: "Conversazione vuota", v: 141 },
  { name: "Saluto senza richiesta", v: 103 },
  { name: "Interruzione precoce", v: 23 },
  { name: "Silenzio", v: 6 },
];

const CT = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "#161b22", border: "1px solid #30363d", borderRadius: "8px", padding: "10px 14px", fontSize: "12px", fontFamily: "'JetBrains Mono', monospace" }}>
      <div style={{ color: "#8b949e", marginBottom: "4px" }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.fill || p.color || "#c9d1d9" }}>
          {p.name}: {typeof p.value === "number" ? fmt(p.value) : p.value}{p.unit || ""}
        </div>
      ))}
    </div>
  );
};

function Card({ children, style }) {
  return <div style={{ background: "#0d1117", border: "1px solid #21262d", borderRadius: "12px", padding: "22px", ...style }}>{children}</div>;
}
function Num({ value, label, sub, color = "#58a6ff" }) {
  return (
    <Card>
      <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "28px", fontWeight: 700, color, lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: "12px", fontWeight: 600, color: "#c9d1d9", marginTop: "8px" }}>{label}</div>
      {sub && <div style={{ fontSize: "11px", color: "#484f58", marginTop: "4px", lineHeight: 1.4 }}>{sub}</div>}
    </Card>
  );
}
function Insight({ color = "#58a6ff", children }) {
  return <div style={{ padding: "16px 18px", background: color + "0a", borderRadius: "10px", borderLeft: `3px solid ${color}`, fontSize: "13px", color: "#8b949e", lineHeight: 1.65 }}>{children}</div>;
}
function Stitle({ children, sub }) {
  return (
    <div style={{ marginBottom: "16px" }}>
      <h2 style={{ fontSize: "18px", fontWeight: 700, color: "#e6edf3", margin: 0 }}>{children}</h2>
      {sub && <p style={{ fontSize: "12px", color: "#484f58", margin: "4px 0 0" }}>{sub}</p>}
    </div>
  );
}

const tabs = [
  { id: "quadro", label: "1. Quadro" },
  { id: "qualita", label: "2. Qualità risposte" },
  { id: "gestite", label: "3. Dove eccelle" },
  { id: "trasferite", label: "4. Trasferimenti" },
  { id: "domanda", label: "5. Prossimi passi" },
];

export default function App() {
  const [tab, setTab] = useState("quadro");

  return (
    <div style={{ minHeight: "100vh", background: "#010409", color: "#c9d1d9", fontFamily: "'IBM Plex Sans', system-ui, sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;700&display=swap" rel="stylesheet" />

      {/* HEADER */}
      <div style={{ background: "#0d1117", borderBottom: "1px solid #21262d", padding: "32px 20px 24px" }}>
        <div style={{ maxWidth: "980px", margin: "0 auto" }}>
          <div style={{ display: "flex", gap: "8px", marginBottom: "10px", flexWrap: "wrap" }}>
            {["DIMO · EURONICS", "17 FEB – 13 MAR 2026", "25 GIORNI", `${fmt(T)} CONVERSAZIONI`].map((t, i) => (
              <span key={i} style={{ fontSize: "10px", fontFamily: "'JetBrains Mono', monospace", color: i === 0 ? "#58a6ff" : "#484f58", background: i === 0 ? "#58a6ff12" : "#161b22", padding: "3px 8px", borderRadius: "4px", letterSpacing: "1.5px" }}>{t}</span>
            ))}
          </div>
          <h1 style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "clamp(18px, 3.5vw, 26px)", fontWeight: 700, margin: 0, color: "#e6edf3", lineHeight: 1.3 }}>
            Analisi comportamento Voicebot
          </h1>
          <p style={{ fontSize: "13px", color: "#484f58", margin: "6px 0 0", maxWidth: "700px", lineHeight: 1.5 }}>
            Il bot risponde in modo pertinente nel <strong style={{ color: "#3fb950" }}>79,4%</strong> dei casi. Il <strong style={{ color: "#58a6ff" }}>72%</strong> delle richieste su disponibilità prodotto viene gestito senza operatore. Ci sono <strong style={{ color: "#d29922" }}>{fmt(recoverable)}</strong> conversazioni recuperabili.
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

        {/* ═══ 1. QUADRO ═══ */}
        {tab === "quadro" && (
          <div>
            <Stitle sub="Divisione principale delle conversazioni">Quadro generale</Stitle>

            <Card style={{ marginBottom: "16px" }}>
              <div style={{ fontSize: "13px", fontWeight: 600, marginBottom: "16px" }}>Distribuzione delle {fmt(T)} conversazioni</div>
              <ResponsiveContainer width="100%" height={80}>
                <BarChart data={[{ a: gA.total, b: gB.total, c: abandoned }]} layout="vertical" margin={{ left: 0, right: 0 }}>
                  <XAxis type="number" hide />
                  <YAxis type="category" hide />
                  <Tooltip content={<CT />} />
                  <Bar dataKey="a" name="Gestite dal bot" stackId="s" fill="#58a6ff" barSize={36} />
                  <Bar dataKey="b" name="Trasferite" stackId="s" fill="#30363d" barSize={36} />
                  <Bar dataKey="c" name="Abbandono" stackId="s" fill="#161b22" barSize={36} />
                </BarChart>
              </ResponsiveContainer>
              <div style={{ display: "flex", gap: "20px", marginTop: "10px", flexWrap: "wrap" }}>
                {[
                  { c: "#58a6ff", l: `Gestite dal bot: ${fmt(gA.total)} (${pct(gA.total, T)}%)` },
                  { c: "#30363d", l: `Trasferite: ${fmt(gB.total)} (${pct(gB.total, T)}%)` },
                  { c: "#161b22", l: `Abbandono: ${fmt(abandoned)} (${pct(abandoned, T)}%)` },
                ].map((l, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <div style={{ width: 10, height: 10, borderRadius: "50%", background: l.c, border: "1px solid #21262d" }} />
                    <span style={{ fontSize: "12px", color: "#8b949e" }}>{l.l}</span>
                  </div>
                ))}
              </div>
            </Card>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "16px" }}>
              <Card style={{ borderTop: "3px solid #58a6ff" }}>
                <div style={{ fontSize: "10px", fontFamily: "'JetBrains Mono', monospace", color: "#58a6ff", letterSpacing: "1.5px", marginBottom: "12px" }}>GRUPPO A — GESTITE DAL BOT</div>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "32px", fontWeight: 700, color: "#58a6ff" }}>{fmt(gA.total)}</div>
                <div style={{ fontSize: "12px", color: "#8b949e", marginTop: "8px", lineHeight: 1.5 }}>Conversazioni gestite <strong style={{ color: "#c9d1d9" }}>senza trasferimento</strong></div>
                <div style={{ marginTop: "12px", display: "flex", flexDirection: "column", gap: "6px" }}>
                  {[
                    { l: "Risolte completamente", v: fmt(gA.resolved), c: "#3fb950" },
                    { l: "Chiuse dall'utente dopo interazione", v: fmt(gA.closed), c: "#58a6ff" },
                  ].map((r, i) => (
                    <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: "12px" }}>
                      <span style={{ color: "#484f58" }}>{r.l}</span>
                      <span style={{ fontFamily: "'JetBrains Mono', monospace", color: r.c }}>{r.v}</span>
                    </div>
                  ))}
                </div>
              </Card>

              <Card style={{ borderTop: "3px solid #484f58" }}>
                <div style={{ fontSize: "10px", fontFamily: "'JetBrains Mono', monospace", color: "#484f58", letterSpacing: "1.5px", marginBottom: "12px" }}>GRUPPO B — TRASFERITE</div>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "32px", fontWeight: 700, color: "#8b949e" }}>{fmt(gB.total)}</div>
                <div style={{ fontSize: "12px", color: "#8b949e", marginTop: "8px", lineHeight: 1.5 }}>
                  <strong style={{ color: "#c9d1d9" }}>Non tutte indicano un errore.</strong> L'85,4% è una scelta dell'utente.
                </div>
                <div style={{ marginTop: "12px", display: "flex", flexDirection: "column", gap: "6px" }}>
                  {[
                    { l: "Richiesta immediata (1° turno)", v: fmt(gB.immediate), c: "#8b949e" },
                    { l: "Scelta utente dopo risposta bot", v: fmt(gB.postReply), c: "#d29922" },
                    { l: "Info mancante in KB", v: fmt(gB.kbMiss), c: "#f85149" },
                    { l: "Incomprensioni linguistiche", v: fmt(gB.linguistic), c: "#f85149" },
                  ].map((r, i) => (
                    <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: "12px" }}>
                      <span style={{ color: "#484f58" }}>{r.l}</span>
                      <span style={{ fontFamily: "'JetBrains Mono', monospace", color: r.c }}>{r.v}</span>
                    </div>
                  ))}
                </div>
              </Card>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "10px", marginBottom: "16px" }}>
              <Num value={fmt(dailyVol)} label="Chiamate/giorno" sub="Media su 25 giorni" color="#8b949e" />
              <Num value={fmt(dailyManaged)} label="Gestite/giorno dal bot" sub="Senza operatore" color="#58a6ff" />
              <Num value={`${savedH}h`} label="Ore risparmiate/giorno" sub={`≈ ${fte} FTE`} color="#3fb950" />
              <Num value={`${pct(abandoned, T)}%`} label="Tasso abbandono" sub={`${fmt(abandoned)} conversazioni`} color="#484f58" />
            </div>

            <Insight color="#58a6ff">
              <strong style={{ color: "#58a6ff" }}>Il dato chiave:</strong> dell'{pct(gB.total, T)}% trasferito, solo il <strong style={{ color: "#f85149" }}>{pct(systemLimit, gB.total)}%</strong> ({fmt(systemLimit)} conversazioni) è dovuto a limiti del sistema. L'85,4% è una scelta dell'utente — richiesta diretta di operatore o preferenza umana dopo aver ricevuto risposta.
            </Insight>
          </div>
        )}

        {/* ═══ 2. QUALITA RISPOSTE ═══ */}
        {tab === "qualita" && (
          <div>
            <Stitle sub="Quando il bot risponde, risponde bene?">Qualità delle risposte del bot</Stitle>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "16px" }}>
              <Card>
                <div style={{ fontSize: "13px", fontWeight: 600, marginBottom: "14px" }}>Il bot ha risposto?</div>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={[{ name: "Sì, ha risposto", value: botReplied, color: "#58a6ff" }, { name: "No, non ha potuto", value: botNoReply, color: "#21262d" }]} cx="50%" cy="50%" innerRadius={45} outerRadius={80} dataKey="value" stroke="#010409" strokeWidth={2}>
                      <Cell fill="#58a6ff" /><Cell fill="#21262d" />
                    </Pie>
                    <Tooltip content={<CT />} />
                    <Legend iconType="circle" iconSize={8} formatter={(v) => <span style={{ color: "#8b949e", fontSize: "11px" }}>{v}</span>} />
                  </PieChart>
                </ResponsiveContainer>
                <div style={{ textAlign: "center", marginTop: "4px" }}>
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "20px", fontWeight: 700, color: "#58a6ff" }}>40,2%</span>
                  <span style={{ fontSize: "12px", color: "#484f58", marginLeft: "8px" }}>ha ricevuto risposta</span>
                </div>
              </Card>
              <Card>
                <div style={{ fontSize: "13px", fontWeight: 600, marginBottom: "14px" }}>La risposta era pertinente?</div>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={[{ name: "Pertinente", value: pertinent }, { name: "Non pertinente", value: notPertinent }]} cx="50%" cy="50%" innerRadius={45} outerRadius={80} dataKey="value" stroke="#010409" strokeWidth={2}>
                      <Cell fill="#3fb950" /><Cell fill="#f85149" />
                    </Pie>
                    <Tooltip content={<CT />} />
                    <Legend iconType="circle" iconSize={8} formatter={(v) => <span style={{ color: "#8b949e", fontSize: "11px" }}>{v}</span>} />
                  </PieChart>
                </ResponsiveContainer>
                <div style={{ textAlign: "center", marginTop: "4px" }}>
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "20px", fontWeight: 700, color: "#3fb950" }}>79,4%</span>
                  <span style={{ fontSize: "12px", color: "#484f58", marginLeft: "8px" }}>pertinente</span>
                </div>
              </Card>
            </div>

            <Card style={{ marginBottom: "16px" }}>
              <div style={{ fontSize: "13px", fontWeight: 600, marginBottom: "14px" }}>Cosa succede quando il bot risponde ({fmt(botReplied)} casi)</div>
              <ResponsiveContainer width="100%" height={70}>
                <BarChart data={[{ risolte: gA.resolved, chiuse: gA.closed, trasf: gB.postReply }]} layout="vertical" margin={{ left: 0, right: 0 }}>
                  <XAxis type="number" hide /><YAxis type="category" hide />
                  <Tooltip content={<CT />} />
                  <Bar dataKey="risolte" name="Risolte completamente" stackId="s" fill="#3fb950" barSize={28} />
                  <Bar dataKey="chiuse" name="Chiuse dall'utente" stackId="s" fill="#58a6ff" barSize={28} />
                  <Bar dataKey="trasf" name="Utente sceglie operatore" stackId="s" fill="#d29922" barSize={28} />
                </BarChart>
              </ResponsiveContainer>
              <div style={{ display: "flex", gap: "16px", marginTop: "10px", flexWrap: "wrap" }}>
                {[
                  { c: "#3fb950", l: `Risolte: ${fmt(gA.resolved)} (${pct(gA.resolved, botReplied)}%)` },
                  { c: "#58a6ff", l: `Chiuse utente: ${fmt(gA.closed)} (${pct(gA.closed, botReplied)}%)` },
                  { c: "#d29922", l: `Scelta operatore: ${fmt(gB.postReply)} (${pct(gB.postReply, botReplied)}%)` },
                ].map((l, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: l.c }} />
                    <span style={{ fontSize: "11px", color: "#8b949e" }}>{l.l}</span>
                  </div>
                ))}
              </div>
            </Card>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "10px", marginBottom: "16px" }}>
              <Num value={fmt(totalKbMiss)} label="Lacune KB totali" sub="Domande capite ma senza risposta" color="#d29922" />
              <Num value={fmt(gB.linguistic)} label="Incomprensioni linguistiche" sub={`${pct(gB.linguistic, T)}% del totale`} color="#f85149" />
              <Num value={fmt(recoverable)} label="Conversazioni recuperabili" sub="KB miss + post risposta bot" color="#58a6ff" />
            </div>

            <Insight color="#3fb950">
              <strong style={{ color: "#3fb950" }}>Il bot risponde bene quando può rispondere.</strong> Il 79,4% delle risposte è pertinente. Il problema principale non è la qualità delle risposte ma il volume di utenti che chiedono l'operatore senza interagire (46,9%) e le lacune nella knowledge base ({fmt(totalKbMiss)} casi).
            </Insight>
          </div>
        )}

        {/* ═══ 3. DOVE ECCELLE ═══ */}
        {tab === "gestite" && (
          <div>
            <Stitle sub="Su quali argomenti il bot gestisce meglio le richieste">Tasso di gestione autonoma per argomento</Stitle>

            <Card style={{ marginBottom: "16px" }}>
              <div style={{ fontSize: "11px", color: "#484f58", marginBottom: "16px" }}>Verde = gestite dal bot · Grigio = trasferite a operatore</div>
              <ResponsiveContainer width="100%" height={360}>
                <BarChart data={successIntents} layout="vertical" margin={{ left: 10, right: 16 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#21262d" horizontal={false} />
                  <XAxis type="number" domain={[0, 100]} tick={{ fill: "#484f58", fontSize: 11 }} axisLine={false} tickLine={false} unit="%" />
                  <YAxis type="category" dataKey="name" tick={{ fill: "#8b949e", fontSize: 11 }} width={130} axisLine={false} tickLine={false} />
                  <Tooltip content={<CT />} />
                  <Bar dataKey="pct" name="Gestite dal bot" fill="#3fb950" radius={[0, 4, 4, 0]} barSize={20} unit="%" />
                </BarChart>
              </ResponsiveContainer>
            </Card>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "10px", marginBottom: "16px" }}>
              <Num value="83%" label="Prezzo prodotto" sub={`${fmt(322)} su ${fmt(388)} gestite`} color="#3fb950" />
              <Num value="73%" label="Offerte/Promozioni" sub={`${fmt(146)} su ${fmt(201)} gestite`} color="#3fb950" />
              <Num value="72%" label="Disponibilità" sub={`${fmt(1912)} su ${fmt(2641)} gestite`} color="#3fb950" />
            </div>

            <Card style={{ marginBottom: "16px" }}>
              <div style={{ fontSize: "13px", fontWeight: 600, marginBottom: "14px" }}>Volume gestito vs trasferito per argomento</div>
              <ResponsiveContainer width="100%" height={360}>
                <BarChart data={successIntents} layout="vertical" margin={{ left: 10, right: 16 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#21262d" horizontal={false} />
                  <XAxis type="number" tick={{ fill: "#484f58", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="name" tick={{ fill: "#8b949e", fontSize: 11 }} width={130} axisLine={false} tickLine={false} />
                  <Tooltip content={<CT />} />
                  <Bar dataKey="managed" name="Gestite dal bot" stackId="a" fill="#3fb950" barSize={18} />
                  <Bar dataKey="transferred" name="Trasferite" stackId="a" fill="#21262d" barSize={18} />
                  <Legend iconType="circle" iconSize={8} formatter={(v) => <span style={{ color: "#8b949e", fontSize: "11px" }}>{v}</span>} />
                </BarChart>
              </ResponsiveContainer>
            </Card>

            <Insight color="#3fb950">
              <strong style={{ color: "#3fb950" }}>Il bot eccelle sugli argomenti transazionali.</strong> Prezzo (83%), offerte (73%), disponibilità (72%), info prodotto (65%), stato ordine (64%). Questi sono gli argomenti dove il bot dimostra di funzionare efficacemente e di dare valore reale al servizio.
            </Insight>
          </div>
        )}

        {/* ═══ 4. TRASFERIMENTI ═══ */}
        {tab === "trasferite" && (
          <div>
            <Stitle sub="Distinguiamo: scelta dell'utente vs limite del sistema">Analisi dei {fmt(gB.total)} trasferimenti</Stitle>

            {/* 3 blocks */}
            {[
              { label: "COMPORTAMENTO UTENTE", title: "Richiesta operatore al primo turno", desc: `L'utente chiede l'operatore senza dare al bot la possibilità di rispondere.`, val: gB.immediate, pctV: pct(gB.immediate, gB.total), col: "#484f58", tag: "46,9% del totale conversazioni" },
              { label: "SCELTA UTENTE", title: "Bot ha risposto, utente sceglie operatore", desc: `Il bot ha fornito informazioni pertinenti, ma l'utente preferisce comunque l'operatore.`, val: gB.postReply, pctV: pct(gB.postReply, gB.total), col: "#d29922", tag: "Non è un errore del bot" },
              { label: "LIMITE DEL SISTEMA", title: "Bot non ha saputo rispondere", desc: `KB miss (${fmt(gB.kbMiss)}) + incomprensioni linguistiche (${fmt(gB.linguistic)}). Questi sono i casi su cui intervenire.`, val: systemLimit, pctV: pct(systemLimit, gB.total), col: "#f85149", tag: "Area di miglioramento" },
            ].map((item, i) => (
              <Card key={i} style={{ marginBottom: "12px", borderLeft: `4px solid ${item.col}` }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "12px" }}>
                  <div style={{ flex: 1, minWidth: "260px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
                      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "10px", color: item.col, background: item.col + "15", padding: "3px 8px", borderRadius: "4px", letterSpacing: "0.5px" }}>{item.label}</span>
                      <span style={{ fontSize: "10px", color: "#484f58" }}>{item.tag}</span>
                    </div>
                    <div style={{ fontSize: "15px", fontWeight: 700, color: "#e6edf3", marginBottom: "6px" }}>{item.title}</div>
                    <div style={{ fontSize: "12px", color: "#8b949e", lineHeight: 1.6 }}>{item.desc}</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "28px", fontWeight: 700, color: item.col }}>{fmt(item.val)}</div>
                    <div style={{ fontSize: "11px", color: "#484f58" }}>{item.pctV}% dei trasferimenti</div>
                  </div>
                </div>
              </Card>
            ))}

            <Card style={{ marginBottom: "16px" }}>
              <div style={{ fontSize: "13px", fontWeight: 600, marginBottom: "14px" }}>Richieste operatore: perché lo chiedono ({fmt(operatorBreakdown.reduce((s, x) => s + x.v, 0))} totali)</div>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={operatorBreakdown} layout="vertical" margin={{ left: 10, right: 16 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#21262d" horizontal={false} />
                  <XAxis type="number" tick={{ fill: "#484f58", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="name" tick={{ fill: "#8b949e", fontSize: 11 }} width={120} axisLine={false} tickLine={false} />
                  <Tooltip content={<CT />} />
                  <Bar dataKey="v" name="Richieste" fill="#484f58" radius={[0, 4, 4, 0]} barSize={16} />
                </BarChart>
              </ResponsiveContainer>
            </Card>

            <Card style={{ marginBottom: "16px" }}>
              <div style={{ fontSize: "13px", fontWeight: 600, marginBottom: "14px" }}>Prodotti più menzionati nei trasferimenti</div>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={products} layout="vertical" margin={{ left: 10, right: 16 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#21262d" horizontal={false} />
                  <XAxis type="number" tick={{ fill: "#484f58", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="name" tick={{ fill: "#8b949e", fontSize: 11 }} width={110} axisLine={false} tickLine={false} />
                  <Tooltip content={<CT />} />
                  <Bar dataKey="v" name="Menzioni" fill="#d29922" radius={[0, 4, 4, 0]} barSize={16}>
                    {products.map((_, i) => <Cell key={i} fill={i < 3 ? "#d29922" : "#484f58"} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Card>

            <Insight color="#f85149">
              <strong style={{ color: "#f85149" }}>Solo il 14,6% dei trasferimenti è un limite reale del sistema</strong> ({fmt(systemLimit)} su {fmt(gB.total)}). L'85,4% è una scelta dell'utente. Il dato "70,9% trasferito" non significa "70,9% di errori" — la maggioranza degli utenti vuole parlare con un umano indipendentemente dalla qualità del bot.
            </Insight>
          </div>
        )}

        {/* ═══ 5. PROSSIMI PASSI ═══ */}
        {tab === "domanda" && (
          <div>
            <Stitle sub="Il bot funziona. Definiamo insieme come gestire i casi specifici.">Prossimi passi</Stitle>

            <Card style={{ marginBottom: "20px", borderTop: "3px solid #58a6ff" }}>
              <div style={{ fontSize: "13px", fontWeight: 600, color: "#58a6ff", marginBottom: "12px" }}>Sintesi dei risultati</div>
              {[
                { icon: "✅", text: `Il bot gestisce ${fmt(gA.total)} conversazioni (${pct(gA.total, T)}%) senza operatore.` },
                { icon: "✅", text: "Quando risponde, lo fa in modo pertinente nel 79,4% dei casi." },
                { icon: "✅", text: "Eccelle su prezzo (83%), offerte (73%), disponibilità (72%), info prodotto (65%)." },
                { icon: "✅", text: `Solo ${fmt(systemLimit)} trasferimenti (${pct(systemLimit, T)}%) sono dovuti a limiti reali del sistema.` },
                { icon: "⚠️", text: `${fmt(totalKbMiss)} lacune KB e ${fmt(gB.linguistic)} incomprensioni: le aree di intervento tecnico.` },
                { icon: "📊", text: `${fmt(recoverable)} conversazioni recuperabili con ottimizzazione mirata.` },
              ].map((r, i) => (
                <div key={i} style={{ display: "flex", gap: "10px", alignItems: "flex-start", marginBottom: "8px" }}>
                  <span style={{ fontSize: "16px", lineHeight: 1.3 }}>{r.icon}</span>
                  <span style={{ fontSize: "13px", color: "#c9d1d9", lineHeight: 1.5 }}>{r.text}</span>
                </div>
              ))}
            </Card>

            <div style={{ background: "linear-gradient(135deg, #0d1117 0%, #161b22 100%)", border: "2px solid #58a6ff40", borderRadius: "16px", padding: "32px 28px", marginBottom: "20px", textAlign: "center" }}>
              <div style={{ fontSize: "13px", fontFamily: "'JetBrains Mono', monospace", color: "#58a6ff", letterSpacing: "2px", marginBottom: "16px" }}>LA DOMANDA</div>
              <div style={{ fontSize: "clamp(18px, 3vw, 24px)", fontWeight: 700, color: "#e6edf3", lineHeight: 1.4, maxWidth: "600px", margin: "0 auto" }}>
                In queste situazioni, come volete che il bot si comporti?
              </div>
              <div style={{ fontSize: "13px", color: "#484f58", marginTop: "16px", maxWidth: "520px", margin: "16px auto 0", lineHeight: 1.6 }}>
                Il bot funziona e risponde alle richieste. Ora definiamo insieme come gestire i casi limite. È un lavoro di affinamento operativo — come si farebbe con un operatore umano.
              </div>
            </div>

            <Card style={{ marginBottom: "16px" }}>
              <div style={{ fontSize: "13px", fontWeight: 600, marginBottom: "16px", color: "#e6edf3" }}>Scenari da discutere</div>
              {[
                { n: "A", q: `L'utente chiede subito l'operatore (${fmt(gB.immediate)} casi, ${pct(gB.immediate, T)}%)`, options: "Trasferire immediatamente? Proporre prima cosa può fare il bot? Chiedere il motivo della chiamata?", c: "#484f58" },
                { n: "B", q: `Il bot ha risposto ma l'utente vuole comunque l'operatore (${fmt(gB.postReply)} casi)`, options: "Trasferire? Proporre prenotazione di richiamata? Chiedere se c'è altro che serve?", c: "#d29922" },
                { n: "C", q: `Il bot non ha l'informazione nella KB (${fmt(gB.kbMiss)} casi)`, options: "Trasferire? Dire che l'info non è disponibile e suggerire il sito? Proporre contatto email?", c: "#f85149" },
                { n: "D", q: `Incomprensioni linguistiche (${fmt(gB.linguistic)} casi)`, options: "Quanti tentativi prima di trasferire? Proporre di riformulare? Offrire alternative (email, sito)?", c: "#f85149" },
              ].map((s, i) => (
                <div key={i} style={{ display: "flex", gap: "16px", padding: "16px 0", borderBottom: i < 3 ? "1px solid #21262d" : "none", alignItems: "flex-start" }}>
                  <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "18px", fontWeight: 700, color: s.c, minWidth: "32px" }}>{s.n}</div>
                  <div>
                    <div style={{ fontSize: "13px", fontWeight: 600, color: "#e6edf3", marginBottom: "4px" }}>{s.q}</div>
                    <div style={{ fontSize: "12px", color: "#8b949e", lineHeight: 1.6, fontStyle: "italic" }}>{s.options}</div>
                  </div>
                </div>
              ))}
            </Card>

            <Card>
              <div style={{ fontSize: "13px", fontWeight: 600, marginBottom: "16px", color: "#e6edf3" }}>Piano di intervento tecnico</div>
              {[
                { n: "01", t: "Arricchire KB prodotti prioritari", d: `Lavatrice (330), telefono (138), televisore (107), computer (104): ${fmt(totalKbMiss)} lacune KB sono direttamente colmabili.`, tag: "ALTA", c: "#f85149" },
                { n: "02", t: "Ridisegnare il welcome message", d: `Il 46,9% chiede operatore al primo turno. Comunicare subito le capacità del bot per trattenere più utenti.`, tag: "ALTA", c: "#f85149" },
                { n: "03", t: "Migliorare risposte non pertinenti", d: `Il 21,2% delle risposte non è pertinente (${fmt(notPertinent)} casi). Affinare il prompt per migliorare la precisione.`, tag: "MEDIA", c: "#d29922" },
                { n: "04", t: "Monitoraggio settimanale", d: "Tracciare pertinenza risposte, KB miss per prodotto, e containment rate per intent.", tag: "ONGOING", c: "#3fb950" },
              ].map((item, i) => (
                <div key={i} style={{ display: "flex", gap: "18px", padding: "16px 0", borderBottom: i < 3 ? "1px solid #21262d" : "none", alignItems: "flex-start" }}>
                  <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "20px", fontWeight: 700, color: item.c, minWidth: "36px" }}>{item.n}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap", marginBottom: "4px" }}>
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
