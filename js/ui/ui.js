/* ============ UI helpers — dom, toasts, modals, progress ============ */
const UI = (() => {
  const app = () => document.getElementById("app");

  function el(tag, attrs = {}, ...children) {
    const e = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) {
      if (k === "class") e.className = v;
      else if (k === "html") e.innerHTML = v;
      else if (k.startsWith("on")) e.addEventListener(k.slice(2), v);
      else if (v !== false && v != null) e.setAttribute(k, v === true ? "" : v);
    }
    for (const c of children.flat()) {
      if (c == null || c === false) continue;
      e.appendChild(typeof c === "string" ? document.createTextNode(c) : c);
    }
    return e;
  }

  function render(...nodes) {
    const a = app();
    a.innerHTML = "";
    nodes.flat().forEach(n => n && a.appendChild(n));
    window.scrollTo({ top: 0 });
  }

  function toastHost() {
    let h = document.getElementById("toasts");
    if (!h) { h = el("div", { id: "toasts" }); document.body.appendChild(h); }
    return h;
  }
  function toast(html, cls = "", ms = 3500) {
    const t = el("div", { class: `toast ${cls}`, html });
    toastHost().appendChild(t);
    setTimeout(() => t.remove(), ms);
  }

  function xpPop(amount, anchor) {
    const pop = el("div", { class: "xp-pop" }, `+${amount} XP`);
    const r = anchor && anchor.getBoundingClientRect ? anchor.getBoundingClientRect() : { left: innerWidth / 2, top: innerHeight / 2 };
    pop.style.left = (r.left + (r.width || 0) / 2) + "px";
    pop.style.top = (r.top - 10) + "px";
    document.body.appendChild(pop);
    setTimeout(() => pop.remove(), 1100);
  }

  function pbar(pct, cls = "") {
    const b = el("div", { class: `pbar ${cls}` }, el("div"));
    b.firstChild.style.width = Math.max(0, Math.min(100, pct)) + "%";
    return b;
  }

  function modal(contentNodes, opts = {}) {
    const bg = el("div", { class: "modal-bg", onclick: e => { if (e.target === bg && !opts.sticky) bg.remove(); } });
    const m = el("div", { class: "modal" }, ...contentNodes);
    if (!opts.noClose) m.appendChild(el("div", { class: "center mt" }, el("button", { class: "btn-sm", onclick: () => bg.remove() }, "Close")));
    bg.appendChild(m);
    document.body.appendChild(bg);
    return bg;
  }

  function confirm(msg, onYes) {
    const bg = modal([
      el("p", { html: msg }),
      el("div", { class: "row mt" },
        el("button", { class: "btn-primary", onclick: () => { bg.remove(); onYes(); } }, "Yes"),
        el("button", { onclick: () => bg.remove() }, "Cancel"))
    ], { noClose: true });
  }

  function shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
    return a;
  }

  function esc(s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }

  return { el, render, toast, xpPop, pbar, modal, confirm, shuffle, esc };
})();
