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
    s.upgrades = {};
    s.lifetimeCoins = 0;
    s.activeEvents = [];
    s.activeTalentPowers = [];
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
    s.upgrades = {};
    s.research = {};
    s.unlocked = {};
    s.activeEvents = [];
    s.activeTalentPowers = [];
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
