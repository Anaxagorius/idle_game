/* ==========================================================================
   Idle Empire Ultimate - automation.js
   Auto-click, auto-buy, auto-upgrade, auto-research, auto-prestige, auto-ascend.
   ========================================================================== */

(function () {
  const cfg = Game.config;
  const Automation = {};

  let autoClickAccumulator = 0;
  let slowTimer = 0;

  /* Clicks per second based on auto-clicker research tier (1..~50) */
  Automation.clicksPerSecond = function () {
    const tier = Game.Research.autoclickTier();
    if (tier <= 0) return 0;
    // tier 1 -> 1/s, scaling up to ~50/s at max tiers
    return Math.min(50, tier * tier + tier * 2);
  };

  Automation.isUnlocked = function (feature) {
    return !!Game.state.unlocked[feature];
  };

  Automation.toggle = function (feature) {
    const s = Game.state;
    if (!Automation.isUnlocked(feature)) return false;
    s.automation[feature] = !s.automation[feature];
    return s.automation[feature];
  };

  Automation.setBuyAmount = function (amount) {
    Game.state.automation.buyAmount = amount;
  };

  /* ---------------------------------------------------------------------
     Per-tick update
     --------------------------------------------------------------------- */
  Automation.update = function (dt) {
    const s = Game.state;
    const a = s.automation;

    // Auto Click
    if (a.autoClick && Automation.isUnlocked("autoClick")) {
      autoClickAccumulator += Automation.clicksPerSecond() * dt;
      while (autoClickAccumulator >= 1) {
        Game.click();
        autoClickAccumulator -= 1;
      }
    }

    // Throttle heavier automations to ~4 times/sec
    slowTimer += dt;
    if (slowTimer < 0.25) return;
    slowTimer = 0;

    // Auto Buy: buy the most expensive affordable building (best value), fallback cheapest affordable
    if (a.autoBuy && Automation.isUnlocked("autoBuy")) {
      Automation.doAutoBuy();
    }

    // Auto Upgrade
    if (a.autoUpgrade && Automation.isUnlocked("autoUpgrade")) {
      Automation.doAutoUpgrade();
    }

    // Auto Research
    if (a.autoResearch && Automation.isUnlocked("autoResearch")) {
      Automation.doAutoResearch();
    }

    // Auto Prestige: only when it would give > 2x current PP
    if (a.autoPrestige && Automation.isUnlocked("autoPrestige")) {
      const potential = Game.Prestige.potential();
      if (potential >= 1 && potential > s.prestigePoints * 2 && potential > 0) {
        Game.Prestige.prestige();
      }
    }

    // Auto Ascend: when we can gain shards
    if (a.autoAscend && Automation.isUnlocked("autoAscend")) {
      if (Game.Prestige.canAscend() && Game.Prestige.potentialShards() >= 1) {
        Game.Prestige.ascend();
      }
    }
  };

  Automation.doAutoBuy = function () {
    // Buy the highest-tier building we can currently afford one of.
    const buildings = cfg.buildings;
    let target = null;
    for (let i = buildings.length - 1; i >= 0; i--) {
      const b = buildings[i];
      if (Game.state.coins >= Game.Buildings.costOf(b.id)) {
        target = b.id;
        break;
      }
    }
    if (target) {
      Game.Buildings.buy(target);
    }
  };

  Automation.doAutoUpgrade = function () {
    const ups = Game.Buildings.availableUpgrades();
    // buy cheapest affordable
    let best = null;
    ups.forEach((u) => {
      if (Game.Buildings.canAffordUpgrade(u.id)) {
        if (!best || u.cost < best.cost) best = u;
      }
    });
    if (best) Game.Buildings.buyUpgrade(best.id);
  };

  Automation.doAutoResearch = function () {
    const r = Game.Research.cheapestAvailable();
    if (r && Game.Research.canAfford(r.id)) {
      Game.Research.buy(r.id);
    }
  };

  Game.Automation = Automation;
})();
