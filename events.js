/* ==========================================================================
   Idle Empire Ultimate - events.js
   Random timed events with weighted selection.
   ========================================================================== */

(function () {
  const cfg = Game.config;
  const Events = {};

  Events.scheduleNext = function () {
    const min = cfg.eventMinDelay;
    const max = cfg.eventMaxDelay;
    const mults = Game.state._mult || Game.computeMultipliers();
    const delayMult = Math.max(0.5, Math.min(1.5, mults.eventDelayMult || 1));
    const delay = (min + Math.random() * (max - min)) * delayMult;
    Game.state.nextEventTime = Game.state.stats.playTime + delay;
  };

  Events.pick = function () {
    const total = cfg.events.reduce((s, e) => s + e.weight, 0);
    let roll = Math.random() * total;
    for (let i = 0; i < cfg.events.length; i++) {
      roll -= cfg.events[i].weight;
      if (roll <= 0) return cfg.events[i];
    }
    return cfg.events[0];
  };

  Events.trigger = function (def) {
    const s = Game.state;
    s.stats.eventsTriggered++;

    if (def.kind === "instantRP") {
      s.researchPoints += def.value * (cfg.GAIN_EFFECTIVENESS_MULT || 1);
    } else {
      // Timed effect
      s.activeEvents.push({
        id: def.id,
        endTime: s.stats.playTime + def.duration,
      });
    }

    Game.recalculate();
    if (Game.UI && Game.UI.eventBanner) Game.UI.eventBanner(def);
    if (s.settings.notifications && Game.UI && Game.UI.toast) {
      Game.UI.toast("Event: " + def.name + " — " + def.desc, "event");
    }
  };

  Events.forceTrigger = function (id) {
    const def = cfg.events.find((e) => e.id === id);
    if (def) Events.trigger(def);
  };

  Events.update = function () {
    const s = Game.state;

    // Initialize schedule
    if (!s.nextEventTime || s.nextEventTime <= 0) {
      Events.scheduleNext();
    }

    // Expire finished events
    if (s.activeEvents.length) {
      const before = s.activeEvents.length;
      s.activeEvents = s.activeEvents.filter((ev) => ev.endTime > s.stats.playTime);
      if (s.activeEvents.length !== before) Game.recalculate();
    }

    // Trigger new event
    if (s.stats.playTime >= s.nextEventTime) {
      const def = Events.pick();
      Events.trigger(def);
      Events.scheduleNext();
    }
  };

  Events.activeList = function () {
    const s = Game.state;
    return s.activeEvents.map((ev) => {
      const def = cfg.events.find((e) => e.id === ev.id);
      return { def, remaining: Math.max(0, ev.endTime - s.stats.playTime) };
    });
  };

  Events.timeToNext = function () {
    return Math.max(0, Game.state.nextEventTime - Game.state.stats.playTime);
  };

  Game.Events = Events;
})();
