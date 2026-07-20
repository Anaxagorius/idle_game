/* ==========================================================================
   Idle Empire Ultimate - megaprojects.js
   Mega-project purchase, tracking and permanent effect application.
   ========================================================================== */

(function () {
  const cfg = Game.config;
  const MegaProjects = {};

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
    if (costs.coins           && s.coins              < costs.coins)           return false;
    if (costs.researchPoints  && s.researchPoints      < costs.researchPoints)  return false;
    if (costs.ascensionShards && s.ascensionShards     < costs.ascensionShards) return false;
    if (costs.empireLegacies  && (s.empireLegacies||0) < costs.empireLegacies)  return false;
    if (costs.timeFragments   && (s.timeFragments||0)  < costs.timeFragments)   return false;
    if (costs.realityCores    && (s.realityCores||0)   < costs.realityCores)    return false;
    return true;
  };

  /* Purchase a project, deducting costs and applying permanent effects. */
  MegaProjects.purchase = function (id) {
    const proj = cfg.megaProjectMap[id];
    if (!proj || !MegaProjects.canAfford(id)) return false;
    const s = Game.state;
    const costs = proj.costs || {};

    // Deduct costs
    if (costs.coins)           s.coins              -= costs.coins;
    if (costs.researchPoints)  s.researchPoints      -= costs.researchPoints;
    if (costs.ascensionShards) s.ascensionShards     -= costs.ascensionShards;
    if (costs.empireLegacies)  s.empireLegacies      = (s.empireLegacies||0)  - costs.empireLegacies;
    if (costs.timeFragments)   s.timeFragments        = (s.timeFragments||0)   - costs.timeFragments;
    if (costs.realityCores)    s.realityCores         = (s.realityCores||0)    - costs.realityCores;

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
    let minRatio = Infinity;
    if (costs.coins)           minRatio = Math.min(minRatio, s.coins / costs.coins);
    if (costs.researchPoints)  minRatio = Math.min(minRatio, s.researchPoints / costs.researchPoints);
    if (costs.ascensionShards) minRatio = Math.min(minRatio, (s.ascensionShards||0) / costs.ascensionShards);
    if (costs.empireLegacies)  minRatio = Math.min(minRatio, (s.empireLegacies||0)  / costs.empireLegacies);
    if (costs.timeFragments)   minRatio = Math.min(minRatio, (s.timeFragments||0)   / costs.timeFragments);
    if (costs.realityCores)    minRatio = Math.min(minRatio, (s.realityCores||0)    / costs.realityCores);
    return minRatio === Infinity ? 0 : Math.min(1, Math.max(0, minRatio));
  };

  Game.MegaProjects = MegaProjects;
})();
