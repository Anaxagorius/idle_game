/* ==========================================================================
   Idle Empire Ultimate - save.js
   localStorage persistence, export/import (base64), hard reset.
   ========================================================================== */

(function () {
  const cfg = Game.config;
  const Save = {};
  const VERSION = 1;

  /* Only serialize persistent state (strip transient underscore fields) */
  function serializable() {
    const s = Game.state;
    const copy = JSON.parse(JSON.stringify(s));
    delete copy._cps;
    delete copy._rps;
    delete copy._clickValue;
    delete copy._baseCps;
    delete copy._mult;
    copy._version = VERSION;
    copy.lastSave = Date.now();
    return copy;
  }

  Save.save = function () {
    try {
      const data = serializable();
      Game.state.lastSave = data.lastSave;
      localStorage.setItem(cfg.SAVE_KEY, JSON.stringify(data));
      return true;
    } catch (e) {
      console.error("Save failed", e);
      return false;
    }
  };

  /* Merge loaded data into a fresh default state to tolerate missing keys */
  function merge(target, source) {
    Object.keys(source).forEach((k) => {
      // Guard against prototype pollution
      if (k === "__proto__" || k === "constructor" || k === "prototype") return;
      if (
        source[k] &&
        typeof source[k] === "object" &&
        !Array.isArray(source[k]) &&
        target[k] &&
        typeof target[k] === "object" &&
        !Array.isArray(target[k])
      ) {
        merge(target[k], source[k]);
      } else {
        target[k] = source[k];
      }
    });
  }

  Save.applyData = function (data) {
    const fresh = Game.defaultState();
    merge(fresh, data);
    // Ensure every building id exists
    cfg.buildings.forEach((b) => {
      if (typeof fresh.buildings[b.id] !== "number") fresh.buildings[b.id] = 0;
    });
    Game.state = fresh;
    Game.recalculate();
  };

  Save.load = function () {
    try {
      const raw = localStorage.getItem(cfg.SAVE_KEY);
      if (!raw) return false;
      const data = JSON.parse(raw);
      Save.applyData(data);
      return true;
    } catch (e) {
      console.error("Load failed", e);
      return false;
    }
  };

  Save.exportSave = function () {
    const data = serializable();
    const json = JSON.stringify(data);
    return btoa(unescape(encodeURIComponent(json)));
  };

  Save.importSave = function (str) {
    try {
      const json = decodeURIComponent(escape(atob(str.trim())));
      const data = JSON.parse(json);
      Save.applyData(data);
      Save.save();
      return true;
    } catch (e) {
      console.error("Import failed", e);
      return false;
    }
  };

  Save.hardReset = function () {
    try {
      localStorage.removeItem(cfg.SAVE_KEY);
    } catch (e) {
      /* ignore */
    }
    Game.state = Game.defaultState();
    Game.recalculate();
  };

  Game.Save = Save;
})();
