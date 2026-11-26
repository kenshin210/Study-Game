/* ============ STORAGE — autosave to localStorage ============ */
const Storage = (() => {
  const KEY = "md102_endpoint_escape_v1";

  function defaults() {
    return {
      created: Date.now(),
      xp: 0,
      badges: [],                 // badge ids earned
      missions: {},               // missionId -> {done:true, stars, bestXp}
      steps: {},                  // missionId -> last completed step index (resume)
      srs: {},                    // objectiveId -> {box, due, seen, correct, wrong, streak}
      qhist: {},                  // questionId -> {seen, correct, wrong, last}
      lessonsRead: {},            // objectiveId -> true
      daily: { lastDate: null, streak: 0, best: 0, doneToday: false },
      exams: [],                  // history of exam sim results
      counters: { answers: 0, correct: 0, hintsUsed: 0, perfectMissions: 0, detectives: 0, escapes: 0, configs: 0 },
      settings: { sound: true, music: false, motion: true, focus: false, bigtext: false },
      lastMission: null,          // {missionId} for Continue
    };
  }

  let data = null;

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      data = raw ? Object.assign(defaults(), JSON.parse(raw)) : defaults();
    } catch (e) { data = defaults(); }
    // deep-merge nested defaults for forward compatibility
    const d = defaults();
    for (const k of ["daily", "counters", "settings"]) data[k] = Object.assign({}, d[k], data[k]);
    return data;
  }

  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(data)); } catch (e) { /* storage full/blocked */ }
  }

  function reset() {
    data = defaults();
    save();
  }

  return { load, save, reset, get: () => data };
})();
