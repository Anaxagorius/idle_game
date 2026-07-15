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
    if (setting === -1) return Math.max(1, Buildings.maxAffordable(buildingId));
    return setting;
  };

  Buildings.canAfford = function (buildingId, amount) {
    return Game.state.coins >= Buildings.bulkCost(buildingId, amount);
  };

  /* Purchase buildings. Returns number actually bought. */
  Buildings.buy = function (buildingId, amountArg) {
    const s = Game.state;
    let amount = amountArg !== undefined ? amountArg : Buildings.resolveAmount(buildingId);
    if (Game.state.automation.buyAmount === -1 && amountArg === undefined) {
      amount = Buildings.maxAffordable(buildingId);
    }
    if (amount <= 0) return 0;

    const cost = Buildings.bulkCost(buildingId, amount);
    if (s.coins < cost) {
      // fall back to as many as affordable
      const max = Buildings.maxAffordable(buildingId);
      if (max <= 0) return 0;
      amount = Math.min(amount, max);
      const c2 = Buildings.bulkCost(buildingId, amount);
      if (s.coins < c2) return 0;
      s.coins -= c2;
      s.stats.totalCoinsSpent += c2;
    } else {
      s.coins -= cost;
      s.stats.totalCoinsSpent += cost;
    }

    s.buildings[buildingId] = (s.buildings[buildingId] || 0) + amount;
    Game.recalculate();
    return amount;
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

  Game.Buildings = Buildings;
})();
