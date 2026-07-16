/* ==========================================================================
   Idle Empire Ultimate - stocks.js
   Simulated stock prices, trading, portfolio, and dividend payouts.
   ========================================================================== */

(function () {
  const cfg = Game.config;
  const Stocks = {};

  function ensureState() {
    const s = Game.state;
    if (!s.stocks) s.stocks = {};
    if (!s.stockHistory) s.stockHistory = {};
    if (!s.portfolio) s.portfolio = {};
    cfg.stocks.forEach((st) => {
      if (typeof s.stocks[st.id] !== "number") s.stocks[st.id] = st.basePrice;
      if (!Array.isArray(s.stockHistory[st.id])) s.stockHistory[st.id] = [s.stocks[st.id]];
      if (!s.portfolio[st.id]) s.portfolio[st.id] = { shares: 0, avgCost: 0 };
    });
  }

  Stocks.feeRate = function () {
    const mults = Game.state._mult || Game.computeMultipliers();
    const reduction = Math.max(0, 1 - ((mults.stockFeeReduction || 1) - 1));
    return Math.max(0, cfg.STOCK_TRADING_FEE * reduction);
  };

  Stocks.buy = function (stockId, shares) {
    ensureState();
    const s = Game.state;
    const price = s.stocks[stockId];
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

  Stocks.update = function (dtSeconds) {
    ensureState();
    const s = Game.state;
    s.stockTickTimer = (s.stockTickTimer || 0) + dtSeconds;
    s.stockDividendTimer = (s.stockDividendTimer || 0) + dtSeconds;

    if (s.stockTickTimer >= cfg.STOCK_TICK_SECONDS) {
      s.stockTickTimer -= cfg.STOCK_TICK_SECONDS;
      const marketEventRoll = Math.random();
      let eventShift = 0;
      if (marketEventRoll < 0.03) eventShift = -0.08;
      else if (marketEventRoll > 0.97) eventShift = 0.1;
      cfg.stocks.forEach((st) => {
        const price = s.stocks[st.id];
        const sectorDrift = st.drift + (Math.random() - 0.5) * st.volatility;
        const correlated = eventShift * (0.6 + Math.random() * 0.8);
        const next = price * (1 + sectorDrift + correlated);
        s.stocks[st.id] = Math.max(1, next);
        const hist = s.stockHistory[st.id];
        hist.push(s.stocks[st.id]);
        if (hist.length > cfg.STOCK_HISTORY_POINTS) hist.shift();
      });
    }

    if (s.stockDividendTimer >= cfg.STOCK_DIVIDEND_SECONDS) {
      s.stockDividendTimer -= cfg.STOCK_DIVIDEND_SECONDS;
      let payout = 0;
      cfg.stocks.forEach((st) => {
        const p = s.portfolio[st.id];
        if (!p || p.shares <= 0) return;
        if (s.stocks[st.id] < st.basePrice * 1.1) return;
        payout += p.shares * s.stocks[st.id] * 0.0005;
      });
      if (payout > 0) {
        s.coins += payout;
        s.lifetimeCoins += payout;
        s.stats.totalCoinsEarned += payout;
      }
    }
  };

  Game.Stocks = Stocks;
})();
