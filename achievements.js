/* ==========================================================================
   Idle Empire Ultimate - achievements.js
   Achievement checking and unlock notifications.
   ========================================================================== */

(function () {
  const cfg = Game.config;
  const Achievements = {};

  /* Check all achievements; unlock newly earned ones */
  Achievements.check = function () {
    const s = Game.state;
    let changed = false;
    cfg.achievements.forEach((a) => {
      if (!s.achievements[a.id]) {
        try {
          if (a.check(s)) {
            s.achievements[a.id] = true;
            changed = true;
            if (Game.UI && Game.UI.toast) {
              Game.UI.toast("Achievement unlocked: " + a.name + " (+" + Math.round(a.bonus * 100) + "%)", "success");
            }
          }
        } catch (e) {
          /* ignore individual achievement errors */
        }
      }
    });
    if (changed) Game.recalculate();
    return changed;
  };

  Achievements.count = function () {
    return cfg.achievements.filter((a) => Game.state.achievements[a.id]).length;
  };

  Achievements.progress = function (a) {
    if (Game.state.achievements[a.id]) return 1;
    try {
      return Math.max(0, Math.min(1, a.progress(Game.state) || 0));
    } catch (e) {
      return 0;
    }
  };

  Game.Achievements = Achievements;
})();
