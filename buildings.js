/* ==========================================================================
   Idle Empire Ultimate - buildings.js
   Building purchase logic, cost scaling, bulk buying and upgrades.
   ========================================================================== */

(function () {
  const cfg = Game.config;
  const Buildings = {};

  /* Cost of the (owned+offset)-th building */
  Buildings.costOf = function (buildingId, ownedOverride) {
    const b = cfg.buildingMap[buildingId];
    const owned = ownedOverride !== undefined ? ownedOverride : Game.state.buildings[buildingId] || 0;
    const reduction = (Game.state._mult && Game.state._mult.costReduction) || 1;
    return b.baseCost * Math.pow(cfg.COST_SCALE, owned) * reduction;
  };

  /* Cost of buying `amount` buildings starting from current owned count.
     Uses geometric series for the 1.15^owned scaling. */
  Buildings.bulkCost = function (buildingId, amount) {
    const b = cfg.buildingMap[buildingId];
    const owned = Game.state.buildings[buildingId] || 0;
    const reduction = (Game.state._mult && Game.state._mult.costReduction) || 1;
    const r = cfg.COST_SCALE;
    // sum_{k=0}^{amount-1} baseCost * r^(owned+k)
    const first = b.baseCost * Math.pow(r, owned);
    const total = first * (Math.pow(r, amount) - 1) / (r - 1);
    return total * reduction;
  };

  /* How many can be afforded (used for "max" buy) */
  Buildings.maxAffordable = function (buildingId) {
    const b = cfg.buildingMap[buildingId];
    const owned = Game.state.buildings[buildingId] || 0;
    const reduction = (Game.state._mult && Game.state._mult.costReduction) || 1;
    const r = cfg.COST_SCALE;
    const coins = Game.state.coins;
    const first = b.baseCost * Math.pow(r, owned) * reduction;
    if (coins < first) return 0;
    // coins >= first * (r^n - 1)/(r-1)  =>  solve for n
    const n = Math.floor(Math.log((coins * (r - 1)) / first + 1) / Math.log(r));
    return Math.max(0, n);
  };

  /* Resolve the requested buy amount into a concrete number */
  Buildings.resolveAmount = function (buildingId) {
    const setting = Game.state.automation.buyAmount;
    if (setting === -1) return Math.max(1, Buildings.maxPurchasable(buildingId));
    return setting;
  };

  Buildings.canAfford = function (buildingId, amount) {
    return Buildings.maxPurchasable(buildingId) >= Math.max(1, amount || 1);
  };

  Buildings.previousBuildingId = function (buildingId) {
    const idx = cfg.buildings.findIndex((b) => b.id === buildingId);
    if (idx <= 0) return null;
    return cfg.buildings[idx - 1].id;
  };

  Buildings.requirementRatio = function (buildingId) {
    const b = cfg.buildingMap[buildingId];
    if (!b) return 0;
    const prevId = Buildings.previousBuildingId(buildingId);
    if (!prevId) return 0;
    const map = cfg.BUILDING_PREREQ_BY_TIER || {};
    return map[b.tier] || 0;
  };

  Buildings.requiredPrevious = function (buildingId, amount) {
    const ratio = Buildings.requirementRatio(buildingId);
    if (!ratio) return 0;
    return ratio * Math.max(1, amount || 1);
  };

  Buildings.maxAffordableByRequirement = function (buildingId) {
    const prevId = Buildings.previousBuildingId(buildingId);
    const ratio = Buildings.requirementRatio(buildingId);
    if (!prevId || !ratio) return Infinity;
    const prevOwned = Game.state.buildings[prevId] || 0;
    return Math.floor(prevOwned / ratio);
  };

  Buildings.maxPurchasable = function (buildingId) {
    return Math.max(0, Math.min(Buildings.maxAffordable(buildingId), Buildings.maxAffordableByRequirement(buildingId)));
  };

  /* Purchase buildings. Returns number actually bought. */
  Buildings.buy = function (buildingId, amountArg) {
    const s = Game.state;
    let amount = amountArg !== undefined ? amountArg : Buildings.resolveAmount(buildingId);
    if (Game.state.automation.buyAmount === -1 && amountArg === undefined) {
      amount = Buildings.maxPurchasable(buildingId);
    }
    if (amount <= 0) return 0;

    const cost = Buildings.bulkCost(buildingId, amount);
    const prevId = Buildings.previousBuildingId(buildingId);
    const requiredPrev = Buildings.requiredPrevious(buildingId, amount);
    const hasPrereq = !prevId || (s.buildings[prevId] || 0) >= requiredPrev;
    let finalCost = cost;
    if (s.coins < cost || !hasPrereq) {
      // fall back to as many as affordable
      const max = Buildings.maxPurchasable(buildingId);
      if (max <= 0) return 0;
      amount = Math.min(amount, max);
      finalCost = Buildings.bulkCost(buildingId, amount);
      if (s.coins < finalCost) return 0;
    }

    const finalRequiredPrev = Buildings.requiredPrevious(buildingId, amount);
    if (prevId && finalRequiredPrev > 0) {
      // Safety guard for state mutations between amount resolution and final purchase application.
      if ((s.buildings[prevId] || 0) < finalRequiredPrev) return 0;
      s.buildings[prevId] -= finalRequiredPrev;
    }
    s.coins -= finalCost;
    s.stats.totalCoinsSpent += finalCost;
    s.buildings[buildingId] = (s.buildings[buildingId] || 0) + amount;
    if (Game.MapUI) Game.MapUI.placeBuildingPin(buildingId);
    Game.recalculate();
    return amount;
  };

  /* ---------------------------------------------------------------------
     Sub-buildings
     --------------------------------------------------------------------- */
  Buildings.subBuildingsForParent = function (buildingId) {
    return cfg.subBuildingsByParent[buildingId] || [];
  };
  function normalizeSubAmount(amountArg) {
    if (amountArg === undefined || amountArg === null) return 1;
    return Math.max(0, Math.floor(amountArg));
  }

  Buildings.allocatedParentUnits = function (buildingId) {
    const subs = Buildings.subBuildingsForParent(buildingId);
    return subs.reduce((sum, sb) => sum + (Game.state.subBuildings[sb.id] || 0), 0);
  };

  Buildings.availableParentUnits = function (buildingId) {
    const owned = Game.state.buildings[buildingId] || 0;
    const allocated = Buildings.allocatedParentUnits(buildingId);
    return Math.max(0, owned - allocated);
  };

  Buildings.canBuySubBuilding = function (subId, amountArg) {
    const sb = cfg.subBuildingMap[subId];
    if (!sb) return false;
    const amount = normalizeSubAmount(amountArg);
    if (amount <= 0) return false;
    return Buildings.availableParentUnits(sb.parent) >= amount;
  };

  Buildings.buySubBuilding = function (subId, amountArg) {
    const sb = cfg.subBuildingMap[subId];
    if (!sb) return 0;
    const amount = normalizeSubAmount(amountArg);
    if (amount <= 0) return 0;
    const available = Buildings.availableParentUnits(sb.parent);
    const bought = Math.min(amount, available);
    if (bought <= 0) return 0;
    Game.state.subBuildings[sb.id] = (Game.state.subBuildings[sb.id] || 0) + bought;
    Game.recalculate();
    return bought;
  };

  Buildings.subUpgradeLevel = function (subId) {
    return Math.max(0, (Game.state.subBuildingUpgrades && Game.state.subBuildingUpgrades[subId]) || 0);
  };

  Buildings.subUpgradeCost = function (subId) {
    const sb = cfg.subBuildingMap[subId];
    if (!sb) return Infinity;
    const level = Buildings.subUpgradeLevel(subId);
    if (level >= cfg.SUB_BUILDING_MAX_UPGRADES) return Infinity;
    const reduction = (Game.state._mult && Game.state._mult.costReduction) || 1;
    return sb.upgradeCosts[level] * reduction;
  };

  Buildings.canUpgradeSubBuilding = function (subId) {
    const sb = cfg.subBuildingMap[subId];
    if (!sb) return false;
    const level = Buildings.subUpgradeLevel(subId);
    if (level >= cfg.SUB_BUILDING_MAX_UPGRADES) return false;
    return Game.state.coins >= Buildings.subUpgradeCost(subId);
  };

  Buildings.upgradeSubBuilding = function (subId) {
    if (!Buildings.canUpgradeSubBuilding(subId)) return false;
    const cost = Buildings.subUpgradeCost(subId);
    Game.state.coins -= cost;
    Game.state.stats.totalCoinsSpent += cost;
    Game.state.subBuildingUpgrades[subId] = Buildings.subUpgradeLevel(subId) + 1;
    Game.recalculate();
    return true;
  };

  /* ---------------------------------------------------------------------
     Upgrades
     --------------------------------------------------------------------- */
  Buildings.upgradeUnlocked = function (upgradeId) {
    const u = cfg.upgradeMap[upgradeId];
    return (Game.state.buildings[u.building] || 0) >= u.threshold;
  };

  Buildings.upgradePurchased = function (upgradeId) {
    return !!Game.state.upgrades[upgradeId];
  };

  Buildings.upgradeCost = function (upgradeId) {
    const u = cfg.upgradeMap[upgradeId];
    const reduction = (Game.state._mult && Game.state._mult.costReduction) || 1;
    return u.cost * reduction;
  };

  Buildings.canAffordUpgrade = function (upgradeId) {
    return (
      Buildings.upgradeUnlocked(upgradeId) &&
      !Buildings.upgradePurchased(upgradeId) &&
      Game.state.coins >= Buildings.upgradeCost(upgradeId)
    );
  };

  Buildings.buyUpgrade = function (upgradeId) {
    const s = Game.state;
    if (!Buildings.canAffordUpgrade(upgradeId)) return false;
    const cost = Buildings.upgradeCost(upgradeId);
    s.coins -= cost;
    s.stats.totalCoinsSpent += cost;
    s.upgrades[upgradeId] = true;
    Game.recalculate();
    return true;
  };

  /* List upgrades that are unlocked (visible) for the UI */
  Buildings.availableUpgrades = function () {
    return cfg.upgrades.filter((u) => Buildings.upgradeUnlocked(u.id) && !Buildings.upgradePurchased(u.id));
  };

  Buildings.totalOwned = function () {
    return cfg.buildings.reduce((sum, b) => sum + (Game.state.buildings[b.id] || 0), 0);
  };

  /* ---------------------------------------------------------------------
     Clicker upgrades
     --------------------------------------------------------------------- */
  Buildings.clickerUpgradeCost = function () {
    const level = Game.state.clickerUpgrades || 0;
    if (level >= cfg.CLICKER_UPGRADE_MAX) return Infinity;
    return cfg.CLICKER_UPGRADE_BASE_COST * Math.pow(cfg.CLICKER_UPGRADE_COST_MULT, level);
  };

  Buildings.canBuyClickerUpgrade = function () {
    const level = Game.state.clickerUpgrades || 0;
    if (level >= cfg.CLICKER_UPGRADE_MAX) return false;
    return Game.state.coins >= Buildings.clickerUpgradeCost();
  };

  Buildings.buyClickerUpgrade = function () {
    if (!Buildings.canBuyClickerUpgrade()) return false;
    const cost = Buildings.clickerUpgradeCost();
    Game.state.coins -= cost;
    Game.state.stats.totalCoinsSpent += cost;
    Game.state.clickerUpgrades = (Game.state.clickerUpgrades || 0) + 1;
    Game.recalculate();
    return true;
  };

  Game.Buildings = Buildings;
})();
