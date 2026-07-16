/* ==========================================================================
   Idle Empire Ultimate - skilltrees.js
   Skill tree purchase logic and activatable skill powers.
   ========================================================================== */

(function () {
  const cfg = Game.config;
  const SkillTrees = {};

  SkillTrees.purchased = function (id) {
    return !!Game.state.skillTrees[id];
  };

  SkillTrees.available = function (id) {
    const n = cfg.skillTreeNodeMap[id];
    if (!n || SkillTrees.purchased(id)) return false;
    if (n.requires && !SkillTrees.purchased(n.requires)) return false;
    return true;
  };

  SkillTrees.canAfford = function (id) {
    const n = cfg.skillTreeNodeMap[id];
    return !!n && SkillTrees.available(id) && Game.state.prestigePoints >= n.cost;
  };

  SkillTrees.buy = function (id) {
    if (!SkillTrees.canAfford(id)) return false;
    const s = Game.state;
    const n = cfg.skillTreeNodeMap[id];
    s.prestigePoints -= n.cost;
    s.skillTrees[id] = true;
    s.stats.skillNodesPurchased = (s.stats.skillNodesPurchased || 0) + 1;
    Game.recalculate();
    if (Game.UI && Game.UI.toast) Game.UI.toast("Skill unlocked: " + n.name, "prestige");
    return true;
  };

  SkillTrees.totalPurchased = function () {
    return cfg.skillTreeNodes.reduce((sum, n) => sum + (SkillTrees.purchased(n.id) ? 1 : 0), 0);
  };

  SkillTrees.cooldownRemaining = function (powerId) {
    const until = Game.state.skillCooldowns[powerId] || 0;
    return Math.max(0, until - Game.state.stats.playTime);
  };

  SkillTrees.canActivate = function (powerId) {
    const def = cfg.skillPowers[powerId];
    if (!def) return false;
    const unlocked = cfg.skillTreeNodes.some((n) => n.type === "skillPower" && n.powerId === powerId && SkillTrees.purchased(n.id));
    if (!unlocked) return false;
    if (SkillTrees.cooldownRemaining(powerId) > 0) return false;
    if (Game.state.activeSkillPowers.some((p) => p.id === powerId)) return false;
    return true;
  };

  SkillTrees.activate = function (powerId) {
    const s = Game.state;
    const def = cfg.skillPowers[powerId];
    if (!def || !SkillTrees.canActivate(powerId)) return false;
    s.activeSkillPowers.push({
      id: powerId,
      endTime: s.stats.playTime + def.duration,
    });
    s.skillCooldowns[powerId] = s.stats.playTime + def.cooldown;
    Game.recalculate();
    if (Game.UI && Game.UI.toast) Game.UI.toast("Skill power activated: " + def.name, "event");
    return true;
  };

  SkillTrees.update = function () {
    const s = Game.state;
    if (!s.activeSkillPowers.length) return;
    const before = s.activeSkillPowers.length;
    s.activeSkillPowers = s.activeSkillPowers.filter((p) => p.endTime > s.stats.playTime);
    if (before !== s.activeSkillPowers.length) Game.recalculate();
  };

  SkillTrees.activePowers = function () {
    const s = Game.state;
    return s.activeSkillPowers.map((p) => ({
      id: p.id,
      def: cfg.skillPowers[p.id],
      remaining: Math.max(0, p.endTime - s.stats.playTime),
    }));
  };

  Game.SkillTrees = SkillTrees;
})();
