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
    const subBuildings = {};
    const subBuildingUpgrades = {};
    (cfg.subBuildings || []).forEach((sb) => {
      subBuildings[sb.id] = 0;
      subBuildingUpgrades[sb.id] = 0;
    });
    return {
      coins: 0,
      lifetimeCoins: 0,
      prestigePoints: 0,
      lifetimePrestigePoints: 0,
      researchPoints: 0,
      ascensionShards: 0,
      buildings,
      subBuildings,
      subBuildingUpgrades,
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
      talents: {},
      godsTitans: {},
      talentCooldowns: {},
      activeTalentPowers: [],
      nextEventTime: 0,
      stats: {
        totalClicks: 0,
        totalCoinsSpent: 0,
        prestigeCount: 0,
        ascensionCount: 0,
        researchCompleted: 0,
        talentsPurchased: 0,
        powersActivated: 0,
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
    const bonusScale = cfg.BONUS_EFFECTIVENESS_MULT || 1;
    function scaleBonus(value) {
      return (value || 0) * bonusScale;
    }
    function scaledMultiplierFromEffect(effect) {
      if (effect.mult !== undefined) {
        if (effect.mult > 1) return 1 + (effect.mult - 1) * bonusScale;
        if (effect.mult < 1) return 1 - (1 - effect.mult) * bonusScale;
        return 1;
      }
      return 1 + scaleBonus(effect.value || 0);
    }
    const m = {
      prestige: 1 + s.prestigePoints * cfg.PRESTIGE_PER_POINT_MULT * bonusScale,
      ascension: 1 + s.ascensionShards * cfg.ASCENSION_PER_SHARD_MULT * bonusScale,
      researchCoin: 1,
      researchBuilding: 1,
      researchGlobal: 1,
      researchAutomation: 1,
      researchPrestige: 1,
      achievement: 1,
      milestone: 1,
      event: 1,
      talentGlobal: 1,
      clickMult: 1,
      rpGain: 1,
      buildingMult: {},
      prestigeGain: 1,
      costReduction: 1,
    };

    function applyEffect(effect) {
      if (!effect || !effect.type) return;
      const type = effect.type;
      // value -> additive bonus (1 + value), mult -> direct multiplier.
      const effectMultiplier = scaledMultiplierFromEffect(effect);
      if (type === "globalMult") {
        m.talentGlobal *= effectMultiplier;
      } else if (type === "clickMult") {
        m.clickMult *= effectMultiplier;
      } else if (type === "rpMult") {
        m.rpGain *= effectMultiplier;
      } else if (type === "prestigeGain") {
        m.prestigeGain *= effectMultiplier;
      } else if (type === "costReduction") {
        // costReduction uses subtraction (1 - value); negative values are ignored.
        const value = scaleBonus(effect.value || 0);
        const reduction = effect.mult !== undefined ? effect.mult : 1 - value;
        m.costReduction *= reduction;
      } else if (type === "buildingMult") {
        const buildingId = effect.building;
        if (!buildingId) return;
        const current = m.buildingMult[buildingId] || 1;
        m.buildingMult[buildingId] = current * effectMultiplier;
      }
    }

    function subBuildingEffectMultiplier(effectValue, owned, upgradeMult) {
      const rawMult = 1 + effectValue * owned * upgradeMult;
      return Math.max(cfg.MIN_BUILDING_MULTIPLIER, rawMult);
    }

    // Research effects
    cfg.research.forEach((r) => {
      if (!s.research[r.id]) return;
      const v = scaleBonus(r.value);
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

    // Prestige talents (passive)
    cfg.talents.forEach((t) => {
      if (!s.talents[t.id] || t.type === "power") return;
      applyEffect(t);
    });

    // Ascension shard tradeoff upgrades (permanent)
    cfg.godsTitans.forEach((gt) => {
      if (!s.godsTitans[gt.id] || !gt.effects) return;
      gt.effects.forEach((effect) => applyEffect(effect));
    });

    // Achievement bonuses (additive)
    let achBonus = 0;
    cfg.achievements.forEach((a) => {
      if (s.achievements[a.id]) achBonus += scaleBonus(a.bonus);
    });
    m.achievement = 1 + achBonus;

    // Milestone bonuses (additive)
    let msBonus = 0;
    cfg.milestones.forEach((ml) => {
      if (s.milestones[ml.id]) msBonus += scaleBonus(ml.bonus);
    });
    m.milestone = 1 + msBonus;

    // Active events
    s.activeEvents.forEach((ev) => {
      const def = cfg.events.find((e) => e.id === ev.id);
      if (!def) return;
      if (def.kind === "coinMult") {
        const v = def.value > 1 ? 1 + (def.value - 1) * bonusScale : def.value;
        m.event *= v;
      } else if (def.kind === "prestigeMult") {
        const v = def.value > 1 ? 1 + (def.value - 1) * bonusScale : def.value;
        m.prestigeGain *= v;
      }
    });

    // Active talent powers
    s.activeTalentPowers.forEach((p) => {
      const def = cfg.talentPowerMap[p.id];
      if (!def || !def.effects) return;
      def.effects.forEach((effect) => applyEffect(effect));
    });

    // Sub-building specialization effects
    (cfg.subBuildings || []).forEach((sb) => {
      const owned = s.subBuildings && s.subBuildings[sb.id] ? s.subBuildings[sb.id] : 0;
      if (!owned) return;
      const level = Math.max(0, Math.min(cfg.SUB_BUILDING_MAX_UPGRADES, (s.subBuildingUpgrades && s.subBuildingUpgrades[sb.id]) || 0));
      const upgradeMult = 1 + level * cfg.SUB_BUILDING_UPGRADE_STEP;
      sb.effects.forEach((effect) => {
        const effectMult = subBuildingEffectMultiplier(effect.value, owned, upgradeMult);
        const current = m.buildingMult[effect.target] || 1;
        m.buildingMult[effect.target] = current * effectMult;
      });
    });

    // 0.1 multiplier = maximum 90% total cost reduction.
    m.costReduction = Math.max(cfg.MAX_COST_REDUCTION_MULT, m.costReduction);

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
      m.event *
      m.talentGlobal;

    return m;
  };

  /* Base CPS per building (with its upgrades), before global multipliers */
  /* Base CPS per building (with its upgrades), before global multipliers.
     multOverride is used by Game.recalculate() so all buildings use the
     same multiplier snapshot within the same frame; s._mult is refreshed
     each recalculate and is used as the normal cached fallback. */
  Game.buildingCps = function (buildingId, multOverride) {
    const s = Game.state;
    const b = cfg.buildingMap[buildingId];
    const owned = s.buildings[buildingId] || 0;
    if (owned === 0) return 0;
    let upgradeLevels = 0;
    for (let i = 0; i < 6; i++) {
      if (s.upgrades[buildingId + "_up" + i]) upgradeLevels++;
    }
    let mults = multOverride;
    if (!mults) mults = s._mult;
    if (!mults) mults = Game.computeMultipliers();
    const buildingMult = (mults.buildingMult && mults.buildingMult[buildingId]) || 1;
    const bonusScale = cfg.BONUS_EFFECTIVENESS_MULT === undefined ? 1 : cfg.BONUS_EFFECTIVENESS_MULT;
    const upgradeStepMult = 1 + bonusScale;
    return owned * b.baseCps * Math.pow(upgradeStepMult, upgradeLevels) * buildingMult;
  };

  /* ---------------------------------------------------------------------
     Full recalculation of CPS / RPS / click value
     --------------------------------------------------------------------- */
  Game.recalculate = function () {
    const s = Game.state;
    const m = Game.computeMultipliers();

    let baseCps = 0;
    cfg.buildings.forEach((b) => {
      baseCps += Game.buildingCps(b.id, m);
    });

    const cps = baseCps * m.global;
    const gainScale = cfg.GAIN_EFFECTIVENESS_MULT || 1;
    s._cps = cps * gainScale;
    s._baseCps = baseCps;
    s._mult = m;

    // RP production: laboratories, universities, data centers
    const rpBase =
      (s.buildings.laboratory || 0) * 0.2 +
      (s.buildings.university || 0) * 2 +
      (s.buildings.datacenter || 0) * 5;
    s._rps = rpBase * m.researchGlobal * m.prestige * (1 + s.ascensionShards * cfg.ASCENSION_PER_SHARD_MULT * (cfg.BONUS_EFFECTIVENESS_MULT || 1)) * m.rpGain * gainScale;

    // Click value: flat scaled by global mult + fraction of CPS
    s._clickValue = ((1 * m.global + cps * cfg.CLICK_CPS_FRACTION) * m.clickMult) * gainScale;

    return { cps: s._cps, rps: s._rps, clickValue: s._clickValue, m };
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
    return Math.floor(raw * m.prestigeGain * (cfg.GAIN_EFFECTIVENESS_MULT || 1));
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
    if (Game.Talents && Game.Talents.update) Game.Talents.update();
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
