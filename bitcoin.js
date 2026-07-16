/* ==========================================================================
   Idle Empire Ultimate - bitcoin.js
   Energy production, manual bitcoin farming, mining hardware and BTC selling.
   ========================================================================== */

(function () {
  const cfg = Game.config;
  const Bitcoin = {};
  // Snapshot math uses demand * dt; keep dt above zero so UI rate previews stay stable.
  const SNAPSHOT_MIN_DELTA_TIME = 0.05;

  function ownedCount(group, id) {
    return (Game.state[group] && Game.state[group][id]) || 0;
  }

  function mult(name, fallback) {
    const mults = Game.state._mult || {};
    const value = mults[name];
    return value === undefined ? (fallback === undefined ? 1 : fallback) : value;
  }

  function clampEnergy(value) {
    return Math.max(0, Math.min(Bitcoin.energyCap(), value || 0));
  }

  function purchaseEquipment(list, group, id) {
    const def = list.find((item) => item.id === id);
    if (!def) return false;
    const owned = ownedCount(group, id);
    const cost = Bitcoin.equipmentCost(def.baseCost, owned);
    if (Game.state.coins < cost) return false;
    Game.state.coins -= cost;
    Game.state.stats.totalCoinsSpent += cost;
    Game.state[group][id] = owned + 1;
    return true;
  }

  Bitcoin.equipmentCost = function (baseCost, owned) {
    return baseCost * Math.pow(cfg.BTC_EQUIPMENT_COST_SCALE, owned);
  };

  Bitcoin.buyProducer = function (id) {
    return purchaseEquipment(cfg.energyProducers, "energyProducers", id);
  };

  Bitcoin.buyMiner = function (id) {
    return purchaseEquipment(cfg.btcMiners, "btcMiners", id);
  };

  Bitcoin.buyBattery = function (id) {
    return purchaseEquipment(cfg.batteries, "batteries", id);
  };

  Bitcoin.buyCoinFarmer = function (id) {
    return purchaseEquipment(cfg.coinFarmers || [], "coinFarmers", id);
  };

  Bitcoin.energyProductionBase = function () {
    return cfg.energyProducers.reduce((sum, p) => sum + p.energyPerSec * ownedCount("energyProducers", p.id), 0);
  };

  Bitcoin.energyProduction = function () {
    return Bitcoin.energyProductionBase() * mult("energyProduction", 1);
  };

  Bitcoin.minerDemand = function () {
    return cfg.btcMiners.reduce((sum, m) => sum + m.energyUse * ownedCount("btcMiners", m.id), 0);
  };

  Bitcoin.coinFarmerDemand = function () {
    return (cfg.coinFarmers || []).reduce((sum, f) => sum + f.energyUse * ownedCount("coinFarmers", f.id), 0);
  };

  Bitcoin.energyConsumption = function () {
    return Bitcoin.minerDemand() + Bitcoin.coinFarmerDemand();
  };

  Bitcoin.batteryCapacityBase = function () {
    return cfg.batteries.reduce((sum, b) => sum + b.capacity * ownedCount("batteries", b.id), 0);
  };

  Bitcoin.batteryCapacity = function () {
    return Bitcoin.batteryCapacityBase() * mult("energyCapacity", 1);
  };

  Bitcoin.energyCap = function () {
    return Math.max(0, cfg.BTC_BASE_ENERGY_CAP + Bitcoin.batteryCapacity());
  };

  Bitcoin.baseMiningRate = function () {
    return cfg.btcMiners.reduce((sum, m) => sum + m.btcPerSec * ownedCount("btcMiners", m.id), 0);
  };

  Bitcoin.baseCoinFarmerRate = function () {
    return (cfg.coinFarmers || []).reduce((sum, f) => sum + f.coinsPerSec * ownedCount("coinFarmers", f.id), 0);
  };

  Bitcoin.manualEnergyGain = function () {
    const batteries = cfg.batteries.reduce((sum, b) => sum + ownedCount("batteries", b.id), 0);
    return cfg.BTC_BASE_MANUAL_ENERGY * mult("energyClick", 1) * (1 + batteries * 0.03);
  };

  Bitcoin.manualBitcoinGain = function () {
    const miners = cfg.btcMiners.reduce((sum, m) => sum + ownedCount("btcMiners", m.id), 0);
    return cfg.BTC_BASE_MANUAL_BTC * mult("btcClick", 1) * (1 + miners * 0.02);
  };

  Bitcoin.manualMineEnergyCost = function () {
    return cfg.BTC_MANUAL_MINE_ENERGY_COST;
  };

  Bitcoin.collectEnergy = function () {
    const gain = Bitcoin.manualEnergyGain();
    const before = Game.state.energy;
    Game.state.energy = clampEnergy(before + gain);
    const actual = Game.state.energy - before;
    if (actual <= 0) return false;
    Game.state.stats.totalEnergyCollected = (Game.state.stats.totalEnergyCollected || 0) + actual;
    Game.state.stats.totalEnergyGenerated = (Game.state.stats.totalEnergyGenerated || 0) + actual;
    return true;
  };

  Bitcoin.farmBitcoin = function () {
    const s = Game.state;
    const energyCost = Bitcoin.manualMineEnergyCost();
    if (s.energy < energyCost) return false;
    const gain = Bitcoin.manualBitcoinGain();
    s.energy -= energyCost;
    s.btc += gain;
    s.stats.totalEnergySpent = (s.stats.totalEnergySpent || 0) + energyCost;
    s.stats.totalBtcMined = (s.stats.totalBtcMined || 0) + gain;
    s.stats.totalManualBtcMined = (s.stats.totalManualBtcMined || 0) + gain;
    return true;
  };

  Bitcoin.snapshot = function (dtSeconds) {
    const s = Game.state;
    s.energyCap = Bitcoin.energyCap();
    const dt = Math.max(SNAPSHOT_MIN_DELTA_TIME, dtSeconds || 1);
    const production = Bitcoin.energyProduction();
    const minerDemand = Bitcoin.minerDemand();
    const coinDemand = Bitcoin.coinFarmerDemand();
    const totalDemand = minerDemand + coinDemand;
    const availableEnergy = Math.max(0, s.energy) + production * dt;
    const ratio = totalDemand <= 0 ? 1 : Math.min(1, availableEnergy / (totalDemand * dt));
    const miningRate = Bitcoin.baseMiningRate() * ratio * mult("minerEfficiency", 1);
    const coinRate = Bitcoin.baseCoinFarmerRate() * ratio * mult("coinFarmerYield", 1);
    const projectedEnergy = clampEnergy(Math.max(0, s.energy) + production * dt - totalDemand * ratio * dt);
    return {
      production,
      minerDemand,
      coinDemand,
      totalDemand,
      activityRatio: ratio,
      miningRate,
      coinRate,
      projectedEnergy,
    };
  };

  Bitcoin.miningRate = function () {
    return Bitcoin.snapshot(1).miningRate;
  };

  Bitcoin.coinFarmerRate = function () {
    return Bitcoin.snapshot(1).coinRate;
  };

  Bitcoin.canSell = function () {
    return Game.state.btc > 0;
  };

  Bitcoin.sellAll = function () {
    const s = Game.state;
    if (!Bitcoin.canSell()) return false;
    const sold = s.btc;
    const revenue = sold * s.btcPrice * mult("btcPriceMult", 1);
    s.coins += revenue;
    s.lifetimeCoins += revenue;
    s.stats.totalCoinsEarned += revenue;
    s.stats.totalBtcSold = (s.stats.totalBtcSold || 0) + sold;
    s.btc = 0;
    return true;
  };

  Bitcoin.update = function (dtSeconds) {
    const s = Game.state;
    s.energyCap = Bitcoin.energyCap();
    const snap = Bitcoin.snapshot(dtSeconds);
    const produced = snap.production * dtSeconds;
    const consumed = snap.totalDemand * snap.activityRatio * dtSeconds;
    s.energy = clampEnergy(s.energy + produced - consumed);
    s.stats.totalEnergyGenerated = (s.stats.totalEnergyGenerated || 0) + produced;
    s.stats.totalEnergySpent = (s.stats.totalEnergySpent || 0) + consumed;

    const mined = snap.miningRate * dtSeconds;
    const farmedCoins = snap.coinRate * dtSeconds;
    s.btc += mined;
    s.stats.totalBtcMined = (s.stats.totalBtcMined || 0) + mined;
    s.coins += farmedCoins;
    s.lifetimeCoins += farmedCoins;
    s.stats.totalCoinsEarned += farmedCoins;

    s.btcMarketTime = (s.btcMarketTime || 0) + dtSeconds;
    const osc = Math.sin(s.btcMarketTime / cfg.BTC_PRICE_OSCILLATION_PERIOD) * cfg.BTC_PRICE_OSCILLATION;
    const noise = (Math.random() - 0.5) * cfg.BTC_PRICE_VOLATILITY;
    s.btcPrice = cfg.BTC_BASE_PRICE * (1 + osc + noise);
    s.btcPrice = Math.max(cfg.BTC_MIN_PRICE, Math.min(cfg.BTC_MAX_PRICE, s.btcPrice));
  };

  Game.Bitcoin = Bitcoin;
})();
