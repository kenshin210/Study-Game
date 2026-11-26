/* ============ PUZZLE ENGINE ============
   Renders every step type. All puzzles share:
   - 3-level hint system (gentle → specific → guided)
   - instant feedback with explanations (never shaming)
   - XP awards reported through onDone(result)            */

const Puzzles = (() => {
  const { el, shuffle, esc } = UI;

  function baseXP(d) { return 8 + 4 * (d || 1); }

  /* ---------- Hint system ---------- */
  function hintButton(q, applyGuided) {
    let used = 0;
    const generic = [
      "Take a breath and re-read the scenario — one detail is the key. 💡",
      "Eliminate the options that clearly don't fit, then compare what's left.",
    ];
    const btn = el("button", { class: "btn-hint btn-sm" }, "💡 Hint");
    const box = el("div", { class: "lesson-box", style: "display:none" });
    btn.addEventListener("click", () => {
      Audio.play("click");
      used++;
      State.player().counters.hintsUsed++; Storage.save();
      box.style.display = "block";
      const hints = q.hints || [];
      if (used === 1) box.innerHTML = `<b>Hint 1:</b> ${hints[0] || generic[0]}`;
      else if (used === 2) box.innerHTML = `<b>Hint 2:</b> ${hints[1] || hints[0] || generic[1]}`;
      else {
        box.innerHTML = `<b>Hint 3:</b> Let me guide you closer…`;
        if (applyGuided) applyGuided(box);
        btn.disabled = true;
      }
      if (used >= 3) btn.disabled = true;
    });
    return { btn, box, getUsed: () => used };
  }

  /* ---------- Feedback ---------- */
  function feedback(ok, html) {
    return el("div", { class: `feedback ${ok ? "ok" : "no"}`, html: `${ok ? "✅ <b>Correct!</b>" : "❌ <b>Not quite.</b>"} ${html}` });
  }

  function finish(container, q, ok, hintsUsed, onDone, extraHtml = "") {
    Audio.play(ok ? "correct" : "wrong");
    const xp = ok ? Math.max(4, baseXP(q.d) - hintsUsed * 3) : 0;
    container.appendChild(feedback(ok, (q.explain || "") + extraHtml));
    const btn = el("button", { class: "btn-primary mt", onclick: () => onDone({ correct: ok, xp }) }, "Continue ➜");
    container.appendChild(el("div", { class: "center mt" }, btn));
    btn.focus();
    if (q.obj) {
      if (q.id) SRS.reportQuestion(State.player(), q, ok);
      else {
        const p = State.player();
        p.counters.answers++; if (ok) p.counters.correct++;
        SRS.report(p, q.obj, ok);
      }
    }
    if (ok && xp) State.addXP(xp, btn);
    State.checkBadges();
  }

  /* ---------- Multiple choice / true-false ---------- */
  function renderMC(q, onDone, exam) {
    const wrap = el("div");
    wrap.appendChild(el("h3", { html: q.q, class: "mb" }));
    const choices = q.type === "tf" ? ["✔️ True", "✖️ False"] : q.choices;
    const correctIdx = q.type === "tf" ? (q.answer ? 0 : 1) : q.answer;
    const btns = [];
    const h = hintButton(q, () => {
      // Guided: eliminate wrong options until two remain
      let wrong = btns.map((b, i) => i).filter(i => i !== correctIdx && !btns[i].disabled);
      while (wrong.length > 1) { const i = wrong.shift(); btns[i].disabled = true; btns[i].style.opacity = 0.3; }
    });
    choices.forEach((c, i) => {
      const b = el("button", { class: "choice", html: c });
      b.addEventListener("click", () => {
        if (exam) { onDone({ answered: i, correct: i === correctIdx }); return; }
        btns.forEach(x => x.disabled = true);
        b.classList.add(i === correctIdx ? "correct" : "wrong");
        if (i !== correctIdx) btns[correctIdx].classList.add("reveal");
        h.btn.disabled = true;
        finish(wrap, q, i === correctIdx, h.getUsed(), onDone);
      });
      btns.push(b); wrap.appendChild(b);
    });
    if (!exam) { wrap.appendChild(el("div", { class: "row mt" }, h.btn)); wrap.appendChild(h.box); }
    return wrap;
  }

  /* ---------- Multiple select ---------- */
  function renderMulti(q, onDone, exam) {
    const wrap = el("div");
    wrap.appendChild(el("h3", { html: q.q, class: "mb" }));
    wrap.appendChild(el("p", { class: "muted small" }, "Select every answer that applies, then confirm."));
    const sel = new Set(); const btns = [];
    q.choices.forEach((c, i) => {
      const b = el("button", { class: "choice", html: c });
      b.addEventListener("click", () => {
        if (b.disabled) return;
        Audio.play("click");
        sel.has(i) ? sel.delete(i) : sel.add(i);
        b.classList.toggle("sel");
      });
      btns.push(b); wrap.appendChild(b);
    });
    const h = hintButton(q, box => { box.innerHTML += ` There are <b>${q.answer.length}</b> correct answers.`; });
    const confirm = el("button", { class: "btn-primary" }, "Confirm selection");
    confirm.addEventListener("click", () => {
      if (sel.size === 0) { UI.toast("Pick at least one option first 🙂"); return; }
      const ok = q.answer.length === sel.size && q.answer.every(i => sel.has(i));
      if (exam) { onDone({ answered: [...sel], correct: ok }); return; }
      btns.forEach((b, i) => {
        b.disabled = true;
        if (q.answer.includes(i)) b.classList.add(sel.has(i) ? "correct" : "reveal");
        else if (sel.has(i)) b.classList.add("wrong");
      });
      confirm.remove(); h.btn.disabled = true;
      finish(wrap, q, ok, h.getUsed(), onDone);
    });
    const row = el("div", { class: "row mt" }, confirm);
    if (!exam) { row.appendChild(h.btn); }
    wrap.appendChild(row);
    if (!exam) wrap.appendChild(h.box);
    return wrap;
  }

  /* ---------- Match (drag & drop + tap) ---------- */
  function renderMatch(q, onDone, exam) {
    const wrap = el("div");
    wrap.appendChild(el("h3", { html: q.q, class: "mb" }));
    wrap.appendChild(el("p", { class: "muted small" }, "Drag each card onto its slot — or tap a card, then tap a slot."));
    const items = shuffle(q.pairs.map(p => p[0]));
    const placements = {}; // slotIdx -> itemText
    let selected = null;
    const pool = el("div", { class: "row mb" });
    const slotsWrap = el("div");
    const itemEls = {};

    function sync() {
      // pool items: hide placed
      for (const [txt, node] of Object.entries(itemEls)) {
        const placed = Object.values(placements).includes(txt);
        node.classList.toggle("placed", placed);
      }
      checkBtn.disabled = Object.keys(placements).length !== q.pairs.length;
    }

    items.forEach(txt => {
      const it = el("div", { class: "match-item", draggable: "true", html: txt });
      it.addEventListener("click", () => {
        if (it.classList.contains("placed")) return;
        Audio.play("click");
        document.querySelectorAll(".match-item.sel").forEach(x => x.classList.remove("sel"));
        selected = selected === txt ? null : txt;
        if (selected === txt) it.classList.add("sel");
      });
      it.addEventListener("dragstart", e => { e.dataTransfer.setData("text/plain", txt); it.classList.add("dragging"); });
      it.addEventListener("dragend", () => it.classList.remove("dragging"));
      itemEls[txt] = it;
      pool.appendChild(it);
    });

    q.pairs.forEach((p, si) => {
      const slot = el("div", { class: "match-slot" },
        el("div", { class: "slot-label" }, p[1]),
        el("div", { class: "slot-content" }));
      function place(txt) {
        // remove txt from any other slot
        for (const k of Object.keys(placements)) if (placements[k] === txt) { delete placements[k]; refreshSlot(+k); }
        placements[si] = txt; refreshSlot(si);
        selected = null;
        document.querySelectorAll(".match-item.sel").forEach(x => x.classList.remove("sel"));
        sync();
      }
      function refreshSlot(idx) {
        const s = slotsWrap.children[idx]; if (!s) return;
        const content = s.querySelector(".slot-content");
        content.innerHTML = "";
        s.classList.toggle("filled", placements[idx] != null);
        if (placements[idx] != null) {
          const pill = el("span", { class: "pill", html: placements[idx] + " ✕" });
          pill.addEventListener("click", e => { e.stopPropagation(); delete placements[idx]; refreshSlot(idx); sync(); });
          content.appendChild(pill);
        }
      }
      slot.addEventListener("click", () => { if (selected) place(selected); });
      slot.addEventListener("dragover", e => { e.preventDefault(); slot.classList.add("over"); });
      slot.addEventListener("dragleave", () => slot.classList.remove("over"));
      slot.addEventListener("drop", e => { e.preventDefault(); slot.classList.remove("over"); place(e.dataTransfer.getData("text/plain")); });
      slot._refresh = () => refreshSlot(si);
      slotsWrap.appendChild(slot);
    });

    const h = hintButton(q, () => {
      // Guided: auto-place the first unplaced correct pair
      for (let si = 0; si < q.pairs.length; si++) {
        if (placements[si] !== q.pairs[si][0]) {
          for (const k of Object.keys(placements)) if (placements[k] === q.pairs[si][0]) { delete placements[k]; slotsWrap.children[k]._refresh(); }
          placements[si] = q.pairs[si][0];
          slotsWrap.children[si]._refresh();
          sync();
          break;
        }
      }
    });
    const checkBtn = el("button", { class: "btn-primary", disabled: true }, "Check matches");
    checkBtn.addEventListener("click", () => {
      let allOk = true;
      q.pairs.forEach((p, si) => {
        const ok = placements[si] === p[0];
        slotsWrap.children[si].classList.add(ok ? "correct" : "wrong");
        if (!ok) allOk = false;
      });
      if (exam) { onDone({ correct: allOk }); return; }
      if (!allOk) {
        // show correct mapping
        q.pairs.forEach((p, si) => {
          const s = slotsWrap.children[si];
          if (placements[si] !== p[0]) s.querySelector(".slot-content").innerHTML = `<span class="pill bad">${esc(placements[si]||"—")}</span> → should be <b class="good">${esc(p[0])}</b>`;
        });
      }
      checkBtn.remove(); h.btn.disabled = true;
      pool.querySelectorAll(".match-item").forEach(x => x.style.pointerEvents = "none");
      finish(wrap, q, allOk, h.getUsed(), onDone);
    });
    wrap.appendChild(pool);
    wrap.appendChild(slotsWrap);
    const row = el("div", { class: "row mt" }, checkBtn);
    if (!exam) row.appendChild(h.btn);
    wrap.appendChild(row);
    if (!exam) wrap.appendChild(h.box);
    sync();
    return wrap;
  }

  /* ---------- Order ---------- */
  function renderOrder(q, onDone, exam) {
    const wrap = el("div");
    wrap.appendChild(el("h3", { html: q.q, class: "mb" }));
    wrap.appendChild(el("p", { class: "muted small" }, "Use the arrows to arrange the steps top-to-bottom."));
    let items = shuffle(q.items);
    if (items.every((x, i) => x === q.items[i])) items = [...items].reverse(); // never pre-solved
    const list = el("div");
    function draw() {
      list.innerHTML = "";
      items.forEach((txt, i) => {
        const up = el("button", { class: "btn-sm", disabled: i === 0 }, "▲");
        const down = el("button", { class: "btn-sm", disabled: i === items.length - 1 }, "▼");
        up.addEventListener("click", () => { Audio.play("click"); [items[i - 1], items[i]] = [items[i], items[i - 1]]; draw(); });
        down.addEventListener("click", () => { Audio.play("click"); [items[i + 1], items[i]] = [items[i], items[i + 1]]; draw(); });
        list.appendChild(el("div", { class: "order-item" },
          el("span", { class: "num" }, String(i + 1)),
          el("span", { html: txt }),
          el("span", { class: "arrows" }, up, down)));
      });
    }
    draw();
    const h = hintButton(q, () => {
      // Guided: put the first step in place
      const first = q.items[0];
      items = [first, ...items.filter(x => x !== first)];
      draw();
    });
    const checkBtn = el("button", { class: "btn-primary" }, "Check order");
    checkBtn.addEventListener("click", () => {
      const ok = items.every((x, i) => x === q.items[i]);
      if (exam) { onDone({ correct: ok }); return; }
      [...list.children].forEach((node, i) => node.classList.add(items[i] === q.items[i] ? "correct" : "wrong"));
      list.querySelectorAll("button").forEach(b => b.disabled = true);
      checkBtn.remove(); h.btn.disabled = true;
      const extra = ok ? "" : `<div class="mt small"><b>Correct order:</b><ol style="margin-left:1.2em">${q.items.map(x => `<li>${x}</li>`).join("")}</ol></div>`;
      finish(wrap, q, ok, h.getUsed(), onDone, extra);
    });
    wrap.appendChild(list);
    const row = el("div", { class: "row mt" }, checkBtn);
    if (!exam) row.appendChild(h.btn);
    wrap.appendChild(row);
    if (!exam) wrap.appendChild(h.box);
    return wrap;
  }

  /* ---------- Type-in ---------- */
  function norm(s) { return s.toLowerCase().trim().replace(/[.,;:!?'"]+$/g, "").replace(/\s+/g, " "); }
  function renderTypein(q, onDone, exam) {
    const wrap = el("div");
    wrap.appendChild(el("h3", { html: q.q, class: "mb" }));
    const input = el("input", { type: "text", placeholder: q.placeholder || "Type your answer…", autocomplete: "off", spellcheck: "false" });
    const h = hintButton(q, box => {
      box.innerHTML += ` It starts with: <b>${esc(q.answers[0].slice(0, 4))}…</b>`;
    });
    const submit = el("button", { class: "btn-primary" }, "Submit");
    function doCheck() {
      const val = norm(input.value);
      if (!val) return;
      const ok = q.answers.some(a => norm(a) === val);
      if (exam) { onDone({ answered: input.value, correct: ok }); return; }
      input.disabled = true; submit.remove(); h.btn.disabled = true;
      input.style.borderColor = ok ? "var(--green)" : "var(--red)";
      const extra = ok ? "" : ` <div class="mt small">Accepted answer: <b class="good">${esc(q.answers[0])}</b></div>`;
      finish(wrap, q, ok, h.getUsed(), onDone, extra);
    }
    submit.addEventListener("click", doCheck);
    input.addEventListener("keydown", e => { if (e.key === "Enter") doCheck(); });
    wrap.appendChild(input);
    const row = el("div", { class: "row mt" }, submit);
    if (!exam) row.appendChild(h.btn);
    wrap.appendChild(row);
    if (!exam) wrap.appendChild(h.box);
    setTimeout(() => input.focus(), 50);
    return wrap;
  }

  /* ---------- Lesson (intel card) ---------- */
  function renderLesson(objId, onDone) {
    const L = LESSONS[objId];
    const wrap = el("div");
    if (!L) { onDone({ correct: true, xp: 0 }); return wrap; }
    wrap.appendChild(el("div", { class: "clue-tag" }, "📡 Intel Card — " + objId));
    wrap.appendChild(el("h2", { class: "neon-p mb" }, L.title));
    const box = el("div", { class: "lesson-box" },
      el("div", { class: "lesson-row", html: `<b>What:</b> ${L.what}` }),
      el("div", { class: "lesson-row", html: `<b>Why it matters:</b> ${L.why}` }),
      el("div", { class: "lesson-row", html: `<b>How:</b> ${L.how}` }),
      el("div", { class: "lesson-row", html: `<b>⚠️ Watch out:</b> ${L.gotcha}` }),
      el("div", { class: "lesson-row", html: `<b>🎓 Exam angle:</b> ${L.exam}` }),
    );
    wrap.appendChild(box);
    const btn = el("button", { class: "btn-primary mt" }, "Got it — let's go ➜");
    btn.addEventListener("click", () => {
      const p = State.player();
      const firstRead = !p.lessonsRead[objId];
      p.lessonsRead[objId] = true; Storage.save();
      if (firstRead) State.addXP(5, btn);
      State.checkBadges();
      onDone({ correct: true, xp: firstRead ? 5 : 0 });
    });
    wrap.appendChild(el("div", { class: "center" }, btn));
    return wrap;
  }

  /* ---------- Detective ---------- */
  function renderDetective(step, onDone) {
    const wrap = el("div");
    wrap.appendChild(el("div", { class: "clue-tag" }, "🕵️ Detective Case"));
    wrap.appendChild(el("div", { class: "panel", html: step.scenario }));
    wrap.appendChild(el("p", { class: "muted small" }, "Click the evidence to investigate. Examine at least two clues before diagnosing."));
    let opened = 0;
    const diagBtn = el("button", { class: "btn-primary", disabled: true }, "🔍 Make your diagnosis");
    step.clues.forEach(c => {
      const clue = el("button", { class: "clue" },
        el("span", {}, "🔎 " + c.label),
        el("div", { class: "clue-info", html: c.info }));
      clue.addEventListener("click", () => {
        if (clue.classList.contains("open")) return;
        Audio.play("unlock");
        clue.classList.add("open");
        opened++;
        if (opened >= 2) { diagBtn.disabled = false; diagBtn.classList.add("pulse"); }
      });
      wrap.appendChild(clue);
    });
    const diagArea = el("div");
    diagBtn.addEventListener("click", () => {
      diagBtn.remove();
      const q = { obj: step.obj, type: "mc", d: 2, q: step.question, choices: step.choices, answer: step.answer, explain: step.explain, hints: step.hints };
      diagArea.appendChild(renderMC(q, res => {
        if (res.correct) { const p = State.player(); p.counters.detectives++; Storage.save(); State.checkBadges(); }
        onDone(res);
      }));
    });
    wrap.appendChild(el("div", { class: "center mt" }, diagBtn));
    wrap.appendChild(diagArea);
    return wrap;
  }

  /* ---------- Config builder ---------- */
  function renderConfig(step, onDone) {
    const wrap = el("div");
    wrap.appendChild(el("div", { class: "clue-tag" }, "🛠️ Configuration Console"));
    wrap.appendChild(el("div", { class: "panel", html: step.intro }));
    const slotEls = [];
    step.slots.forEach(s => {
      const sel = el("select",{},
        el("option", { value: "-1" }, "— choose —"),
        ...s.options.map((o, i) => el("option", { value: String(i) }, o)));
      const box = el("div", { class: "cfg-slot" }, el("b", {}, s.label), sel, el("div", { class: "small mt cfg-why" }));
      slotEls.push({ box, sel, s });
      wrap.appendChild(box);
    });
    const h = hintButton({ hints: step.hints }, () => {
      // Guided: solve the first unsolved slot
      for (const se of slotEls) {
        if (+se.sel.value !== se.s.correct) { se.sel.value = String(se.s.correct); se.box.querySelector(".cfg-why").innerHTML = `💡 ${se.s.why}`; break; }
      }
    });
    let attempts = 0;
    const apply = el("button", { class: "btn-primary" }, "⚡ Apply configuration");
    apply.addEventListener("click", () => {
      if (slotEls.some(se => se.sel.value === "-1")) { UI.toast("Choose an option for every setting first 🙂"); return; }
      attempts++;
      let allOk = true;
      slotEls.forEach(se => {
        const ok = +se.sel.value === se.s.correct;
        se.box.classList.remove("correct", "wrong");
        se.box.classList.add(ok ? "correct" : "wrong");
        se.box.querySelector(".cfg-why").innerHTML = ok ? `✅ ${se.s.why}` : `❌ Not this one — review and adjust.`;
        if (ok) se.sel.disabled = true;
        else allOk = false;
      });
      if (allOk) {
        Audio.play("complete");
        apply.remove(); h.btn.disabled = true;
        const xp = Math.max(6, 20 - (attempts - 1) * 4 - h.getUsed() * 3);
        const p = State.player(); p.counters.configs++; Storage.save();
        if (step.obj) SRS.report(p, step.obj, attempts === 1);
        wrap.appendChild(feedback(true, `${step.explain} <div class="mt small">System configured in ${attempts} attempt${attempts > 1 ? "s" : ""}.</div>`));
        const btn = el("button", { class: "btn-primary mt", onclick: () => onDone({ correct: attempts === 1, xp }) }, "Continue ➜");
        wrap.appendChild(el("div", { class: "center" }, btn));
        State.addXP(xp, btn);
        State.checkBadges();
      } else {
        Audio.play("wrong");
        UI.toast("Some settings are off — the red panels need another look. You've got this! 💪");
      }
    });
    wrap.appendChild(el("div", { class: "row mt" }, apply, h.btn));
    wrap.appendChild(h.box);
    return wrap;
  }

  /* ---------- Escape code entry ---------- */
  function renderCode(step, digits, onDone) {
    const wrap = el("div");
    wrap.appendChild(el("div", { class: "clue-tag" }, "🔐 Locked Door"));
    wrap.appendChild(el("div", { class: "panel", html: step.intro }));
    wrap.appendChild(el("div", { class: "code-display" }, digits.map(d => d ?? "•").join(" ")));
    const input = el("input", { type: "text", placeholder: "Enter code…", maxlength: String(step.code.length), autocomplete: "off" });
    input.style.textAlign = "center"; input.style.letterSpacing = "8px"; input.style.fontSize = "1.4em";
    const submit = el("button", { class: "btn-primary" }, "🔓 Unlock");
    const area = el("div");
    function tryCode() {
      if (input.value.trim() === step.code) {
        Audio.play("unlock");
        input.disabled = true; submit.disabled = true;
        area.appendChild(feedback(true, "The door slides open. You escaped! 🎉"));
        const btn = el("button", { class: "btn-primary mt", onclick: () => onDone({ correct: true, xp: 25 }) }, "Walk through ➜");
        area.appendChild(el("div", { class: "center" }, btn));
        const p = State.player(); p.counters.escapes++; Storage.save();
        State.addXP(25, btn); State.checkBadges();
      } else {
        Audio.play("wrong");
        input.value = "";
        UI.toast("The keypad buzzes… wrong code. Check the digits you unlocked above. 🔁");
      }
    }
    submit.addEventListener("click", tryCode);
    input.addEventListener("keydown", e => { if (e.key === "Enter") tryCode(); });
    wrap.appendChild(input);
    wrap.appendChild(el("div", { class: "center mt" }, submit));
    wrap.appendChild(area);
    setTimeout(() => input.focus(), 50);
    return wrap;
  }

  /* ---------- Question dispatcher ---------- */
  function renderQuestion(q, onDone, exam = false) {
    switch (q.type) {
      case "mc": case "tf": return renderMC(q, onDone, exam);
      case "multi": return renderMulti(q, onDone, exam);
      case "match": return renderMatch(q, onDone, exam);
      case "order": return renderOrder(q, onDone, exam);
      case "typein": return renderTypein(q, onDone, exam);
      default: return el("div", {}, "Unknown puzzle type: " + q.type);
    }
  }

  return { renderQuestion, renderLesson, renderDetective, renderConfig, renderCode };
})();
