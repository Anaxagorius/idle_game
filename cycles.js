/* ==========================================================================
   Idle Empire Ultimate - cycles.js
   Economic cycle phase management: Boom, Stable, Recession, Hypergrowth.
   ========================================================================== */

(function () {
  const cfg = Game.config;
  const Cycles = {};

  /* Pick the next cycle phase (weighted random, never repeat same phase). */
  function pickNextPhase(currentPhase) {
    const weights = cfg.economicCycleWeights || {};
    let pool = [];
    cfg.economicCycles.forEach(function (c) {
      if (c.id === currentPhase) return; // avoid immediate repeat
      const w = weights[c.id] || 10;
      for (let i = 0; i < w; i++) pool.push(c.id);
    });
    return pool[Math.floor(Math.random() * pool.length)] || "stable";
  }

  /* Duration in play-time seconds for a cycle phase. */
  function phaseDuration(cycleId) {
    const def = cfg.economicCycleMap[cycleId];
    if (!def) return 120;
    return def.durationMin + Math.random() * (def.durationMax - def.durationMin);
  }

  /* Ensure cycle state exists. */
  Cycles.ensureState = function () {
    const s = Game.state;
    if (!s.cycle || typeof s.cycle !== "object") {
      s.cycle = { phase: "stable", endTime: 0 };
    }
    if (!s.cycle.phase) s.cycle.phase = "stable";
    if (!s.cycle.endTime) s.cycle.endTime = 0;
  };

  /* Called every game tick. */
  Cycles.update = function (dtSeconds) {
    const s = Game.state;
    Cycles.ensureState();

    if (s.stats.playTime >= s.cycle.endTime) {
      const prev = s.cycle.phase;
      s.cycle.phase = s.cycle.endTime === 0 ? "stable" : pickNextPhase(prev);
      const dur = phaseDuration(s.cycle.phase);
      s.cycle.endTime = s.stats.playTime + dur;

      // Only announce phase change, not the very first initialisation.
      if (s.cycle.endTime > dur) {
        const def = cfg.economicCycleMap[s.cycle.phase];
        if (def && Game.UI && Game.UI.eventBanner) {
          Game.UI.eventBanner({ name: def.icon + " " + def.name, desc: def.desc, color: def.color });
        }
        if (def && Game.state.settings.notifications && Game.UI && Game.UI.toast) {
          Game.UI.toast("Economic Cycle: " + def.name, "cycle");
        }
      }
      Game.recalculate();
    }
  };

  /* Return the current cycle definition. */
  Cycles.current = function () {
    const s = Game.state;
    Cycles.ensureState();
    return cfg.economicCycleMap[s.cycle.phase] || cfg.economicCycleMap.stable;
  };

  /* Seconds until the current cycle ends. */
  Cycles.timeRemaining = function () {
    const s = Game.state;
    Cycles.ensureState();
    return Math.max(0, s.cycle.endTime - s.stats.playTime);
  };

  /* Stock drift multiplier for use in stocks.js */
  Cycles.stockDriftMult = function () {
    const def = Cycles.current();
    return def ? (def.stockDriftMult || 1) : 1;
  };

  /* BTC price multiplier for use in bitcoin.js */
  Cycles.btcPriceMult = function () {
    const def = Cycles.current();
    return def ? (def.btcPriceMult || 1) : 1;
  };

  Game.Cycles = Cycles;
})();
