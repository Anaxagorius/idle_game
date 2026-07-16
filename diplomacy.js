/* ==========================================================================
   Idle Empire Ultimate - diplomacy.js
   County diplomacy, rivalry management and economic influence actions.
   ========================================================================== */

(function () {
  var cfg = Game.config;
  var MapData = Game.Map;
  var Diplomacy = {};
  var OUTCOME_SEPARATOR = " • ";

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function round2(value) {
    return Math.round(value * 100) / 100;
  }

  function hostilityFromRelation(relation) {
    return Math.max(0, -relation);
  }

  function boundedTarget(base, terms, min, max) {
    var total = base;
    for (var i = 0; i < terms.length; i++) total += terms[i];
    return clamp(total, min, max);
  }

  function moveTowardsTarget(current, target, maxDelta) {
    return current + Math.max(-maxDelta, Math.min(maxDelta, target - current));
  }

  function countyIndex(countyId) {
    for (var i = 0; i < MapData.COUNTIES.length; i++) {
      if (MapData.COUNTIES[i].id === countyId) return i;
    }
    return -1;
  }

  function baseCountyState(countyId) {
    var county = MapData.COUNTY_MAP[countyId];
    var index = countyIndex(countyId);
    var resourceCount = county && county.resources ? county.resources.length : 0;
    return {
      relation: clamp(
        cfg.DIPLOMACY_RELATION_SEED_BASE +
          ((index * cfg.DIPLOMACY_RELATION_SEED_INDEX_FACTOR + resourceCount * cfg.DIPLOMACY_RELATION_SEED_RESOURCE_FACTOR) % cfg.DIPLOMACY_RELATION_SEED_MOD),
        cfg.DIPLOMACY_RELATION_MIN,
        cfg.DIPLOMACY_RELATION_MAX
      ),
      prosperity: clamp(
        cfg.DIPLOMACY_PROSPERITY_SEED_BASE +
          resourceCount * cfg.DIPLOMACY_PROSPERITY_SEED_RESOURCE_FACTOR +
          ((index * cfg.DIPLOMACY_PROSPERITY_SEED_INDEX_FACTOR) % cfg.DIPLOMACY_PROSPERITY_SEED_MOD),
        cfg.DIPLOMACY_PROSPERITY_SEED_MIN,
        cfg.DIPLOMACY_PROSPERITY_SEED_MAX
      ),
      trade: clamp(
        cfg.DIPLOMACY_TRADE_SEED_BASE +
          resourceCount * cfg.DIPLOMACY_TRADE_SEED_RESOURCE_FACTOR +
          ((index * cfg.DIPLOMACY_TRADE_SEED_INDEX_FACTOR) % cfg.DIPLOMACY_TRADE_SEED_MOD),
        cfg.DIPLOMACY_TRADE_SEED_MIN,
        cfg.DIPLOMACY_TRADE_SEED_MAX
      ),
      influence: clamp(
        cfg.DIPLOMACY_INFLUENCE_SEED_BASE + ((index * cfg.DIPLOMACY_INFLUENCE_SEED_INDEX_FACTOR) % cfg.DIPLOMACY_INFLUENCE_SEED_MOD),
        cfg.DIPLOMACY_STAT_MIN,
        cfg.DIPLOMACY_INFLUENCE_SEED_MAX
      ),
      suspicion: clamp(
        cfg.DIPLOMACY_SUSPICION_SEED_BASE + ((index * cfg.DIPLOMACY_SUSPICION_SEED_INDEX_FACTOR) % cfg.DIPLOMACY_SUSPICION_SEED_MOD),
        cfg.DIPLOMACY_STAT_MIN,
        cfg.DIPLOMACY_SUSPICION_SEED_MAX
      ),
      intel: 0,
      cooldowns: {},
      lastAction: "",
      lastOutcome: "",
      lastActionAt: 0,
    };
  }

  function normalizeCountyState(state) {
    if (!state || typeof state !== "object") state = {};
    state.relation = clamp(Number(state.relation) || 0, cfg.DIPLOMACY_RELATION_MIN, cfg.DIPLOMACY_RELATION_MAX);
    state.prosperity = clamp(Number(state.prosperity) || 0, cfg.DIPLOMACY_STAT_MIN, cfg.DIPLOMACY_STAT_MAX);
    state.trade = clamp(Number(state.trade) || 0, cfg.DIPLOMACY_STAT_MIN, cfg.DIPLOMACY_STAT_MAX);
    state.influence = clamp(Number(state.influence) || 0, cfg.DIPLOMACY_STAT_MIN, cfg.DIPLOMACY_STAT_MAX);
    state.suspicion = clamp(Number(state.suspicion) || 0, cfg.DIPLOMACY_STAT_MIN, cfg.DIPLOMACY_STAT_MAX);
    state.intel = clamp(Number(state.intel) || 0, cfg.DIPLOMACY_STAT_MIN, cfg.DIPLOMACY_STAT_MAX);
    if (!state.cooldowns || typeof state.cooldowns !== "object") state.cooldowns = {};
    Object.keys(state.cooldowns).forEach(function (key) {
      state.cooldowns[key] = Math.max(0, Number(state.cooldowns[key]) || 0);
    });
    state.lastAction = state.lastAction || "";
    state.lastOutcome = state.lastOutcome || "";
    state.lastActionAt = Number(state.lastActionAt) || 0;
    return state;
  }

  function addInstantRewards(county, action) {
    var coins = 0;
    var rp = 0;
    switch (action.id) {
      case "trade_deal":
        coins = county.trade * 9 + county.prosperity * 4;
        break;
      case "chastise":
        coins = 80 + county.influence * 4;
        break;
      case "spy_network":
        coins = county.trade * 12 + county.prosperity * 8;
        rp = 2 + Math.floor(county.intel / 20);
        break;
      case "sanctions":
        coins = county.trade * 10 + county.prosperity * 5;
        break;
      case "smuggling_ring":
        coins = county.trade * county.prosperity * cfg.DIPLOMACY_SMUGGLING_REWARD_MULT;
        break;
      case "joint_venture":
        coins = county.trade * 22 + county.prosperity * 16;
        rp = 5;
        break;
    }
    return { coins: Math.floor(coins), rp: Math.floor(rp) };
  }

  Diplomacy.ensureState = function () {
    var s = Game.state;
    if (!s.map || typeof s.map !== "object") {
      s.map = { selectedCounty: null, pins: [], counties: {}, focusCounty: null };
    }
    if (!Array.isArray(s.map.pins)) s.map.pins = [];
    if (!s.map.counties || typeof s.map.counties !== "object") s.map.counties = {};

    var empireId = s.map.selectedCounty || null;
    var firstRival = null;
    for (var i = 0; i < MapData.COUNTIES.length; i++) {
      var county = MapData.COUNTIES[i];
      if (county.id === empireId) {
        delete s.map.counties[county.id];
        continue;
      }
      if (!s.map.counties[county.id]) s.map.counties[county.id] = baseCountyState(county.id);
      s.map.counties[county.id] = normalizeCountyState(s.map.counties[county.id]);
      if (!firstRival) firstRival = county.id;
    }

    if (!s.map.focusCounty || s.map.focusCounty === empireId || !s.map.counties[s.map.focusCounty]) {
      s.map.focusCounty = firstRival;
    }
  };

  Diplomacy.setEmpireCounty = function (countyId, previousEmpireId) {
    var previous = previousEmpireId || (Game.state.map && Game.state.map.selectedCounty);
    Diplomacy.ensureState();
    if (previous && previous !== countyId && MapData.COUNTY_MAP[previous] && !Game.state.map.counties[previous]) {
      var restored = baseCountyState(previous);
      restored.relation = clamp(restored.relation + 12, cfg.DIPLOMACY_RELATION_MIN, cfg.DIPLOMACY_RELATION_MAX);
      restored.influence = clamp(restored.influence + 8, cfg.DIPLOMACY_STAT_MIN, cfg.DIPLOMACY_STAT_MAX);
      Game.state.map.counties[previous] = restored;
    }
    delete Game.state.map.counties[countyId];
    Diplomacy.ensureState();
  };

  Diplomacy.getCountyState = function (countyId) {
    Diplomacy.ensureState();
    return Game.state.map.counties[countyId] || null;
  };

  Diplomacy.describeCounty = function (countyId) {
    var county = Diplomacy.getCountyState(countyId);
    if (!county) return cfg.diplomacyStances[2];
    for (var i = 0; i < cfg.diplomacyStances.length; i++) {
      if (county.relation >= cfg.diplomacyStances[i].min) return cfg.diplomacyStances[i];
    }
    return cfg.diplomacyStances[cfg.diplomacyStances.length - 1];
  };

  Diplomacy.countyYield = function (countyId, countyOverride) {
    var county = countyOverride || Diplomacy.getCountyState(countyId);
    if (!county) return 0;
    var relationFactor = Math.max(0, (county.relation + 100) / 200);
    var influenceFactor = 1 + county.influence * 0.002;
    var suspicionPenalty = Math.max(0.45, 1 - county.suspicion * 0.0035);
    return county.trade * county.prosperity * relationFactor * influenceFactor * suspicionPenalty * cfg.DIPLOMACY_BASE_TRADE_CPS;
  };

  Diplomacy.getBonuses = function () {
    Diplomacy.ensureState();
    var counties = Game.state.map.counties;
    var ids = Object.keys(counties);
    var totalCps = 0;
    var totalInfluence = 0;
    var totalIntel = 0;
    var hostility = 0;
    for (var i = 0; i < ids.length; i++) {
      var county = counties[ids[i]];
      totalCps += Diplomacy.countyYield(ids[i], county);
      totalIntel += county.intel;
      hostility += hostilityFromRelation(county.relation) + county.suspicion * cfg.DIPLOMACY_SUSPICION_HOSTILITY_WEIGHT;
      totalInfluence += county.influence * Math.max(0, county.relation + 25) / 125;
    }
    return {
      coinsPerSecond: round2(totalCps),
      clickMult: 1 + totalInfluence * cfg.DIPLOMACY_PROPAGANDA_CLICK_SCALE,
      rpMult: 1 + totalIntel * cfg.DIPLOMACY_INTEL_RP_SCALE,
      globalMult: Math.max(cfg.DIPLOMACY_MIN_GLOBAL_MULT, 1 - hostility * cfg.DIPLOMACY_HOSTILITY_PRODUCTION_PENALTY),
      totalInfluence: round2(totalInfluence),
      totalIntel: round2(totalIntel),
      hostility: round2(hostility),
    };
  };

  Diplomacy.summary = function () {
    var bonuses = Diplomacy.getBonuses();
    return {
      coinsPerSecond: bonuses.coinsPerSecond,
      clickBonusPct: (bonuses.clickMult - 1) * 100,
      rpBonusPct: (bonuses.rpMult - 1) * 100,
      productionPenaltyPct: (1 - bonuses.globalMult) * 100,
      totalInfluence: bonuses.totalInfluence,
      totalIntel: bonuses.totalIntel,
      hostility: bonuses.hostility,
    };
  };

  Diplomacy.listCounties = function () {
    Diplomacy.ensureState();
    var empireId = Game.state.map.selectedCounty;
    var rows = [];
    for (var i = 0; i < MapData.COUNTIES.length; i++) {
      var county = MapData.COUNTIES[i];
      if (county.id === empireId) continue;
      rows.push({
        county: county,
        state: Diplomacy.getCountyState(county.id),
        status: Diplomacy.describeCounty(county.id),
        yield: Diplomacy.countyYield(county.id, Diplomacy.getCountyState(county.id)),
      });
    }
    rows.sort(function (a, b) {
      return b.state.relation - a.state.relation;
    });
    return rows;
  };

  Diplomacy.canUseAction = function (countyId, actionId) {
    Diplomacy.ensureState();
    var action = cfg.diplomacyActionMap[actionId];
    var county = Diplomacy.getCountyState(countyId);
    if (!action || !county) return { ok: false, reason: "Unavailable" };
    var cooldown = county.cooldowns[action.id] || 0;
    if (cooldown > 0) return { ok: false, reason: "Cooldown " + Game.formatTime(cooldown) };
    if (Game.state.coins < (action.coinCost || 0)) return { ok: false, reason: "Need " + Game.formatNumber(action.coinCost || 0) + " coins" };
    if (Game.state.researchPoints < (action.rpCost || 0)) return { ok: false, reason: "Need " + Game.formatNumber(action.rpCost || 0) + " RP" };
    if (action.minRelation !== undefined && county.relation < action.minRelation) return { ok: false, reason: "Needs " + action.minRelation + " relation" };
    if (action.maxSuspicion !== undefined && county.suspicion > action.maxSuspicion) return { ok: false, reason: "Too much suspicion" };
    return { ok: true, reason: "" };
  };

  Diplomacy.availableActions = function (countyId) {
    Diplomacy.ensureState();
    return cfg.diplomacyActions.map(function (action) {
      return {
        action: action,
        availability: Diplomacy.canUseAction(countyId, action.id),
      };
    });
  };

  Diplomacy.applyAction = function (countyId, actionId) {
    Diplomacy.ensureState();
    var action = cfg.diplomacyActionMap[actionId];
    var county = Diplomacy.getCountyState(countyId);
    var countyMeta = MapData.COUNTY_MAP[countyId];
    var check = Diplomacy.canUseAction(countyId, actionId);
    if (!action || !county || !countyMeta) return false;
    if (!check.ok) {
      if (Game.UI && Game.UI.toast) Game.UI.toast(countyMeta.name + ": " + check.reason, "error");
      return false;
    }

    Game.state.coins -= action.coinCost || 0;
    Game.state.stats.totalCoinsSpent += action.coinCost || 0;
    Game.state.researchPoints -= action.rpCost || 0;

    county.relation = clamp(county.relation + (action.relation || 0), cfg.DIPLOMACY_RELATION_MIN, cfg.DIPLOMACY_RELATION_MAX);
    county.prosperity = clamp(county.prosperity + (action.prosperity || 0), cfg.DIPLOMACY_STAT_MIN, cfg.DIPLOMACY_STAT_MAX);
    county.trade = clamp(county.trade + (action.trade || 0), cfg.DIPLOMACY_STAT_MIN, cfg.DIPLOMACY_STAT_MAX);
    county.influence = clamp(county.influence + (action.influence || 0), cfg.DIPLOMACY_STAT_MIN, cfg.DIPLOMACY_STAT_MAX);
    county.suspicion = clamp(county.suspicion + (action.suspicion || 0), cfg.DIPLOMACY_STAT_MIN, cfg.DIPLOMACY_STAT_MAX);
    county.intel = clamp(county.intel + (action.intel || 0), cfg.DIPLOMACY_STAT_MIN, cfg.DIPLOMACY_STAT_MAX);

    var rewards = addInstantRewards(county, action);
    if (rewards.coins > 0) {
      Game.state.coins += rewards.coins;
      Game.state.lifetimeCoins += rewards.coins;
      Game.state.stats.totalCoinsEarned += rewards.coins;
      Game.state.stats.diplomacyCoins += rewards.coins;
    }
    if (rewards.rp > 0) {
      Game.state.researchPoints += rewards.rp;
      Game.state.stats.diplomacyResearch += rewards.rp;
    }

    county.cooldowns[action.id] = action.cooldown || 0;
    county.lastAction = action.id;
    county.lastActionAt = Game.state.stats.playTime || 0;
    county.lastOutcome =
      action.name +
      OUTCOME_SEPARATOR +
      (rewards.coins > 0 ? "+" + Game.formatNumber(rewards.coins) + " coins " : "") +
      (rewards.rp > 0 ? "+" + Game.formatNumber(rewards.rp) + " RP " : "") +
      "rel " + (action.relation >= 0 ? "+" : "") + (action.relation || 0);
    Game.state.stats.diplomaticActions = (Game.state.stats.diplomaticActions || 0) + 1;

    Game.recalculate();
    if (Game.MapUI && Game.MapUI.refreshDiplomacy) Game.MapUI.refreshDiplomacy();
    if (Game.UI && Game.UI.toast) {
      var suffix = rewards.coins > 0 || rewards.rp > 0
        ? " (+" + Game.formatNumber(rewards.coins || 0) + " coins" + (rewards.rp > 0 ? ", +" + Game.formatNumber(rewards.rp) + " RP" : "") + ")"
        : "";
      Game.UI.toast(action.name + " in " + countyMeta.name + suffix, "success");
    }
    return true;
  };

  Diplomacy.update = function (dt) {
    Diplomacy.ensureState();
    var counties = Game.state.map.counties;
    var ids = Object.keys(counties);
    for (var i = 0; i < ids.length; i++) {
      var county = counties[ids[i]];
      Object.keys(county.cooldowns).forEach(function (key) {
        county.cooldowns[key] = Math.max(0, county.cooldowns[key] - dt);
      });

      county.suspicion = clamp(county.suspicion - cfg.DIPLOMACY_SUSPICION_DECAY * dt, cfg.DIPLOMACY_STAT_MIN, cfg.DIPLOMACY_STAT_MAX);
      county.influence = clamp(county.influence - cfg.DIPLOMACY_INFLUENCE_DECAY * dt, cfg.DIPLOMACY_STAT_MIN, cfg.DIPLOMACY_STAT_MAX);
      county.intel = clamp(county.intel - cfg.DIPLOMACY_INTEL_DECAY * dt, cfg.DIPLOMACY_STAT_MIN, cfg.DIPLOMACY_STAT_MAX);

      var prosperityTarget = boundedTarget(
        cfg.DIPLOMACY_PROSPERITY_TARGET_BASE,
        [
          county.relation * cfg.DIPLOMACY_PROSPERITY_RELATION_FACTOR,
          -county.suspicion * cfg.DIPLOMACY_PROSPERITY_SUSPICION_FACTOR,
        ],
        cfg.DIPLOMACY_PROSPERITY_TARGET_MIN,
        cfg.DIPLOMACY_PROSPERITY_TARGET_MAX
      );
      var tradeTarget = boundedTarget(
        cfg.DIPLOMACY_TRADE_TARGET_BASE,
        [
          county.relation * cfg.DIPLOMACY_TRADE_RELATION_FACTOR,
          county.influence * cfg.DIPLOMACY_TRADE_INFLUENCE_FACTOR,
          -county.suspicion * cfg.DIPLOMACY_TRADE_SUSPICION_FACTOR,
        ],
        cfg.DIPLOMACY_TRADE_TARGET_MIN,
        cfg.DIPLOMACY_TRADE_TARGET_MAX
      );
      var relationTarget = boundedTarget(
        cfg.DIPLOMACY_RELATION_TARGET_BASE,
        [
          county.prosperity * cfg.DIPLOMACY_RELATION_PROSPERITY_FACTOR,
          county.influence * cfg.DIPLOMACY_RELATION_INFLUENCE_FACTOR,
          -county.suspicion * cfg.DIPLOMACY_RELATION_SUSPICION_FACTOR,
        ],
        cfg.DIPLOMACY_RELATION_TARGET_MIN,
        cfg.DIPLOMACY_RELATION_TARGET_MAX
      );

      county.prosperity = clamp(moveTowardsTarget(county.prosperity, prosperityTarget, cfg.DIPLOMACY_PROSPERITY_SWING * dt), cfg.DIPLOMACY_STAT_MIN, cfg.DIPLOMACY_STAT_MAX);
      county.trade = clamp(moveTowardsTarget(county.trade, tradeTarget, cfg.DIPLOMACY_TRADE_SWING * dt), cfg.DIPLOMACY_STAT_MIN, cfg.DIPLOMACY_STAT_MAX);
      county.relation = clamp(moveTowardsTarget(county.relation, relationTarget, cfg.DIPLOMACY_RELATION_DECAY * dt), cfg.DIPLOMACY_RELATION_MIN, cfg.DIPLOMACY_RELATION_MAX);
    }
  };

  Game.Diplomacy = Diplomacy;
})();
