/* ==========================================================================
   Idle Empire Ultimate - prestige.js
   Three-layer meta progression: Prestige, Research Reset, Ascension.
   ========================================================================== */

(function () {
  const cfg = Game.config;
  const Prestige = {};

  /* Reset coins, buildings and upgrades (shared by prestige & higher layers) */
  function resetEconomy() {
    const s = Game.state;
    s.coins = 0;
    cfg.buildings.forEach((b) => (s.buildings[b.id] = 0));
    (cfg.subBuildings || []).forEach((sb) => {
      s.subBuildings[sb.id] = 0;
      s.subBuildingUpgrades[sb.id] = 0;
    });
    s.upgrades = {};
    s.lifetimeCoins = 0;
    s.activeEvents = [];
    s.activeTalentPowers = [];
    s.activeSkillPowers = [];
    s.energy = 0;
    s.btc = 0;
    s.btcMarketTime = 0;
    s.btcPrice = cfg.BTC_BASE_PRICE;
    (cfg.energyProducers || []).forEach((p) => (s.energyProducers[p.id] = 0));
    (cfg.btcMiners || []).forEach((m) => (s.btcMiners[m.id] = 0));
    (cfg.batteries || []).forEach((b) => (s.batteries[b.id] = 0));
    (cfg.coinFarmers || []).forEach((f) => (s.coinFarmers[f.id] = 0));
    s.energyCap = cfg.BTC_BASE_ENERGY_CAP;
    (cfg.stocks || []).forEach((st) => {
      s.stocks[st.id] = st.basePrice;
      s.stockHistory[st.id] = [st.basePrice];
      s.portfolio[st.id] = { shares: 0, avgCost: 0 };
    });
    s.stockTickTimer = 0;
    s.stockDividendTimer = 0;
    // Clear building pins (buildings are gone), but keep the selected county
    if (s.map) s.map.pins = [];
    if (Game.MapUI) {
      Game.MapUI.refresh();
      Game.MapUI._updateEmpirePanel();
    }
  }

  /* ---------------------------------------------------------------------
     Layer 1: Prestige -> Prestige Points
     --------------------------------------------------------------------- */
  Prestige.potential = function () {
    return Game.potentialPrestige();
  };

  Prestige.canPrestige = function () {
    return Prestige.potential() >= 1;
  };

  Prestige.prestige = function (force) {
    const s = Game.state;
    const gain = Prestige.potential();
    if (gain < 1 && !force) return false;

    s.prestigePoints += gain;
    s.lifetimePrestigePoints += gain;
    s.stats.prestigeCount++;

    resetEconomy();
    Game.recalculate();
    if (Game.UI && Game.UI.toast) Game.UI.toast("Prestiged! +" + Game.formatNumber(gain) + " PP", "prestige");
    return true;
  };

  /* ---------------------------------------------------------------------
     Layer 2: Research Reset -> spend PP for RP
     --------------------------------------------------------------------- */
  Prestige.canResearchReset = function () {
    return Game.state.prestigePoints >= cfg.RESEARCH_RESET_PP_COST;
  };

  Prestige.researchReset = function () {
    const s = Game.state;
    if (!Prestige.canResearchReset()) return false;
    const times = Math.floor(s.prestigePoints / cfg.RESEARCH_RESET_PP_COST);
    const ppSpent = times * cfg.RESEARCH_RESET_PP_COST;
    const rpGain = times * cfg.RESEARCH_RESET_RP_GAIN * (cfg.GAIN_EFFECTIVENESS_MULT || 1);

    s.prestigePoints -= ppSpent;
    s.researchPoints += rpGain;

    resetEconomy();
    Game.recalculate();
    if (Game.UI && Game.UI.toast) Game.UI.toast("Research Reset! +" + Game.formatNumber(rpGain) + " RP", "research");
    return true;
  };

  /* ---------------------------------------------------------------------
     Layer 3: Ascension -> Ascension Shards
     --------------------------------------------------------------------- */
  Prestige.canAscend = function () {
    // Uses potential shards so the check automatically respects gain-effectiveness scaling.
    return Prestige.potentialShards() >= 1;
  };

  Prestige.potentialShards = function () {
    return Math.floor((Game.state.prestigePoints / cfg.ASCENSION_REQUIRED_PP) * (cfg.GAIN_EFFECTIVENESS_MULT || 1));
  };

  Prestige.ascend = function () {
    const s = Game.state;
    if (!Prestige.canAscend()) return false;
    const shards = Prestige.potentialShards();

    s.ascensionShards += shards;
    s.stats.ascensionCount++;

    // Reset everything except ascension shards, stats, achievements, milestones, settings
    s.coins = 0;
    s.lifetimeCoins = 0;
    s.prestigePoints = 0;
    s.researchPoints = 0;
    cfg.buildings.forEach((b) => (s.buildings[b.id] = 0));
    (cfg.subBuildings || []).forEach((sb) => {
      s.subBuildings[sb.id] = 0;
      s.subBuildingUpgrades[sb.id] = 0;
    });
    s.upgrades = {};
    s.research = {};
    s.unlocked = {};
    s.activeEvents = [];
    s.activeTalentPowers = [];
    s.activeSkillPowers = [];
    s.energy = 0;
    s.btc = 0;
    s.btcMarketTime = 0;
    s.btcPrice = cfg.BTC_BASE_PRICE;
    (cfg.energyProducers || []).forEach((p) => (s.energyProducers[p.id] = 0));
    (cfg.btcMiners || []).forEach((m) => (s.btcMiners[m.id] = 0));
    (cfg.batteries || []).forEach((b) => (s.batteries[b.id] = 0));
    (cfg.coinFarmers || []).forEach((f) => (s.coinFarmers[f.id] = 0));
    s.energyCap = cfg.BTC_BASE_ENERGY_CAP;
    (cfg.stocks || []).forEach((st) => {
      s.stocks[st.id] = st.basePrice;
      s.stockHistory[st.id] = [st.basePrice];
      s.portfolio[st.id] = { shares: 0, avgCost: 0 };
    });
    s.stockTickTimer = 0;
    s.stockDividendTimer = 0;
    // Automation toggles reset (features must be re-unlocked via research)
    s.automation.autoClick = false;
    s.automation.autoBuy = false;
    s.automation.autoUpgrade = false;
    s.automation.autoResearch = false;
    s.automation.autoPrestige = false;
    s.automation.autoAscend = false;

    Game.recalculate();
    if (Game.UI && Game.UI.toast) Game.UI.toast("Ascended! +" + Game.formatNumber(shards) + " Ascension Shards", "prestige");
    return true;
  };

  /* ---------------------------------------------------------------------
     Layer 4: Ascension Shards → Empire Legacies
     --------------------------------------------------------------------- */
  Prestige.potentialLegacies = function () {
    const s = Game.state;
    const shards = s.ascensionShards || 0;
    return Math.floor((shards / cfg.EMPIRE_REQUIRED_SHARDS) * (cfg.GAIN_EFFECTIVENESS_MULT || 1));
  };

  Prestige.canEmpire = function () {
    return Prestige.potentialLegacies() >= 1;
  };

  Prestige.empire = function () {
    const s = Game.state;
    if (!Prestige.canEmpire()) return false;
    const legacies = Prestige.potentialLegacies();

    s.empireLegacies = (s.empireLegacies || 0) + legacies;
    s.lifetimeEmpireLegacies = (s.lifetimeEmpireLegacies || 0) + legacies;
    s.stats.empireCount = (s.stats.empireCount || 0) + 1;

    // Reset everything except Empire Legacies+, stats, achievements, milestones, settings
    s.ascensionShards = 0;
    s.coins = 0;
    s.lifetimeCoins = 0;
    s.prestigePoints = 0;
    s.researchPoints = 0;
    cfg.buildings.forEach((b) => (s.buildings[b.id] = 0));
    (cfg.subBuildings || []).forEach((sb) => {
      s.subBuildings[sb.id] = 0;
      s.subBuildingUpgrades[sb.id] = 0;
    });
    s.upgrades = {};
    s.research = {};
    s.unlocked = {};
    s.activeEvents = [];
    s.activeTalentPowers = [];
    s.activeSkillPowers = [];
    s.energy = 0;
    s.btc = 0;
    s.btcMarketTime = 0;
    s.btcPrice = cfg.BTC_BASE_PRICE;
    (cfg.energyProducers || []).forEach((p) => (s.energyProducers[p.id] = 0));
    (cfg.btcMiners || []).forEach((m) => (s.btcMiners[m.id] = 0));
    (cfg.batteries || []).forEach((b) => (s.batteries[b.id] = 0));
    (cfg.coinFarmers || []).forEach((f) => (s.coinFarmers[f.id] = 0));
    s.energyCap = cfg.BTC_BASE_ENERGY_CAP;
    (cfg.stocks || []).forEach((st) => {
      s.stocks[st.id] = st.basePrice;
      s.stockHistory[st.id] = [st.basePrice];
      s.portfolio[st.id] = { shares: 0, avgCost: 0 };
    });
    s.stockTickTimer = 0;
    s.stockDividendTimer = 0;
    s.automation.autoClick = false;
    s.automation.autoBuy = false;
    s.automation.autoUpgrade = false;
    s.automation.autoResearch = false;
    s.automation.autoPrestige = false;
    s.automation.autoAscend = false;
    s.godsTitans = {};
    s.talents = {};
    s.skillTrees = {};
    s.prestigePath = null;

    Game.recalculate();
    if (Game.UI && Game.UI.toast) Game.UI.toast("Empire Legacy forged! +" + Game.formatNumber(legacies) + " Empire Legacies", "empire");
    return true;
  };

  /* ---------------------------------------------------------------------
     Layer 5: Empire Legacies → Time Fragments
     --------------------------------------------------------------------- */
  Prestige.potentialFragments = function () {
    const s = Game.state;
    const legacies = s.empireLegacies || 0;
    return Math.floor((legacies / cfg.TIME_REQUIRED_LEGACIES) * (cfg.GAIN_EFFECTIVENESS_MULT || 1));
  };

  Prestige.canTimeRift = function () {
    return Prestige.potentialFragments() >= 1;
  };

  Prestige.timeRift = function () {
    const s = Game.state;
    if (!Prestige.canTimeRift()) return false;
    const fragments = Prestige.potentialFragments();

    s.timeFragments = (s.timeFragments || 0) + fragments;
    s.lifetimeTimeFragments = (s.lifetimeTimeFragments || 0) + fragments;
    s.stats.timeCount = (s.stats.timeCount || 0) + 1;

    // Reset everything except Time Fragments+, stats, achievements, milestones, settings
    s.empireLegacies = 0;
    s.ascensionShards = 0;
    s.coins = 0;
    s.lifetimeCoins = 0;
    s.prestigePoints = 0;
    s.researchPoints = 0;
    cfg.buildings.forEach((b) => (s.buildings[b.id] = 0));
    (cfg.subBuildings || []).forEach((sb) => {
      s.subBuildings[sb.id] = 0;
      s.subBuildingUpgrades[sb.id] = 0;
    });
    s.upgrades = {};
    s.research = {};
    s.unlocked = {};
    s.activeEvents = [];
    s.activeTalentPowers = [];
    s.activeSkillPowers = [];
    s.energy = 0;
    s.btc = 0;
    s.btcMarketTime = 0;
    s.btcPrice = cfg.BTC_BASE_PRICE;
    (cfg.energyProducers || []).forEach((p) => (s.energyProducers[p.id] = 0));
    (cfg.btcMiners || []).forEach((m) => (s.btcMiners[m.id] = 0));
    (cfg.batteries || []).forEach((b) => (s.batteries[b.id] = 0));
    (cfg.coinFarmers || []).forEach((f) => (s.coinFarmers[f.id] = 0));
    s.energyCap = cfg.BTC_BASE_ENERGY_CAP;
    (cfg.stocks || []).forEach((st) => {
      s.stocks[st.id] = st.basePrice;
      s.stockHistory[st.id] = [st.basePrice];
      s.portfolio[st.id] = { shares: 0, avgCost: 0 };
    });
    s.stockTickTimer = 0;
    s.stockDividendTimer = 0;
    s.automation.autoClick = false;
    s.automation.autoBuy = false;
    s.automation.autoUpgrade = false;
    s.automation.autoResearch = false;
    s.automation.autoPrestige = false;
    s.automation.autoAscend = false;
    s.godsTitans = {};
    s.talents = {};
    s.skillTrees = {};
    s.megaProjects = {};
    s.prestigePath = null;

    Game.recalculate();
    if (Game.UI && Game.UI.toast) Game.UI.toast("Time Rift opened! +" + Game.formatNumber(fragments) + " Time Fragments", "empire");
    return true;
  };

  /* ---------------------------------------------------------------------
     Layer 6: Time Fragments → Reality Cores
     --------------------------------------------------------------------- */
  Prestige.potentialCores = function () {
    const s = Game.state;
    const fragments = s.timeFragments || 0;
    return Math.floor((fragments / cfg.REALITY_REQUIRED_FRAGMENTS) * (cfg.GAIN_EFFECTIVENESS_MULT || 1));
  };

  Prestige.canRealityCollapse = function () {
    return Prestige.potentialCores() >= 1;
  };

  Prestige.realityCollapse = function () {
    const s = Game.state;
    if (!Prestige.canRealityCollapse()) return false;
    const cores = Prestige.potentialCores();

    s.realityCores = (s.realityCores || 0) + cores;
    s.lifetimeRealityCores = (s.lifetimeRealityCores || 0) + cores;
    s.stats.realityCount = (s.stats.realityCount || 0) + 1;

    // Total reset — only Reality Cores, stats, achievements, milestones survive
    s.timeFragments = 0;
    s.empireLegacies = 0;
    s.ascensionShards = 0;
    s.coins = 0;
    s.lifetimeCoins = 0;
    s.prestigePoints = 0;
    s.researchPoints = 0;
    cfg.buildings.forEach((b) => (s.buildings[b.id] = 0));
    (cfg.subBuildings || []).forEach((sb) => {
      s.subBuildings[sb.id] = 0;
      s.subBuildingUpgrades[sb.id] = 0;
    });
    s.upgrades = {};
    s.research = {};
    s.unlocked = {};
    s.activeEvents = [];
    s.activeTalentPowers = [];
    s.activeSkillPowers = [];
    s.energy = 0;
    s.btc = 0;
    s.btcMarketTime = 0;
    s.btcPrice = cfg.BTC_BASE_PRICE;
    (cfg.energyProducers || []).forEach((p) => (s.energyProducers[p.id] = 0));
    (cfg.btcMiners || []).forEach((m) => (s.btcMiners[m.id] = 0));
    (cfg.batteries || []).forEach((b) => (s.batteries[b.id] = 0));
    (cfg.coinFarmers || []).forEach((f) => (s.coinFarmers[f.id] = 0));
    s.energyCap = cfg.BTC_BASE_ENERGY_CAP;
    (cfg.stocks || []).forEach((st) => {
      s.stocks[st.id] = st.basePrice;
      s.stockHistory[st.id] = [st.basePrice];
      s.portfolio[st.id] = { shares: 0, avgCost: 0 };
    });
    s.stockTickTimer = 0;
    s.stockDividendTimer = 0;
    s.automation.autoClick = false;
    s.automation.autoBuy = false;
    s.automation.autoUpgrade = false;
    s.automation.autoResearch = false;
    s.automation.autoPrestige = false;
    s.automation.autoAscend = false;
    s.godsTitans = {};
    s.talents = {};
    s.skillTrees = {};
    s.megaProjects = {};
    s.prestigePath = null;

    Game.recalculate();
    if (Game.UI && Game.UI.toast) Game.UI.toast("Reality collapsed! +" + Game.formatNumber(cores) + " Reality Cores", "reality");
    return true;
  };

  /* ---------------------------------------------------------------------
     Prestige Path selection
     --------------------------------------------------------------------- */
  Prestige.setPrestigePath = function (pathId) {
    if (!cfg.prestigePathMap[pathId]) return false;
    Game.state.prestigePath = pathId;
    Game.recalculate();
    if (Game.UI && Game.UI.toast) Game.UI.toast("Prestige Path: " + cfg.prestigePathMap[pathId].name, "info");
    return true;
  };

  Prestige.godTitanPurchased = function (id) {
    return !!Game.state.godsTitans[id];
  };

  Prestige.godTitanAvailable = function (id) {
    const gt = cfg.godTitanMap[id];
    if (!gt || Prestige.godTitanPurchased(id)) return false;
    if (gt.requires && !Prestige.godTitanPurchased(gt.requires)) return false;
    return true;
  };

  Prestige.canAffordGodTitan = function (id) {
    const gt = cfg.godTitanMap[id];
    return !!gt && Prestige.godTitanAvailable(id) && Game.state.ascensionShards >= gt.cost;
  };

  Prestige.buyGodTitan = function (id) {
    const s = Game.state;
    if (!Prestige.canAffordGodTitan(id)) return false;
    const gt = cfg.godTitanMap[id];
    s.ascensionShards -= gt.cost;
    s.godsTitans[id] = true;
    Game.recalculate();
    if (Game.UI && Game.UI.toast) Game.UI.toast("Unlocked: " + gt.name, "prestige");
    return true;
  };

  Game.Prestige = Prestige;
})();
