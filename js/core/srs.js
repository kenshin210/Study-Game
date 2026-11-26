/* ============ SRS — spaced repetition + weak areas + coverage ============ */
/* Leitner-style boxes 0-5. Correct → up a box, due pushed out. Wrong → down, due soon. */
const SRS = (() => {
  const DUE_DAYS = [0, 1, 3, 7, 14, 30]; // by box

  function rec(p, objId) {
    if (!p.srs[objId]) p.srs[objId] = { box: 0, due: 0, seen: 0, correct: 0, wrong: 0, streak: 0 };
    return p.srs[objId];
  }

  function report(p, objId, correct) {
    if (!objId) return;
    const r = rec(p, objId);
    r.seen++;
    if (correct) {
      r.correct++; r.streak++;
      r.box = Math.min(5, r.box + 1);
    } else {
      r.wrong++; r.streak = 0;
      r.box = Math.max(1, r.box - 1);
    }
    r.due = Date.now() + DUE_DAYS[r.box] * 864e5;
    Storage.save();
  }

  function reportQuestion(p, q, correct) {
    if (!p.qhist[q.id]) p.qhist[q.id] = { seen: 0, correct: 0, wrong: 0, last: 0 };
    const h = p.qhist[q.id];
    h.seen++; h.last = Date.now();
    correct ? h.correct++ : h.wrong++;
    p.counters.answers++;
    if (correct) p.counters.correct++;
    report(p, q.obj, correct);
  }

  // Objective status for the coverage tracker
  function status(p, objId) {
    const r = p.srs[objId];
    const read = p.lessonsRead[objId];
    if (!r || r.seen === 0) return read ? "learning" : "ns";
    if (r.box >= 4 && r.streak >= 2) return "mastered";
    if (r.box >= 2 && r.correct > r.wrong) return "practising";
    return "learning";
  }

  function isWeak(p, objId) {
    const r = p.srs[objId];
    return !!r && r.seen >= 2 && (r.wrong >= r.correct || r.box <= 1);
  }

  // Weak + due objectives, weakest first
  function weakObjectives(p) {
    const out = [];
    for (const o of MD102_OBJECTIVES.flatMap(d => d.groups.flatMap(g => g.objectives))) {
      const r = p.srs[o.id];
      if (!r || r.seen === 0) continue;
      const weak = isWeak(p, o.id);
      const due = r.due <= Date.now() && status(p, o.id) !== "mastered";
      if (weak || due) out.push({ obj: o, weak, due, score: (r.wrong - r.correct) * 10 - r.box });
    }
    return out.sort((a, b) => b.score - a.score);
  }

  /* Question picking.
     mode "smart": prefer weak-objective questions, then unseen, then due-for-retention.
     Avoids questions already answered correctly recently unless retention-due. */
  function pickQuestions(p, n, filter) {
    const pool = QUESTION_BANK.filter(q => !filter || filter(q));
    const now = Date.now();
    const scored = pool.map(q => {
      const h = p.qhist[q.id];
      const r = p.srs[q.obj];
      let s = Math.random() * 10;
      if (!h) s += 50;                                    // unseen first
      else {
        if (h.wrong > h.correct) s += 70;                 // got it wrong before
        if (now - h.last < 864e5 && h.correct > 0) s -= 60; // answered correctly today: rest it
      }
      if (r && isWeak(p, q.obj)) s += 40;                 // weak objective
      if (r && r.due <= now && r.box >= 2) s += 25;       // retention check due
      if (r && status(p, q.obj) === "mastered" && h && h.correct > 0 && r.due > now) s -= 50;
      return { q, s };
    });
    scored.sort((a, b) => b.s - a.s);
    // light shuffle within top band for variety
    const top = scored.slice(0, Math.max(n * 2, 10));
    top.sort(() => Math.random() - 0.5);
    return top.slice(0, n).map(x => x.q);
  }

  // Deterministic daily picks (seeded by date)
  function dailyQuestions(p, n) {
    const seedStr = new Date().toISOString().slice(0, 10);
    let seed = 0;
    for (const c of seedStr) seed = (seed * 31 + c.charCodeAt(0)) >>> 0;
    const rand = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
    const pool = [...QUESTION_BANK];
    for (let i = pool.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [pool[i], pool[j]] = [pool[j], pool[i]]; }
    return pool.slice(0, n);
  }

  // Coverage summary per domain
  function coverage(p) {
    return MD102_OBJECTIVES.map(d => {
      const objs = d.groups.flatMap(g => g.objectives);
      const counts = { ns: 0, learning: 0, practising: 0, mastered: 0 };
      for (const o of objs) counts[status(p, o.id)]++;
      return { domain: d, total: objs.length, counts, pct: Math.round(((counts.practising * 0.5 + counts.mastered) / objs.length) * 100) };
    });
  }

  return { report, reportQuestion, status, isWeak, weakObjectives, pickQuestions, dailyQuestions, coverage };
})();
