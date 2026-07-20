/* ==========================================================================
   Idle Empire Ultimate - save.js
   localStorage persistence, export/import (base64), hard reset.
   ========================================================================== */

(function () {
  const cfg = Game.config;
  const Save = {};
  const VERSION = 1;

  /* Only serialize persistent state (strip transient underscore fields) */
  function serializable() {
    const s = Game.state;
    const copy = JSON.parse(JSON.stringify(s));
    delete copy._cps;
    delete copy._rps;
    delete copy._clickValue;
    delete copy._baseCps;
    delete copy._mult;
    copy._version = VERSION;
    copy.lastSave = Date.now();
    return copy;
  }

  Save.save = function () {
    try {
      const data = serializable();
      Game.state.lastSave = data.lastSave;
      localStorage.setItem(cfg.SAVE_KEY, JSON.stringify(data));
      return true;
    } catch (e) {
      console.error("Save failed", e);
      return false;
    }
  };

  /* Merge loaded data into a fresh default state to tolerate missing keys */
  function merge(target, source) {
    Object.keys(source).forEach((k) => {
      // Guard against prototype pollution
      if (k === "__proto__" || k === "constructor" || k === "prototype") return;
      if (
        source[k] &&
        typeof source[k] === "object" &&
        !Array.isArray(source[k]) &&
        target[k] &&
        typeof target[k] === "object" &&
        !Array.isArray(target[k])
      ) {
        merge(target[k], source[k]);
      } else {
        target[k] = source[k];
      }
    });
  }

  Save.applyData = function (data) {
    const fresh = Game.defaultState();
    merge(fresh, data);
    // Ensure every building id exists
    cfg.buildings.forEach((b) => {
      if (typeof fresh.buildings[b.id] !== "number") fresh.buildings[b.id] = 0;
    });
    // Ensure every sub-building id and upgrade level exists
    (cfg.subBuildings || []).forEach((sb) => {
      if (typeof fresh.subBuildings[sb.id] !== "number") fresh.subBuildings[sb.id] = 0;
      if (typeof fresh.subBuildingUpgrades[sb.id] !== "number") fresh.subBuildingUpgrades[sb.id] = 0;
      fresh.subBuildingUpgrades[sb.id] = Math.max(0, Math.min(cfg.SUB_BUILDING_MAX_UPGRADES, fresh.subBuildingUpgrades[sb.id]));
    });
    if (!fresh.skillTrees || typeof fresh.skillTrees !== "object") fresh.skillTrees = {};
    if (!fresh.skillCooldowns || typeof fresh.skillCooldowns !== "object") fresh.skillCooldowns = {};
    if (!Array.isArray(fresh.activeSkillPowers)) fresh.activeSkillPowers = [];
    if (!fresh.energyProducers || typeof fresh.energyProducers !== "object") fresh.energyProducers = {};
    if (!fresh.btcMiners || typeof fresh.btcMiners !== "object") fresh.btcMiners = {};
    if (!fresh.batteries || typeof fresh.batteries !== "object") fresh.batteries = {};
    if (!fresh.coinFarmers || typeof fresh.coinFarmers !== "object") fresh.coinFarmers = {};
    if (!fresh.stocks || typeof fresh.stocks !== "object") fresh.stocks = {};
    if (!fresh.stockHistory || typeof fresh.stockHistory !== "object") fresh.stockHistory = {};
    if (!fresh.portfolio || typeof fresh.portfolio !== "object") fresh.portfolio = {};
    (cfg.energyProducers || []).forEach((p) => {
      if (typeof fresh.energyProducers[p.id] !== "number") fresh.energyProducers[p.id] = 0;
    });
    (cfg.btcMiners || []).forEach((m) => {
      if (typeof fresh.btcMiners[m.id] !== "number") fresh.btcMiners[m.id] = 0;
    });
    (cfg.batteries || []).forEach((b) => {
      if (typeof fresh.batteries[b.id] !== "number") fresh.batteries[b.id] = 0;
    });
    (cfg.coinFarmers || []).forEach((f) => {
      if (typeof fresh.coinFarmers[f.id] !== "number") fresh.coinFarmers[f.id] = 0;
    });
    (cfg.stocks || []).forEach((st) => {
      if (typeof fresh.stocks[st.id] !== "number") fresh.stocks[st.id] = st.basePrice;
      if (!Array.isArray(fresh.stockHistory[st.id])) fresh.stockHistory[st.id] = [fresh.stocks[st.id]];
      if (!fresh.portfolio[st.id] || typeof fresh.portfolio[st.id] !== "object") fresh.portfolio[st.id] = { shares: 0, avgCost: 0 };
      if (typeof fresh.portfolio[st.id].shares !== "number") fresh.portfolio[st.id].shares = 0;
      if (typeof fresh.portfolio[st.id].avgCost !== "number") fresh.portfolio[st.id].avgCost = 0;
    });
    if (!fresh.map || typeof fresh.map !== "object") fresh.map = {};
    if (!Array.isArray(fresh.map.pins)) fresh.map.pins = [];
    if (!fresh.map.counties || typeof fresh.map.counties !== "object") fresh.map.counties = {};
    if (typeof fresh.map.focusCounty !== "string") fresh.map.focusCounty = null;

    if (!fresh.gambling || typeof fresh.gambling !== "object") fresh.gambling = {};
    if (typeof fresh.gambling.chips !== "number") fresh.gambling.chips = 0;
    if (typeof fresh.gambling.totalChipsWon !== "number") fresh.gambling.totalChipsWon = 0;
    if (typeof fresh.gambling.totalChipsLost !== "number") fresh.gambling.totalChipsLost = 0;
    if (typeof fresh.gambling.chipsFromCoins !== "number") fresh.gambling.chipsFromCoins = 0;
    if (typeof fresh.gambling.gamesPlayed !== "number") fresh.gambling.gamesPlayed = 0;
    if (typeof fresh.gambling.gamesWon !== "number") fresh.gambling.gamesWon = 0;
    ["slotStats", "blackjackStats", "pokerStats", "rouletteStats", "diceStats", "plinkoStats"].forEach((key) => {
      if (!fresh.gambling[key] || typeof fresh.gambling[key] !== "object") fresh.gambling[key] = {};
      if (typeof fresh.gambling[key].played !== "number") fresh.gambling[key].played = 0;
      if (typeof fresh.gambling[key].won !== "number") fresh.gambling[key].won = 0;
      if (key === "slotStats" && typeof fresh.gambling[key].bigWins !== "number") fresh.gambling[key].bigWins = 0;
    });
    if (!fresh.gambling.blackjackState || typeof fresh.gambling.blackjackState !== "object") fresh.gambling.blackjackState = {};
    if (!Array.isArray(fresh.gambling.blackjackState.deck)) fresh.gambling.blackjackState.deck = [];
    if (!Array.isArray(fresh.gambling.blackjackState.playerHand)) fresh.gambling.blackjackState.playerHand = [];
    if (!Array.isArray(fresh.gambling.blackjackState.dealerHand)) fresh.gambling.blackjackState.dealerHand = [];
    if (typeof fresh.gambling.blackjackState.bet !== "number") fresh.gambling.blackjackState.bet = 0;
    if (typeof fresh.gambling.blackjackState.phase !== "string") fresh.gambling.blackjackState.phase = "idle";
    if (typeof fresh.gambling.blackjackState.doubled !== "boolean") fresh.gambling.blackjackState.doubled = false;
    if (typeof fresh.gambling.blackjackState.result !== "string") fresh.gambling.blackjackState.result = "";
    if (!fresh.gambling.pokerState || typeof fresh.gambling.pokerState !== "object") fresh.gambling.pokerState = {};
    if (!Array.isArray(fresh.gambling.pokerState.deck)) fresh.gambling.pokerState.deck = [];
    if (!Array.isArray(fresh.gambling.pokerState.hand)) fresh.gambling.pokerState.hand = [];
    if (!Array.isArray(fresh.gambling.pokerState.held)) fresh.gambling.pokerState.held = [false, false, false, false, false];
    if (typeof fresh.gambling.pokerState.bet !== "number") fresh.gambling.pokerState.bet = 0;
    if (typeof fresh.gambling.pokerState.phase !== "string") fresh.gambling.pokerState.phase = "idle";
    if (typeof fresh.gambling.pokerState.result !== "string") fresh.gambling.pokerState.result = "";
    if (typeof fresh.gambling.pokerState.payout !== "number") fresh.gambling.pokerState.payout = 0;

    if (!fresh.horses || typeof fresh.horses !== "object") fresh.horses = {};
    if (!Array.isArray(fresh.horses.owned)) fresh.horses.owned = [];
    if (!Array.isArray(fresh.horses.market)) fresh.horses.market = [];
    if (typeof fresh.horses.marketRefreshIn !== "number") fresh.horses.marketRefreshIn = 300;
    if (!Array.isArray(fresh.horses.raceHistory)) fresh.horses.raceHistory = [];
    if (typeof fresh.horses.nextRaceIn !== "number") fresh.horses.nextRaceIn = 60;
    if (!Array.isArray(fresh.horses.pendingBets)) fresh.horses.pendingBets = [];
    if (typeof fresh.horses.totalRaces !== "number") fresh.horses.totalRaces = 0;
    if (typeof fresh.horses.totalWinnings !== "number") fresh.horses.totalWinnings = 0;
    if (typeof fresh.horses.totalLosses !== "number") fresh.horses.totalLosses = 0;
    if (fresh.horses.currentRace === undefined) fresh.horses.currentRace = null;
    if (fresh.horses.lastRaceResult === undefined) fresh.horses.lastRaceResult = null;

    if (!fresh.cars || typeof fresh.cars !== "object") fresh.cars = {};
    if (!Array.isArray(fresh.cars.owned)) fresh.cars.owned = [];
    if (!Array.isArray(fresh.cars.market)) fresh.cars.market = [];
    if (typeof fresh.cars.marketRefreshIn !== "number") fresh.cars.marketRefreshIn = 600;
    if (!Array.isArray(fresh.cars.raceHistory)) fresh.cars.raceHistory = [];
    if (typeof fresh.cars.nextRaceIn !== "number") fresh.cars.nextRaceIn = 90;
    if (!Array.isArray(fresh.cars.pendingBets)) fresh.cars.pendingBets = [];
    if (typeof fresh.cars.totalRaces !== "number") fresh.cars.totalRaces = 0;
    if (typeof fresh.cars.totalWinnings !== "number") fresh.cars.totalWinnings = 0;
    if (typeof fresh.cars.totalLosses !== "number") fresh.cars.totalLosses = 0;
    if (typeof fresh.cars.currentTrackIndex !== "number") fresh.cars.currentTrackIndex = 0;
    if (fresh.cars.currentRace === undefined) fresh.cars.currentRace = null;
    if (fresh.cars.lastRaceResult === undefined) fresh.cars.lastRaceResult = null;

    // New meta-layer currencies
    if (typeof fresh.empireLegacies  !== "number") fresh.empireLegacies  = 0;
    if (typeof fresh.lifetimeEmpireLegacies !== "number") fresh.lifetimeEmpireLegacies = 0;
    if (typeof fresh.timeFragments   !== "number") fresh.timeFragments   = 0;
    if (typeof fresh.lifetimeTimeFragments !== "number") fresh.lifetimeTimeFragments = 0;
    if (typeof fresh.realityCores    !== "number") fresh.realityCores    = 0;
    if (typeof fresh.lifetimeRealityCores !== "number") fresh.lifetimeRealityCores = 0;

    // Prestige path
    if (fresh.prestigePath !== null && fresh.prestigePath !== undefined &&
        !Game.config.prestigePathMap[fresh.prestigePath]) fresh.prestigePath = null;

    // Economic cycle
    if (!fresh.cycle || typeof fresh.cycle !== "object") fresh.cycle = { phase: "stable", endTime: 0 };
    if (!fresh.cycle.phase) fresh.cycle.phase = "stable";
    if (typeof fresh.cycle.endTime !== "number") fresh.cycle.endTime = 0;

    // Active abilities
    if (!fresh.abilities || typeof fresh.abilities !== "object") fresh.abilities = {};

    // Mega projects
    if (!fresh.megaProjects || typeof fresh.megaProjects !== "object") fresh.megaProjects = {};

    // New stats fields
    if (!fresh.stats) fresh.stats = {};
    if (typeof fresh.stats.empireCount  !== "number") fresh.stats.empireCount  = 0;
    if (typeof fresh.stats.timeCount    !== "number") fresh.stats.timeCount    = 0;
    if (typeof fresh.stats.realityCount !== "number") fresh.stats.realityCount = 0;
    if (typeof fresh.stats.megaProjectsCompleted !== "number") fresh.stats.megaProjectsCompleted = 0;

    Game.state = fresh;
    if (Game.Diplomacy && Game.Diplomacy.ensureState) Game.Diplomacy.ensureState();
    if (Game.Cycles && Game.Cycles.ensureState) Game.Cycles.ensureState();
    if (Game.Gambling && Game.Gambling.ensureState) Game.Gambling.ensureState();
    if (Game.Gambling && Game.Gambling.ensureHorseState) Game.Gambling.ensureHorseState();
    if (Game.Gambling && Game.Gambling.ensureCarState) Game.Gambling.ensureCarState();
    Game.recalculate();
  };

  Save.load = function () {
    try {
      const raw = localStorage.getItem(cfg.SAVE_KEY);
      if (!raw) return false;
      const data = JSON.parse(raw);
      Save.applyData(data);
      return true;
    } catch (e) {
      console.error("Load failed", e);
      return false;
    }
  };

  Save.exportSave = function () {
    const data = serializable();
    const json = JSON.stringify(data);
    return btoa(unescape(encodeURIComponent(json)));
  };

  Save.importSave = function (str) {
    try {
      const json = decodeURIComponent(escape(atob(str.trim())));
      const data = JSON.parse(json);
      Save.applyData(data);
      Save.save();
      return true;
    } catch (e) {
      console.error("Import failed", e);
      return false;
    }
  };

  Save.hardReset = function () {
    try {
      localStorage.removeItem(cfg.SAVE_KEY);
    } catch (e) {
      /* ignore */
    }
    Game.state = Game.defaultState();
    Game.recalculate();
  };

  Game.Save = Save;
})();
