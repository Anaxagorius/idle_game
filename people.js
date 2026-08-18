/* ==========================================================================
   Idle Empire Ultimate - people.js
   Employ specialist teams that boost income systems across the empire.
   ========================================================================== */

(function () {
  const cfg = Game.config;
  const People = {};

  function ensureState() {
    const s = Game.state;
    if (!s.people || typeof s.people !== "object") s.people = {};
    (cfg.peopleSpecialists || []).forEach((p) => {
      if (typeof s.people[p.id] !== "number" || Number.isNaN(s.people[p.id])) s.people[p.id] = 0;
      s.people[p.id] = Math.max(0, Math.floor(s.people[p.id]));
    });
  }

  People.level = function (id) {
    ensureState();
    return Game.state.people[id] || 0;
  };

  People.cost = function (id) {
    ensureState();
    const def = cfg.peopleSpecialistMap[id];
    if (!def) return Infinity;
    const owned = People.level(id);
    if (owned >= (def.maxLevel || Infinity)) return Infinity;
    return def.baseCost * Math.pow(def.costMult || 1.15, owned);
  };

  People.canHire = function (id) {
    ensureState();
    const def = cfg.peopleSpecialistMap[id];
    if (!def) return false;
    if (People.level(id) >= (def.maxLevel || Infinity)) return false;
    return Game.state.coins >= People.cost(id);
  };

  People.hire = function (id) {
    ensureState();
    if (!People.canHire(id)) return false;
    const cost = People.cost(id);
    const s = Game.state;
    s.coins -= cost;
    s.stats.totalCoinsSpent += cost;
    s.people[id] = (s.people[id] || 0) + 1;
    Game.recalculate();
    return true;
  };

  People.totalLevels = function () {
    ensureState();
    return (cfg.peopleSpecialists || []).reduce((sum, p) => sum + (Game.state.people[p.id] || 0), 0);
  };

  People.maxLevels = function () {
    return (cfg.peopleSpecialists || []).reduce((sum, p) => sum + (p.maxLevel || 0), 0);
  };

  People.ensureState = ensureState;
  Game.People = People;
})();
