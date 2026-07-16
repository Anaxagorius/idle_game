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
    Game.state = fresh;
    if (Game.Diplomacy && Game.Diplomacy.ensureState) Game.Diplomacy.ensureState();
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
