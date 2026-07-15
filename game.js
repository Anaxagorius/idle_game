/* ==========================================================================
   Idle Empire Ultimate - game.js
   Core game state, main loop, resource production and multiplier math.
   ========================================================================== */

(function () {
  const cfg = Game.config;

  /* ---------------------------------------------------------------------
     Default state factory
     --------------------------------------------------------------------- */
  Game.defaultState = function () {
    const buildings = {};
    cfg.buildings.forEach((b) => (buildings[b.id] = 0));
    return {
      coins: 0,
      lifetimeCoins: 0,
      prestigePoints: 0,
      lifetimePrestigePoints: 0,
      researchPoints: 0,
      ascensionShards: 0,
      buildings,
      upgrades: {},
      research: {},
      achievements: {},
      milestones: {},
      automation: {
        autoClick: false,
        autoBuy: false,
        autoUpgrade: false,
        autoResearch: false,
        autoPrestige: false,
        autoAscend: false,
        buyAmount: 1, // 1, 10, 100, or -1 for max
      },
      unlocked: {}, // automation features unlocked via research
      activeEvents: [],
      nextEventTime: 0,
      stats: {
        totalClicks: 0,
        totalCoinsSpent: 0,
        prestigeCount: 0,
        ascensionCount: 0,
        researchCompleted: 0,
        eventsTriggered: 0,
        playTime: 0,
        offlineEarnings: 0,
        totalCoinsEarned: 0,
      },
      settings: {
        notifications: true,
      },
      map: {
        selectedCounty: null,
        pins: [],
      },
      lastSave: Date.now(),
      lastTick: Date.now(),
      startTime: Date.now(),
      _cps: 0,
      _rps: 0,
      _clickValue: 1,
    };
  };

  Game.state = Game.defaultState();

  /* ---------------------------------------------------------------------
     Multiplier calculation
     --------------------------------------------------------------------- */
  Game.computeMultipliers = function () {
    const s = Game.state;
    const m = {
      prestige: 1 + s.prestigePoints * cfg.PRESTIGE_PER_POINT_MULT,
      ascension: 1 + s.ascensionShards * cfg.ASCENSION_PER_SHARD_MULT,
      researchCoin: 1,
      researchBuilding: 1,
      researchGlobal: 1,
      researchAutomation: 1,
      researchPrestige: 1,
      achievement: 1,
      milestone: 1,
      event: 1,
      prestigeGain: 1,
      costReduction: 1,
    };

    // Research effects
    cfg.research.forEach((r) => {
      if (!s.research[r.id]) return;
      const v = r.value;
      if (r.effectType === "coin") {
        m.researchCoin *= 1 + v;
        m.costReduction *= 1 - Math.min(0.5, v * 0.05);
      } else if (r.effectType === "building") {
        m.researchBuilding *= 1 + v;
      } else if (r.effectType === "global") {
        m.researchGlobal *= 1 + v;
      } else if (r.effectType === "automation") {
        m.researchAutomation *= 1 + v;
      } else if (r.effectType === "prestige") {
        m.researchPrestige *= 1 + v;
        m.prestigeGain *= 1 + v;
      }
    });

    // Achievement bonuses (additive)
    let achBonus = 0;
    cfg.achievements.forEach((a) => {
      if (s.achievements[a.id]) achBonus += a.bonus;
    });
    m.achievement = 1 + achBonus;

    // Milestone bonuses (additive)
    let msBonus = 0;
    cfg.milestones.forEach((ml) => {
      if (s.milestones[ml.id]) msBonus += ml.bonus;
    });
    m.milestone = 1 + msBonus;

    // Active events
    s.activeEvents.forEach((ev) => {
      const def = cfg.events.find((e) => e.id === ev.id);
      if (!def) return;
      if (def.kind === "coinMult") m.event *= def.value;
      else if (def.kind === "prestigeMult") m.prestigeGain *= def.value;
    });

    // Global production multiplier applied to CPS
    m.global =
      m.prestige *
      m.ascension *
      m.researchCoin *
      m.researchBuilding *
      m.researchGlobal *
      m.researchAutomation *
      m.achievement *
      m.milestone *
      m.event;

    return m;
  };

  /* Base CPS per building (with its upgrades), before global multipliers */
  Game.buildingCps = function (buildingId) {
    const s = Game.state;
    const b = cfg.buildingMap[buildingId];
    const owned = s.buildings[buildingId] || 0;
    if (owned === 0) return 0;
    let upgradeLevels = 0;
    for (let i = 0; i < 6; i++) {
      if (s.upgrades[buildingId + "_up" + i]) upgradeLevels++;
    }
    return owned * b.baseCps * Math.pow(2, upgradeLevels);
  };

  /* ---------------------------------------------------------------------
     Full recalculation of CPS / RPS / click value
     --------------------------------------------------------------------- */
  Game.recalculate = function () {
    const s = Game.state;
    const m = Game.computeMultipliers();

    let baseCps = 0;
    cfg.buildings.forEach((b) => {
      baseCps += Game.buildingCps(b.id);
    });

    const cps = baseCps * m.global;
    s._cps = cps;
    s._baseCps = baseCps;
    s._mult = m;

    // RP production: laboratories, universities, data centers
    const rpBase =
      (s.buildings.laboratory || 0) * 0.2 +
      (s.buildings.university || 0) * 2 +
      (s.buildings.datacenter || 0) * 5;
    s._rps = rpBase * m.researchGlobal * m.prestige * (1 + s.ascensionShards * cfg.ASCENSION_PER_SHARD_MULT);

    // Click value: flat scaled by global mult + fraction of CPS
    s._clickValue = 1 * m.global + cps * cfg.CLICK_CPS_FRACTION;

    return { cps, rps: s._rps, clickValue: s._clickValue, m };
  };

  /* ---------------------------------------------------------------------
     Player click
     --------------------------------------------------------------------- */
  Game.click = function () {
    const s = Game.state;
    const value = s._clickValue;
    s.coins += value;
    s.lifetimeCoins += value;
    s.stats.totalCoinsEarned += value;
    s.stats.totalClicks++;
    return value;
  };

  /* ---------------------------------------------------------------------
     Prestige potential
     --------------------------------------------------------------------- */
  Game.potentialPrestige = function () {
    const s = Game.state;
    const m = s._mult || Game.computeMultipliers();
    const raw = Math.sqrt(s.lifetimeCoins / cfg.PRESTIGE_REQUIRED_COINS);
    return Math.floor(raw * m.prestigeGain);
  };

  /* ---------------------------------------------------------------------
     Main tick
     --------------------------------------------------------------------- */
  Game.tick = function (dtSeconds) {
    const s = Game.state;

    Game.recalculate();

    // Produce coins
    const earned = s._cps * dtSeconds;
    s.coins += earned;
    s.lifetimeCoins += earned;
    s.stats.totalCoinsEarned += earned;

    // Produce research points
    s.researchPoints += s._rps * dtSeconds;

    // Play time
    s.stats.playTime += dtSeconds;

    // Events, automation, achievements, milestones
    Game.Events.update(dtSeconds);
    Game.Automation.update(dtSeconds);
    Game.Achievements.check();
    Game.Milestones.check();
  };

  /* ---------------------------------------------------------------------
     Loop management
     --------------------------------------------------------------------- */
  let tickInterval = null;
  let uiInterval = null;
  let autosaveInterval = null;

  Game.start = function () {
    Game.state.lastTick = Date.now();
    Game.recalculate();

    tickInterval = setInterval(function () {
      const now = Date.now();
      let dt = (now - Game.state.lastTick) / 1000;
      Game.state.lastTick = now;
      if (dt < 0) dt = 0;
      if (dt > 5) dt = 5; // guard against very long freezes (offline handled separately)
      Game.tick(dt);
    }, cfg.TICK_MS);

    uiInterval = setInterval(function () {
      Game.UI.update();
    }, cfg.UI_MS);

    autosaveInterval = setInterval(function () {
      Game.Save.save();
      Game.UI.toast("Game auto-saved.", "info");
    }, cfg.AUTOSAVE_MS);
  };

  Game.stopLoops = function () {
    clearInterval(tickInterval);
    clearInterval(uiInterval);
    clearInterval(autosaveInterval);
  };

  /* ---------------------------------------------------------------------
     Offline progression
     --------------------------------------------------------------------- */
  Game.applyOffline = function () {
    const s = Game.state;
    const now = Date.now();
    let seconds = (now - (s.lastSave || now)) / 1000;
    if (seconds < 10) return null; // ignore trivial gaps
    seconds = Math.min(seconds, cfg.OFFLINE_CAP_SECONDS);

    Game.recalculate();
    const coins = s._cps * seconds;
    const rp = s._rps * seconds;
    s.coins += coins;
    s.lifetimeCoins += coins;
    s.stats.totalCoinsEarned += coins;
    s.researchPoints += rp;
    s.stats.offlineEarnings += coins;
    s.stats.playTime += seconds;

    return { seconds, coins, rp };
  };
})();
