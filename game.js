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
    const energyProducers = {};
    const btcMiners = {};
    const batteries = {};
    const coinFarmers = {};
    (cfg.energyProducers || []).forEach((p) => (energyProducers[p.id] = 0));
    (cfg.btcMiners || []).forEach((m) => (btcMiners[m.id] = 0));
    (cfg.batteries || []).forEach((b) => (batteries[b.id] = 0));
    (cfg.coinFarmers || []).forEach((f) => (coinFarmers[f.id] = 0));
    const stocks = {};
    const stockHistory = {};
    const portfolio = {};
    (cfg.stocks || []).forEach((st) => {
      stocks[st.id] = st.basePrice;
      stockHistory[st.id] = [st.basePrice];
      portfolio[st.id] = { shares: 0, avgCost: 0 };
    });
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
      empireLegacies: 0,
      lifetimeEmpireLegacies: 0,
      timeFragments: 0,
      lifetimeTimeFragments: 0,
      realityCores: 0,
      lifetimeRealityCores: 0,
      prestigePath: null,
      cycle: { phase: "stable", endTime: 0 },
      abilities: {},
      megaProjects: {},
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
        buyAmount: 10, // 10, 25, 50, 100, 1000, or -1 for max
      },
      unlocked: {}, // automation features unlocked via research
      activeEvents: [],
      talents: {},
      skillTrees: {},
      godsTitans: {},
      talentCooldowns: {},
      activeTalentPowers: [],
      skillCooldowns: {},
      activeSkillPowers: [],
      nextEventTime: 0,
      population: 0,
      btc: 0,
      btcPrice: cfg.BTC_BASE_PRICE,
      btcMarketTime: 0,
      energy: 0,
      energyCap: cfg.BTC_BASE_ENERGY_CAP,
      energyProducers,
      btcMiners,
      batteries,
      coinFarmers,
      stocks,
      stockHistory,
      portfolio,
      gambling: {
        chips: 0,
        totalChipsWon: 0,
        totalChipsLost: 0,
        chipsFromCoins: 0,
        gamesPlayed: 0,
        gamesWon: 0,
        slotStats: { played: 0, won: 0, bigWins: 0 },
        blackjackStats: { played: 0, won: 0 },
        pokerStats: { played: 0, won: 0 },
        rouletteStats: { played: 0, won: 0 },
        diceStats: { played: 0, won: 0 },
        plinkoStats: { played: 0, won: 0 },
        blackjackState: { phase: "idle", deck: [], playerHand: [], dealerHand: [], bet: 0, doubled: false, result: "" },
        pokerState: { phase: "idle", deck: [], hand: [], held: [false, false, false, false, false], bet: 0, result: "", payout: 0 },
      },
      horses: {
        owned: [],
        market: [],
        marketRefreshIn: 300,
        raceHistory: [],
        nextRaceIn: 60,
        currentRace: null,
        pendingBets: [],
        lastRaceResult: null,
        totalRaces: 0,
        totalWinnings: 0,
        totalLosses: 0,
      },
      cars: {
        owned: [],
        market: [],
        marketRefreshIn: 600,
        raceHistory: [],
        nextRaceIn: 90,
        currentRace: null,
        pendingBets: [],
        lastRaceResult: null,
        totalRaces: 0,
        totalWinnings: 0,
        totalLosses: 0,
        currentTrackIndex: 0,
      },
      stockTickTimer: 0,
      stockDividendTimer: 0,
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
        skillNodesPurchased: 0,
        diplomaticActions: 0,
        diplomacyCoins: 0,
        diplomacyResearch: 0,
        totalEnergyGenerated: 0,
        totalEnergySpent: 0,
        totalEnergyCollected: 0,
        totalBtcMined: 0,
        totalManualBtcMined: 0,
        totalBtcSold: 0,
        empireCount: 0,
        timeCount: 0,
        realityCount: 0,
        megaProjectsCompleted: 0,
      },
      settings: {
        notifications: true,
      },
      map: {
        selectedCounty: null,
        pins: [],
        counties: {},
        focusCounty: null,
      },
      clickerUpgrades: 0,
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
    const MIN_MEGAPROJECT_COST_MULT = 0.1;
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
      empireLegacy: 1 + (s.empireLegacies || 0) * cfg.EMPIRE_PER_LEGACY_MULT * bonusScale,
      timeFragment: 1 + (s.timeFragments || 0) * cfg.TIME_PER_FRAGMENT_MULT * bonusScale,
      realityCore: 1 + (s.realityCores || 0) * cfg.REALITY_PER_CORE_MULT * bonusScale,
      cycle: 1,
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
      milestoneMult: 1,
      eventDelayMult: 1,
      automationMult: 1,
      clickCpsFractionMult: 1,
      minerEfficiency: 1,
      btcPriceMult: 1,
      energyProduction: 1,
      energyCapacity: 1,
      energyClick: 1,
      btcClick: 1,
      coinFarmerYield: 1,
      stockFeeReduction: 1,
      stockInsight: 0,
      autoClickBoost: 0,
      clickerPenalty: 1,
      stockDividendMult: 1,
      btcIncomeBoost: 0,
      casinoPayoutMult: 1,
      horseWinMult: 1,
      carWinMult: 1,
      megaProjectCostMult: 1,
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
      } else if (type === "milestoneMult") {
        m.milestoneMult *= effectMultiplier;
      } else if (type === "eventDelayMult") {
        m.eventDelayMult *= effect.mult !== undefined ? effect.mult : effectMultiplier;
      } else if (type === "automationMult") {
        m.automationMult *= effect.mult !== undefined ? effect.mult : effectMultiplier;
      } else if (type === "clickCpsFractionMult") {
        m.clickCpsFractionMult *= effectMultiplier;
      } else if (type === "minerEfficiency") {
        m.minerEfficiency *= effectMultiplier;
      } else if (type === "btcPriceMult") {
        m.btcPriceMult *= effectMultiplier;
      } else if (type === "energyProduction") {
        m.energyProduction *= effectMultiplier;
      } else if (type === "energyCapacity") {
        m.energyCapacity *= effectMultiplier;
      } else if (type === "energyClick") {
        m.energyClick *= effectMultiplier;
      } else if (type === "btcClick") {
        m.btcClick *= effectMultiplier;
      } else if (type === "coinFarmerYield") {
        m.coinFarmerYield *= effectMultiplier;
      } else if (type === "stockFeeReduction") {
        m.stockFeeReduction *= effectMultiplier;
      } else if (type === "stockInsight") {
        m.stockInsight += effect.value || 0;
      } else if (type === "autoClickBoost") {
        m.autoClickBoost += effect.value || 0;
      } else if (type === "stockDividendMult") {
        const mv = effect.mult !== undefined ? effect.mult : effectMultiplier;
        m.stockDividendMult *= mv;
      } else if (type === "btcIncomeBoost") {
        m.btcIncomeBoost += effect.value || 0;
      } else if (type === "casinoPayoutMult") {
        m.casinoPayoutMult *= effectMultiplier;
      } else if (type === "horseWinMult") {
        m.horseWinMult *= effectMultiplier;
      } else if (type === "carWinMult") {
        m.carWinMult *= effectMultiplier;
      } else if (type === "megaProjectCostMult") {
        const value = scaleBonus(effect.value || 0);
        const reduction = effect.mult !== undefined ? effect.mult : 1 - value;
        m.megaProjectCostMult *= reduction;
        m.megaProjectCostMult = Math.max(MIN_MEGAPROJECT_COST_MULT, m.megaProjectCostMult);
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
      } else if (r.effectType === "stocks") {
        m.stockDividendMult *= 1 + v;
        m.stockFeeReduction *= 1 + v;
      } else if (r.effectType === "bitcoin") {
        m.minerEfficiency *= 1 + v;
        m.coinFarmerYield *= 1 + v;
      } else if (r.effectType === "megaproject") {
        m.megaProjectCostMult *= Math.max(0.1, 1 - v);
      } else if (r.effectType === "casino") {
        m.casinoPayoutMult *= 1 + v;
      } else if (r.effectType === "horses") {
        m.horseWinMult *= 1 + v;
      } else if (r.effectType === "racecar") {
        m.carWinMult *= 1 + v;
      }
    });

    // Prestige talents (passive)
    cfg.talents.forEach((t) => {
      if (!s.talents[t.id] || t.type === "power") return;
      applyEffect(t);
    });

    // Skill tree nodes (passive + penalties)
    (cfg.skillTreeNodes || []).forEach((n) => {
      if (!s.skillTrees[n.id] || n.type === "skillPower") return;
      applyEffect(n);
      if (n.penaltyType) {
        applyEffect({
          type: n.penaltyType,
          value: n.penaltyValue,
          mult: n.penaltyMult,
          building: n.penaltyBuilding,
        });
      }
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
    m.milestone = 1 + msBonus * m.milestoneMult;

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

    // Active skill powers
    s.activeSkillPowers.forEach((p) => {
      const def = cfg.skillPowers[p.id];
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

    // Prestige path effects (active path for current run)
    if (s.prestigePath && cfg.prestigePathMap[s.prestigePath]) {
      cfg.prestigePathMap[s.prestigePath].effects.forEach(function (effect) {
        applyEffect(effect);
      });
    }

    // Economic cycle multiplier
    const cycleId = (s.cycle && s.cycle.phase) || "stable";
    const cycleDef = cfg.economicCycleMap[cycleId] || cfg.economicCycleMap.stable;
    m.cycle = cycleDef ? cycleDef.globalMult : 1;
    if (cycleDef && cycleDef.rpMult !== undefined) m.rpGain *= cycleDef.rpMult;
    if (cycleDef && cycleDef.costMult !== undefined) {
      m.costReduction *= cycleDef.costMult > 0 ? cycleDef.costMult : 1;
    }

    // Mega project permanent effects
    if (s.megaProjects) {
      (cfg.megaProjects || []).forEach(function (proj) {
        if (!s.megaProjects[proj.id]) return;
        (proj.effects || []).forEach(function (effect) { applyEffect(effect); });
      });
    }

    // Active abilities (timed)
    const now = Date.now() / 1000;
    if (s.abilities) {
      (cfg.activeAbilities || []).forEach(function (ab) {
        const state = s.abilities[ab.id];
        if (!state || !state.activeEnd || now > state.activeEnd) return;
        (ab.effects || []).forEach(function (effect) { applyEffect(effect); });
      });
    }

    // BTC income boost (Crypto Lord path: btc * value boosts global)
    if (m.btcIncomeBoost > 0) {
      m.talentGlobal *= 1 + (s.btc || 0) * m.btcIncomeBoost;
    }

    // Clicker upgrades: direct multipliers, not scaled by BONUS_EFFECTIVENESS_MULT.
    const clickerLevels = Math.min(cfg.CLICKER_UPGRADE_MAX, s.clickerUpgrades || 0);
    for (let i = 0; i < clickerLevels; i++) {
      const def = cfg.clickerUpgradeDefs[i];
      m.clickMult *= def.clickBoost;
      m.clickerPenalty *= def.globalPenalty;
    }

    // Global production multiplier applied to CPS
    m.global =
      m.prestige *
      m.ascension *
      m.empireLegacy *
      m.timeFragment *
      m.realityCore *
      m.cycle *
      m.researchCoin *
      m.researchBuilding *
      m.researchGlobal *
      m.researchAutomation *
      m.achievement *
      m.milestone *
      m.event *
      m.talentGlobal *
      m.clickerPenalty;

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
    const diplomacy = Game.Diplomacy && Game.Diplomacy.getBonuses
      ? Game.Diplomacy.getBonuses()
      : { coinsPerSecond: 0, globalMult: 1, clickMult: 1, rpMult: 1, happinessMult: 1 };

    let baseCps = 0;
    cfg.buildings.forEach((b) => {
      baseCps += Game.buildingCps(b.id, m);
    });

    const happinessMult = diplomacy.happinessMult || 1;
    const cps = baseCps * m.global * diplomacy.globalMult * happinessMult;
    const gainScale = cfg.GAIN_EFFECTIVENESS_MULT || 1;
    s._cps = (cps + diplomacy.coinsPerSecond) * gainScale;
    s._baseCps = baseCps;
    s._mult = m;
    s._mult.diplomacy = diplomacy;

    // RP production: laboratories, universities, data centers
    const rpBase =
      (s.buildings.laboratory || 0) * 0.2 +
      (s.buildings.university || 0) * 2 +
      (s.buildings.datacenter || 0) * 5;
    s._rps = rpBase * m.researchGlobal * m.prestige * (1 + s.ascensionShards * cfg.ASCENSION_PER_SHARD_MULT * (cfg.BONUS_EFFECTIVENESS_MULT || 1)) * m.rpGain * diplomacy.rpMult * gainScale;

    // Click value: flat scaled by global mult + fraction of CPS
    s._clickValue = ((1 * m.global * diplomacy.globalMult + cps * cfg.CLICK_CPS_FRACTION * m.clickCpsFractionMult) * m.clickMult * diplomacy.clickMult) * gainScale;

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
    if (Game.Cycles && Game.Cycles.update) Game.Cycles.update(dtSeconds);
    if (Game.Talents && Game.Talents.update) Game.Talents.update();
    if (Game.SkillTrees && Game.SkillTrees.update) Game.SkillTrees.update();
    if (Game.Bitcoin && Game.Bitcoin.update) Game.Bitcoin.update(dtSeconds);
    if (Game.Stocks && Game.Stocks.update) Game.Stocks.update(dtSeconds);
    if (Game.Diplomacy && Game.Diplomacy.update) Game.Diplomacy.update(dtSeconds);
    if (Game.Gambling && Game.Gambling.update) Game.Gambling.update(dtSeconds);
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

    // Estimate offline BTC from auto-miners
    let btc = 0;
    if (cfg.btcMiners && s.btcMiners) {
      const m = s._mult || Game.computeMultipliers();
      cfg.btcMiners.forEach(function (miner) {
        btc += (s.btcMiners[miner.id] || 0) * miner.btcPerSec * (m.minerEfficiency || 1) * seconds;
      });
    }
    if (btc > 0) {
      s.btc += btc;
      s.stats.totalBtcMined = (s.stats.totalBtcMined || 0) + btc;
    }

    return { seconds, coins, rp, btc };
  };
})();
