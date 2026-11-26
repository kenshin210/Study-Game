/* ============ STATE — XP, levels, badges, streaks ============ */
const State = (() => {
  let P = null; // player save object

  const LEVELS = [0, 100, 250, 450, 700, 1000, 1400, 1900, 2500, 3200, 4000, 5000, 6200, 7600, 9200, 11000, 13000, 15500, 18500, 22000];
  const LEVEL_TITLES = [
    "Trainee", "Help Desk Hero", "Device Wrangler", "Enrollment Agent", "Policy Pilot",
    "Profile Pro", "Update Captain", "App Commander", "Security Sentinel", "Compliance Chief",
    "Autopilot Ace", "Intune Investigator", "Defender Veteran", "Cloud Commander", "Fleet Guardian",
    "Zero Trust Zealot", "Tenant Tactician", "Graph Guru", "Endpoint Elite", "ENDPOINT ADMINISTRATOR"
  ];

  const BADGES = [
    { id: "first-steps",   ico: "🪪", name: "First Device Enrolled", desc: "Complete your first mission", check: p => Object.keys(p.missions).length >= 1 },
    { id: "world1",        ico: "🏢", name: "Infrastructure Engineer", desc: "Complete every mission in World 1", check: p => Game.worldDone(p, "w1") },
    { id: "world2",        ico: "🛠️", name: "Device Maintainer", desc: "Complete every mission in World 2", check: p => Game.worldDone(p, "w2") },
    { id: "world3",        ico: "📦", name: "Application Deployment Master", desc: "Complete every mission in World 3", check: p => Game.worldDone(p, "w3") },
    { id: "world4",        ico: "🛡️", name: "Security Specialist", desc: "Complete every mission in World 4", check: p => Game.worldDone(p, "w4") },
    { id: "world5",        ico: "📡", name: "Operations Commander", desc: "Complete every mission in World 5", check: p => Game.worldDone(p, "w5") },
    { id: "detective",     ico: "🕵️", name: "Intune Investigator", desc: "Solve 5 detective cases", check: p => p.counters.detectives >= 5 },
    { id: "escape-artist", ico: "🔓", name: "Escape Artist", desc: "Escape 3 locked rooms", check: p => p.counters.escapes >= 3 },
    { id: "autopilot",     ico: "✈️", name: "Autopilot Expert", desc: "Master every Autopilot objective", check: p => ["2A1","2A2","2A3","2A4","2A5"].every(o => SRS.status(p, o) === "mastered") },
    { id: "sharp",         ico: "🎯", name: "Sharp Shooter", desc: "Answer 25 questions correctly", check: p => p.counters.correct >= 25 },
    { id: "centurion",     ico: "💯", name: "Centurion", desc: "Answer 100 questions correctly", check: p => p.counters.correct >= 100 },
    { id: "no-hints",      ico: "🧠", name: "Pure Instinct", desc: "Finish a mission with zero hints and zero mistakes", check: p => p.counters.perfectMissions >= 1 },
    { id: "streak3",       ico: "🔥", name: "On a Roll", desc: "3-day play streak (streaks never punish you!)", check: p => p.daily.best >= 3 },
    { id: "examiner",      ico: "📝", name: "Exam Challenger", desc: "Complete an exam simulation", check: p => p.exams.length >= 1 },
    { id: "ready",         ico: "🏆", name: "Endpoint Escape Champion", desc: "Score 80%+ in the Certification Gauntlet", check: p => p.exams.some(e => e.final && e.pct >= 80) },
    { id: "scholar",       ico: "📚", name: "Field Scholar", desc: "Read 25 intel cards", check: p => Object.keys(p.lessonsRead).length >= 25 },
    { id: "mastermind",    ico: "🌟", name: "Syllabus Mastermind", desc: "Master 40 exam objectives", check: p => Object.keys(p.srs).filter(o => SRS.status(p, o) === "mastered").length >= 40 },
  ];

  function init() { P = Storage.load(); touchDaily(); return P; }
  function player() { return P; }

  function level(xp) {
    let lv = 1;
    for (let i = 0; i < LEVELS.length; i++) if (xp >= LEVELS[i]) lv = i + 1;
    return lv;
  }
  function levelInfo() {
    const lv = level(P.xp);
    const cur = LEVELS[lv - 1];
    const next = LEVELS[lv] ?? (cur + 5000);
    return { lv, title: LEVEL_TITLES[Math.min(lv - 1, LEVEL_TITLES.length - 1)], cur, next, pct: Math.min(100, Math.round(((P.xp - cur) / (next - cur)) * 100)) };
  }

  function addXP(amount, anchorEl) {
    if (amount <= 0) return;
    const before = level(P.xp);
    P.xp += amount;
    Storage.save();
    UI.xpPop(amount, anchorEl);
    const after = level(P.xp);
    if (after > before) {
      Audio.play("levelup");
      UI.toast(`⬆️ LEVEL ${after} — ${LEVEL_TITLES[Math.min(after - 1, LEVEL_TITLES.length - 1)]}`, "badge");
    }
    checkBadges();
  }

  function checkBadges() {
    for (const b of BADGES) {
      if (!P.badges.includes(b.id) && b.check(P)) {
        P.badges.push(b.id);
        Storage.save();
        Audio.play("badge");
        UI.toast(`${b.ico} Achievement unlocked: <b>${b.name}</b>`, "badge");
      }
    }
  }

  function touchDaily() {
    const today = new Date().toISOString().slice(0, 10);
    if (P.daily.lastDate === today) return;
    const yesterday = new Date(Date.now() - 864e5).toISOString().slice(0, 10);
    // streaks never punish: a gap just restarts the counter quietly
    P.daily.streak = (P.daily.lastDate === yesterday) ? P.daily.streak + 1 : 1;
    P.daily.best = Math.max(P.daily.best, P.daily.streak);
    P.daily.lastDate = today;
    P.daily.doneToday = false;
    Storage.save();
  }

  return { init, player, level, levelInfo, addXP, checkBadges, BADGES, LEVEL_TITLES };
})();
