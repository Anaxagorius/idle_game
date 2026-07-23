/* ==========================================================================
   Idle Empire Ultimate - megaprojects.js
   Mega-project purchase, tracking and permanent effect application.
   ========================================================================== */

(function () {
  const cfg = Game.config;
  const MegaProjects = {};

  function getCostMult() {
    const m = Game.state._mult;
    return (m && m.megaProjectCostMult != null) ? m.megaProjectCostMult : 1;
  }

  /* Check whether the player has completed a project. */
  MegaProjects.completed = function (id) {
    return !!(Game.state.megaProjects && Game.state.megaProjects[id]);
  };

  /* Check whether the player can afford a project. */
  MegaProjects.canAfford = function (id) {
    const proj = cfg.megaProjectMap[id];
    if (!proj || MegaProjects.completed(id)) return false;
    const s = Game.state;
    const costs = proj.costs || {};
    const costMult = getCostMult();
    if (costs.coins           && s.coins              < costs.coins           * costMult) return false;
    if (costs.researchPoints  && s.researchPoints      < costs.researchPoints  * costMult) return false;
    if (costs.ascensionShards && s.ascensionShards     < costs.ascensionShards * costMult) return false;
    if (costs.empireLegacies  && (s.empireLegacies||0) < costs.empireLegacies  * costMult) return false;
    if (costs.timeFragments   && (s.timeFragments||0)  < costs.timeFragments   * costMult) return false;
    if (costs.realityCores    && (s.realityCores||0)   < costs.realityCores    * costMult) return false;
    return true;
  };

  /* Purchase a project, deducting costs and applying permanent effects. */
  MegaProjects.purchase = function (id) {
    const proj = cfg.megaProjectMap[id];
    if (!proj || !MegaProjects.canAfford(id)) return false;
    const s = Game.state;
    const costs = proj.costs || {};
    const costMult = getCostMult();

    // Deduct costs
    if (costs.coins)           s.coins              -= costs.coins           * costMult;
    if (costs.researchPoints)  s.researchPoints      -= costs.researchPoints  * costMult;
    if (costs.ascensionShards) s.ascensionShards     -= costs.ascensionShards * costMult;
    if (costs.empireLegacies)  s.empireLegacies       = (s.empireLegacies||0)  - costs.empireLegacies  * costMult;
    if (costs.timeFragments)   s.timeFragments        = (s.timeFragments||0)   - costs.timeFragments   * costMult;
    if (costs.realityCores)    s.realityCores         = (s.realityCores||0)    - costs.realityCores    * costMult;

    if (!s.megaProjects) s.megaProjects = {};
    s.megaProjects[id] = true;
    s.stats.megaProjectsCompleted = (s.stats.megaProjectsCompleted || 0) + 1;

    Game.recalculate();

    if (Game.UI && Game.UI.toast) {
      Game.UI.toast("🏆 Mega Project Complete: " + proj.name, "prestige");
    }
    return true;
  };

  /* Fraction of completion progress for tooltip/progress bar (0–1). */
  MegaProjects.progress = function (id) {
    const proj = cfg.megaProjectMap[id];
    if (!proj) return 0;
    if (MegaProjects.completed(id)) return 1;
    const s = Game.state;
    const costs = proj.costs || {};
    const costMult = getCostMult();
    let minRatio = Infinity;
    if (costs.coins)           minRatio = Math.min(minRatio, s.coins / (costs.coins * costMult));
    if (costs.researchPoints)  minRatio = Math.min(minRatio, s.researchPoints / (costs.researchPoints * costMult));
    if (costs.ascensionShards) minRatio = Math.min(minRatio, (s.ascensionShards||0) / (costs.ascensionShards * costMult));
    if (costs.empireLegacies)  minRatio = Math.min(minRatio, (s.empireLegacies||0)  / (costs.empireLegacies  * costMult));
    if (costs.timeFragments)   minRatio = Math.min(minRatio, (s.timeFragments||0)   / (costs.timeFragments   * costMult));
    if (costs.realityCores)    minRatio = Math.min(minRatio, (s.realityCores||0)    / (costs.realityCores    * costMult));
    return minRatio === Infinity ? 0 : Math.min(1, Math.max(0, minRatio));
  };

  Game.MegaProjects = MegaProjects;
})();
