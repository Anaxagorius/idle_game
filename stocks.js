/* ==========================================================================
   Idle Empire Ultimate - stocks.js
   Simulated stock prices, trading, portfolio, and dividend payouts.
   ========================================================================== */

(function () {
  const cfg = Game.config;
  const Stocks = {};
  const TRADE_AMOUNTS = [1, 10, 25, 50, 100, 1000, -1];
  const MAX_MISSING_FIELD_WARNINGS = 512;
  const missingFieldWarnings = {};
  let missingFieldWarningCount = 0;

  function ensureState() {
    const s = Game.state;
    if (!s.stocks) s.stocks = {};
    if (!s.stockHistory) s.stockHistory = {};
    if (!s.portfolio) s.portfolio = {};
    if (typeof s.stockBuyAmount !== "number" || !TRADE_AMOUNTS.includes(s.stockBuyAmount)) s.stockBuyAmount = 1;
    if (typeof s.stockMarketRegime !== "number") s.stockMarketRegime = 0;
    if (typeof s.stockRegimeTimer !== "number") s.stockRegimeTimer = 0;
    if (typeof s.stockCycleEventId !== "string" || (s.stockCycleEventId && !(cfg.stockCycleEventMap && cfg.stockCycleEventMap[s.stockCycleEventId]))) s.stockCycleEventId = "";
    if (typeof s.stockDividendLastPayout !== "number") s.stockDividendLastPayout = 0;
    if (typeof s.stockDividendLifetime !== "number") s.stockDividendLifetime = 0;
    cfg.stocks.forEach((st) => {
      if (typeof s.stocks[st.id] !== "number") s.stocks[st.id] = st.basePrice;
      if (!Array.isArray(s.stockHistory[st.id])) s.stockHistory[st.id] = [s.stocks[st.id]];
      if (!s.portfolio[st.id]) s.portfolio[st.id] = { shares: 0, avgCost: 0 };
    });
  }

  function resetRegimeTimer() {
    const min = cfg.STOCK_REGIME_MIN_SECONDS || 45;
    const max = cfg.STOCK_REGIME_MAX_SECONDS || 180;
    return min + Math.random() * Math.max(1, max - min);
  }

  function stockFieldWithFallback(st, field, fallback) {
    if (typeof st[field] === "number") return st[field];
    const key = st.id + ":" + field;
    if (!missingFieldWarnings[key] && missingFieldWarningCount < MAX_MISSING_FIELD_WARNINGS) {
      missingFieldWarnings[key] = true;
      missingFieldWarningCount++;
      console.warn("Stock config missing numeric field:", st.id, field, "using fallback", fallback);
    }
    return fallback;
  }

  function getShareCount(portfolioEntry) {
    return portfolioEntry ? Math.max(0, Math.floor(portfolioEntry.shares || 0)) : 0;
  }

  function getPositiveBasePrice(st, fallback) {
    if (typeof st.basePrice === "number" && st.basePrice > 0) return st.basePrice;
    const key = st.id + ":basePricePositive";
    if (!missingFieldWarnings[key] && missingFieldWarningCount < MAX_MISSING_FIELD_WARNINGS) {
      missingFieldWarnings[key] = true;
      missingFieldWarningCount++;
      console.warn("Stock config basePrice must be > 0:", st.id, "using fallback", fallback);
    }
    return fallback;
  }

  function pickRegime() {
    const roll = Math.random();
    let bullChance = Math.max(0, cfg.STOCK_REGIME_BULL_CHANCE || 0.28);
    let bearChance = Math.max(0, cfg.STOCK_REGIME_BEAR_CHANCE || 0.32);
    const total = bullChance + bearChance;
    if (total > 1) {
      bullChance /= total;
      bearChance /= total;
    }
    if (roll < bullChance) return 1;
    if (roll < bullChance + bearChance) return -1;
    return 0;
  }

  function pickCycleEventKind() {
    const weights = cfg.STOCK_CYCLE_EVENT_KIND_WEIGHTS || { good: 25, bad: 25, mixed: 50 };
    const total = (weights.good || 0) + (weights.bad || 0) + (weights.mixed || 0);
    if (total <= 0) return "mixed";
    const roll = Math.random() * total;
    if (roll < (weights.good || 0)) return "good";
    if (roll < (weights.good || 0) + (weights.bad || 0)) return "bad";
    return "mixed";
  }

  function pickCycleEvent() {
    const kind = pickCycleEventKind();
    const bucket = (cfg.stockCycleEventsByKind && cfg.stockCycleEventsByKind[kind]) || [];
    if (!bucket.length) return null;
    return bucket[Math.floor(Math.random() * bucket.length)] || null;
  }

  function canPayDividend(st, price) {
    const yieldRate = st.dividendYield || 0;
    if (yieldRate <= 0) return false;
    const minMult = cfg.STOCK_DIVIDEND_MIN_PRICE_MULT || 0;
    const basePrice = getPositiveBasePrice(st, cfg.STOCK_MIN_BASE_PRICE || 0.01);
    if (minMult > 0 && price < basePrice * minMult) return false;
    return true;
  }

  function dividendPerShare(st, price, divMult) {
    if (!canPayDividend(st, price)) return 0;
    const yearSeconds = cfg.STOCK_DIVIDEND_YEAR_SECONDS || 3600;
    const interval = cfg.STOCK_DIVIDEND_SECONDS || 30;
    const yieldRate = st.dividendYield || 0;
    if (yearSeconds <= 0 || interval <= 0 || yieldRate <= 0) return 0;
    return price * yieldRate * (interval / yearSeconds) * Math.max(0, divMult || 1);
  }

  Stocks.feeRate = function () {
    const mults = Game.state._mult || { stockFeeReduction: 1 };
    return Math.max(0, cfg.STOCK_TRADING_FEE / Math.max(1, mults.stockFeeReduction || 1));
  };

  Stocks.tradeAmountOptions = function () {
    return TRADE_AMOUNTS.slice();
  };

  Stocks.tradeAmount = function () {
    ensureState();
    return Game.state.stockBuyAmount;
  };

  Stocks.clearCycleEvent = function () {
    ensureState();
    Game.state.stockCycleEventId = "";
  };

  Stocks.activeCycleEvent = function () {
    ensureState();
    return (cfg.stockCycleEventMap && cfg.stockCycleEventMap[Game.state.stockCycleEventId]) || null;
  };

  Stocks.onCycleChange = function () {
    ensureState();
    Stocks.clearCycleEvent();
    const triggerChance = Math.max(0, Math.min(1, typeof cfg.STOCK_CYCLE_EVENT_TRIGGER_CHANCE === "number" ? cfg.STOCK_CYCLE_EVENT_TRIGGER_CHANCE : 0.2));
    if (Math.random() >= triggerChance) return null;
    const eventDef = pickCycleEvent();
    if (!eventDef) return null;
    Game.state.stockCycleEventId = eventDef.id;
    if (Game.state.settings.notifications && Game.UI && Game.UI.toast) {
      Game.UI.toast("Market Event: " + eventDef.name + " — " + eventDef.desc, "event");
    }
    return eventDef;
  };

  Stocks.setTradeAmount = function (amount) {
    ensureState();
    if (!TRADE_AMOUNTS.includes(amount)) return false;
    Game.state.stockBuyAmount = amount;
    return true;
  };

  Stocks.maxAffordableShares = function (stockId) {
    ensureState();
    const s = Game.state;
    const price = s.stocks[stockId];
    if (!price || price <= 0) return 0;
    const totalPerShare = price * (1 + Stocks.feeRate());
    if (totalPerShare <= 0) return 0;
    return Math.max(0, Math.floor(s.coins / totalPerShare));
  };

  Stocks.resolveTradeAmount = function (stockId, side) {
    ensureState();
    const s = Game.state;
    const setting = s.stockBuyAmount;
    if (setting === -1) {
      if (side === "sell") {
        const p = s.portfolio[stockId];
        return getShareCount(p);
      }
      return Stocks.maxAffordableShares(stockId);
    }
    const target = Math.max(1, Math.floor(setting || 1));
    if (side === "sell") {
      const p = s.portfolio[stockId];
      const shares = getShareCount(p);
      return shares >= target ? target : 0;
    }
    return Stocks.maxAffordableShares(stockId) >= target ? target : 0;
  };

  Stocks.buy = function (stockId, shares) {
    ensureState();
    const s = Game.state;
    const price = s.stocks[stockId];
    shares = Math.max(0, Math.floor(shares));
    if (!price || shares <= 0) return false;
    const feeRate = Stocks.feeRate();
    const gross = price * shares;
    const fee = gross * feeRate;
    const total = gross + fee;
    if (s.coins < total) return false;
    s.coins -= total;
    s.stats.totalCoinsSpent += total;
    const p = s.portfolio[stockId];
    const newShares = p.shares + shares;
    p.avgCost = newShares > 0 ? (p.avgCost * p.shares + gross) / newShares : 0;
    p.shares = newShares;
    return true;
  };

  Stocks.sell = function (stockId, shares) {
    ensureState();
    const s = Game.state;
    const p = s.portfolio[stockId];
    shares = Math.max(0, Math.floor(shares));
    if (!p || shares <= 0 || p.shares < shares) return false;
    const price = s.stocks[stockId];
    const gross = price * shares;
    const fee = gross * Stocks.feeRate();
    const net = gross - fee;
    p.shares -= shares;
    if (p.shares <= 0) p.avgCost = 0;
    s.coins += net;
    s.lifetimeCoins += net;
    s.stats.totalCoinsEarned += net;
    return true;
  };

  Stocks.portfolioValue = function () {
    ensureState();
    const s = Game.state;
    return cfg.stocks.reduce((sum, st) => {
      const p = s.portfolio[st.id];
      return sum + (p ? p.shares * s.stocks[st.id] : 0);
    }, 0);
  };

  Stocks.trend = function (stockId) {
    const h = Game.state.stockHistory[stockId] || [];
    if (h.length < 2) return "→";
    const delta = h[h.length - 1] - h[0];
    if (delta > 0.001) return "↗";
    if (delta < -0.001) return "↘";
    return "→";
  };

  Stocks.dividendForecast = function () {
    ensureState();
    const s = Game.state;
    const divMult = (s._mult && s._mult.stockDividendMult) ? s._mult.stockDividendMult : 1;
    let totalPerPayout = 0;
    let eligibleStocks = 0;
    let dividendStocksOwned = 0;
    let totalShares = 0;
    const breakdown = [];

    cfg.stocks.forEach((st) => {
      const p = s.portfolio[st.id];
      const shares = getShareCount(p);
      totalShares += shares;
      const price = s.stocks[st.id] || st.basePrice;
      const perShare = dividendPerShare(st, price, divMult);
      const payout = shares * perShare;
      const eligible = shares > 0 && perShare > 0;
      if (shares > 0 && (st.dividendYield || 0) > 0) dividendStocksOwned++;
      if (eligible) eligibleStocks++;
      totalPerPayout += payout;
      if (shares > 0) {
        breakdown.push({
          id: st.id,
          ticker: st.ticker,
          shares,
          payout,
          eligible,
          annualYield: st.dividendYield || 0,
        });
      }
    });

    const interval = cfg.STOCK_DIVIDEND_SECONDS || 30;
    const roundsPerMinute = interval > 0 ? 60 / interval : 0;
    return {
      intervalSeconds: interval,
      totalPerPayout,
      perMinute: totalPerPayout * roundsPerMinute,
      perHour: totalPerPayout * roundsPerMinute * 60,
      eligibleStocks,
      dividendStocksOwned,
      totalShares,
      breakdown,
    };
  };

  Stocks.dividendTracking = function () {
    ensureState();
    const s = Game.state;
    const interval = cfg.STOCK_DIVIDEND_SECONDS || 30;
    const nextIn = Math.max(0, interval - (s.stockDividendTimer || 0));
    return {
      lastPayout: s.stockDividendLastPayout || 0,
      lifetimePayout: s.stockDividendLifetime || 0,
      nextInSeconds: nextIn,
      forecast: Stocks.dividendForecast(),
    };
  };

  Stocks.update = function (dtSeconds) {
    ensureState();
    const s = Game.state;
    const defaultBeta = cfg.STOCK_DEFAULT_BETA || 1;
    const defaultVolatility = cfg.STOCK_DEFAULT_VOLATILITY || 0.03;
    const baseDrift = cfg.STOCK_MARKET_BASE_DRIFT || 0.0004;
    const marketVol = cfg.STOCK_MARKET_VOLATILITY || 0.008;
    const bullDrift = cfg.STOCK_REGIME_BULL_DRIFT || 0.0024;
    const bearDrift = cfg.STOCK_REGIME_BEAR_DRIFT || -0.0026;
    const meanReversion = cfg.STOCK_MEAN_REVERSION || 0.0035;
    const minBasePrice = cfg.STOCK_MIN_BASE_PRICE || 0.01;
    const minPriceMult = cfg.STOCK_MIN_PRICE_MULT || 0.15;
    s.stockTickTimer = (s.stockTickTimer || 0) + dtSeconds;
    s.stockDividendTimer = (s.stockDividendTimer || 0) + dtSeconds;
    s.stockRegimeTimer = (s.stockRegimeTimer || 0) - dtSeconds;
    if (s.stockRegimeTimer <= 0) {
      s.stockMarketRegime = pickRegime();
      s.stockRegimeTimer = resetRegimeTimer();
    }

    while (s.stockTickTimer >= cfg.STOCK_TICK_SECONDS) {
      s.stockTickTimer -= cfg.STOCK_TICK_SECONDS;
      const cycleDriftMult = (Game.Cycles && Game.Cycles.stockDriftMult) ? Game.Cycles.stockDriftMult() : 1;
      const cycleEvent = Stocks.activeCycleEvent();
      const cycleEventMarketDrift = cycleEvent ? (cycleEvent.marketDrift || 0) : 0;
      const cycleEventVolatilityMult = cycleEvent ? Math.max(0, cycleEvent.volatilityMult || 1) : 1;
      const cycleEventSectorEffects = cycleEvent && cycleEvent.sectorEffects ? cycleEvent.sectorEffects : null;
      const randomMarket = (Math.random() * 2 - 1) * marketVol;
      const regimeDrift = s.stockMarketRegime > 0
        ? bullDrift
        : (s.stockMarketRegime < 0 ? bearDrift : 0);
      const marketEventRoll = Math.random();
      let eventShift = 0;
      if (marketEventRoll < cfg.STOCK_EVENT_BEAR_CHANCE) eventShift = cfg.STOCK_EVENT_BEAR_SHIFT;
      else if (marketEventRoll > cfg.STOCK_EVENT_BULL_CHANCE) eventShift = cfg.STOCK_EVENT_BULL_SHIFT;
      const marketMove = (baseDrift + randomMarket + regimeDrift) * cycleDriftMult;
      cfg.stocks.forEach((st) => {
        const price = s.stocks[st.id];
        const beta = stockFieldWithFallback(st, "beta", defaultBeta);
        const volatility = stockFieldWithFallback(st, "volatility", defaultVolatility);
        const sectorEventDrift = cycleEventSectorEffects ? (cycleEventSectorEffects[st.sector] || 0) : 0;
        const sectorDrift = (st.drift + (Math.random() - 0.5) * volatility * cycleEventVolatilityMult) * cycleDriftMult;
        const correlated = eventShift * (cfg.STOCK_EVENT_CORRELATION_MIN + Math.random() * cfg.STOCK_EVENT_CORRELATION_RANGE);
        const targetBasePrice = getPositiveBasePrice(st, minBasePrice);
        const safeBasePrice = Math.max(minBasePrice, targetBasePrice);
        const revert = ((targetBasePrice - price) / safeBasePrice) * meanReversion;
        const next = price * (1 + marketMove * beta + sectorDrift + correlated + cycleEventMarketDrift + sectorEventDrift + revert);
        const minPrice = Math.max(1, st.basePrice * minPriceMult);
        s.stocks[st.id] = Math.max(minPrice, next);
        const hist = s.stockHistory[st.id];
        hist.push(s.stocks[st.id]);
        if (hist.length > cfg.STOCK_HISTORY_POINTS) hist.shift();
      });
    }

    while (s.stockDividendTimer >= cfg.STOCK_DIVIDEND_SECONDS) {
      s.stockDividendTimer -= cfg.STOCK_DIVIDEND_SECONDS;
      const divMult = (s._mult && s._mult.stockDividendMult) ? s._mult.stockDividendMult : 1;
      let payout = 0;
      cfg.stocks.forEach((st) => {
        const p = s.portfolio[st.id];
        if (!p || p.shares <= 0) return;
        payout += p.shares * dividendPerShare(st, s.stocks[st.id], divMult);
      });
      s.stockDividendLastPayout = payout;
      if (payout > 0) {
        s.coins += payout;
        s.lifetimeCoins += payout;
        s.stats.totalCoinsEarned += payout;
        s.stockDividendLifetime += payout;
      }
    }
  };

  Game.Stocks = Stocks;
})();
