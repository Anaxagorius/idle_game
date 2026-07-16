/* ==========================================================================
   Idle Empire Ultimate - bitcoin.js
   Energy production, mining hardware, BTC generation, and BTC selling.
   ========================================================================== */

(function () {
  const cfg = Game.config;
  const Bitcoin = {};

  function ownedCount(group, id) {
    return (Game.state[group] && Game.state[group][id]) || 0;
  }

  Bitcoin.equipmentCost = function (baseCost, owned) {
    return baseCost * Math.pow(cfg.BTC_EQUIPMENT_COST_SCALE, owned);
  };

  Bitcoin.buyProducer = function (id) {
    const def = cfg.energyProducers.find((p) => p.id === id);
    if (!def) return false;
    const owned = ownedCount("energyProducers", id);
    const cost = Bitcoin.equipmentCost(def.baseCost, owned);
    if (Game.state.coins < cost) return false;
    Game.state.coins -= cost;
    Game.state.stats.totalCoinsSpent += cost;
    Game.state.energyProducers[id] = owned + 1;
    return true;
  };

  Bitcoin.buyMiner = function (id) {
    const def = cfg.btcMiners.find((m) => m.id === id);
    if (!def) return false;
    const owned = ownedCount("btcMiners", id);
    const cost = Bitcoin.equipmentCost(def.baseCost, owned);
    if (Game.state.coins < cost) return false;
    Game.state.coins -= cost;
    Game.state.stats.totalCoinsSpent += cost;
    Game.state.btcMiners[id] = owned + 1;
    return true;
  };

  Bitcoin.buyBattery = function (id) {
    const def = cfg.batteries.find((b) => b.id === id);
    if (!def) return false;
    const owned = ownedCount("batteries", id);
    const cost = Bitcoin.equipmentCost(def.baseCost, owned);
    if (Game.state.coins < cost) return false;
    Game.state.coins -= cost;
    Game.state.stats.totalCoinsSpent += cost;
    Game.state.batteries[id] = owned + 1;
    return true;
  };

  Bitcoin.energyProduction = function () {
    return cfg.energyProducers.reduce((sum, p) => sum + p.energyPerSec * ownedCount("energyProducers", p.id), 0);
  };

  Bitcoin.energyConsumption = function () {
    return cfg.btcMiners.reduce((sum, m) => sum + m.energyUse * ownedCount("btcMiners", m.id), 0);
  };

  Bitcoin.batteryCapacity = function () {
    return cfg.batteries.reduce((sum, b) => sum + b.capacity * ownedCount("batteries", b.id), 0);
  };

  Bitcoin.miningRate = function () {
    const s = Game.state;
    const base = cfg.btcMiners.reduce((sum, m) => sum + m.btcPerSec * ownedCount("btcMiners", m.id), 0);
    if (base <= 0) return 0;
    const use = Bitcoin.energyConsumption();
    const prod = Bitcoin.energyProduction();
    const ratio = use <= 0 ? 1 : Math.min(1, Math.max(0, prod / use));
    const mults = s._mult || Game.computeMultipliers();
    return base * ratio * (mults.minerEfficiency || 1);
  };

  Bitcoin.sellAll = function () {
    const s = Game.state;
    if (s.btc <= 0) return false;
    const mults = s._mult || Game.computeMultipliers();
    const revenue = s.btc * s.btcPrice * (mults.btcPriceMult || 1);
    s.coins += revenue;
    s.lifetimeCoins += revenue;
    s.stats.totalCoinsEarned += revenue;
    s.btc = 0;
    return true;
  };

  Bitcoin.update = function (dtSeconds) {
    const s = Game.state;
    const production = Bitcoin.energyProduction();
    const consumption = Bitcoin.energyConsumption();
    s.energyCap = Math.max(0, cfg.BTC_BASE_ENERGY_CAP + Bitcoin.batteryCapacity());
    s.energy += (production - consumption) * dtSeconds;
    if (s.energy < 0) s.energy = 0;
    if (s.energy > s.energyCap) s.energy = s.energyCap;

    s.btc += Bitcoin.miningRate() * dtSeconds;

    s.btcMarketTime = (s.btcMarketTime || 0) + dtSeconds;
    const osc = Math.sin(s.btcMarketTime / 20) * cfg.BTC_PRICE_OSCILLATION;
    const noise = (Math.random() - 0.5) * cfg.BTC_PRICE_VOLATILITY;
    s.btcPrice *= 1 + osc * 0.1 + noise * 0.03;
    s.btcPrice = Math.max(cfg.BTC_MIN_PRICE, Math.min(cfg.BTC_MAX_PRICE, s.btcPrice));
  };

  Game.Bitcoin = Bitcoin;
})();
