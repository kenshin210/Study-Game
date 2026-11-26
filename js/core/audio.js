/* ============ AUDIO — WebAudio synth SFX + ambient music (no assets) ============ */
const Audio_ctx = window.AudioContext || window.webkitAudioContext;
const Audio = (() => {
  let ctx = null, musicNodes = null;

  function ensure() {
    if (!ctx && Audio_ctx) ctx = new Audio_ctx();
    if (ctx && ctx.state === "suspended") ctx.resume();
    return ctx;
  }

  function tone(freq, dur, type = "sine", vol = 0.12, when = 0) {
    const c = ensure(); if (!c) return;
    const o = c.createOscillator(), g = c.createGain();
    o.type = type; o.frequency.value = freq;
    g.gain.setValueAtTime(vol, c.currentTime + when);
    g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + when + dur);
    o.connect(g).connect(c.destination);
    o.start(c.currentTime + when); o.stop(c.currentTime + when + dur + 0.05);
  }

  const SFX = {
    correct: () => { tone(660, 0.12, "sine", 0.1); tone(880, 0.2, "sine", 0.1, 0.1); },
    wrong:   () => { tone(220, 0.25, "sawtooth", 0.06); tone(180, 0.3, "sawtooth", 0.05, 0.12); },
    click:   () => tone(500, 0.05, "square", 0.04),
    unlock:  () => { tone(523, 0.1, "triangle", 0.1); tone(659, 0.1, "triangle", 0.1, 0.1); tone(784, 0.25, "triangle", 0.1, 0.2); },
    badge:   () => { tone(523, 0.12, "sine", 0.12); tone(659, 0.12, "sine", 0.12, 0.12); tone(784, 0.12, "sine", 0.12, 0.24); tone(1047, 0.35, "sine", 0.12, 0.36); },
    levelup: () => { for (let i = 0; i < 5; i++) tone(440 * Math.pow(1.2, i), 0.15, "triangle", 0.1, i * 0.09); },
    complete:() => { tone(392, 0.15, "sine", 0.11); tone(523, 0.15, "sine", 0.11, 0.15); tone(659, 0.15, "sine", 0.11, 0.3); tone(784, 0.4, "sine", 0.11, 0.45); },
  };

  function play(name) {
    const p = State.player();
    if (!p || !p.settings.sound) return;
    try { (SFX[name] || SFX.click)(); } catch (e) {}
  }

  /* Gentle ambient pad: two slow detuned oscillators + LFO. Off by default. */
  function musicOn() {
    const c = ensure(); if (!c || musicNodes) return;
    const g = c.createGain(); g.gain.value = 0.025; g.connect(c.destination);
    const nodes = [g];
    [[110, "sine"], [165, "sine"], [220.5, "triangle"]].forEach(([f, t]) => {
      const o = c.createOscillator(); o.type = t; o.frequency.value = f;
      const og = c.createGain(); og.gain.value = 0.5;
      const lfo = c.createOscillator(); lfo.frequency.value = 0.07 + Math.random() * 0.06;
      const lg = c.createGain(); lg.gain.value = 0.25;
      lfo.connect(lg).connect(og.gain);
      o.connect(og).connect(g);
      o.start(); lfo.start();
      nodes.push(o, lfo);
    });
    musicNodes = nodes;
  }
  function musicOff() {
    if (!musicNodes) return;
    musicNodes.forEach(n => { try { n.stop ? n.stop() : n.disconnect(); } catch (e) {} });
    musicNodes = null;
  }
  function syncMusic() {
    const p = State.player();
    p && p.settings.music ? musicOn() : musicOff();
  }

  return { play, syncMusic };
})();
