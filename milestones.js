/* ==========================================================================
   Idle Empire Ultimate - milestones.js
   Milestone checking and CPS bonus notifications.
   ========================================================================== */

(function () {
  const cfg = Game.config;
  const Milestones = {};

  Milestones.check = function () {
    const s = Game.state;
    let changed = false;
    cfg.milestones.forEach((m) => {
      if (!s.milestones[m.id]) {
        try {
          if (m.check(s)) {
            s.milestones[m.id] = true;
            changed = true;
            if (Game.UI && Game.UI.toast) {
              Game.UI.toast("Milestone reached: " + m.name + " (+" + Math.round(m.bonus * 100) + "% CPS)", "success");
            }
          }
        } catch (e) {
          /* ignore */
        }
      }
    });
    if (changed) Game.recalculate();
    return changed;
  };

  Milestones.count = function () {
    return cfg.milestones.filter((m) => Game.state.milestones[m.id]).length;
  };

  Milestones.progress = function (m) {
    if (Game.state.milestones[m.id]) return 1;
    try {
      return Math.max(0, Math.min(1, m.progress(Game.state) || 0));
    } catch (e) {
      return 0;
    }
  };

  Game.Milestones = Milestones;
})();
