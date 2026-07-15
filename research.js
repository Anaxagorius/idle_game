/* ==========================================================================
   Idle Empire Ultimate - research.js
   Research tree purchase logic and effect application.
   ========================================================================== */

(function () {
  const cfg = Game.config;
  const Research = {};

  Research.purchased = function (id) {
    return !!Game.state.research[id];
  };

  /* A node is available if its prerequisite (previous node in branch) is done */
  Research.available = function (id) {
    const r = cfg.researchMap[id];
    if (!r) return false;
    if (Research.purchased(id)) return false;
    if (r.requires && !Research.purchased(r.requires)) return false;
    return true;
  };

  Research.canAfford = function (id) {
    return Research.available(id) && Game.state.researchPoints >= cfg.researchMap[id].cost;
  };

  Research.buy = function (id) {
    const s = Game.state;
    if (!Research.canAfford(id)) return false;
    const r = cfg.researchMap[id];
    s.researchPoints -= r.cost;
    s.research[id] = true;
    s.stats.researchCompleted++;

    // Unlock automation feature if applicable
    if (r.unlock) {
      s.unlocked[r.unlock] = true;
    }

    Game.recalculate();
    return true;
  };

  /* Cheapest currently-available research (used by auto-research) */
  Research.cheapestAvailable = function () {
    let best = null;
    cfg.research.forEach((r) => {
      if (Research.available(r.id)) {
        if (!best || r.cost < best.cost) best = r;
      }
    });
    return best;
  };

  Research.branchProgress = function (branchKey) {
    const nodes = cfg.research.filter((r) => r.branch === branchKey);
    const done = nodes.filter((r) => Research.purchased(r.id)).length;
    return { done, total: nodes.length };
  };

  Research.totalPurchased = function () {
    return cfg.research.filter((r) => Research.purchased(r.id)).length;
  };

  /* Number of auto-clicker "tiers" earned via research (drives clicks/sec) */
  Research.autoclickTier = function () {
    let tier = 0;
    cfg.autoclickTierNodes.forEach((id) => {
      if (Research.purchased(id)) tier++;
    });
    return tier;
  };

  Game.Research = Research;
})();
