/* ==========================================================================
   Idle Empire Ultimate - talents.js
   Prestige-point talents: passive bonuses and activatable powers with cooldowns.
   ========================================================================== */

(function () {
  const cfg = Game.config;
  const Talents = {};

  Talents.purchased = function (id) {
    return !!Game.state.talents[id];
  };

  Talents.available = function (id) {
    const t = cfg.talentMap[id];
    if (!t || Talents.purchased(id)) return false;
    if (t.requires && !Talents.purchased(t.requires)) return false;
    return true;
  };

  Talents.canAfford = function (id) {
    const t = cfg.talentMap[id];
    return !!t && Talents.available(id) && Game.state.prestigePoints >= t.cost;
  };

  Talents.buy = function (id) {
    const s = Game.state;
    if (!Talents.canAfford(id)) return false;
    const t = cfg.talentMap[id];
    s.prestigePoints -= t.cost;
    s.talents[id] = true;
    s.stats.talentsPurchased = (s.stats.talentsPurchased || 0) + 1;
    Game.recalculate();
    if (Game.UI && Game.UI.toast) Game.UI.toast("Talent purchased: " + t.name, "prestige");
    return true;
  };

  Talents.totalPurchased = function () {
    return cfg.talents.reduce((sum, t) => sum + (Talents.purchased(t.id) ? 1 : 0), 0);
  };

  Talents.activePowers = function () {
    const s = Game.state;
    return s.activeTalentPowers.map((p) => {
      const def = cfg.talentPowerMap[p.id];
      return {
        id: p.id,
        def,
        remaining: Math.max(0, p.endTime - s.stats.playTime),
      };
    });
  };

  Talents.cooldownRemaining = function (powerId) {
    const until = Game.state.talentCooldowns[powerId] || 0;
    return Math.max(0, until - Game.state.stats.playTime);
  };

  Talents.canActivate = function (powerId) {
    const def = cfg.talentPowerMap[powerId];
    if (!def || !Talents.purchased(def.id)) return false;
    if (Talents.cooldownRemaining(powerId) > 0) return false;
    if (Game.state.activeTalentPowers.some((p) => p.id === powerId)) return false;
    return true;
  };

  Talents.activate = function (powerId) {
    const s = Game.state;
    const def = cfg.talentPowerMap[powerId];
    if (!def || !Talents.canActivate(powerId)) return false;

    s.activeTalentPowers.push({
      id: powerId,
      endTime: s.stats.playTime + def.duration,
    });
    s.talentCooldowns[powerId] = s.stats.playTime + def.cooldown;
    s.stats.powersActivated = (s.stats.powersActivated || 0) + 1;
    Game.recalculate();

    if (Game.UI && Game.UI.toast) Game.UI.toast("Power activated: " + def.name, "event");
    if (Game.UI && Game.UI.eventBanner) {
      Game.UI.eventBanner({
        name: def.name,
        desc: def.desc,
        color: "#7bdff2",
      });
    }
    return true;
  };

  Talents.update = function () {
    const s = Game.state;
    if (!s.activeTalentPowers.length) return;
    const before = s.activeTalentPowers.length;
    s.activeTalentPowers = s.activeTalentPowers.filter((p) => p.endTime > s.stats.playTime);
    if (s.activeTalentPowers.length !== before) Game.recalculate();
  };

  Game.Talents = Talents;
})();
