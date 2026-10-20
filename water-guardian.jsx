import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Droplet, MapPin, Camera, BookOpen, Users, Trophy, Home as HomeIcon,
  AlertTriangle, CheckCircle2, ChevronRight, ChevronLeft, X, Upload,
  Waves, FlaskConical, Recycle, Factory, Fish, Trash2, Award, Target,
  ClipboardList, Activity, ShieldCheck, Info, Plus, Minus
} from "lucide-react";

/* ---------------------------------------------------------------------
   WATER GUARDIAN — field-instrument styled citizen water-monitoring app
   Design tokens:
     ink      #0B2E33  (deep teal-black, headers / dark surfaces)
     ink-2    #123A40
     paper    #EAF2F0  (cool pale-aqua background, not cream)
     card     #FFFFFF
     aqua     #1FB6A6  (primary accent — sensor glow)
     algae    #4C9A3A  (good / low severity)
     amber    #E8A33D  (attention / medium severity)
     rust     #C0392B  (poor / high severity)
     ink-soft #4A6367  (secondary text)
   Type: IBM Plex Sans Condensed (display), IBM Plex Sans (body),
         IBM Plex Mono (data / coordinates / readouts)
--------------------------------------------------------------------- */

const T = {
  ink: "#0B2E33",
  ink2: "#123A40",
  paper: "#EAF2F0",
  card: "#FFFFFF",
  aqua: "#1FB6A6",
  aquaDark: "#158577",
  algae: "#4C9A3A",
  amber: "#E8A33D",
  rust: "#C0392B",
  soft: "#4A6367",
  line: "#D3E3E0",
};

const POLLUTION_TYPES = [
  { id: "plastic", label: "Plastic", icon: Trash2 },
  { id: "sewage", label: "Sewage", icon: Droplet },
  { id: "industrial", label: "Industrial waste", icon: Factory },
  { id: "oil", label: "Oil / chemical", icon: FlaskConical },
  { id: "deadfish", label: "Dead fish", icon: Fish },
  { id: "other", label: "Other", icon: AlertTriangle },
];

const SEVERITY = {
  Low: T.algae,
  Medium: T.amber,
  High: T.rust,
};

const SOLUTIONS = [
  { type: "Plastic", icon: Trash2, actions: ["Reduce single-use plastic in daily life", "Use proper waste segregation and collection bins", "Support local plastic-collection drives", "Choose reusable bottles, bags, and containers"] },
  { type: "Sewage", icon: Droplet, actions: ["Support proper sewage treatment infrastructure", "Never dump waste directly into drains or water bodies", "Report broken sewage lines to local authorities", "Advocate for decentralized treatment in underserved areas"] },
  { type: "Industrial waste", icon: Factory, actions: ["Push for mandatory wastewater treatment before discharge", "Support stricter enforcement of discharge permits", "Report visible industrial discharge into waterways", "Back businesses with transparent environmental practices"] },
  { type: "Agricultural runoff", icon: Recycle, actions: ["Reduce excessive fertilizer and pesticide use", "Support buffer strips of vegetation near waterways", "Promote precision irrigation to limit runoff", "Encourage organic and low-input farming nearby"] },
  { type: "Oil / chemical pollution", icon: FlaskConical, actions: ["Dispose of oil and chemicals at designated facilities", "Never pour oil or solvents down drains", "Report spills immediately to environmental authorities", "Support rapid-response spill management teams"] },
];

const LEARN_SECTIONS = [
  { title: "What is water pollution?", body: "Water pollution is the contamination of rivers, lakes, groundwater, and oceans with substances that make the water unsafe or unusable — for people, wildlife, or ecosystems." },
  { title: "Causes", body: "Untreated sewage, industrial discharge, agricultural runoff (fertilizer and pesticides), plastic waste, oil spills, and improper disposal of chemicals are among the leading causes." },
  { title: "Effects on humans, animals & environment", body: "Contaminated water spreads disease, damages aquatic habitats, kills fish and plant life, and disrupts entire food chains — effects that often reach far beyond the original source." },
  { title: "Prevention", body: "Proper waste disposal, reduced single-use plastic, responsible farming practices, and treating wastewater before it's released all help prevent pollution at the source." },
  { title: "Water treatment methods", body: "Common methods include sedimentation, filtration, disinfection (chlorination or UV), and biological treatment that uses microorganisms to break down organic waste." },
  { title: "Case studies", body: "Cleanups like the Thames (UK) and the Chicago River (US) show that heavily polluted urban waterways can recover within decades through sustained treatment investment and community action." },
];

const BADGES = [
  { id: "first-report", label: "First Report", desc: "Submit your first pollution report", need: (s) => s.reportsSubmitted >= 1 },
  { id: "eco-reporter", label: "Eco Reporter", desc: "Submit 5 pollution reports", need: (s) => s.reportsSubmitted >= 5 },
  { id: "volunteer", label: "Volunteer", desc: "Join a cleanup event", need: (s) => s.eventsJoined >= 1 },
  { id: "community-leader", label: "Community Leader", desc: "Join 3 cleanup events", need: (s) => s.eventsJoined >= 3 },
  { id: "water-scientist", label: "Water Scientist", desc: "Run the water quality checker 5 times", need: (s) => s.checksRun >= 5 },
];

const DEFAULT_EVENTS = [
  { id: "e1", name: "Riverside Bank Cleanup", area: "North Riverside", date: "Sat, Sep 6", volunteers: 12 },
  { id: "e2", name: "Lakeshore Plastic Sweep", area: "East Lakeshore", date: "Sun, Sep 14", volunteers: 7 },
  { id: "e3", name: "Storm Drain Watch", area: "Downtown Creek", date: "Sat, Sep 20", volunteers: 4 },
];

const uid = () => Math.random().toString(36).slice(2, 10);

function scoreWaterQuality({ ph, turbidity, dox, tds }) {
  let score = 0, count = 0;
  const issues = [];
  if (ph !== "") {
    count++;
    const v = parseFloat(ph);
    if (v >= 6.5 && v <= 8.5) score += 100;
    else if (v >= 6 && v < 9) { score += 55; issues.push("pH is slightly outside the ideal 6.5–8.5 range"); }
    else { score += 15; issues.push("pH is far outside the safe range"); }
  }
  if (turbidity !== "") {
    count++;
    const v = parseFloat(turbidity);
    if (v < 5) score += 100;
    else if (v < 50) { score += 55; issues.push("Turbidity is elevated (cloudy water)"); }
    else { score += 15; issues.push("Turbidity is very high"); }
  }
  if (dox !== "") {
    count++;
    const v = parseFloat(dox);
    if (v > 6) score += 100;
    else if (v >= 3) { score += 55; issues.push("Dissolved oxygen is on the low side"); }
    else { score += 15; issues.push("Dissolved oxygen is very low — stressful for aquatic life"); }
  }
  if (tds !== "") {
    count++;
    const v = parseFloat(tds);
    if (v < 500) score += 100;
    else if (v <= 1000) { score += 55; issues.push("Total dissolved solids are elevated"); }
    else { score += 15; issues.push("Total dissolved solids are high"); }
  }
  if (count === 0) return null;
  const avg = score / count;
  let verdict = "Good", color = T.algae;
  if (avg < 45) { verdict = "Poor"; color = T.rust; }
  else if (avg < 80) { verdict = "Needs Attention"; color = T.amber; }
  return { avg: Math.round(avg), verdict, color, issues, count };
}

function analyzeImagePixels(imgEl) {
  const canvas = document.createElement("canvas");
  const w = (canvas.width = 80), h = (canvas.height = 80);
  const ctx = canvas.getContext("2d");
  ctx.drawImage(imgEl, 0, 0, w, h);
  let data;
  try {
    data = ctx.getImageData(0, 0, w, h).data;
  } catch (e) {
    return { label: "Couldn't analyze this image", type: "Other", confidence: "none", note: "Please select the pollution type manually." };
  }
  let r = 0, g = 0, b = 0, n = 0;
  const lum = [];
  for (let i = 0; i < data.length; i += 4) {
    r += data[i]; g += data[i + 1]; b += data[i + 2];
    lum.push(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]);
    n++;
  }
  r /= n; g /= n; b /= n;
  const meanLum = lum.reduce((a, c) => a + c, 0) / lum.length;
  const variance = lum.reduce((a, c) => a + (c - meanLum) ** 2, 0) / lum.length;
  const std = Math.sqrt(variance);

  if (g > r * 1.15 && g > b * 1.15 && meanLum > 60) {
    return { label: "Green-dominant water detected", type: "sewage", confidence: "moderate", note: "Green, murky water often signals an algae bloom from nutrient pollution (e.g. sewage or fertilizer runoff)." };
  }
  if (r > g && r > b && meanLum < 100 && r - b < 45) {
    return { label: "Brown, low-clarity water detected", type: "sewage", confidence: "moderate", note: "Brownish, low-clarity water often indicates sewage or sediment contamination." };
  }
  if (std > 68) {
    return { label: "High visual contrast detected", type: "plastic", confidence: "low", note: "Strong color variation can indicate floating solid debris such as plastic waste." };
  }
  if (meanLum > 195) {
    return { label: "Bright, reflective surface detected", type: "oil", confidence: "low", note: "Unusually bright or iridescent water surfaces can indicate an oil or chemical sheen." };
  }
  return { label: "No strong visual signal detected", type: "other", confidence: "low", note: "Nothing conclusive stood out. Please select the pollution type yourself based on what you observed." };
}

export default function WaterGuardian() {
  const [tab, setTab] = useState("home");
  const [hubView, setHubView] = useState("menu");
  const [reports, setReports] = useState([]);
  const [events, setEvents] = useState(DEFAULT_EVENTS);
  const [impact, setImpact] = useState({ points: 0, badges: [], reportsSubmitted: 0, eventsJoined: 0, checksRun: 0 });
  const [ready, setReady] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const r = await window.storage.get("reports", true);
        if (r && r.value) setReports(JSON.parse(r.value));
      } catch (e) {}
      try {
        const ev = await window.storage.get("events", true);
        if (ev && ev.value) setEvents(JSON.parse(ev.value));
      } catch (e) {}
      try {
        const im = await window.storage.get("impact", false);
        if (im && im.value) setImpact(JSON.parse(im.value));
      } catch (e) {}
      setReady(true);
    })();
  }, []);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2600);
  };

  const persistReports = async (next) => {
    setReports(next);
    try { await window.storage.set("reports", JSON.stringify(next), true); } catch (e) {}
  };
  const persistEvents = async (next) => {
    setEvents(next);
    try { await window.storage.set("events", JSON.stringify(next), true); } catch (e) {}
  };
  const persistImpact = async (next) => {
    setImpact(next);
    try { await window.storage.set("impact", JSON.stringify(next), false); } catch (e) {}
  };

  const grantPoints = useCallback((patch, pts, celebrate) => {
    setImpact((prev) => {
      const next = { ...prev, ...patch, points: prev.points + pts };
      const newBadges = BADGES.filter((b) => !prev.badges.includes(b.id) && b.need(next)).map((b) => b.id);
      if (newBadges.length) {
        next.badges = [...prev.badges, ...newBadges];
        const first = BADGES.find((b) => b.id === newBadges[0]);
        showToast(`🏆 Badge earned: ${first.label}`);
      } else if (celebrate) {
        showToast(celebrate);
      }
      window.storage.set("impact", JSON.stringify(next), false).catch(() => {});
      return next;
    });
  }, []);

  const addReport = (report) => {
    const next = [report, ...reports];
    persistReports(next);
    grantPoints({ reportsSubmitted: impact.reportsSubmitted + 1 }, 10, "Report submitted — thank you!");
  };

  const joinEvent = (id) => {
    const next = events.map((e) => (e.id === id ? { ...e, volunteers: e.volunteers + 1 } : e));
    persistEvents(next);
    grantPoints({ eventsJoined: impact.eventsJoined + 1 }, 15, "You're signed up — see you there!");
  };

  const runChecker = () => {
    grantPoints({ checksRun: impact.checksRun + 1 }, 5, null);
  };

  const nearbyAlert = (() => {
    const counts = {};
    reports.forEach((r) => {
      const key = `${Math.round(r.lat / 8)}-${Math.round(r.lng / 8)}`;
      counts[key] = (counts[key] || 0) + 1;
    });
    const max = Math.max(0, ...Object.values(counts));
    return max >= 3;
  })();

  return (
    <div style={{ fontFamily: "'IBM Plex Sans', sans-serif", background: T.paper, minHeight: "100vh", color: T.ink, display: "flex", flexDirection: "column" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600&family=IBM+Plex+Sans+Condensed:wght@600;700&family=IBM+Plex+Mono:wght@400;500&display=swap');
        * { box-sizing: border-box; }
        .wg-display { font-family: 'IBM Plex Sans Condensed', sans-serif; letter-spacing: 0.01em; }
        .wg-mono { font-family: 'IBM Plex Mono', monospace; }
        .wg-btn { border: none; cursor: pointer; font-family: inherit; }
        .wg-btn:focus-visible { outline: 2px solid ${T.aqua}; outline-offset: 2px; }
        .wg-scroll::-webkit-scrollbar { display: none; }
        .wg-scroll { scrollbar-width: none; }
        input, select, textarea { font-family: inherit; }
        input:focus, select:focus, textarea:focus { outline: 2px solid ${T.aqua}; outline-offset: 1px; }
        @media (prefers-reduced-motion: reduce) { * { transition: none !important; animation: none !important; } }
      `}</style>

      <main className="wg-scroll" style={{ flex: 1, overflowY: "auto", paddingBottom: 84 }}>
        {tab === "home" && <HomeScreen reports={reports} nearbyAlert={nearbyAlert} goto={(t, h) => { setTab(t); if (h) setHubView(h); }} />}
        {tab === "report" && <ReportScreen onSubmit={addReport} showToast={showToast} />}
        {tab === "map" && <MapScreen reports={reports} nearbyAlert={nearbyAlert} />}
        {tab === "checker" && <CheckerScreen onRun={runChecker} />}
        {tab === "hub" && (
          <HubScreen
            view={hubView}
            setView={setHubView}
            events={events}
            joinEvent={joinEvent}
            reports={reports}
            impact={impact}
          />
        )}
      </main>

      {toast && (
        <div style={{ position: "fixed", bottom: 96, left: "50%", transform: "translateX(-50%)", background: T.ink, color: "#fff", padding: "10px 18px", borderRadius: 8, fontSize: 13.5, zIndex: 50, boxShadow: "0 6px 20px rgba(0,0,0,0.25)", maxWidth: "88%", textAlign: "center" }}>
          {toast}
        </div>
      )}

      <BottomNav tab={tab} setTab={(t) => { setTab(t); if (t === "hub") setHubView("menu"); }} />
    </div>
  );
}

/* ---------------------------- Bottom nav ---------------------------- */
function BottomNav({ tab, setTab }) {
  const items = [
    { id: "home", label: "Home", icon: HomeIcon },
    { id: "report", label: "Report", icon: Camera },
    { id: "map", label: "Map", icon: MapPin },
    { id: "checker", label: "Checker", icon: Droplet },
    { id: "hub", label: "Hub", icon: ClipboardList },
  ];
  return (
    <nav style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: T.ink, display: "flex", justifyContent: "space-around", padding: "8px 4px 10px", zIndex: 40, boxShadow: "0 -4px 16px rgba(0,0,0,0.2)" }}>
      {items.map((it) => {
        const active = tab === it.id;
        const Icon = it.icon;
        return (
          <button key={it.id} onClick={() => setTab(it.id)} className="wg-btn"
            style={{ background: "none", display: "flex", flexDirection: "column", alignItems: "center", gap: 3, padding: "4px 10px", color: active ? T.aqua : "#8FAFAE", minWidth: 56 }}>
            <Icon size={20} strokeWidth={active ? 2.4 : 1.9} />
            <span className="wg-display" style={{ fontSize: 10.5, fontWeight: 600, letterSpacing: "0.03em" }}>{it.label.toUpperCase()}</span>
          </button>
        );
      })}
    </nav>
  );
}

/* ------------------------------- Home -------------------------------- */
function HomeScreen({ reports, nearbyAlert, goto }) {
  const resolved = reports.filter((r) => r.resolved).length;
  const stats = [
    { label: "Reports logged", value: reports.length },
    { label: "High severity", value: reports.filter((r) => r.severity === "High").length },
    { label: "Resolved", value: resolved },
  ];
  return (
    <div>
      <div style={{ background: `linear-gradient(160deg, ${T.ink} 0%, ${T.ink2} 60%, ${T.aquaDark} 130%)`, color: "#fff", padding: "28px 20px 26px", borderBottomLeftRadius: 22, borderBottomRightRadius: 22 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, opacity: 0.85, marginBottom: 10 }}>
          <Waves size={16} />
          <span className="wg-mono" style={{ fontSize: 11.5, letterSpacing: "0.08em" }}>WATER GUARDIAN · CITIZEN MONITORING</span>
        </div>
        <h1 className="wg-display" style={{ fontSize: 30, fontWeight: 700, margin: "0 0 6px", lineHeight: 1.1 }}>Clean Water,<br />Healthy Future</h1>
        <p style={{ fontSize: 13.5, opacity: 0.85, margin: "0 0 20px", maxWidth: 320 }}>Spot pollution, report it, understand it, and act on it — together.</p>

        <div style={{ display: "flex", gap: 10 }}>
          {stats.map((s) => (
            <div key={s.label} style={{ flex: 1, background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 10, padding: "10px 8px", textAlign: "center" }}>
              <div className="wg-mono" style={{ fontSize: 22, fontWeight: 500 }}>{s.value}</div>
              <div style={{ fontSize: 10, opacity: 0.75, marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {nearbyAlert && (
        <div style={{ margin: "16px 16px 0", background: "#FCEBE8", border: `1px solid ${T.rust}`, borderRadius: 10, padding: "10px 12px", display: "flex", gap: 8, alignItems: "flex-start" }}>
          <AlertTriangle size={17} color={T.rust} style={{ flexShrink: 0, marginTop: 1 }} />
          <div style={{ fontSize: 12.5, color: T.rust }}>Multiple pollution reports detected clustering in one area. Check the Map tab for details.</div>
        </div>
      )}

      <div style={{ padding: "18px 16px 8px" }}>
        <div className="wg-display" style={{ fontSize: 12.5, fontWeight: 700, color: T.soft, letterSpacing: "0.05em", marginBottom: 10 }}>QUICK ACTIONS</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <QuickCard icon={Camera} title="Report Pollution" sub="Log a sighting" onClick={() => goto("report")} accent={T.aqua} />
          <QuickCard icon={Droplet} title="Check Water" sub="Screen a sample" onClick={() => goto("checker")} accent={T.aquaDark} />
          <QuickCard icon={BookOpen} title="Learn" sub="Causes & effects" onClick={() => goto("hub", "learn")} accent={T.algae} />
          <QuickCard icon={Recycle} title="Take Action" sub="Real solutions" onClick={() => goto("hub", "solutions")} accent={T.amber} />
        </div>
      </div>

      <div style={{ padding: "10px 16px 20px" }}>
        <div className="wg-display" style={{ fontSize: 12.5, fontWeight: 700, color: T.soft, letterSpacing: "0.05em", margin: "12px 0 10px" }}>RECENT REPORTS</div>
        {reports.length === 0 ? (
          <EmptyState text="No reports yet. Be the first to log a pollution sighting in your area." />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {reports.slice(0, 3).map((r) => <ReportRow key={r.id} r={r} />)}
          </div>
        )}
      </div>
    </div>
  );
}

function QuickCard({ icon: Icon, title, sub, onClick, accent }) {
  return (
    <button onClick={onClick} className="wg-btn" style={{ background: T.card, borderRadius: 12, padding: "14px 12px", textAlign: "left", border: `1px solid ${T.line}`, boxShadow: "0 1px 3px rgba(11,46,51,0.06)" }}>
      <div style={{ width: 32, height: 32, borderRadius: 8, background: `${accent}1A`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 8 }}>
        <Icon size={17} color={accent} />
      </div>
      <div className="wg-display" style={{ fontWeight: 700, fontSize: 14.5 }}>{title}</div>
      <div style={{ fontSize: 11.5, color: T.soft, marginTop: 1 }}>{sub}</div>
    </button>
  );
}

function EmptyState({ text, icon: Icon = Info }) {
  return (
    <div style={{ border: `1px dashed ${T.line}`, borderRadius: 12, padding: "22px 16px", textAlign: "center", color: T.soft }}>
      <Icon size={20} style={{ marginBottom: 6, opacity: 0.6 }} />
      <div style={{ fontSize: 12.5 }}>{text}</div>
    </div>
  );
}

function typeMeta(id) {
  return POLLUTION_TYPES.find((t) => t.id === id) || POLLUTION_TYPES[POLLUTION_TYPES.length - 1];
}

function ReportRow({ r }) {
  const meta = typeMeta(r.type);
  const Icon = meta.icon;
  const color = SEVERITY[r.severity];
  return (
    <div style={{ display: "flex", gap: 10, background: T.card, border: `1px solid ${T.line}`, borderRadius: 10, padding: "10px 12px", alignItems: "flex-start" }}>
      <div style={{ width: 30, height: 30, borderRadius: 8, background: `${color}1A`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <Icon size={15} color={color} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 6 }}>
          <span style={{ fontWeight: 600, fontSize: 13 }}>{meta.label}</span>
          <span className="wg-mono" style={{ fontSize: 10, color, fontWeight: 500 }}>{r.severity.toUpperCase()}</span>
        </div>
        {r.description && <div style={{ fontSize: 11.5, color: T.soft, marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.description}</div>}
        <div className="wg-mono" style={{ fontSize: 10, color: T.soft, marginTop: 3 }}>{r.lat.toFixed(2)}, {r.lng.toFixed(2)} · {r.timestamp}</div>
      </div>
    </div>
  );
}

/* ------------------------------ Report -------------------------------- */
function ReportScreen({ onSubmit, showToast }) {
  const [type, setType] = useState(null);
  const [severity, setSeverity] = useState("Medium");
  const [description, setDescription] = useState("");
  const [pin, setPin] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const imgRef = useRef(null);
  const fileRef = useRef(null);

  const handleFile = (file) => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    setPhotoPreview(url);
    setAnalysis(null);
  };

  useEffect(() => {
    if (!photoPreview) return;
    setAnalyzing(true);
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const result = analyzeImagePixels(img);
      setAnalysis(result);
      setAnalyzing(false);
      if (!type) setType(result.type);
    };
    img.onerror = () => setAnalyzing(false);
    img.src = photoPreview;
  }, [photoPreview]);

  const canSubmit = type && pin;

  const submit = () => {
    const report = {
      id: uid(),
      type, severity, description,
      lat: pin.lat, lng: pin.lng,
      timestamp: new Date().toLocaleDateString(undefined, { month: "short", day: "numeric" }),
      hadPhoto: !!photoPreview,
      resolved: false,
    };
    onSubmit(report);
    setType(null); setSeverity("Medium"); setDescription(""); setPin(null);
    setPhotoPreview(null); setAnalysis(null);
  };

  return (
    <div style={{ padding: "18px 16px 8px" }}>
      <ScreenHeader icon={Camera} title="Report Pollution" sub="Log what you saw — every report helps build the picture." />

      <SectionLabel>1 · PHOTO (OPTIONAL)</SectionLabel>
      <div style={{ background: T.card, border: `1px solid ${T.line}`, borderRadius: 12, padding: 14, marginBottom: 16 }}>
        {!photoPreview ? (
          <button className="wg-btn" onClick={() => fileRef.current?.click()} style={{ width: "100%", border: `1.5px dashed ${T.line}`, borderRadius: 10, padding: "22px 10px", background: T.paper, display: "flex", flexDirection: "column", alignItems: "center", gap: 6, color: T.soft }}>
            <Upload size={20} />
            <span style={{ fontSize: 12.5 }}>Upload a photo or video still</span>
          </button>
        ) : (
          <div>
            <div style={{ position: "relative" }}>
              <img ref={imgRef} src={photoPreview} alt="Uploaded pollution sighting" style={{ width: "100%", maxHeight: 190, objectFit: "cover", borderRadius: 8 }} />
              <button className="wg-btn" onClick={() => { setPhotoPreview(null); setAnalysis(null); }} style={{ position: "absolute", top: 6, right: 6, background: "rgba(11,46,51,0.7)", borderRadius: 999, width: 26, height: 26, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <X size={14} color="#fff" />
              </button>
            </div>
            <div style={{ marginTop: 10, background: `${T.aqua}0F`, border: `1px solid ${T.aqua}55`, borderRadius: 8, padding: "9px 10px", display: "flex", gap: 8, alignItems: "flex-start" }}>
              <Activity size={15} color={T.aquaDark} style={{ flexShrink: 0, marginTop: 1 }} />
              <div style={{ fontSize: 11.5 }}>
                {analyzing ? (
                  <span className="wg-mono" style={{ color: T.aquaDark }}>Analyzing image…</span>
                ) : analysis ? (
                  <>
                    <div className="wg-mono" style={{ color: T.aquaDark, fontWeight: 500, marginBottom: 2 }}>AI SCAN: {analysis.label}</div>
                    <div style={{ color: T.soft }}>{analysis.note} <span style={{ opacity: 0.7 }}>(confidence: {analysis.confidence})</span></div>
                  </>
                ) : null}
              </div>
            </div>
          </div>
        )}
        <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={(e) => handleFile(e.target.files?.[0])} />
        <div style={{ fontSize: 10.5, color: T.soft, marginTop: 8, lineHeight: 1.4 }}>
          The scan is a simple on-device color heuristic for this demo — it's a starting suggestion, not a certified identification. Please confirm the type yourself below.
        </div>
      </div>

      <SectionLabel>2 · LOCATION</SectionLabel>
      <div style={{ marginBottom: 16 }}>
        <PinPicker pin={pin} setPin={setPin} height={170} />
      </div>

      <SectionLabel>3 · POLLUTION TYPE</SectionLabel>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 16 }}>
        {POLLUTION_TYPES.map((pt) => {
          const Icon = pt.icon;
          const active = type === pt.id;
          return (
            <button key={pt.id} className="wg-btn" onClick={() => setType(pt.id)}
              style={{ background: active ? T.ink : T.card, color: active ? "#fff" : T.ink, border: `1.5px solid ${active ? T.ink : T.line}`, borderRadius: 10, padding: "10px 6px", display: "flex", flexDirection: "column", alignItems: "center", gap: 5 }}>
              <Icon size={17} color={active ? T.aqua : T.soft} />
              <span style={{ fontSize: 10.5, fontWeight: 600, textAlign: "center" }}>{pt.label}</span>
            </button>
          );
        })}
      </div>

      <SectionLabel>4 · SEVERITY</SectionLabel>
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        {Object.keys(SEVERITY).map((s) => {
          const active = severity === s;
          const color = SEVERITY[s];
          return (
            <button key={s} className="wg-btn" onClick={() => setSeverity(s)} style={{ flex: 1, borderRadius: 10, padding: "9px 0", background: active ? color : T.card, color: active ? "#fff" : T.ink, border: `1.5px solid ${active ? color : T.line}`, fontWeight: 600, fontSize: 12.5 }}>
              {s}
            </button>
          );
        })}
      </div>

      <SectionLabel>5 · DESCRIPTION (OPTIONAL)</SectionLabel>
      <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What did you see? Smell, color, extent, nearby landmarks…" rows={3}
        style={{ width: "100%", borderRadius: 10, border: `1px solid ${T.line}`, padding: 10, fontSize: 13, marginBottom: 18, resize: "vertical" }} />

      <button className="wg-btn" disabled={!canSubmit} onClick={submit}
        style={{ width: "100%", padding: "13px 0", borderRadius: 10, background: canSubmit ? T.aqua : T.line, color: canSubmit ? "#fff" : T.soft, fontWeight: 700, fontSize: 14 }}>
        {canSubmit ? "Submit Report" : pin ? "Select a pollution type" : "Drop a pin to continue"}
      </button>
      <div style={{ fontSize: 10.5, color: T.soft, marginTop: 8, marginBottom: 10, textAlign: "center" }}>Reports are visible to everyone using this app.</div>
    </div>
  );
}

function SectionLabel({ children }) {
  return <div className="wg-display" style={{ fontSize: 11.5, fontWeight: 700, color: T.soft, letterSpacing: "0.06em", marginBottom: 8 }}>{children}</div>;
}
function ScreenHeader({ icon: Icon, title, sub }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
        <div style={{ width: 30, height: 30, borderRadius: 8, background: `${T.aqua}1A`, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Icon size={16} color={T.aquaDark} />
        </div>
        <h2 className="wg-display" style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>{title}</h2>
      </div>
      <p style={{ fontSize: 12.5, color: T.soft, margin: 0 }}>{sub}</p>
    </div>
  );
}

/* Stylized watershed grid used for both pin-dropping and the pollution map.
   Not a real geographic map — a schematic "your local watershed" canvas
   where x/y position doubles as a simple lat/lng-style coordinate. */
function PinPicker({ pin, setPin, height = 170 }) {
  const ref = useRef(null);
  const place = (e) => {
    const rect = ref.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setPin({ lat: Math.max(0, Math.min(100, y)), lng: Math.max(0, Math.min(100, x)) });
  };
  return (
    <div>
      <div ref={ref} onClick={place} style={{ position: "relative", height, borderRadius: 12, overflow: "hidden", cursor: "crosshair", border: `1px solid ${T.line}` }}>
        <WatershedBackdrop />
        {pin && (
          <div style={{ position: "absolute", left: `${pin.lng}%`, top: `${pin.lat}%`, transform: "translate(-50%,-100%)" }}>
            <MapPin size={26} color={T.rust} fill={T.rust} fillOpacity={0.15} />
          </div>
        )}
        <div style={{ position: "absolute", bottom: 6, left: 8, fontSize: 10, color: "rgba(255,255,255,0.75)" }} className="wg-mono">TAP TO DROP PIN</div>
      </div>
      {pin && <div className="wg-mono" style={{ fontSize: 11, color: T.soft, marginTop: 6 }}>Pinned at {pin.lat.toFixed(1)}, {pin.lng.toFixed(1)} (local grid units)</div>}
    </div>
  );
}

function WatershedBackdrop() {
  return (
    <svg viewBox="0 0 300 170" width="100%" height="100%" preserveAspectRatio="none" style={{ display: "block" }}>
      <rect width="300" height="170" fill={T.ink2} />
      <path d="M0,40 C60,60 90,20 150,45 C210,70 240,30 300,55" stroke={T.aqua} strokeOpacity="0.35" strokeWidth="14" fill="none" />
      <path d="M0,110 C70,90 120,140 180,115 C230,95 260,130 300,110" stroke={T.aqua} strokeOpacity="0.22" strokeWidth="20" fill="none" />
      {Array.from({ length: 6 }).map((_, i) => (
        <line key={i} x1={i * 50} y1="0" x2={i * 50} y2="170" stroke="#ffffff" strokeOpacity="0.05" />
      ))}
      {Array.from({ length: 4 }).map((_, i) => (
        <line key={"h" + i} x1="0" y1={i * 42} x2="300" y2={i * 42} stroke="#ffffff" strokeOpacity="0.05" />
      ))}
    </svg>
  );
}

/* -------------------------------- Map --------------------------------- */
function MapScreen({ reports, nearbyAlert }) {
  const [selected, setSelected] = useState(null);
  const [filter, setFilter] = useState("all");
  const shown = filter === "all" ? reports : reports.filter((r) => r.type === filter);

  return (
    <div style={{ padding: "18px 16px 8px" }}>
      <ScreenHeader icon={MapPin} title="Pollution Map" sub="Reported sightings across the watershed." />

      {nearbyAlert && (
        <div style={{ background: "#FCEBE8", border: `1px solid ${T.rust}`, borderRadius: 10, padding: "9px 12px", display: "flex", gap: 8, alignItems: "flex-start", marginBottom: 14 }}>
          <AlertTriangle size={16} color={T.rust} style={{ flexShrink: 0, marginTop: 1 }} />
          <div style={{ fontSize: 12, color: T.rust }}>Multiple pollution reports detected clustering in one area.</div>
        </div>
      )}

      <div className="wg-scroll" style={{ display: "flex", gap: 6, overflowX: "auto", marginBottom: 12, paddingBottom: 2 }}>
        <FilterChip active={filter === "all"} onClick={() => setFilter("all")} label="All" />
        {POLLUTION_TYPES.map((pt) => <FilterChip key={pt.id} active={filter === pt.id} onClick={() => setFilter(pt.id)} label={pt.label} />)}
      </div>

      <div style={{ position: "relative", height: 260, borderRadius: 14, overflow: "hidden", border: `1px solid ${T.line}` }}>
        <WatershedBackdrop />
        {shown.map((r) => (
          <button key={r.id} className="wg-btn" onClick={() => setSelected(r)}
            style={{ position: "absolute", left: `${r.lng}%`, top: `${r.lat}%`, transform: "translate(-50%,-50%)", width: r.severity === "High" ? 18 : r.severity === "Medium" ? 14 : 11, height: r.severity === "High" ? 18 : r.severity === "Medium" ? 14 : 11, borderRadius: "50%", background: SEVERITY[r.severity], border: "2px solid rgba(255,255,255,0.85)", padding: 0, boxShadow: "0 0 0 3px rgba(0,0,0,0.15)" }}
            aria-label={`${typeMeta(r.type).label} report`} />
        ))}
        {shown.length === 0 && (
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(255,255,255,0.7)", fontSize: 12 }}>No reports match this filter</div>
        )}
      </div>

      <div style={{ display: "flex", gap: 14, justifyContent: "center", marginTop: 10, marginBottom: 16, flexWrap: "wrap" }}>
        {Object.entries(SEVERITY).map(([label, color]) => (
          <div key={label} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: T.soft }}>
            <span style={{ width: 9, height: 9, borderRadius: "50%", background: color, display: "inline-block" }} />{label}
          </div>
        ))}
      </div>

      {selected && (
        <div style={{ background: T.card, border: `1px solid ${T.line}`, borderRadius: 12, padding: 14, marginBottom: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: 14 }}>{typeMeta(selected.type).label}</div>
              <div className="wg-mono" style={{ fontSize: 10.5, color: T.soft, marginTop: 2 }}>{selected.lat.toFixed(1)}, {selected.lng.toFixed(1)} · {selected.timestamp}</div>
            </div>
            <span style={{ fontSize: 10.5, fontWeight: 600, color: SEVERITY[selected.severity] }}>{selected.severity.toUpperCase()}</span>
          </div>
          {selected.description && <div style={{ fontSize: 12.5, marginTop: 8 }}>{selected.description}</div>}
          <button className="wg-btn" onClick={() => setSelected(null)} style={{ marginTop: 10, background: "none", color: T.soft, fontSize: 11.5, padding: 0 }}>Close</button>
        </div>
      )}

      <div className="wg-display" style={{ fontSize: 11.5, fontWeight: 700, color: T.soft, letterSpacing: "0.06em", margin: "6px 0 10px" }}>NEARBY REPORTS ({shown.length})</div>
      {shown.length === 0 ? <EmptyState text="Nothing here yet." /> : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 10 }}>
          {shown.map((r) => <ReportRow key={r.id} r={r} />)}
        </div>
      )}
    </div>
  );
}

function FilterChip({ active, onClick, label }) {
  return (
    <button className="wg-btn" onClick={onClick} style={{ flexShrink: 0, padding: "6px 12px", borderRadius: 999, background: active ? T.ink : T.card, color: active ? "#fff" : T.soft, border: `1px solid ${active ? T.ink : T.line}`, fontSize: 11.5, fontWeight: 600 }}>
      {label}
    </button>
  );
}

/* ------------------------------ Checker -------------------------------- */
function CheckerScreen({ onRun }) {
  const [ph, setPh] = useState("");
  const [turbidity, setTurbidity] = useState("");
  const [temp, setTemp] = useState("");
  const [dox, setDox] = useState("");
  const [tds, setTds] = useState("");
  const [result, setResult] = useState(null);

  const run = () => {
    const r = scoreWaterQuality({ ph, turbidity, dox, tds });
    setResult(r);
    if (r) onRun();
  };

  const fields = [
    { label: "pH", value: ph, set: setPh, placeholder: "e.g. 7.2", hint: "Ideal range: 6.5 – 8.5" },
    { label: "Turbidity (NTU)", value: turbidity, set: setTurbidity, placeholder: "e.g. 12", hint: "Under 5 NTU is clear water" },
    { label: "Temperature (°C)", value: temp, set: setTemp, placeholder: "e.g. 21", hint: "For context only — not scored" },
    { label: "Dissolved oxygen (mg/L)", value: dox, set: setDox, placeholder: "e.g. 6.5", hint: "Above 6 mg/L supports aquatic life well" },
    { label: "TDS (ppm)", value: tds, set: setTds, placeholder: "e.g. 320", hint: "Under 500 ppm is generally good" },
  ];

  return (
    <div style={{ padding: "18px 16px 8px" }}>
      <ScreenHeader icon={Droplet} title="Water Quality Checker" sub="Enter whatever measurements you have on hand." />

      <div style={{ background: "#FFF7E9", border: `1px solid ${T.amber}55`, borderRadius: 10, padding: "10px 12px", display: "flex", gap: 8, marginBottom: 16 }}>
        <Info size={15} color={T.amber} style={{ flexShrink: 0, marginTop: 1 }} />
        <div style={{ fontSize: 11.5, color: "#6B5316" }}>This is an educational screening tool, not a replacement for certified water testing. For drinking water or health decisions, use an accredited lab.</div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 16 }}>
        {fields.map((f) => (
          <div key={f.label}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
              <label style={{ fontSize: 12.5, fontWeight: 600 }}>{f.label}</label>
              <span style={{ fontSize: 10.5, color: T.soft }}>{f.hint}</span>
            </div>
            <input type="number" inputMode="decimal" value={f.value} onChange={(e) => f.set(e.target.value)} placeholder={f.placeholder}
              style={{ width: "100%", borderRadius: 9, border: `1px solid ${T.line}`, padding: "9px 10px", fontSize: 13.5 }} className="wg-mono" />
          </div>
        ))}
      </div>

      <button className="wg-btn" onClick={run} style={{ width: "100%", padding: "12px 0", borderRadius: 10, background: T.aqua, color: "#fff", fontWeight: 700, fontSize: 14, marginBottom: 18 }}>
        Screen This Sample
      </button>

      {result && <GaugeResult result={result} />}
    </div>
  );
}

function GaugeResult({ result }) {
  const pct = Math.max(0, Math.min(100, result.avg));
  const angle = -90 + (pct / 100) * 180;
  return (
    <div style={{ background: T.card, border: `1px solid ${T.line}`, borderRadius: 14, padding: 18, marginBottom: 20 }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
        <svg width="180" height="102" viewBox="0 0 180 102">
          <path d="M10,100 A80,80 0 0,1 170,100" fill="none" stroke={T.line} strokeWidth="14" strokeLinecap="round" />
          <path d="M10,100 A80,80 0 0,1 170,100" fill="none" stroke={result.color} strokeWidth="14" strokeLinecap="round"
            strokeDasharray={`${(pct / 100) * 251.3} 251.3`} />
          <g transform={`rotate(${angle} 90 100)`}>
            <line x1="90" y1="100" x2="90" y2="30" stroke={T.ink} strokeWidth="3" strokeLinecap="round" />
          </g>
          <circle cx="90" cy="100" r="6" fill={T.ink} />
        </svg>
        <div className="wg-display" style={{ fontSize: 22, fontWeight: 700, color: result.color, marginTop: -6 }}>{result.verdict}</div>
        <div className="wg-mono" style={{ fontSize: 11, color: T.soft }}>Screening score: {result.avg}/100 · based on {result.count} measurement{result.count > 1 ? "s" : ""}</div>
      </div>
      {result.issues.length > 0 && (
        <div style={{ marginTop: 14, borderTop: `1px solid ${T.line}`, paddingTop: 12 }}>
          {result.issues.map((iss, i) => (
            <div key={i} style={{ display: "flex", gap: 7, fontSize: 12, marginBottom: 6, color: T.ink }}>
              <AlertTriangle size={13} color={T.amber} style={{ flexShrink: 0, marginTop: 2 }} />{iss}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* -------------------------------- Hub ---------------------------------- */
function HubScreen({ view, setView, events, joinEvent, reports, impact }) {
  if (view === "menu") {
    const menu = [
      { id: "solutions", label: "Solutions", sub: "Practical fixes by pollution source", icon: Recycle, color: T.algae },
      { id: "learn", label: "Learn", sub: "Causes, effects & treatment", icon: BookOpen, color: T.aqua },
      { id: "community", label: "Community", sub: "Cleanup events & volunteers", icon: Users, color: T.amber },
      { id: "impact", label: "Impact Dashboard", sub: "Track collective progress", icon: Target, color: T.aquaDark },
      { id: "badges", label: "Your Badges", sub: `${impact.points} points earned`, icon: Trophy, color: T.rust },
    ];
    return (
      <div style={{ padding: "18px 16px 8px" }}>
        <ScreenHeader icon={ClipboardList} title="Hub" sub="Everything beyond reporting and checking." />
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {menu.map((m) => {
            const Icon = m.icon;
            return (
              <button key={m.id} className="wg-btn" onClick={() => setView(m.id)} style={{ display: "flex", alignItems: "center", gap: 12, background: T.card, border: `1px solid ${T.line}`, borderRadius: 12, padding: "13px 14px", textAlign: "left" }}>
                <div style={{ width: 36, height: 36, borderRadius: 9, background: `${m.color}1A`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Icon size={18} color={m.color} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>{m.label}</div>
                  <div style={{ fontSize: 11.5, color: T.soft }}>{m.sub}</div>
                </div>
                <ChevronRight size={17} color={T.soft} />
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  const back = <BackBar onBack={() => setView("menu")} />;
  if (view === "solutions") return <><SolutionsView />{back}</>;
  if (view === "learn") return <><LearnView />{back}</>;
  if (view === "community") return <><CommunityView events={events} joinEvent={joinEvent} />{back}</>;
  if (view === "impact") return <><ImpactView reports={reports} events={events} impact={impact} />{back}</>;
  if (view === "badges") return <><BadgesView impact={impact} />{back}</>;
  return null;
}

function BackBar({ onBack }) {
  return (
    <div style={{ padding: "0 16px 20px" }}>
      <button className="wg-btn" onClick={onBack} style={{ display: "flex", alignItems: "center", gap: 4, background: "none", color: T.soft, fontSize: 12.5, padding: "6px 0" }}>
        <ChevronLeft size={15} /> Back to Hub
      </button>
    </div>
  );
}

function SolutionsView() {
  return (
    <div style={{ padding: "18px 16px 8px" }}>
      <ScreenHeader icon={Recycle} title="Solutions" sub="What actually helps, by pollution source." />
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {SOLUTIONS.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.type} style={{ background: T.card, border: `1px solid ${T.line}`, borderRadius: 12, padding: 14 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <Icon size={16} color={T.algae} />
                <div style={{ fontWeight: 700, fontSize: 13.5 }}>{s.type}</div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                {s.actions.map((a, i) => (
                  <div key={i} style={{ display: "flex", gap: 7, fontSize: 12, color: T.ink }}>
                    <CheckCircle2 size={13} color={T.algae} style={{ flexShrink: 0, marginTop: 2 }} />{a}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function LearnView() {
  const [open, setOpen] = useState(0);
  return (
    <div style={{ padding: "18px 16px 8px" }}>
      <ScreenHeader icon={BookOpen} title="Learn" sub="Short reads on water pollution." />
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {LEARN_SECTIONS.map((sec, i) => {
          const isOpen = open === i;
          return (
            <div key={sec.title} style={{ background: T.card, border: `1px solid ${T.line}`, borderRadius: 10, overflow: "hidden" }}>
              <button className="wg-btn" onClick={() => setOpen(isOpen ? -1 : i)} style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 14px", background: "none", textAlign: "left" }}>
                <span style={{ fontWeight: 600, fontSize: 13 }}>{sec.title}</span>
                {isOpen ? <Minus size={15} color={T.soft} /> : <Plus size={15} color={T.soft} />}
              </button>
              {isOpen && <div style={{ padding: "0 14px 14px", fontSize: 12.5, color: T.soft, lineHeight: 1.5 }}>{sec.body}</div>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function CommunityView({ events, joinEvent }) {
  return (
    <div style={{ padding: "18px 16px 8px" }}>
      <ScreenHeader icon={Users} title="Community" sub="Join a cleanup or track volunteer turnout." />
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {events.map((e) => (
          <div key={e.id} style={{ background: T.card, border: `1px solid ${T.line}`, borderRadius: 12, padding: 14 }}>
            <div style={{ fontWeight: 700, fontSize: 14 }}>{e.name}</div>
            <div style={{ fontSize: 12, color: T.soft, marginTop: 2 }}>{e.area} · {e.date}</div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 10 }}>
              <span className="wg-mono" style={{ fontSize: 11, color: T.aquaDark }}>{e.volunteers} volunteers signed up</span>
              <button className="wg-btn" onClick={() => joinEvent(e.id)} style={{ padding: "7px 14px", borderRadius: 8, background: T.aqua, color: "#fff", fontWeight: 600, fontSize: 12 }}>Join</button>
            </div>
          </div>
        ))}
      </div>
      <div style={{ fontSize: 10.5, color: T.soft, marginTop: 12, textAlign: "center" }}>Events and volunteer counts are shared with everyone using this app.</div>
    </div>
  );
}

function ImpactView({ reports, events, impact }) {
  const totalVolunteers = events.reduce((a, e) => a + e.volunteers, 0);
  const resolved = reports.filter((r) => r.resolved).length;
  const estWaste = reports.length * 3.2; // rough estimate, kg, for demo purposes
  const cards = [
    { label: "Reports submitted", value: reports.length, icon: ClipboardList },
    { label: "Reports resolved", value: resolved, icon: ShieldCheck },
    { label: "Cleanup events", value: events.length, icon: Users },
    { label: "Volunteers signed up", value: totalVolunteers, icon: Award },
    { label: "Est. waste flagged (kg)", value: estWaste.toFixed(1), icon: Trash2 },
    { label: "Areas with reports", value: new Set(reports.map((r) => `${Math.round(r.lat / 10)}-${Math.round(r.lng / 10)}`)).size, icon: MapPin },
  ];
  return (
    <div style={{ padding: "18px 16px 8px" }}>
      <ScreenHeader icon={Target} title="Impact Dashboard" sub="What the community has done so far." />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <div key={c.label} style={{ background: T.card, border: `1px solid ${T.line}`, borderRadius: 12, padding: 14 }}>
              <Icon size={16} color={T.aquaDark} />
              <div className="wg-mono" style={{ fontSize: 22, fontWeight: 500, marginTop: 8 }}>{c.value}</div>
              <div style={{ fontSize: 11, color: T.soft, marginTop: 2 }}>{c.label}</div>
            </div>
          );
        })}
      </div>
      <div style={{ fontSize: 10.5, color: T.soft, marginTop: 14, textAlign: "center" }}>Estimated waste is a rough per-report average for illustration, not a measured figure.</div>
    </div>
  );
}

function BadgesView({ impact }) {
  return (
    <div style={{ padding: "18px 16px 8px" }}>
      <ScreenHeader icon={Trophy} title="Your Badges" sub={`${impact.points} points earned so far.`} />
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {BADGES.map((b) => {
          const earned = impact.badges.includes(b.id);
          return (
            <div key={b.id} style={{ display: "flex", alignItems: "center", gap: 12, background: T.card, border: `1px solid ${earned ? T.aqua : T.line}`, borderRadius: 12, padding: "12px 14px", opacity: earned ? 1 : 0.55 }}>
              <div style={{ width: 34, height: 34, borderRadius: "50%", background: earned ? `${T.aqua}1A` : T.paper, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Award size={17} color={earned ? T.aquaDark : T.soft} />
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 13 }}>{b.label}</div>
                <div style={{ fontSize: 11.5, color: T.soft }}>{b.desc}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
