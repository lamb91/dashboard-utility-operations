import { useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend, CartesianGrid } from "recharts";

// ── DATA ──
const T = 21987, days = 25;
const groupA = { resolved: 2511, closed: 7604, get total() { return this.resolved + this.closed; } };
const groupB = { immediate: 10884, voluntary: 393, kbMiss: 328, linguistic: 40, get total() { return this.immediate + this.voluntary + this.kbMiss + this.linguistic; } };
const abandoned = 223;
const intCalls = 10880;
const dailyVol = Math.round(T / days);
const dailyManaged = Math.round(groupA.total / days);
const fmt = (n) => typeof n === "number" ? n.toLocaleString("it-IT") : n;

// Derived
const caso1 = groupB.voluntary; // bot answered, user still wants operator
const caso2 = groupB.kbMiss + groupB.linguistic; // bot couldn't answer
const caso3 = groupB.immediate; // user wants operator without trying

const successIntents = [
  { name: "Offerte/Promozioni", managed: 88, total: 145 },
  { name: "Disponibilità prodotto", managed: 1365, total: 3250 },
  { name: "Info negozio", managed: 116, total: 422 },
  { name: "Stato ordine", managed: 319, total: 1443 },
  { name: "Prezzo prodotto", managed: 70, total: 450 },
  { name: "Assistenza tecnica", managed: 68, total: 906 },
].map(i => ({ ...i, pct: Math.round((i.managed / i.total) * 100), transferred: i.total - i.managed }));

const products = [
  { name: "Lavatrice", v: 539 }, { name: "TV/Televisore", v: 257 },
  { name: "Frigorifero", v: 247 }, { name: "Telefono", v: 213 },
  { name: "Lavastoviglie", v: 138 }, { name: "Computer", v: 99 },
];

const tagIssues = [
  { old: "Fallimento sistema", new: "Conversazione chiusa dall'utente", desc: "L'utente ha interagito, poi ha chiuso senza chiedere operatore. Non è un errore del bot.", count: 7604, impact: "Da negativo a neutro/positivo" },
  { old: "Non compreso", new: "Disaggregare in sottocategorie", desc: "Include: silenzi, fuori catalogo, interruzioni. Non sempre indica un limite del bot.", count: null, impact: "Da negativo a misto" },
  { old: "Trasferimento volontario", new: "Scelta utente post-risposta", desc: "Il bot ha risposto correttamente, l'utente preferisce comunque l'operatore.", count: 393, impact: "Da negativo a neutro" },
];

const CustomTooltip = ({ active, payload, label }) => {
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
function SectionTitle({ children, sub }) {
  return (
    <div style={{ marginBottom: "16px" }}>
      <h2 style={{ fontSize: "18px", fontWeight: 700, color: "#e6edf3", margin: 0, fontFamily: "'IBM Plex Sans', sans-serif" }}>{children}</h2>
      {sub && <p style={{ fontSize: "12px", color: "#484f58", margin: "4px 0 0" }}>{sub}</p>}
    </div>
  );
}

const tabs = [
  { id: "quadro", label: "1. Quadro generale" },
  { id: "gestite", label: "2. Gestite dal bot" },
  { id: "trasferite", label: "3. Trasferite" },
  { id: "tag", label: "4. Riclassificazione" },
  { id: "domanda", label: "5. Domanda al cliente" },
];

export default function App() {
  const [tab, setTab] = useState("quadro");

  return (
    <div style={{ minHeight: "100vh", background: "#010409", color: "#c9d1d9", fontFamily: "'IBM Plex Sans', system-ui, sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;700&display=swap" rel="stylesheet" />

      {/* HEADER */}
      <div style={{ background: "#0d1117", borderBottom: "1px solid #21262d", padding: "32px 20px 24px" }}>
        <div style={{ maxWidth: "980px", margin: "0 auto" }}>
          <div style={{ display: "flex", gap: "8px", marginBottom: "10px" }}>
            {["DIMO · EURONICS", "17 FEB – 13 MAR 2026", "25 GIORNI"].map((t, i) => (
              <span key={i} style={{ fontSize: "10px", fontFamily: "'JetBrains Mono', monospace", color: i === 0 ? "#58a6ff" : "#484f58", background: i === 0 ? "#58a6ff12" : "#161b22", padding: "3px 8px", borderRadius: "4px", letterSpacing: "1.5px" }}>{t}</span>
            ))}
          </div>
          <h1 style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "clamp(20px, 3.5vw, 28px)", fontWeight: 700, margin: 0, color: "#e6edf3", lineHeight: 1.3 }}>
            Analisi comportamento Voicebot
          </h1>
          <p style={{ fontSize: "14px", color: "#484f58", margin: "6px 0 0", maxWidth: "700px", lineHeight: 1.5 }}>
            {fmt(T)} conversazioni analizzate. L'obiettivo non è solo mostrare i dati, ma guidare la lettura dei risultati e definire insieme i prossimi passi.
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
              transition: "all 0.2s", whiteSpace: "nowrap", minWidth: 0,
            }}>{t.label}</button>
          ))}
        </div>
      </div>

      <div style={{ maxWidth: "980px", margin: "24px auto 0", padding: "0 16px 48px" }}>

        {/* ═══ 1. QUADRO GENERALE ═══ */}
        {tab === "quadro" && (
          <div>
            <SectionTitle sub="Divisione principale delle conversazioni in due gruppi">Quadro generale: {fmt(T)} conversazioni</SectionTitle>

            {/* Main split visualization */}
            <Card style={{ marginBottom: "16px" }}>
              <div style={{ fontSize: "13px", fontWeight: 600, marginBottom: "16px" }}>Come si distribuiscono le conversazioni</div>
              <ResponsiveContainer width="100%" height={100}>
                <BarChart data={[{ a: groupA.total, b: groupB.total, c: abandoned }]} layout="vertical" margin={{ left: 0, right: 0 }}>
                  <XAxis type="number" hide />
                  <YAxis type="category" hide />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="a" name="A. Gestite dal bot" stackId="s" fill="#58a6ff" barSize={40} />
                  <Bar dataKey="b" name="B. Con trasferimento" stackId="s" fill="#30363d" barSize={40} />
                  <Bar dataKey="c" name="Abbandono" stackId="s" fill="#161b22" barSize={40} />
                </BarChart>
              </ResponsiveContainer>
              <div style={{ display: "flex", gap: "24px", marginTop: "12px", flexWrap: "wrap" }}>
                {[
                  { color: "#58a6ff", label: `A. Gestite dal bot: ${fmt(groupA.total)} (${((groupA.total/T)*100).toFixed(1)}%)` },
                  { color: "#30363d", label: `B. Con trasferimento: ${fmt(groupB.total)} (${((groupB.total/T)*100).toFixed(1)}%)` },
                  { color: "#161b22", label: `Abbandono: ${fmt(abandoned)} (${((abandoned/T)*100).toFixed(1)}%)` },
                ].map((l, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <div style={{ width: 10, height: 10, borderRadius: "50%", background: l.color, border: "1px solid #21262d" }} />
                    <span style={{ fontSize: "12px", color: "#8b949e" }}>{l.label}</span>
                  </div>
                ))}
              </div>
            </Card>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "16px" }}>
              {/* Gruppo A */}
              <Card style={{ borderTop: "3px solid #58a6ff" }}>
                <div style={{ fontSize: "10px", fontFamily: "'JetBrains Mono', monospace", color: "#58a6ff", letterSpacing: "1.5px", marginBottom: "12px" }}>GRUPPO A — GESTITE DAL BOT</div>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "32px", fontWeight: 700, color: "#58a6ff" }}>{fmt(groupA.total)}</div>
                <div style={{ fontSize: "12px", color: "#8b949e", marginTop: "8px", lineHeight: 1.5 }}>
                  Il voicebot ha gestito queste conversazioni <strong style={{ color: "#c9d1d9" }}>senza trasferire a un operatore</strong>.
                </div>
                <div style={{ marginTop: "12px", display: "flex", flexDirection: "column", gap: "6px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px" }}>
                    <span style={{ color: "#484f58" }}>Risolte completamente</span>
                    <span style={{ fontFamily: "'JetBrains Mono', monospace", color: "#3fb950" }}>{fmt(groupA.resolved)}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px" }}>
                    <span style={{ color: "#484f58" }}>Chiuse dall'utente dopo interazione</span>
                    <span style={{ fontFamily: "'JetBrains Mono', monospace", color: "#58a6ff" }}>{fmt(groupA.closed)}</span>
                  </div>
                </div>
              </Card>

              {/* Gruppo B */}
              <Card style={{ borderTop: "3px solid #484f58" }}>
                <div style={{ fontSize: "10px", fontFamily: "'JetBrains Mono', monospace", color: "#484f58", letterSpacing: "1.5px", marginBottom: "12px" }}>GRUPPO B — CON TRASFERIMENTO</div>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "32px", fontWeight: 700, color: "#8b949e" }}>{fmt(groupB.total)}</div>
                <div style={{ fontSize: "12px", color: "#8b949e", marginTop: "8px", lineHeight: 1.5 }}>
                  Conversazioni in cui l'utente è stato trasferito a un operatore. <strong style={{ color: "#c9d1d9" }}>Non tutte indicano un errore del bot.</strong>
                </div>
                <div style={{ marginTop: "12px", display: "flex", flexDirection: "column", gap: "6px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px" }}>
                    <span style={{ color: "#484f58" }}>Richiesta immediata (1° turno)</span>
                    <span style={{ fontFamily: "'JetBrains Mono', monospace", color: "#8b949e" }}>{fmt(groupB.immediate)}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px" }}>
                    <span style={{ color: "#484f58" }}>Scelta utente dopo risposta bot</span>
                    <span style={{ fontFamily: "'JetBrains Mono', monospace", color: "#d29922" }}>{fmt(groupB.voluntary)}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px" }}>
                    <span style={{ color: "#484f58" }}>Info mancante in KB</span>
                    <span style={{ fontFamily: "'JetBrains Mono', monospace", color: "#f85149" }}>{fmt(groupB.kbMiss)}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px" }}>
                    <span style={{ color: "#484f58" }}>Incomprensioni linguistiche</span>
                    <span style={{ fontFamily: "'JetBrains Mono', monospace", color: "#f85149" }}>{fmt(groupB.linguistic)}</span>
                  </div>
                </div>
              </Card>
            </div>

            <Insight color="#58a6ff">
              <strong style={{ color: "#58a6ff" }}>Lettura chiave:</strong> Il voicebot gestisce il 46% delle conversazioni in completa autonomia. Del 53% trasferito, solo il <strong style={{ color: "#f85149" }}>3,1%</strong> ({fmt(caso2)} chiamate) è dovuto a limiti reali del sistema (KB miss + incomprensioni). Il restante 97% dei trasferimenti è una scelta dell'utente, non un errore del bot.
            </Insight>
          </div>
        )}

        {/* ═══ 2. GESTITE DAL BOT ═══ */}
        {tab === "gestite" && (
          <div>
            <SectionTitle sub="Il bot funziona: ecco cosa gestisce con successo">Gruppo A: {fmt(groupA.total)} conversazioni gestite</SectionTitle>

            <Card style={{ marginBottom: "16px" }}>
              <div style={{ fontSize: "13px", fontWeight: 600, marginBottom: "4px" }}>Tasso di successo per argomento</div>
              <div style={{ fontSize: "11px", color: "#484f58", marginBottom: "16px" }}>Percentuale di richieste che il bot risolve senza operatore</div>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={successIntents} layout="vertical" margin={{ left: 10, right: 16 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#21262d" horizontal={false} />
                  <XAxis type="number" domain={[0, 100]} tick={{ fill: "#484f58", fontSize: 11 }} axisLine={false} tickLine={false} unit="%" />
                  <YAxis type="category" dataKey="name" tick={{ fill: "#8b949e", fontSize: 11 }} width={130} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="pct" name="Gestite dal bot" fill="#3fb950" radius={[0, 4, 4, 0]} barSize={18} unit="%" />
                </BarChart>
              </ResponsiveContainer>
            </Card>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "10px", marginBottom: "16px" }}>
              <Num value="61%" label="Offerte e promozioni" sub="Best performer — 88 su 145" color="#3fb950" />
              <Num value="42%" label="Disponibilità prodotto" sub="1.365 gestite su 3.250" color="#3fb950" />
              <Num value="0,18%" label="Errori linguistici" sub="40 su 21.987 — NLU eccellente" color="#3fb950" />
            </div>

            <Card style={{ marginBottom: "16px" }}>
              <div style={{ fontSize: "13px", fontWeight: 600, marginBottom: "4px" }}>Dettaglio per argomento: gestite vs trasferite</div>
              <div style={{ fontSize: "11px", color: "#484f58", marginBottom: "16px" }}>La parte verde è gestita dal bot, la grigia è trasferita</div>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={successIntents} layout="vertical" margin={{ left: 10, right: 16 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#21262d" horizontal={false} />
                  <XAxis type="number" tick={{ fill: "#484f58", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="name" tick={{ fill: "#8b949e", fontSize: 11 }} width={130} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="managed" name="Gestite dal bot" stackId="a" fill="#3fb950" barSize={18} />
                  <Bar dataKey="transferred" name="Trasferite" stackId="a" fill="#21262d" barSize={18} />
                  <Legend iconType="circle" iconSize={8} formatter={(v) => <span style={{ color: "#8b949e", fontSize: "11px" }}>{v}</span>} />
                </BarChart>
              </ResponsiveContainer>
            </Card>

            <Insight color="#3fb950">
              <strong style={{ color: "#3fb950" }}>Il bot gestisce con successo gli argomenti transazionali</strong> — offerte (61%), disponibilità (42%), info negozio (27%). La comprensione vocale è quasi perfetta: solo 40 incomprensioni su quasi 22.000 chiamate. Il sistema funziona.
            </Insight>
          </div>
        )}

        {/* ═══ 3. TRASFERITE ═══ */}
        {tab === "trasferite" && (
          <div>
            <SectionTitle sub="Non tutti i trasferimenti sono errori. Distinguiamo tre casi.">Gruppo B: {fmt(groupB.total)} conversazioni trasferite</SectionTitle>

            {/* The 3 cases */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "12px", marginBottom: "16px" }}>
              {/* Caso 3 - immediate */}
              <Card style={{ borderLeft: "4px solid #484f58" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "12px" }}>
                  <div style={{ flex: 1, minWidth: "280px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
                      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "11px", color: "#484f58", background: "#21262d", padding: "3px 8px", borderRadius: "4px" }}>COMPORTAMENTO UTENTE</span>
                    </div>
                    <div style={{ fontSize: "15px", fontWeight: 700, color: "#e6edf3", marginBottom: "6px" }}>Richiesta operatore al primo turno</div>
                    <div style={{ fontSize: "12px", color: "#8b949e", lineHeight: 1.6 }}>
                      L'utente chiede immediatamente di parlare con un operatore, <strong style={{ color: "#c9d1d9" }}>senza dare al bot la possibilità di rispondere</strong>. Non è un errore del sistema — è un comportamento dell'utente.
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "28px", fontWeight: 700, color: "#8b949e" }}>{fmt(caso3)}</div>
                    <div style={{ fontSize: "11px", color: "#484f58" }}>{((caso3 / groupB.total) * 100).toFixed(1)}% dei trasferimenti</div>
                  </div>
                </div>
              </Card>

              {/* Caso 1 - voluntary */}
              <Card style={{ borderLeft: "4px solid #d29922" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "12px" }}>
                  <div style={{ flex: 1, minWidth: "280px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
                      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "11px", color: "#d29922", background: "#d2992215", padding: "3px 8px", borderRadius: "4px" }}>SCELTA UTENTE</span>
                    </div>
                    <div style={{ fontSize: "15px", fontWeight: 700, color: "#e6edf3", marginBottom: "6px" }}>Bot ha risposto, utente sceglie operatore</div>
                    <div style={{ fontSize: "12px", color: "#8b949e", lineHeight: 1.6 }}>
                      Il bot ha fornito le informazioni richieste, ma l'utente ha comunque chiesto di parlare con un operatore. <strong style={{ color: "#c9d1d9" }}>Non è un errore del bot</strong> — il bot ha fatto il suo lavoro.
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "28px", fontWeight: 700, color: "#d29922" }}>{fmt(caso1)}</div>
                    <div style={{ fontSize: "11px", color: "#484f58" }}>{((caso1 / groupB.total) * 100).toFixed(1)}% dei trasferimenti</div>
                  </div>
                </div>
              </Card>

              {/* Caso 2 - real issues */}
              <Card style={{ borderLeft: "4px solid #f85149" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "12px" }}>
                  <div style={{ flex: 1, minWidth: "280px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
                      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "11px", color: "#f85149", background: "#f8514915", padding: "3px 8px", borderRadius: "4px" }}>LIMITE DEL SISTEMA</span>
                    </div>
                    <div style={{ fontSize: "15px", fontWeight: 700, color: "#e6edf3", marginBottom: "6px" }}>Bot non ha saputo rispondere</div>
                    <div style={{ fontSize: "12px", color: "#8b949e", lineHeight: 1.6 }}>
                      Il bot non aveva l'informazione (KB miss: {fmt(groupB.kbMiss)}) oppure non ha compreso la richiesta (linguistiche: {fmt(groupB.linguistic)}). <strong style={{ color: "#f85149" }}>Questi sono i casi su cui intervenire.</strong>
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "28px", fontWeight: 700, color: "#f85149" }}>{fmt(caso2)}</div>
                    <div style={{ fontSize: "11px", color: "#484f58" }}>{((caso2 / groupB.total) * 100).toFixed(1)}% dei trasferimenti</div>
                  </div>
                </div>
              </Card>
            </div>

            {/* Proportional visual */}
            <Card style={{ marginBottom: "16px" }}>
              <div style={{ fontSize: "13px", fontWeight: 600, marginBottom: "14px" }}>Proporzione dei tre casi</div>
              <ResponsiveContainer width="100%" height={80}>
                <BarChart data={[{ c3: caso3, c1: caso1, c2: caso2 }]} layout="vertical" margin={{ left: 0, right: 0 }}>
                  <XAxis type="number" hide />
                  <YAxis type="category" hide />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="c3" name="Comportamento utente" stackId="s" fill="#484f58" barSize={32} />
                  <Bar dataKey="c1" name="Scelta utente post-risposta" stackId="s" fill="#d29922" barSize={32} />
                  <Bar dataKey="c2" name="Limite del sistema" stackId="s" fill="#f85149" barSize={32} />
                </BarChart>
              </ResponsiveContainer>
              <div style={{ display: "flex", gap: "20px", marginTop: "10px", flexWrap: "wrap" }}>
                {[
                  { c: "#484f58", l: "Comportamento utente (93,5%)" },
                  { c: "#d29922", l: "Scelta post-risposta (3,4%)" },
                  { c: "#f85149", l: "Limite sistema (3,1%)" },
                ].map((l, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <div style={{ width: 10, height: 10, borderRadius: "50%", background: l.c }} />
                    <span style={{ fontSize: "11px", color: "#8b949e" }}>{l.l}</span>
                  </div>
                ))}
              </div>
            </Card>

            {/* Products for KB miss */}
            <Card style={{ marginBottom: "16px" }}>
              <div style={{ fontSize: "13px", fontWeight: 600, marginBottom: "4px" }}>Prodotti più menzionati nei trasferimenti per KB miss</div>
              <div style={{ fontSize: "11px", color: "#484f58", marginBottom: "16px" }}>Priorità di arricchimento per ridurre i {fmt(caso2)} errori reali</div>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={products} layout="vertical" margin={{ left: 10, right: 16 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#21262d" horizontal={false} />
                  <XAxis type="number" tick={{ fill: "#484f58", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="name" tick={{ fill: "#8b949e", fontSize: 11 }} width={100} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="v" name="Menzioni" fill="#f85149" radius={[0, 4, 4, 0]} barSize={16}>
                    {products.map((_, i) => <Cell key={i} fill={i < 3 ? "#f85149" : "#484f58"} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Card>

            <Insight color="#f85149">
              <strong style={{ color: "#f85149" }}>Solo il 3,1% dei trasferimenti è un limite reale del sistema.</strong> Il 96,9% è un comportamento dell'utente — richiesta diretta di operatore o scelta dopo aver ricevuto risposta. Il bot funziona: i margini di miglioramento tecnico esistono ma sono contenuti (328 KB miss + 40 linguistiche).
            </Insight>
          </div>
        )}

        {/* ═══ 4. RICLASSIFICAZIONE ═══ */}
        {tab === "tag" && (
          <div>
            <SectionTitle sub="Alcuni tag nei dati creano un'impressione fuorviante. Ecco la lettura corretta.">Riclassificazione dei tag</SectionTitle>

            {tagIssues.map((t, i) => (
              <Card key={i} style={{ marginBottom: "12px" }}>
                <div style={{ display: "flex", gap: "16px", alignItems: "flex-start" }}>
                  <div style={{ minWidth: "40px", textAlign: "center" }}>
                    <div style={{ width: "36px", height: "36px", borderRadius: "8px", background: "#f8514915", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto" }}>
                      <span style={{ fontSize: "16px" }}>⚠️</span>
                    </div>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px", flexWrap: "wrap" }}>
                      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "13px", color: "#f85149", textDecoration: "line-through" }}>{t.old}</span>
                      <span style={{ color: "#484f58" }}>→</span>
                      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "13px", color: "#3fb950" }}>{t.new}</span>
                    </div>
                    <div style={{ fontSize: "13px", color: "#8b949e", lineHeight: 1.6, marginBottom: "8px" }}>{t.desc}</div>
                    <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
                      {t.count && <span style={{ fontSize: "11px", fontFamily: "'JetBrains Mono', monospace", color: "#484f58" }}>{fmt(t.count)} conversazioni coinvolte</span>}
                      <span style={{ fontSize: "11px", fontFamily: "'JetBrains Mono', monospace", color: "#3fb950" }}>{t.impact}</span>
                    </div>
                  </div>
                </div>
              </Card>
            ))}

            <Insight color="#d29922" style={{ marginTop: "16px" }}>
              <strong style={{ color: "#d29922" }}>La classificazione dei tag influenza la percezione dei risultati.</strong> Rinominare "fallimento sistema" in "conversazione chiusa dall'utente" sposta 7.604 conversazioni da un'apparenza negativa a una lettura neutra/positiva. Non cambia i dati — cambia come vengono interpretati.
            </Insight>
          </div>
        )}

        {/* ═══ 5. DOMANDA ═══ */}
        {tab === "domanda" && (
          <div>
            <SectionTitle sub="Il bot funziona. Il passo successivo è definire insieme come gestire i casi specifici.">La domanda per il cliente</SectionTitle>

            <Card style={{ marginBottom: "20px", borderTop: "3px solid #58a6ff" }}>
              <div style={{ fontSize: "13px", fontWeight: 600, color: "#58a6ff", marginBottom: "12px" }}>Sintesi dei risultati</div>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {[
                  { icon: "✅", text: "Il bot gestisce correttamente il 46% delle conversazioni in completa autonomia." },
                  { icon: "✅", text: "Le incomprensioni reali sono una percentuale minima: 368 su 21.987 (1,7%)." },
                  { icon: "✅", text: "Molti trasferimenti avvengono anche quando il bot ha già risposto correttamente." },
                  { icon: "✅", text: "La comprensione vocale è eccellente: solo 40 errori linguistici (0,18%)." },
                  { icon: "📈", text: "Tutti i KPI migliorano nel tempo — il sistema si sta affinando." },
                ].map((r, i) => (
                  <div key={i} style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
                    <span style={{ fontSize: "16px", lineHeight: 1.3 }}>{r.icon}</span>
                    <span style={{ fontSize: "13px", color: "#c9d1d9", lineHeight: 1.5 }}>{r.text}</span>
                  </div>
                ))}
              </div>
            </Card>

            {/* The question */}
            <div style={{ background: "linear-gradient(135deg, #0d1117 0%, #161b22 100%)", border: "2px solid #58a6ff40", borderRadius: "16px", padding: "32px 28px", marginBottom: "20px", textAlign: "center" }}>
              <div style={{ fontSize: "13px", fontFamily: "'JetBrains Mono', monospace", color: "#58a6ff", letterSpacing: "2px", marginBottom: "16px" }}>LA DOMANDA</div>
              <div style={{ fontSize: "clamp(18px, 3vw, 24px)", fontWeight: 700, color: "#e6edf3", lineHeight: 1.4, maxWidth: "600px", margin: "0 auto" }}>
                In queste situazioni, come volete che il bot si comporti?
              </div>
              <div style={{ fontSize: "13px", color: "#484f58", marginTop: "16px", maxWidth: "500px", margin: "16px auto 0", lineHeight: 1.6 }}>
                Il bot funziona e risponde alle richieste. Il punto ora è definire insieme come deve gestire alcuni casi specifici. È un lavoro di affinamento operativo — come si farebbe con un operatore umano.
              </div>
            </div>

            <Card style={{ marginBottom: "16px" }}>
              <div style={{ fontSize: "13px", fontWeight: 600, marginBottom: "16px", color: "#e6edf3" }}>Scenari da discutere insieme</div>
              {[
                { n: "A", q: "L'utente chiede subito l'operatore (49,5% delle chiamate)", options: "Trasferire immediatamente? Proporre prima cosa può fare il bot? Chiedere il motivo?", c: "#484f58" },
                { n: "B", q: "Il bot ha risposto ma l'utente vuole comunque l'operatore", options: "Trasferire? Proporre prenotazione di richiamata? Chiedere se c'è altro che serve?", c: "#d29922" },
                { n: "C", q: "Il bot non ha l'informazione nella KB", options: "Trasferire? Dire che l'info non è disponibile e suggerire il sito? Proporre email?", c: "#f85149" },
              ].map((s, i) => (
                <div key={i} style={{ display: "flex", gap: "16px", padding: "16px 0", borderBottom: i < 2 ? "1px solid #21262d" : "none", alignItems: "flex-start" }}>
                  <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "18px", fontWeight: 700, color: s.c, minWidth: "32px" }}>{s.n}</div>
                  <div>
                    <div style={{ fontSize: "14px", fontWeight: 600, color: "#e6edf3", marginBottom: "4px" }}>{s.q}</div>
                    <div style={{ fontSize: "12px", color: "#8b949e", lineHeight: 1.6, fontStyle: "italic" }}>{s.options}</div>
                  </div>
                </div>
              ))}
            </Card>

            <Insight color="#58a6ff">
              <strong style={{ color: "#58a6ff" }}>Il prossimo passo è decidere insieme.</strong> Ogni scelta che il cliente fa su questi scenari diventa una regola operativa nel prompt del voicebot. È esattamente come formare un nuovo operatore: il sistema è pronto, serve solo definire le procedure.
            </Insight>
          </div>
        )}
      </div>

      <div style={{ textAlign: "center", padding: "0 0 24px" }}>
        <span style={{ fontSize: "9px", fontFamily: "'JetBrains Mono', monospace", color: "#21262d", letterSpacing: "1.5px" }}>DIMO · EURONICS · VOICEBOT ANALYTICS · 17 FEB – 13 MAR 2026</span>
      </div>
    </div>
  );
}
