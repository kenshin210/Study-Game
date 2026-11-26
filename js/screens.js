/* ============ SCREENS & ROUTER ============ */
const Game = (() => {
  const { el, render, pbar, toast } = UI;

  /* ---------- helpers ---------- */
  function worldDone(p, wid) {
    const w = WORLDS.find(x => x.id === wid);
    return w ? w.missions.every(m => p.missions[m.id]?.done) : false;
  }
  function worldUnlocked(p, idx) {
    if (idx === 0) return true;
    const prev = WORLDS[idx - 1];
    return prev.missions.filter(m => p.missions[m.id]?.done).length >= 2;
  }
  function missionUnlocked(p, world, mIdx) {
    if (mIdx === 0) return true;
    return !!p.missions[world.missions[mIdx - 1].id]?.done;
  }
  function allMissionsDone(p) { return WORLDS.every(w => worldDone(p, w.id)); }
  function nextMission(p) {
    if (p.lastMission && MISSION_INDEX[p.lastMission] && !p.missions[p.lastMission]?.done) return p.lastMission;
    for (let wi = 0; wi < WORLDS.length; wi++) {
      if (!worldUnlocked(p, wi)) continue;
      for (let mi = 0; mi < WORLDS[wi].missions.length; mi++) {
        const m = WORLDS[wi].missions[mi];
        if (!p.missions[m.id]?.done && missionUnlocked(p, WORLDS[wi], mi)) return m.id;
      }
    }
    return null;
  }

  /* ---------- HUD ---------- */
  function hud() {
    const p = State.player();
    const li = State.levelInfo();
    return el("div", { class: "hud" },
      el("div", { class: "stat" }, el("b", { class: "neon" }, `LV ${li.lv}`), el("span", { class: "muted hud-extra" }, li.title)),
      el("div", { class: "stat", style: "flex:1; min-width:120px" }, (() => { const b = pbar(li.pct, "thin"); b.style.flex = "1"; return b; })(), el("span", { class: "small muted" }, `${p.xp} XP`)),
      el("div", { class: "stat hud-extra" }, "🔥", el("span", {}, `${p.daily.streak}d`)),
      el("div", { class: "stat hud-extra" }, "🏅", el("span", {}, String(p.badges.length)))
    );
  }

  /* ---------- Bottom nav ---------- */
  let currentScreen = "menu";
  function nav() {
    const items = [
      ["menu", "🏠", "Home"], ["worlds", "🗺️", "Worlds"], ["quick", "⚡", "Quick"],
      ["progress", "📊", "Progress"], ["settings", "⚙️", "Settings"],
    ];
    return el("div", { class: "bottom-nav" }, items.map(([id, ico, label]) =>
      el("button", { class: currentScreen === id ? "active" : "", onclick: () => go(id) },
        el("span", { class: "ico" }, ico), label)));
  }

  function screen(name, ...nodes) {
    currentScreen = name;
    render(hud(), ...nodes, nav());
  }

  /* ========== MAIN MENU ========== */
  function menu() {
    const p = State.player();
    const nm = nextMission(p);
    const nmInfo = nm ? MISSION_INDEX[nm] : null;
    const weak = SRS.weakObjectives(p);
    const cov = SRS.coverage(p);
    const totalObjs = cov.reduce((a, c) => a + c.total, 0);
    const mastered = cov.reduce((a, c) => a + c.counts.mastered, 0);

    const title = el("div", { class: "title-screen" },
      el("div", { class: "title-logo" }, "🛡️"),
      el("div", { class: "title-main" }, "ENDPOINT ESCAPE"),
      el("p", { class: "muted" }, "MD-102 · Save the network. Master the endpoints. Become the Administrator."));

    const buttons = el("div", { class: "panel" },
      el("button", { class: "btn-big mb", onclick: () => nm ? mission(nm) : go("worlds") },
        el("span", { class: "ico" }, "▶️"),
        el("span", {}, el("b", {}, nm ? (p.steps[nm] ? "Continue Mission" : "Next Mission") : "All missions complete!"),
          el("div", { class: "small muted" }, nmInfo ? `${nmInfo.world.ico} ${nmInfo.mission.title} · ~${nmInfo.mission.min} min` : "Try the Certification Gauntlet 🏆"))),
      el("button", { class: "btn-big mb", onclick: () => go("worlds") }, el("span", { class: "ico" }, "🗺️"), el("span", {}, el("b", {}, "Explore Worlds"), el("div", { class: "small muted" }, "5 worlds · every MD-102 domain"))),
      el("button", { class: "btn-big mb", onclick: () => go("quick") }, el("span", { class: "ico" }, "⚡"), el("span", {}, el("b", {}, "Quick Challenge"), el("div", { class: "small muted" }, "5 smart questions · ~5 min"))),
      el("button", { class: "btn-big mb", onclick: () => go("weak") }, el("span", { class: "ico" }, "🎯"), el("span", {}, el("b", {}, "Practice My Weak Areas"), el("div", { class: "small muted" }, weak.length ? `${weak.length} topic${weak.length > 1 ? "s" : ""} need attention` : "Nothing weak detected — nice!"))),
      el("button", { class: "btn-big mb", onclick: () => go("exam") }, el("span", { class: "ico" }, "📝"), el("span", {}, el("b", {}, "Exam Simulation"), el("div", { class: "small muted" }, allMissionsDone(p) ? "Certification Gauntlet UNLOCKED 🏆" : "Practice exams by domain"))),
      el("button", { class: "btn-big mb", onclick: () => go("progress") }, el("span", { class: "ico" }, "📊"), el("span", {}, el("b", {}, "My Progress"), el("div", { class: "small muted" }, `${mastered}/${totalObjs} objectives mastered`))),
      el("button", { class: "btn-big", onclick: () => go("settings") }, el("span", { class: "ico" }, "⚙️"), el("span", {}, el("b", {}, "Settings"))));

    const daily = el("div", { class: "panel" },
      el("div", { class: "spread" },
        el("div", {}, el("b", {}, "🌞 Daily Challenge"), el("div", { class: "small muted" }, p.daily.doneToday ? "Done for today — see you tomorrow! ✅" : "5 fresh questions · small streak bonus")),
        p.daily.doneToday ? el("span", { class: "chip mastered" }, "COMPLETE") :
          el("button", { class: "btn-sm btn-primary", onclick: () => quickRun(SRS.dailyQuestions(p, 5), "🌞 Daily Challenge", true) }, "Play")));

    screen("menu", title, buttons, daily,
      el("p", { class: "center small muted" }, "Streaks are a bonus, never a punishment. Take breaks whenever you like — your progress always saves. 💙"));
  }

  /* ========== WORLDS ========== */
  function worlds() {
    const p = State.player();
    const nodes = [el("h1", { class: "center mb" }, "🗺️ TechCore Campus")];
    WORLDS.forEach((w, wi) => {
      const unlocked = worldUnlocked(p, wi);
      const done = w.missions.filter(m => p.missions[m.id]?.done).length;
      const card = el("div", { class: `panel world-card ${unlocked ? "" : "locked"}` },
        el("div", { class: "world-num" }, String(wi + 1)),
        el("div", { class: "row" },
          el("span", { class: "w-ico" }, w.ico),
          el("div", { style: "flex:1" },
            el("h2", {}, w.name),
            el("div", { class: "small muted" }, `${w.sub} · MD-102 Domain ${w.domain.slice(1)}`))),
        el("p", { class: "small muted" }, unlocked ? w.story : `🔒 Complete 2 missions in ${WORLDS[wi - 1].name} to unlock.`),
        pbar((done / w.missions.length) * 100, "thin green"),
        el("div", { class: "small muted mt" }, `${done}/${w.missions.length} missions complete`));
      if (unlocked) {
        const list = el("div", { class: "mt" });
        w.missions.forEach((m, mi) => {
          const mDone = p.missions[m.id]?.done;
          const mUnlocked = missionUnlocked(p, w, mi);
          const row = el("div", { class: `card mb ${mDone ? "done" : ""} ${mUnlocked ? "click" : "locked"}` },
            el("div", { class: "spread" },
              el("div", {}, `${m.ico} `, el("b", {}, m.title),
                el("div", { class: "small muted" }, `${m.escape ? "🔐 Escape room · " : ""}${m.quickfire ? "⚡ Quick-fire · " : ""}~${m.min} min`)),
              el("span", {}, mDone ? "✅" : (mUnlocked ? (p.steps[m.id] != null ? "⏸️ Resume" : "▶️") : "🔒"))));
          if (mUnlocked) row.addEventListener("click", () => mission(m.id));
          list.appendChild(row);
        });
        card.appendChild(list);
      }
      nodes.push(card);
    });
    if (allMissionsDone(p)) {
      nodes.push(el("div", { class: "panel glow center" },
        el("h2", { class: "neon" }, "🏆 Certification Gauntlet"),
        el("p", { class: "muted" }, "Every world restored. Face the final challenge — a full exam-style simulation across all domains."),
        el("button", { class: "btn-primary", onclick: () => examRun(40, true, true) }, "Enter the Gauntlet")));
    }
    screen("worlds", ...nodes);
  }

  /* ========== MISSION PLAYER ========== */
  function mission(mid) {
    const p = State.player();
    const { mission: m, world: w } = MISSION_INDEX[mid];
    p.lastMission = mid; Storage.save();
    let stepIdx = p.steps[mid] ?? 0;
    if (stepIdx >= m.steps.length) stepIdx = 0;
    let earned = 0, mistakes = 0, hintsBefore = p.counters.hintsUsed;
    const digits = m.steps.filter(s => s.digit).map(() => null);

    function header() {
      const h = el("div", { class: "panel", style: "padding:12px 16px" },
        el("div", { class: "spread" },
          el("div", {}, el("b", {}, `${m.ico} ${m.title}`), el("div", { class: "small muted" }, `${w.ico} ${w.name}`)),
          el("button", { class: "btn-sm btn-ghost", onclick: pauseExit }, "⏸️ Pause & exit")),
        el("div", { class: "mt" }, pbar((stepIdx / m.steps.length) * 100)),
        el("div", { class: "small muted mt" }, `Step ${Math.min(stepIdx + 1, m.steps.length)} of ${m.steps.length} · Next: ${stepLabel(m.steps[stepIdx])}`));
      if (m.escape) {
        const locks = el("div", { class: "lock-row" });
        let di = 0;
        m.steps.forEach(s => {
          if (s.digit) { locks.appendChild(el("span", { class: `lock ${digits[di] ? "open" : ""}` }, digits[di] ? "🔓" : "🔒")); di++; }
        });
        locks.appendChild(el("span", { class: "lock" }, "🚪"));
        h.appendChild(locks);
        if (digits.some(d => d)) h.appendChild(el("div", { class: "code-display" }, digits.map(d => d ?? "•").join(" ")));
      }
      return h;
    }
    function stepLabel(s) {
      if (!s) return "Finish!";
      return { lesson: "📡 Intel", q: "🧩 Puzzle", inline: "🧩 Puzzle", detective: "🕵️ Investigation", config: "🛠️ Configuration", code: "🔐 Door code" }[s.type] || "Puzzle";
    }
    function pauseExit() {
      p.steps[mid] = stepIdx; Storage.save();
      toast("Progress saved. Come back anytime! 💾");
      menu();
    }

    function showStep() {
      const s = m.steps[stepIdx];
      if (!s) return completeMission();
      const body = el("div", { class: "panel" });
      const done = res => {
        earned += res.xp || 0;
        if (res.correct === false) mistakes++;
        if (s.digit && res.correct) {
          let di = -1;
          for (let i = 0; i <= stepIdx; i++) if (m.steps[i].digit) di++;
          digits[di] = s.digit;
          toast(`🔓 Lock opened! Digit revealed: <b>${s.digit}</b>`);
        } else if (s.digit && !res.correct) {
          let di = -1;
          for (let i = 0; i <= stepIdx; i++) if (m.steps[i].digit) di++;
          digits[di] = s.digit; // never block escape progress — reveal with a nudge
          toast(`The lock creaks open anyway — digit: <b>${s.digit}</b>. Review this one later! 💪`);
        }
        stepIdx++;
        p.steps[mid] = stepIdx; Storage.save();
        showStep();
      };
      let node;
      switch (s.type) {
        case "lesson": node = Puzzles.renderLesson(s.obj, done); break;
        case "q": { const q = getQuestion(s.qid); node = q ? Puzzles.renderQuestion(q, done) : el("div", {}, "Missing question " + s.qid); break; }
        case "inline": node = Puzzles.renderQuestion(s.q, done); break;
        case "detective": node = Puzzles.renderDetective(s, done); break;
        case "config": node = Puzzles.renderConfig(s, done); break;
        case "code": node = Puzzles.renderCode(s, digits, done); break;
        default: node = el("div", {}, "Unknown step");
      }
      body.appendChild(node);
      render(header(), body);
    }

    function completeMission() {
      const first = !p.missions[mid]?.done;
      const perfect = mistakes === 0 && p.counters.hintsUsed === hintsBefore;
      const bonus = first ? 50 : 15;
      if (perfect) p.counters.perfectMissions++;
      p.missions[mid] = { done: true, bestXp: Math.max(p.missions[mid]?.bestXp || 0, earned + bonus), perfect: p.missions[mid]?.perfect || perfect };
      delete p.steps[mid];
      p.lastMission = null;
      Storage.save();
      Audio.play("complete");
      State.addXP(bonus);
      State.checkBadges();
      const nm = nextMission(p);
      render(hud(),
        el("div", { class: "panel glow center" },
          el("div", { style: "font-size:3em" }, perfect ? "🌟" : "🎉"),
          el("h1", { class: "neon" }, "Mission Complete!"),
          el("p", {}, el("b", {}, m.title), ` — ${w.name} is a little safer.`),
          el("div", { class: "mt" },
            el("p", {}, `✨ Puzzle XP: ${earned}`),
            el("p", {}, `🎁 Completion bonus: +${bonus} XP`),
            perfect ? el("p", { class: "good" }, "🧠 Flawless — no mistakes, no hints!") : el("p", { class: "muted small" }, mistakes ? `${mistakes} slip${mistakes > 1 ? "s" : ""} — each one taught the game what to bring back for you later. 💪` : "Great run!")),
          el("div", { class: "row mt", style: "justify-content:center" },
            nm ? el("button", { class: "btn-primary", onclick: () => mission(nm) }, "Next mission ➜") : null,
            el("button", { onclick: worlds }, "🗺️ World map"),
            el("button", { onclick: menu }, "🏠 Menu"))),
        nav());
    }

    showStep();
  }

  /* ========== QUICK CHALLENGE / runner ========== */
  function quick() {
    const p = State.player();
    screen("quick",
      el("h1", { class: "center mb" }, "⚡ Quick Challenge"),
      el("div", { class: "panel" },
        el("p", {}, "Five questions picked just for you — the game favors topics you haven't seen, got wrong, or are due for a memory refresh."),
        el("div", { class: "center mt" },
          el("button", { class: "btn-primary", onclick: () => quickRun(SRS.pickQuestions(p, 5), "⚡ Quick Challenge") }, "Start · ~5 min"))),
      el("div", { class: "panel" },
        el("div", { class: "spread" },
          el("div", {}, el("b", {}, "🌞 Daily Challenge"), el("div", { class: "small muted" }, p.daily.doneToday ? "Complete! Come back tomorrow." : "Same 5 questions for everyone today.")),
          p.daily.doneToday ? el("span", { class: "chip mastered" }, "DONE") :
            el("button", { class: "btn-sm", onclick: () => quickRun(SRS.dailyQuestions(p, 5), "🌞 Daily Challenge", true) }, "Play"))));
  }

  function quickRun(questions, title, isDaily = false) {
    const p = State.player();
    let i = 0, right = 0;
    function show() {
      if (i >= questions.length) {
        if (isDaily) { p.daily.doneToday = true; Storage.save(); State.addXP(right === questions.length ? 20 : 10); }
        render(hud(),
          el("div", { class: "panel glow center" },
            el("div", { style: "font-size:2.6em" }, right === questions.length ? "🏆" : right >= 3 ? "🎉" : "💪"),
            el("h2", {}, `${right}/${questions.length} correct`),
            el("p", { class: "muted" }, right === questions.length ? "Perfect round!" : right >= 3 ? "Solid work — misses go into your weak-area training." : "No stress — these topics will come back as mini-puzzles until they stick."),
            el("div", { class: "row mt", style: "justify-content:center" },
              el("button", { class: "btn-primary", onclick: quick }, "Again"),
              el("button", { onclick: menu }, "🏠 Menu"))),
          nav());
        return;
      }
      const q = questions[i];
      render(hud(),
        el("div", { class: "panel", style: "padding:12px 16px" },
          el("div", { class: "spread" }, el("b", {}, title), el("span", { class: "muted small" }, `${i + 1}/${questions.length}`)),
          el("div", { class: "mt" }, pbar((i / questions.length) * 100))),
        el("div", { class: "panel" }, Puzzles.renderQuestion(q, res => { if (res.correct) right++; i++; show(); })));
    }
    show();
  }

  /* ========== WEAK AREAS ========== */
  function weak() {
    const p = State.player();
    const weaks = SRS.weakObjectives(p);
    const nodes = [el("h1", { class: "center mb" }, "🎯 Weak-Area Training")];
    if (!weaks.length) {
      nodes.push(el("div", { class: "panel center" },
        el("div", { style: "font-size:2.6em" }, "🧘"),
        el("p", {}, "Nothing is flagged as weak right now."),
        el("p", { class: "muted small" }, "Play missions and quick challenges — anything you struggle with (or that's due for a memory check) appears here automatically."),
        el("button", { class: "btn-primary mt", onclick: () => go("quick") }, "⚡ Quick Challenge instead")));
    } else {
      nodes.push(el("p", { class: "center muted small" }, "The game tracked these topics from your answers. Each drill: a quick re-explanation, then targeted practice."));
      weaks.slice(0, 8).forEach(wk => {
        const o = wk.obj;
        nodes.push(el("div", { class: "card click mb", onclick: () => drill(o.id) },
          el("div", { class: "spread" },
            el("div", {},
              el("span", { class: `chip ${wk.weak ? "weak" : "practising"}` }, wk.weak ? "NEEDS WORK" : "DUE FOR REVIEW"),
              el("div", { class: "mt", style: "font-weight:600" }, o.text),
              el("div", { class: "small muted" }, OBJ_INDEX[o.id].domain.name)),
            el("span", {}, "➜"))));
      });
    }
    screen("weak", ...nodes);
  }

  function drill(objId) {
    const p = State.player();
    const qs = UI.shuffle(QUESTION_BANK.filter(q => q.obj === objId)).slice(0, 3);
    let phase = 0;
    function show() {
      if (phase === 0) {
        render(hud(),
          el("div", { class: "panel" }, Puzzles.renderLesson(objId, () => { phase = 1; show(); })),
          nav());
      } else if (qs.length) {
        quickRun(qs, "🎯 Weak-Area Drill");
      } else {
        toast("No bank questions for this topic yet — reviewed the intel instead. ✅");
        weak();
      }
    }
    show();
  }
  /* ========== EXAM SIMULATION ========== */
  const DOMAIN_WEIGHT = { d1: 0.225, d2: 0.275, d3: 0.175, d4: 0.175, d5: 0.125 };

  function exam() {
    const p = State.player();
    const gauntlet = allMissionsDone(p);
    const history = p.exams.slice(-5).reverse();
    screen("exam",
      el("h1", { class: "center mb" }, "📝 Exam Simulation"),
      el("div", { class: "panel" },
        el("p", {}, "Scenario-based practice built like the real thing: every MD-102 domain, weighted like the official exam, with explanations for every answer."),
        el("p", { class: "small warn" }, "⚠️ Practice scores are estimates to guide your study — they are not a guarantee of passing the actual Microsoft exam."),
        el("div", { class: "grid2 mt" },
          el("div", { class: "card center" },
            el("h3", {}, "⚡ Focus Test"),
            el("p", { class: "small muted" }, "15 questions · no timer"),
            el("button", { class: "btn-primary mt", onclick: () => examRun(15, false, false) }, "Start")),
          el("div", { class: "card center" },
            el("h3", {}, "⏱️ Timed Practice"),
            el("p", { class: "small muted" }, "30 questions · 45 minutes"),
            el("button", { class: "btn-primary mt", onclick: () => examRun(30, true, false) }, "Start"))),
        el("div", { class: `card center mt ${gauntlet ? "" : "locked"}` },
          el("h3", { class: "neon" }, "🏆 Certification Gauntlet"),
          el("p", { class: "small muted" }, gauntlet ? "40 questions · 60 minutes · the final challenge" : "🔒 Complete all missions in all 5 worlds to unlock"),
          gauntlet ? el("button", { class: "btn-primary mt", onclick: () => examRun(40, true, true) }, "Enter") : null)),
      history.length ? el("div", { class: "panel" },
        el("h3", { class: "mb" }, "Recent results"),
        ...history.map(e => el("div", { class: "spread card mb" },
          el("span", {}, `${e.final ? "🏆" : "📝"} ${new Date(e.date).toLocaleDateString()} · ${e.n} questions`),
          el("b", { class: e.pct >= 70 ? "good" : "warn" }, e.pct + "%")))) : null);
  }

  function sampleExam(n) {
    const picks = [];
    for (const d of MD102_OBJECTIVES) {
      const pool = UI.shuffle(QUESTION_BANK.filter(q => OBJ_INDEX[q.obj]?.domain.id === d.id));
      picks.push(...pool.slice(0, Math.max(1, Math.round(n * DOMAIN_WEIGHT[d.id]))));
    }
    return UI.shuffle(picks).slice(0, n);
  }

  function examRun(n, timed, final) {
    const p = State.player();
    const qs = sampleExam(n);
    const answers = []; // {q, correct}
    let i = 0;
    let secs = timed ? (final ? 60 : 45) * 60 : 0;
    let timerId = null;
    if (timed) {
      timerId = setInterval(() => {
        secs--;
        const t = document.getElementById("exam-timer");
        if (t) t.textContent = `${String(Math.floor(secs / 60)).padStart(2, "0")}:${String(secs % 60).padStart(2, "0")}`;
        if (secs <= 0) { clearInterval(timerId); results(); }
      }, 1000);
    }
    function quit() {
      UI.confirm("Leave the exam? Progress on this attempt won't be saved.", () => { if (timerId) clearInterval(timerId); exam(); });
    }
    function show() {
      if (i >= qs.length) return results();
      const q = qs[i];
      render(
        el("div", { class: "panel", style: "padding:12px 16px" },
          el("div", { class: "spread" },
            el("b", {}, final ? "🏆 Certification Gauntlet" : "📝 Exam Simulation"),
            el("div", { class: "row" },
              timed ? el("span", { class: "timer", id: "exam-timer" }, "--:--") : null,
              el("button", { class: "btn-sm btn-ghost", onclick: quit }, "✕"))),
          el("div", { class: "mt" }, pbar((i / qs.length) * 100)),
          el("div", { class: "small muted mt" }, `Question ${i + 1} of ${qs.length} · ${OBJ_INDEX[q.obj].domain.name}`)),
        el("div", { class: "panel" }, Puzzles.renderQuestion(q, res => {
          answers.push({ q, correct: !!res.correct });
          SRS.reportQuestion(p, q, !!res.correct);
          i++; show();
        }, true)));
    }
    function results() {
      if (timerId) clearInterval(timerId);
      const total = answers.length;
      const right = answers.filter(a => a.correct).length;
      const pct = total ? Math.round((right / total) * 100) : 0;
      p.exams.push({ date: Date.now(), n: total, pct, final });
      Storage.save();
      State.addXP(20 + right * 2);
      State.checkBadges();
      // per-domain breakdown
      const byDomain = MD102_OBJECTIVES.map(d => {
        const dAns = answers.filter(a => OBJ_INDEX[a.q.obj].domain.id === d.id);
        return { d, n: dAns.length, right: dAns.filter(a => a.correct).length };
      }).filter(x => x.n > 0);
      const weakest = [...byDomain].sort((a, b) => (a.right / a.n) - (b.right / b.n))[0];
      const wrongObjs = [...new Set(answers.filter(a => !a.correct).map(a => a.q.obj))];
      render(hud(),
        el("div", { class: "panel glow center" },
          el("div", { style: "font-size:2.6em" }, pct >= 80 ? "🏆" : pct >= 70 ? "🎉" : "📚"),
          el("h1", {}, `${pct}%`),
          el("p", { class: "muted" }, `${right} of ${total} correct · ${pct >= 70 ? "That's passing territory on the real exam (700/1000)." : "Below the ~70% passing line — your revision plan is below."}`),
          el("p", { class: "small warn" }, "Practice estimate only — not a guarantee of the real exam result.")),
        el("div", { class: "panel" },
          el("h3", { class: "mb" }, "Score by exam domain"),
          ...byDomain.map(x => el("div", { class: "mb" },
            el("div", { class: "spread small" }, el("span", {}, x.d.name), el("b", { class: x.right / x.n >= 0.7 ? "good" : "warn" }, `${x.right}/${x.n}`)),
            pbar((x.right / x.n) * 100, "thin " + (x.right / x.n >= 0.7 ? "green" : ""))))),
        el("div", { class: "panel" },
          el("h3", { class: "mb" }, "📋 Recommended next steps"),
          weakest && weakest.right / weakest.n < 1 ? el("p", { class: "small", html: `Weakest domain: <b>${weakest.d.name}</b> — revisit World ${WORLDS.findIndex(w => w.domain === weakest.d.id) + 1} (${WORLDS.find(w => w.domain === weakest.d.id).name}).` }) : el("p", { class: "small good" }, "Every domain looks strong. 💪"),
          wrongObjs.length ? el("div", {},
            el("p", { class: "small muted" }, "Missed objectives (added to your weak-area training):"),
            ...wrongObjs.slice(0, 6).map(o => el("div", { class: "small mb" }, `• ${objName(o)}`)),
            el("button", { class: "btn-primary mt", onclick: () => go("weak") }, "🎯 Train weak areas")) : null),
        el("div", { class: "center mt mb" },
          el("button", { onclick: () => go("exam") }, "Back to exams"),
          " ",
          el("button", { onclick: menu }, "🏠 Menu")),
        nav());
    }
    show();
  }

  /* ========== PROGRESS / COVERAGE DASHBOARD ========== */
  function progress() {
    const p = State.player();
    const li = State.levelInfo();
    const cov = SRS.coverage(p);
    const totalObjs = cov.reduce((a, c) => a + c.total, 0);
    const counts = { ns: 0, learning: 0, practising: 0, mastered: 0 };
    cov.forEach(c => Object.keys(counts).forEach(k => counts[k] += c.counts[k]));
    const acc = p.counters.answers ? Math.round((p.counters.correct / p.counters.answers) * 100) : 0;
    const missionsDone = Object.values(p.missions).filter(m => m.done).length;
    const totalMissions = WORLDS.reduce((a, w) => a + w.missions.length, 0);

    const statPanel = el("div", { class: "panel" },
      el("div", { class: "spread" },
        el("div", {}, el("h2", { class: "neon" }, `Level ${li.lv}`), el("div", { class: "muted" }, li.title)),
        el("div", { class: "center" }, el("h2", {}, `${p.xp}`), el("div", { class: "small muted" }, "XP"))),
      pbar(li.pct), el("div", { class: "small muted mt" }, `${li.next - p.xp} XP to level ${li.lv + 1}`),
      el("div", { class: "grid2 mt" },
        el("div", { class: "card center" }, el("h3", {}, `${missionsDone}/${totalMissions}`), el("div", { class: "small muted" }, "Missions")),
        el("div", { class: "card center" }, el("h3", {}, `${acc}%`), el("div", { class: "small muted" }, `Accuracy (${p.counters.answers} answers)`)),
        el("div", { class: "card center" }, el("h3", {}, `🔥 ${p.daily.streak}`), el("div", { class: "small muted" }, `Day streak (best ${p.daily.best}) — never punished!`)),
        el("div", { class: "card center" }, el("h3", {}, `🏅 ${p.badges.length}/${State.BADGES.length}`), el("div", { class: "small muted" }, "Badges"))));

    // Coverage tracker
    const covPanel = el("div", { class: "panel" },
      el("h2", { class: "mb" }, "📚 MD-102 Exam Coverage Tracker"),
      el("p", { class: "small muted" }, `All ${totalObjs} official sub-objectives (study guide, Oct 2026). Status: Not started → Learning → Practising → Mastered. Mastery requires demonstrated correct answers over time — not just reading.`),
      el("div", { class: "row mb" },
        el("span", { class: "chip ns" }, `${counts.ns} not started`),
        el("span", { class: "chip learning" }, `${counts.learning} learning`),
        el("span", { class: "chip practising" }, `${counts.practising} practising`),
        el("span", { class: "chip mastered" }, `${counts.mastered} mastered`)));
    cov.forEach(c => {
      const det = el("details", { class: "card mb" });
      det.appendChild(el("summary", { style: "cursor:pointer" },
        el("b", {}, `${c.domain.name} `),
        el("span", { class: "small muted" }, `(${c.domain.weight[0]}–${c.domain.weight[1]}%) · readiness ${c.pct}%`)));
      det.appendChild(el("div", { class: "mt" }, pbar(c.pct, "thin")));
      c.domain.groups.forEach(g => {
        det.appendChild(el("div", { class: "small mt", style: "font-weight:600;color:var(--purple)" }, g.name));
        g.objectives.forEach(o => {
          const st = SRS.status(p, o.id);
          const lbl = { ns: "Not started", learning: "Learning", practising: "Practising", mastered: "Mastered" }[st];
          det.appendChild(el("div", { class: "spread small", style: "padding:4px 0;border-bottom:1px solid var(--line)" },
            el("span", { style: "flex:1" }, o.text),
            el("span", { class: `chip ${st}` }, lbl)));
        });
      });
      covPanel.appendChild(det);
    });

    // Badges
    const badgePanel = el("div", { class: "panel" },
      el("h2", { class: "mb" }, "🏅 Achievements"),
      el("div", { class: "badge-grid" },
        ...State.BADGES.map(b => el("div", { class: `card badge-card ${p.badges.includes(b.id) ? "" : "locked"}` },
          el("div", { class: "b-ico" }, b.ico),
          el("div", { class: "small", style: "font-weight:600" }, b.name),
          el("div", { class: "small muted" }, b.desc)))));

    // What you've learned
    const learned = Object.keys(p.lessonsRead);
    const learnedPanel = el("div", { class: "panel" },
      el("h2", { class: "mb" }, "🧠 Intel collected"),
      learned.length ? el("p", { class: "small muted" }, `You've studied ${learned.length} intel cards. Tap any topic in the tracker above to see its status.`) :
        el("p", { class: "small muted" }, "Play missions to collect intel cards — they'll be listed here."));

    screen("progress", el("h1", { class: "center mb" }, "📊 My Progress"), statPanel, covPanel, badgePanel, learnedPanel);
  }

  /* ========== SETTINGS ========== */
  function settings() {
    const p = State.player();
    function tgl(label, desc, key, onchange) {
      const b = el("button", { class: "card click mb", style: "width:100%;text-align:left" },
        el("div", { class: "spread" },
          el("div", {}, el("b", {}, label), el("div", { class: "small muted" }, desc)),
          el("span", { style: "font-size:1.3em" }, p.settings[key] ? "🟢" : "⚪")));
      b.addEventListener("click", () => {
        p.settings[key] = !p.settings[key]; Storage.save();
        if (onchange) onchange();
        settings();
      });
      return b;
    }
    screen("settings",
      el("h1", { class: "center mb" }, "⚙️ Settings"),
      el("div", { class: "panel" },
        tgl("🔊 Sound effects", "Blips and chimes for answers and rewards", "sound"),
        tgl("🎵 Ambient music", "A gentle synth pad while you play", "music", () => Audio.syncMusic()),
        tgl("🌀 Animations", "Turn off for a calmer, reduced-motion experience", "motion", applySettings),
        tgl("🧘 Focus mode", "Hides streaks, badges and extras — just you and the puzzle", "focus", applySettings),
        tgl("🔎 Larger text", "Increases the base font size", "bigtext", applySettings)),
      el("div", { class: "panel" },
        el("h3", { class: "mb" }, "Data"),
        el("p", { class: "small muted" }, "Everything saves automatically to this browser. No accounts, no cloud."),
        el("button", { class: "btn-sm", style: "border-color:var(--red);color:var(--red)", onclick: () =>
          UI.confirm("Reset ALL progress? This cannot be undone.", () => { Storage.reset(); State.init(); applySettings(); menu(); toast("Fresh start! 🌱"); }) }, "🗑️ Reset all progress")),
      el("div", { class: "panel small muted" },
        el("p", {}, "MD-102: Endpoint Escape is an independent study game. Practice questions are original and aligned to Microsoft's official MD-102 study guide (skills as of October 27, 2026). It is not affiliated with or endorsed by Microsoft. Verify details against official docs before your exam.")));
  }

  function applySettings() {
    const s = State.player().settings;
    document.documentElement.dataset.motion = s.motion ? "1" : "0";
    document.documentElement.dataset.focus = s.focus ? "1" : "0";
    document.documentElement.dataset.bigtext = s.bigtext ? "1" : "0";
  }

  /* ========== ROUTER ========== */
  function go(name) {
    Audio.play("click");
    ({ menu, worlds, quick, weak, exam, progress, settings }[name] || menu)();
  }

  return { go, menu, worlds, mission, worldDone, applySettings };
})();
