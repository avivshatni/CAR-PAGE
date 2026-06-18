import { useState, useEffect, useRef } from "react";

const WA = "972544239896";
const openWA = (car) => {
  const m = car ? `היי! אני מעוניין ב${car}. אפשר פרטים?` : "היי! אני מחפש רכב ואשמח לשמוע פרטים";
  window.open(`https://wa.me/${WA}?text=${encodeURIComponent(m)}`, "_blank");
};

const DEFAULT_CARS = [
  { id: "1", name: "סקודה אוקטביה 2019", km: "87,000", tags: ["גג פנורמי", "שירות מלא"], badge: "ביקוש גבוה", badgeType: "hot", emoji: "🚗", img: "" },
  { id: "2", name: "טויוטה קורולה 2020", km: "61,000", tags: ["יד ראשונה", "ללא תאונות"], badge: "חדש!", badgeType: "new", emoji: "🚙", img: "" },
  { id: "3", name: "מאזדה CX-5 2021", km: "45,000", tags: ["4WD", "פנורמי"], badge: "פרימיום", badgeType: "gold", emoji: "🚘", img: "" },
];

const BADGE_STYLES = {
  hot: { background: "rgba(255,68,68,0.15)", color: "#FF6B6B", border: "1px solid rgba(255,68,68,0.25)" },
  new: { background: "rgba(37,211,102,0.12)", color: "#25D366", border: "1px solid rgba(37,211,102,0.25)" },
  gold: { background: "rgba(212,168,83,0.12)", color: "#D4A853", border: "1px solid rgba(212,168,83,0.3)" },
};

export default function CarLanding() {
  const [cars, setCars] = useState(DEFAULT_CARS);
  const [admin, setAdmin] = useState(false);
  const [pin, setPin] = useState("");
  const [pinOpen, setPinOpen] = useState(false);
  const [editCar, setEditCar] = useState(null);
  const [loading, setLoading] = useState(true);
  const [chatMsgs, setChatMsgs] = useState([{ from: "ai", text: "היי! מחפש רכב? ספר לי מה חשוב לך 🙂" }]);
  const [chatInput, setChatInput] = useState("");
  const [quiz, setQuiz] = useState({ step: 0, style: "", km: "" });
  const chatRef = useRef(null);
  const fileRef = useRef(null);
  const ADMIN_PIN = "1234";

  useEffect(() => {
    (async () => {
      try {
        const r = await window.storage.get("car-inventory");
        if (r && r.value) setCars(JSON.parse(r.value));
      } catch {}
      setLoading(false);
    })();
  }, []);

  const saveCars = async (list) => {
    setCars(list);
    try { await window.storage.set("car-inventory", JSON.stringify(list)); } catch {}
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setEditCar((c) => ({ ...c, img: ev.target.result }));
    };
    reader.readAsDataURL(file);
  };

  const saveCarEdit = () => {
    if (!editCar.name) return;
    const exists = cars.find((c) => c.id === editCar.id);
    const updated = exists ? cars.map((c) => (c.id === editCar.id ? editCar : c)) : [...cars, { ...editCar, id: Date.now().toString() }];
    saveCars(updated);
    setEditCar(null);
  };

  const deleteCar = (id) => saveCars(cars.filter((c) => c.id !== id));

  const sendChatMsg = () => {
    if (!chatInput.trim()) return;
    const msg = chatInput.trim();
    setChatInput("");
    setChatMsgs((p) => [...p, { from: "me", text: msg }]);
    setTimeout(() => {
      const lo = msg.toLowerCase();
      const responses = {
        מחיר: "ספר לי מה התקציב שלך ואני אמצא את הרכב הכי מתאים!",
        זמין: "יש כמה רכבים מצוינים עכשיו. מה הסגנון שאתה מחפש?",
        נסיעה: "מעולה! שלח הודעה בוואטסאפ ונתאם נסיעת מבחן 🙂",
        suv: "יש כמה SUV מצוינים! מה התקציב שלך?",
        תהליך: "פשוט: שולח הודעה → מספר מה מחפש → אני מאתר → מתאם נסיעה → מלווה עד סגירה.",
      };
      let resp = "שאלה מצוינת! שלח הודעה בוואטסאפ ואחזור תוך דקות 🙂";
      for (const [k, v] of Object.entries(responses)) { if (lo.includes(k)) { resp = v; break; } }
      // Also check car names
      for (const car of cars) { if (lo.includes(car.name.split(" ")[0]?.toLowerCase())) { resp = `${car.name} — ${car.km} ק"מ. רוצה לתאם נסיעה?`; break; } }
      setChatMsgs((p) => [...p, { from: "ai", text: resp }]);
    }, 1000);
  };

  useEffect(() => { chatRef.current?.scrollTo(0, chatRef.current.scrollHeight); }, [chatMsgs]);

  const quizResult = () => {
    const recs = { economy: "טויוטה קורולה / יאריס", family: "סקודה אוקטביה / קיה ספורטאז׳", suv: "מאזדה CX-5 / טויוטה RAV4", luxury: "פולקסווגן פסאט / סקודה סופרב" };
    return recs[quiz.style] || recs.economy;
  };

  if (loading) return <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", background: "#0A0C0B", color: "#25D366", fontFamily: "'Heebo',sans-serif", fontSize: 18 }}>טוען...</div>;

  // ─── ADMIN PANEL ───
  if (admin) {
    return (
      <div style={{ background: "#0A0C0B", minHeight: "100vh", color: "#F0F2F0", fontFamily: "'Heebo',sans-serif", direction: "rtl", padding: "20px" }}>
        <div style={{ maxWidth: 700, margin: "0 auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
            <h2 style={{ fontFamily: "'Rubik',sans-serif", fontWeight: 800, fontSize: 22 }}>🔧 ניהול רכבים</h2>
            <button onClick={() => setAdmin(false)} style={{ ...btnStyle, background: "rgba(255,255,255,0.08)", color: "#8A9189" }}>חזור לאתר ←</button>
          </div>

          {/* Car list */}
          <div style={{ marginBottom: 24 }}>
            {cars.map((car) => (
              <div key={car.id} style={{ display: "flex", gap: 12, alignItems: "center", background: "#111413", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, padding: 12, marginBottom: 10 }}>
                <div style={{ width: 70, height: 52, borderRadius: 8, overflow: "hidden", background: "#181B19", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, flexShrink: 0 }}>
                  {car.img ? <img src={car.img} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : car.emoji || "🚗"}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>{car.name}</div>
                  <div style={{ fontSize: 12, color: "#8A9189" }}>{car.km} ק"מ · {car.tags?.join(" · ")}</div>
                </div>
                <button onClick={() => setEditCar({ ...car })} style={{ ...btnSmall, background: "rgba(37,211,102,0.1)", color: "#25D366", border: "1px solid rgba(37,211,102,0.2)" }}>ערוך</button>
                <button onClick={() => deleteCar(car.id)} style={{ ...btnSmall, background: "rgba(255,68,68,0.1)", color: "#FF6B6B", border: "1px solid rgba(255,68,68,0.2)" }}>מחק</button>
              </div>
            ))}
          </div>

          {/* Add / Edit form */}
          <div style={{ background: "#111413", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 16, padding: 20 }}>
            <h3 style={{ fontFamily: "'Rubik',sans-serif", fontWeight: 700, fontSize: 16, marginBottom: 16 }}>
              {editCar?.id && cars.find(c => c.id === editCar.id) ? "✏️ עריכת רכב" : "➕ הוספת רכב חדש"}
            </h3>
            {(() => {
              const c = editCar || { id: "", name: "", km: "", tags: [], badge: "", badgeType: "new", emoji: "🚗", img: "" };
              const set = (k, v) => setEditCar({ ...c, [k]: v });
              if (!editCar) setEditCar(c);
              return (
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  {/* Image upload */}
                  <div>
                    <label style={labelStyle}>תמונת הרכב</label>
                    <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                      <div style={{ width: 120, height: 80, borderRadius: 10, border: "2px dashed rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", background: "#181B19", cursor: "pointer", fontSize: 32 }}
                        onClick={() => fileRef.current?.click()}>
                        {c.img ? <img src={c.img} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <span style={{ color: "#8A9189", fontSize: 13 }}>לחץ להעלאה</span>}
                      </div>
                      <input ref={fileRef} type="file" accept="image/*" onChange={handleImageUpload} style={{ display: "none" }} />
                      <div style={{ fontSize: 12, color: "#8A9189", lineHeight: 1.6 }}>העלה תמונה של הרכב<br />JPG / PNG / WebP</div>
                    </div>
                  </div>

                  <div>
                    <label style={labelStyle}>שם הרכב</label>
                    <input value={c.name} onChange={(e) => set("name", e.target.value)} placeholder="למשל: טויוטה קורולה 2020" style={inputStyle} />
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    <div>
                      <label style={labelStyle}>ק"מ</label>
                      <input value={c.km} onChange={(e) => set("km", e.target.value)} placeholder="61,000" style={inputStyle} />
                    </div>
                    <div>
                      <label style={labelStyle}>תגית</label>
                      <select value={c.badgeType} onChange={(e) => set("badgeType", e.target.value)} style={inputStyle}>
                        <option value="new">חדש!</option>
                        <option value="hot">ביקוש גבוה</option>
                        <option value="gold">פרימיום</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label style={labelStyle}>מאפיינים (מופרדים בפסיק)</label>
                    <input value={c.tags?.join(", ")} onChange={(e) => set("tags", e.target.value.split(",").map((t) => t.trim()).filter(Boolean))} placeholder="גג פנורמי, שירות מלא, יד ראשונה" style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>אימוג'י (אם אין תמונה)</label>
                    <input value={c.emoji} onChange={(e) => set("emoji", e.target.value)} style={{ ...inputStyle, width: 80, fontSize: 22, textAlign: "center" }} />
                  </div>
                  <div style={{ display: "flex", gap: 10, marginTop: 6 }}>
                    <button onClick={saveCarEdit} style={{ ...btnStyle, background: "#25D366", color: "#fff", flex: 1, fontWeight: 700 }}>
                      {c.id && cars.find(x => x.id === c.id) ? "💾 שמור שינויים" : "➕ הוסף רכב"}
                    </button>
                    {editCar && <button onClick={() => setEditCar(null)} style={{ ...btnStyle, background: "rgba(255,255,255,0.06)", color: "#8A9189" }}>ביטול</button>}
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      </div>
    );
  }

  // ─── PIN MODAL ───
  const PinModal = () => (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 999, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Heebo',sans-serif", direction: "rtl" }}
      onClick={() => setPinOpen(false)}>
      <div style={{ background: "#111413", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 20, padding: 28, width: 320, textAlign: "center" }}
        onClick={(e) => e.stopPropagation()}>
        <div style={{ fontSize: 28, marginBottom: 10 }}>🔒</div>
        <div style={{ fontFamily: "'Rubik',sans-serif", fontWeight: 700, fontSize: 16, marginBottom: 6 }}>כניסת מנהל</div>
        <div style={{ fontSize: 13, color: "#8A9189", marginBottom: 16 }}>הזן קוד גישה</div>
        <input type="password" value={pin} onChange={(e) => setPin(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && pin === ADMIN_PIN) { setAdmin(true); setPinOpen(false); setPin(""); } }}
          placeholder="קוד" style={{ ...inputStyle, textAlign: "center", fontSize: 22, letterSpacing: 8, marginBottom: 12 }} />
        <button onClick={() => { if (pin === ADMIN_PIN) { setAdmin(true); setPinOpen(false); setPin(""); } }}
          style={{ ...btnStyle, background: "#25D366", color: "#fff", width: "100%", fontWeight: 700, fontSize: 15 }}>כנס</button>
        <div style={{ fontSize: 11, color: "#8A9189", marginTop: 10 }}>קוד ברירת מחדל: 1234</div>
      </div>
    </div>
  );

  // ─── LANDING PAGE ───
  return (
    <div style={{ background: "#0A0C0B", color: "#F0F2F0", fontFamily: "'Heebo',sans-serif", direction: "rtl", overflowX: "hidden" }}>
      <link href="https://fonts.googleapis.com/css2?family=Heebo:wght@300;400;500;700;900&family=Rubik:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />
      {pinOpen && <PinModal />}

      {/* HERO */}
      <div style={{ minHeight: "92vh", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", textAlign: "center", padding: "2.5rem 1.5rem", position: "relative" }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(212,168,83,0.12)", border: "1px solid rgba(212,168,83,0.3)", borderRadius: 50, padding: "6px 16px", fontSize: 12, color: "#D4A853", fontWeight: 500, marginBottom: 24 }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#D4A853" }} /> מומחה לאיתור רכבים
        </div>
        <h1 style={{ fontFamily: "'Rubik',sans-serif", fontSize: "clamp(2.2rem,6.5vw,4rem)", fontWeight: 900, lineHeight: 1.08, marginBottom: 16, letterSpacing: "-.03em" }}>
          אני מוצא לך את<br /><span style={{ background: "linear-gradient(135deg,#25D366,#128C7E)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>הרכב המושלם.</span>
        </h1>
        <p style={{ fontSize: "1.05rem", color: "#8A9189", maxWidth: 520, margin: "0 auto 2rem", fontWeight: 300, lineHeight: 1.7 }}>
          אתה אומר מה אתה מחפש — אני מוצא, בודק, ומביא לך את <strong style={{ color: "#F0F2F0", fontWeight: 500 }}>הרכב הכי מתאים</strong> במחיר הכי טוב.
        </p>
        <a href={`https://wa.me/${WA}?text=${encodeURIComponent("היי! אני מחפש רכב")}`} target="_blank" rel="noopener"
          style={{ display: "inline-flex", alignItems: "center", gap: 10, background: "#25D366", color: "#fff", fontFamily: "'Rubik',sans-serif", fontSize: "1.1rem", fontWeight: 700, padding: "16px 36px", borderRadius: 50, border: "none", cursor: "pointer", textDecoration: "none" }}>
          ספר לי מה אתה מחפש
        </a>
        <div style={{ display: "flex", gap: "2rem", marginTop: 32, justifyContent: "center", flexWrap: "wrap" }}>
          {[["200+", "עסקאות מוצלחות"], ["4.9★", "שביעות רצון"], ["<30 דק", "זמן מענה"], ["10+ שנים", "ניסיון בתחום"]].map(([n, l], i) => (
            <div key={i} style={{ textAlign: "center", minWidth: 75 }}>
              <div style={{ fontFamily: "'Rubik',sans-serif", fontSize: "1.7rem", fontWeight: 800, color: "#25D366" }}>{n}</div>
              <div style={{ fontSize: 11, color: "#8A9189", marginTop: 3 }}>{l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* PROCESS */}
      <div style={{ background: "#111413", padding: "4rem 1.5rem" }}>
        <div style={{ maxWidth: 960, margin: "0 auto" }}>
          <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: ".18em", color: "#25D366", textTransform: "uppercase", marginBottom: 6 }}>איך זה עובד</div>
          <h2 style={{ fontFamily: "'Rubik',sans-serif", fontSize: "clamp(1.5rem,3.5vw,2.2rem)", fontWeight: 800, marginBottom: 8 }}>מהודעה אחת — לרכב מושלם</h2>
          <p style={{ color: "#8A9189", fontSize: ".95rem", marginBottom: 32, fontWeight: 300 }}>תהליך פשוט שחוסך לך זמן וכאב ראש</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))", gap: 14 }}>
            {[["💬", "שלח הודעה", "ספר לי מה מחפש — סוג, תקציב, העדפות."], ["🔎", "אני מחפש ובודק", "סורק מאות רכבים, בודק היסטוריה ומצב טכני."], ["🚗", "נסיעת מבחן", "מתאם לך נסיעה ברכבים הכי מתאימים."], ["🤝", "סגירת עסקה", "מנהל מו\"מ, ניירת, העברת בעלות. הכל."]].map(([icon, t, d], i) => (
              <div key={i} style={{ background: "#181B19", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 14, padding: 20, position: "relative" }}>
                <div style={{ fontSize: "1.8rem", marginBottom: 10 }}>{icon}</div>
                <div style={{ fontFamily: "'Rubik',sans-serif", fontSize: ".95rem", fontWeight: 700, marginBottom: 4 }}>{t}</div>
                <div style={{ fontSize: ".83rem", color: "#8A9189", fontWeight: 300, lineHeight: 1.55 }}>{d}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CARS - Dynamic from storage */}
      <div style={{ padding: "4rem 1.5rem" }}>
        <div style={{ maxWidth: 960, margin: "0 auto" }}>
          <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: ".18em", color: "#25D366", textTransform: "uppercase", marginBottom: 6 }}>רכבים זמינים עכשיו</div>
          <h2 style={{ fontFamily: "'Rubik',sans-serif", fontSize: "clamp(1.5rem,3.5vw,2.2rem)", fontWeight: 800, marginBottom: 8 }}>מה יש לי היום</h2>
          <p style={{ color: "#8A9189", fontSize: ".95rem", marginBottom: 32, fontWeight: 300 }}>לחץ על רכב ← שיחה ישירה בוואטסאפ</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))", gap: 16 }}>
            {cars.map((car) => (
              <div key={car.id} onClick={() => openWA(car.name)}
                style={{ background: "#111413", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 14, overflow: "hidden", cursor: "pointer", transition: "all .25s" }}>
                <div style={{ width: "100%", height: 180, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "3.5rem", position: "relative", overflow: "hidden", background: car.img ? "transparent" : "linear-gradient(135deg,#1a2332,#0d1117)" }}>
                  {car.img ? <img src={car.img} alt={car.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : car.emoji || "🚗"}
                  {car.badge && <span style={{ position: "absolute", top: 10, right: 10, padding: "4px 10px", borderRadius: 50, fontSize: 11, fontWeight: 600, zIndex: 2, ...(BADGE_STYLES[car.badgeType] || BADGE_STYLES.new) }}>{car.badge}</span>}
                </div>
                <div style={{ padding: "14px 16px" }}>
                  <div style={{ fontFamily: "'Rubik',sans-serif", fontSize: "1.05rem", fontWeight: 700, marginBottom: 8 }}>{car.name}</div>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
                    {car.km && <span style={tagStyle}>{car.km} ק"מ</span>}
                    {car.tags?.map((t, i) => <span key={i} style={tagStyle}>{t}</span>)}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#25D366", fontSize: 13, fontWeight: 600, fontFamily: "'Rubik',sans-serif" }}>
                    לפרטים ותיאום נסיעה ←
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div style={{ textAlign: "center", marginTop: 24 }}>
            <a href={`https://wa.me/${WA}?text=${encodeURIComponent("היי! אני מחפש רכב שלא ברשימה — אפשר לאתר לי?")}`} target="_blank" rel="noopener"
              style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#25D366", color: "#fff", fontFamily: "'Rubik',sans-serif", fontSize: ".95rem", fontWeight: 700, padding: "12px 28px", borderRadius: 50, textDecoration: "none" }}>
              לא מצאת? אני אמצא לך ←
            </a>
          </div>
        </div>
      </div>

      {/* QUIZ */}
      <div style={{ background: "#111413", padding: "4rem 1.5rem" }}>
        <div style={{ maxWidth: 960, margin: "0 auto", textAlign: "center" }}>
          <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: ".18em", color: "#25D366", textTransform: "uppercase", marginBottom: 6 }}>עוזר חכם</div>
          <h2 style={{ fontFamily: "'Rubik',sans-serif", fontSize: "clamp(1.5rem,3.5vw,2.2rem)", fontWeight: 800, marginBottom: 8 }}>איזה רכב מתאים לך?</h2>
          <p style={{ color: "#8A9189", fontSize: ".95rem", marginBottom: 32, fontWeight: 300 }}>3 שאלות ← המלצה אישית</p>
          <div style={{ maxWidth: 500, margin: "0 auto", background: "#181B19", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 20, padding: 28, position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: "linear-gradient(90deg,#25D366,#D4A853)" }} />
            {quiz.step === 0 && <>
              <div style={{ fontSize: 11, color: "#8A9189", marginBottom: 6 }}>שאלה 1 מתוך 3</div>
              <div style={{ fontFamily: "'Rubik',sans-serif", fontSize: 16, fontWeight: 700, marginBottom: 16 }}>מה הסגנון שלך?</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center" }}>
                {[["economy", "קומפקטי וחסכוני"], ["family", "משפחתי ומרווח"], ["suv", "SUV / גבוה"], ["luxury", "יוקרתי ומפנק"]].map(([v, l]) => (
                  <button key={v} onClick={() => setQuiz({ ...quiz, step: 1, style: v })} style={quizOptStyle}>{l}</button>
                ))}
              </div>
            </>}
            {quiz.step === 1 && <>
              <div style={{ fontSize: 11, color: "#8A9189", marginBottom: 6 }}>שאלה 2 מתוך 3</div>
              <div style={{ fontFamily: "'Rubik',sans-serif", fontSize: 16, fontWeight: 700, marginBottom: 16 }}>כמה ק"מ ביום?</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center" }}>
                {[["low", "עד 30 ק\"מ"], ["med", "30–80 ק\"מ"], ["high", "80+ ק\"מ"]].map(([v, l]) => (
                  <button key={v} onClick={() => setQuiz({ ...quiz, step: 2, km: v })} style={quizOptStyle}>{l}</button>
                ))}
              </div>
            </>}
            {quiz.step === 2 && <>
              <div style={{ fontSize: 11, color: "#8A9189", marginBottom: 6 }}>שאלה 3 מתוך 3</div>
              <div style={{ fontFamily: "'Rubik',sans-serif", fontSize: 16, fontWeight: 700, marginBottom: 16 }}>מה הכי חשוב?</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center" }}>
                {[["price", "מחיר נמוך"], ["reliable", "אמינות"], ["tech", "טכנולוגיה"], ["safety", "בטיחות"]].map(([v, l]) => (
                  <button key={v} onClick={() => setQuiz({ ...quiz, step: 3 })} style={quizOptStyle}>{l}</button>
                ))}
              </div>
            </>}
            {quiz.step === 3 && (
              <div style={{ textAlign: "center", padding: "10px 0" }}>
                <div style={{ fontSize: 11, color: "#D4A853", letterSpacing: ".1em", textTransform: "uppercase", marginBottom: 6 }}>התאמה מושלמת</div>
                <div style={{ fontFamily: "'Rubik',sans-serif", fontSize: 22, fontWeight: 900, color: "#25D366", marginBottom: 6 }}>{quizResult()}</div>
                <div style={{ fontSize: 13, color: "#8A9189", marginBottom: 14 }}>מותאם בדיוק לצרכים שלך</div>
                <button onClick={() => openWA("המלצת הקוויז: " + quizResult())} style={{ padding: "12px 28px", borderRadius: 50, background: "#25D366", color: "#fff", border: "none", fontFamily: "'Rubik',sans-serif", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>דבר איתי על הרכב הזה</button>
                <br />
                <button onClick={() => setQuiz({ step: 0, style: "", km: "" })} style={{ marginTop: 10, background: "none", border: "none", color: "#8A9189", cursor: "pointer", fontSize: 12, fontFamily: "'Heebo',sans-serif" }}>נסה שוב ↺</button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* BENEFITS */}
      <div style={{ padding: "4rem 1.5rem" }}>
        <div style={{ maxWidth: 960, margin: "0 auto" }}>
          <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: ".18em", color: "#25D366", textTransform: "uppercase", marginBottom: 6 }}>למה לקוחות בוחרים בי</div>
          <h2 style={{ fontFamily: "'Rubik',sans-serif", fontSize: "clamp(1.5rem,3.5vw,2.2rem)", fontWeight: 800, marginBottom: 32 }}>שירות אישי מקצה לקצה</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(270px,1fr))", gap: 14 }}>
            {[["🔍", "g", "איתור מותאם אישית", "לא מלאי קבוע — אני מחפש בדיוק לפי מה שאתה צריך."],
              ["🛡️", "go", "בדיקה מקצועית מלאה", "כל רכב עובר בדיקה, היסטוריה ובדיקת שלדה."],
              ["⚡", "b", "מענה מהיר ואישי", "ישירות בוואטסאפ תוך 30 דקות. לא מוקד."],
              ["📋", "p", "ליווי עד סוף העסקה", "מו\"מ, ניירת, העברת בעלות — אני מטפל בכל."]].map(([icon, cls, t, d], i) => (
              <div key={i} style={{ background: "#111413", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 14, padding: 22, display: "flex", gap: 14, alignItems: "flex-start" }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.3rem", flexShrink: 0, background: cls === "g" ? "rgba(37,211,102,0.1)" : cls === "go" ? "rgba(212,168,83,0.1)" : cls === "b" ? "rgba(59,130,246,0.1)" : "rgba(168,85,247,0.1)" }}>{icon}</div>
                <div>
                  <div style={{ fontFamily: "'Rubik',sans-serif", fontSize: ".95rem", fontWeight: 700, marginBottom: 3 }}>{t}</div>
                  <div style={{ fontSize: ".83rem", color: "#8A9189", fontWeight: 300, lineHeight: 1.55 }}>{d}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* AI CHAT */}
      <div style={{ background: "#111413", padding: "4rem 1.5rem" }}>
        <div style={{ maxWidth: 960, margin: "0 auto", textAlign: "center" }}>
          <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: ".18em", color: "#25D366", textTransform: "uppercase", marginBottom: 6 }}>צ'אט חכם</div>
          <h2 style={{ fontFamily: "'Rubik',sans-serif", fontSize: "clamp(1.5rem,3.5vw,2.2rem)", fontWeight: 800, marginBottom: 32 }}>שאל אותי כל שאלה</h2>
          <div style={{ maxWidth: 440, margin: "0 auto", background: "#181B19", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 20, overflow: "hidden" }}>
            <div style={{ background: "#1F2321", padding: "14px 18px", display: "flex", alignItems: "center", gap: 12, borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
              <div style={{ width: 38, height: 38, borderRadius: "50%", background: "linear-gradient(135deg,#25D366,#128C7E)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, color: "#fff", fontWeight: 700 }}>AI</div>
              <div><div style={{ fontFamily: "'Rubik',sans-serif", fontSize: 14, fontWeight: 700 }}>העוזר שלי</div><div style={{ fontSize: 11, color: "#25D366" }}>● מקוון</div></div>
            </div>
            <div ref={chatRef} style={{ padding: 18, minHeight: 200, maxHeight: 280, overflowY: "auto" }}>
              {chatMsgs.map((m, i) => (
                <div key={i} style={{ display: "flex", gap: 8, marginBottom: 10, flexDirection: m.from === "me" ? "row-reverse" : "row" }}>
                  <div style={{ maxWidth: "80%", padding: "10px 14px", borderRadius: 14, fontSize: 13, lineHeight: 1.6, background: m.from === "me" ? "rgba(37,211,102,0.12)" : "#1F2321", border: `1px solid ${m.from === "me" ? "rgba(37,211,102,0.2)" : "rgba(255,255,255,0.06)"}` }}>{m.text}</div>
                </div>
              ))}
            </div>
            <div style={{ display: "flex", gap: 8, padding: "10px 14px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
              {["מה יש עכשיו?", "איך זה עובד?"].map((s) => (
                <button key={s} onClick={() => { setChatInput(s); setTimeout(sendChatMsg, 50); }}
                  style={{ padding: "5px 12px", borderRadius: 50, border: "1px solid rgba(255,255,255,0.06)", background: "#1F2321", fontSize: 11, cursor: "pointer", color: "#F0F2F0", fontFamily: "'Heebo',sans-serif" }}>{s}</button>
              ))}
            </div>
            <div style={{ display: "flex", gap: 8, padding: "10px 18px 14px", borderTop: "1px solid rgba(255,255,255,0.06)", background: "#1F2321" }}>
              <input value={chatInput} onChange={(e) => setChatInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && sendChatMsg()}
                placeholder="שאל אותי משהו..." style={{ flex: 1, background: "#0A0C0B", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 20, padding: "9px 16px", fontSize: 13, color: "#F0F2F0", fontFamily: "'Heebo',sans-serif", direction: "rtl", outline: "none" }} />
              <button onClick={sendChatMsg} style={{ width: 38, height: 38, borderRadius: "50%", background: "#25D366", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 15 }}>➤</button>
            </div>
          </div>
        </div>
      </div>

      {/* REVIEWS */}
      <div style={{ padding: "4rem 1.5rem" }}>
        <div style={{ maxWidth: 960, margin: "0 auto" }}>
          <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: ".18em", color: "#25D366", textTransform: "uppercase", marginBottom: 6 }}>לקוחות ממליצים</div>
          <h2 style={{ fontFamily: "'Rubik',sans-serif", fontSize: "clamp(1.5rem,3.5vw,2.2rem)", fontWeight: 800, marginBottom: 32 }}>200+ עסקאות מוצלחות</h2>
          <div style={{ display: "flex", gap: 14, overflowX: "auto", paddingBottom: 10 }}>
            {[["אמרתי לו קורולה — תוך 4 ימים הייתי בנסיעה ברכב מושלם.", "דניאל כ. · תל אביב"],
              ["ניסיתי לחפש לבד שבועות. הוא מצא CX-5 מדהים ב-3 ימים.", "שרה א. · חיפה"],
              ["ענה בוואטסאפ תוך 10 דקות. למחרת כבר נסעתי.", "מיכאל ל. · רמת גן"],
              ["פעם שלישית שאני דרכו. תמיד מוצא את העסקה הטובה ביותר.", "יוסי כ. · נתניה"],
              ["חסך לי שבועות. הרכב עבר בדיקה מלאה. ממליצה!", "מרים ח. · הרצליה"]].map(([text, name], i) => (
              <div key={i} style={{ minWidth: 260, maxWidth: 290, background: "#111413", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 14, padding: 18, flexShrink: 0 }}>
                <div style={{ color: "#D4A853", fontSize: 13, letterSpacing: 2, marginBottom: 8 }}>★★★★★</div>
                <div style={{ fontSize: ".88rem", lineHeight: 1.65, marginBottom: 10, fontWeight: 300 }}>{text}</div>
                <div style={{ fontSize: 12, color: "#8A9189", fontWeight: 500 }}>{name}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA */}
      <div style={{ textAlign: "center", padding: "5rem 1.5rem", position: "relative" }}>
        <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: ".18em", color: "#25D366", textTransform: "uppercase", marginBottom: 12 }}>מוכן?</div>
        <h2 style={{ fontFamily: "'Rubik',sans-serif", fontSize: "clamp(1.8rem,5vw,3rem)", fontWeight: 900, marginBottom: 12, letterSpacing: "-.02em" }}>הודעה אחת.<br />רכב מושלם.</h2>
        <p style={{ color: "#8A9189", marginBottom: 24, fontSize: "1rem", fontWeight: 300 }}>ראשון–שישי · 08:00–21:00 · כל הארץ</p>
        <a href={`https://wa.me/${WA}?text=${encodeURIComponent("היי! אני מחפש רכב")}`} target="_blank" rel="noopener"
          style={{ display: "inline-flex", alignItems: "center", gap: 12, background: "#25D366", color: "#fff", fontFamily: "'Rubik',sans-serif", fontSize: "1.15rem", fontWeight: 800, padding: "18px 44px", borderRadius: 50, textDecoration: "none" }}>
          שלח הודעה עכשיו
        </a>
        <div style={{ fontSize: 12, color: "#8A9189", marginTop: 16 }}>ממוצע מענה: 18 דקות · שירות אישי</div>
      </div>

      {/* FOOTER */}
      <div style={{ padding: "2rem 1.5rem", textAlign: "center", borderTop: "1px solid rgba(255,255,255,0.06)", color: "#8A9189", fontSize: 12, fontWeight: 300 }}>
        <p>© 2026 · מומחה רכבים · כל הארץ</p>
      </div>

      {/* ADMIN BUTTON */}
      <div onClick={() => setPinOpen(true)} style={{ position: "fixed", bottom: 24, right: 24, width: 36, height: 36, borderRadius: "50%", background: "rgba(255,255,255,0.04)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: 14, color: "#8A9189", zIndex: 90, border: "1px solid rgba(255,255,255,0.04)" }}>⚙️</div>
    </div>
  );
}

// Styles
const btnStyle = { padding: "10px 20px", borderRadius: 10, border: "none", cursor: "pointer", fontSize: 14, fontFamily: "'Heebo',sans-serif" };
const btnSmall = { padding: "6px 12px", borderRadius: 8, cursor: "pointer", fontSize: 12, fontFamily: "'Heebo',sans-serif", background: "none" };
const inputStyle = { width: "100%", background: "#0A0C0B", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, padding: "10px 14px", fontSize: 14, color: "#F0F2F0", fontFamily: "'Heebo',sans-serif", direction: "rtl", outline: "none" };
const labelStyle = { display: "block", fontSize: 12, color: "#8A9189", marginBottom: 5, fontWeight: 500 };
const tagStyle = { fontSize: 11, padding: "3px 10px", borderRadius: 50, background: "rgba(255,255,255,0.05)", color: "#8A9189", border: "1px solid rgba(255,255,255,0.06)" };
const quizOptStyle = { padding: "10px 20px", borderRadius: 50, border: "1px solid rgba(255,255,255,0.06)", background: "#1F2321", fontSize: 13, cursor: "pointer", color: "#F0F2F0", fontFamily: "'Heebo',sans-serif" };
