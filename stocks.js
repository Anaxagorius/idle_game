/* ==========================================================================
   Idle Empire Ultimate - stocks.js
   Simulated stock prices, trading, portfolio, and dividend payouts.
   ========================================================================== */

(function () {
  const cfg = Game.config;
  const Stocks = {};
  const TRADE_AMOUNTS = [1, 10, 25, 50, 100, 1000, -1];

  function ensureState() {
    const s = Game.state;
    if (!s.stocks) s.stocks = {};
    if (!s.stockHistory) s.stockHistory = {};
    if (!s.portfolio) s.portfolio = {};
    if (typeof s.stockBuyAmount !== "number" || !TRADE_AMOUNTS.includes(s.stockBuyAmount)) s.stockBuyAmount = 1;
    if (typeof s.stockMarketRegime !== "number") s.stockMarketRegime = 0;
    if (typeof s.stockRegimeTimer !== "number") s.stockRegimeTimer = 0;
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

  function pickRegime() {
    const roll = Math.random();
    if (roll < 0.28) return 1;
    if (roll > 0.68) return -1;
    return 0;
  }

  function canPayDividend(st, price) {
    const yieldRate = st.dividendYield || 0;
    if (yieldRate <= 0) return false;
    const minMult = cfg.STOCK_DIVIDEND_MIN_PRICE_MULT || cfg.STOCK_DIVIDEND_PRICE_THRESHOLD_MULT || 0;
    if (minMult > 0 && price < st.basePrice * minMult) return false;
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
        return p ? Math.max(0, Math.floor(p.shares || 0)) : 0;
      }
      return Stocks.maxAffordableShares(stockId);
    }
    return Math.max(1, Math.floor(setting || 1));
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
      const shares = p ? Math.max(0, p.shares || 0) : 0;
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
      const baseDrift = cfg.STOCK_MARKET_BASE_DRIFT || 0.0004;
      const marketVol = cfg.STOCK_MARKET_VOLATILITY || 0.008;
      const randomMarket = (Math.random() * 2 - 1) * marketVol;
      const regimeDrift = s.stockMarketRegime > 0
        ? (cfg.STOCK_REGIME_BULL_DRIFT || 0.0024)
        : (s.stockMarketRegime < 0 ? (cfg.STOCK_REGIME_BEAR_DRIFT || -0.0026) : 0);
      const meanReversion = cfg.STOCK_MEAN_REVERSION || 0.0035;
      const marketEventRoll = Math.random();
      let eventShift = 0;
      if (marketEventRoll < cfg.STOCK_EVENT_BEAR_CHANCE) eventShift = cfg.STOCK_EVENT_BEAR_SHIFT;
      else if (marketEventRoll > cfg.STOCK_EVENT_BULL_CHANCE) eventShift = cfg.STOCK_EVENT_BULL_SHIFT;
      const marketMove = (baseDrift + randomMarket + regimeDrift) * cycleDriftMult;
      cfg.stocks.forEach((st) => {
        const price = s.stocks[st.id];
        const beta = st.beta || 1;
        const sectorDrift = (st.drift + (Math.random() - 0.5) * (st.volatility || 0.03)) * cycleDriftMult;
        const correlated = eventShift * (cfg.STOCK_EVENT_CORRELATION_MIN + Math.random() * cfg.STOCK_EVENT_CORRELATION_RANGE);
        const revert = ((st.basePrice - price) / Math.max(1, st.basePrice)) * meanReversion;
        const next = price * (1 + marketMove * beta + sectorDrift + correlated + revert);
        const minPrice = Math.max(1, st.basePrice * 0.15);
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
