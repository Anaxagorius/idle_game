/* ==========================================================================
   Idle Empire Ultimate - ui.js
   Rendering, tab management, event wiring and per-frame updates.
   ========================================================================== */

(function () {
  const cfg = Game.config;
  const fmt = Game.formatNumber;
  const UI = {};

  let refs = {};
  let built = { research: false, achievements: false, milestones: false, automation: false, bitcoin: false, stocks: false, gambling: false, horseTrack: false, raceTrack: false };
  let currentTab = "economy";
  let activeCasinoGame = "slots";

  function el(id) {
    return document.getElementById(id);
  }
  function make(tag, cls, html) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html !== undefined) e.innerHTML = html;
    return e;
  }

  /** Returns { happiness, happinessMult } from the cached diplomacy snapshot with safe defaults. */
  function getDiplomacyStats(state) {
    const dipl = state._mult && state._mult.diplomacy;
    return {
      happiness: (dipl && dipl.happiness !== undefined) ? dipl.happiness : 50,
      happinessMult: (dipl && dipl.happinessMult !== undefined) ? dipl.happinessMult : 1,
    };
  }

  /* ---------------------------------------------------------------------
     Initialization
     --------------------------------------------------------------------- */
  UI.init = function () {
    refs = {
      coins: el("res-coins"),
      cps: el("res-cps"),
      pp: el("res-pp"),
      rp: el("res-rp"),
      as: el("res-as"),
      btc: el("res-btc"),
      energy: el("res-energy"),
      ppWrap: el("res-pp-wrap"),
      rpWrap: el("res-rp-wrap"),
      asWrap: el("res-as-wrap"),
      btcWrap: el("res-btc-wrap"),
      energyWrap: el("res-energy-wrap"),
      elWrap: el("res-el-wrap"),
      tfWrap: el("res-tf-wrap"),
      rcWrap: el("res-rc-wrap"),
      cycleWrap: el("res-cycle-wrap"),
      populationWrap: el("res-population-wrap"),
      population: el("res-population"),
      happinessWrap: el("res-happiness-wrap"),
      happiness: el("res-happiness"),
      el: el("res-el"),
      tf: el("res-tf"),
      rc: el("res-rc"),
      cycleDisplay: el("res-cycle"),
      clickValue: el("click-value"),
      coinButton: el("coin-button"),
      buildingList: el("building-list"),
      upgradeList: el("upgrade-list"),
      toastContainer: el("toast-container"),
      eventBanner: el("event-banner"),
      activeEvents: el("active-events"),
    };

    // Tab buttons
    document.querySelectorAll(".tab-button").forEach((btn) => {
      btn.addEventListener("click", () => UI.showTab(btn.dataset.tab));
    });

    // Coin button
    refs.coinButton.addEventListener("click", (e) => {
      const v = Game.click();
      UI.spawnClickFloat(e, v);
      pulse(refs.coinButton);
    });

    UI.buildBuildingList();
    UI.buildResearch();
    UI.buildAchievements();
    UI.buildMilestones();
    UI.buildAutomation();
    UI.buildSkillTrees();
    UI.buildBitcoin();
    UI.buildStocks();
    UI.buildCasino();
    UI.buildHorseTrack();
    UI.buildRaceTrack();
    UI.buildResearchTabs();
    UI.wireSettings();
    UI.wirePrestigeButtons();
    UI.wireClickerUpgrades();
    UI.buildPrestigePaths();
    UI.buildMegaProjects();

    UI.showTab("economy");
    UI.update();
    if (Game.MapUI) Game.MapUI.init();
  };

  /* ---------------------------------------------------------------------
     Tabs
     --------------------------------------------------------------------- */
  UI.showTab = function (name) {
    currentTab = name;
    document.querySelectorAll(".tab-button").forEach((b) => {
      b.classList.toggle("active", b.dataset.tab === name);
    });
    document.querySelectorAll(".tab-content").forEach((c) => {
      c.classList.toggle("active", c.id === "tab-" + name);
    });
    UI.update();
  };

  /* ---------------------------------------------------------------------
     Economy: buildings
     --------------------------------------------------------------------- */
  UI.buildBuildingList = function () {
    const list = refs.buildingList;
    list.innerHTML = "";
    UI._buildingRows = {};
    UI._subRows = {};
    let lastTier = 0;
    cfg.buildings.forEach((b) => {
      if (b.tier !== lastTier) {
        lastTier = b.tier;
        const labels = { 1: "Tier 1 — Civilization", 2: "Tier 2 — Industrial Age", 3: "Tier 3 — Space Age" };
        list.appendChild(make("div", "tier-header", labels[b.tier]));
      }
      const subs = Game.Buildings.subBuildingsForParent(b.id);
      const subAllocHtml = subs.length ? '<div class="building-suballoc" data-suballoc></div>' : "";
      const row = make("div", "building-row");
      row.innerHTML =
        '<div class="building-main">' +
        '<div class="building-info">' +
        '<div class="building-name">' + b.name + ' <span class="building-owned" data-owned></span></div>' +
        '<div class="building-role">' + b.role + '</div>' +
        '<div class="building-req" data-req></div>' +
        subAllocHtml +
        '<div class="building-cps" data-cps></div>' +
        "</div>" +
        '<button class="buy-button" data-buy><span class="buy-label">Buy</span><span class="buy-cost" data-cost></span></button>' +
        "</div>" +
        '<div class="subbuilding-list" data-subs></div>';
      const btn = row.querySelector("[data-buy]");
      btn.addEventListener("click", () => {
        const bought = Game.Buildings.buy(b.id);
        if (bought > 0) {
          UI.update();
        }
      });
      const subsWrap = row.querySelector("[data-subs]");
      if (!subs.length) {
        subsWrap.remove();
      } else {
        UI._subRows[b.id] = {};
        const unitLabel = cfg.SUB_BUILDING_PARENT_COST === 1 ? " unit" : " units";
        const buyLabel = cfg.SUB_BUILDING_PARENT_COST + " " + cfg.buildingMap[b.id].name + unitLabel;
        subs.forEach((sb) => {
          const subCard = make("div", "subbuilding-card");
          subCard.innerHTML =
            '<div class="subbuilding-top">' +
            '<div><div class="subbuilding-name">' + sb.name + ' <span class="subbuilding-owned" data-sub-owned></span></div>' +
            '<div class="subbuilding-desc">' + sb.desc + "</div></div>" +
            '<div class="subbuilding-level" data-sub-level></div>' +
            "</div>" +
            '<div class="subbuilding-actions">' +
            '<button class="sub-btn" data-sub-buy><span>Allocate</span><span class="sub-btn-cost" data-sub-buy-cost></span></button>' +
            '<button class="sub-btn secondary" data-sub-upgrade><span>Improve</span><span class="sub-btn-cost" data-sub-up-cost></span></button>' +
            "</div>";
          subCard.querySelector("[data-sub-buy]").addEventListener("click", () => {
            if (Game.Buildings.buySubBuilding(sb.id, 1)) UI.update();
          });
          subCard.querySelector("[data-sub-upgrade]").addEventListener("click", () => {
            if (Game.Buildings.upgradeSubBuilding(sb.id)) UI.update();
          });
          subsWrap.appendChild(subCard);
          UI._subRows[b.id][sb.id] = {
            card: subCard,
            owned: subCard.querySelector("[data-sub-owned]"),
            level: subCard.querySelector("[data-sub-level]"),
            buyBtn: subCard.querySelector("[data-sub-buy]"),
            buyCost: subCard.querySelector("[data-sub-buy-cost]"),
            upBtn: subCard.querySelector("[data-sub-upgrade]"),
            upCost: subCard.querySelector("[data-sub-up-cost]"),
            buyLabel,
          };
        });
      }
      list.appendChild(row);
      UI._buildingRows[b.id] = {
        row,
        owned: row.querySelector("[data-owned]"),
        req: row.querySelector("[data-req]"),
        cps: row.querySelector("[data-cps]"),
        suballoc: row.querySelector("[data-suballoc]"),
        cost: row.querySelector("[data-cost]"),
        btn,
      };
    });
  };

  UI.updateBuildings = function () {
    const s = Game.state;
    cfg.buildings.forEach((b) => {
      const r = UI._buildingRows[b.id];
      if (!r) return;
      const owned = s.buildings[b.id] || 0;
      const amount = Game.Buildings.resolveAmount(b.id);
      const cost = Game.Buildings.bulkCost(b.id, Math.max(1, amount));
      const prevId = Game.Buildings.previousBuildingId(b.id);
      const prev = prevId ? cfg.buildingMap[prevId] : null;
      const requiredPrev = Game.Buildings.requiredPrevious(b.id, Math.max(1, amount));
      const prevOwned = prevId ? (s.buildings[prevId] || 0) : 0;
      r.owned.textContent = "x" + owned;
      const contribution = Game.buildingCps(b.id) * (s._mult ? s._mult.global : 1);
      r.cps.textContent = fmt(contribution) + " CPS" + (owned > 0 ? " (" + ((contribution / (s._cps || 1)) * 100).toFixed(1) + "%)" : "");
      r.cost.textContent = fmt(cost) + (amount > 1 ? " (x" + amount + ")" : "");
      if (!prevId) {
        r.req.textContent = "Base building";
        r.req.classList.remove("missing");
      } else {
        r.req.textContent =
          "Needs " + fmt(requiredPrev) + " " + prev.name + " (" + fmt(prevOwned) + " available)";
        r.req.classList.toggle("missing", prevOwned < requiredPrev);
      }
      const affordable = s.coins >= cost;
      const hasPrereq = !prevId || prevOwned >= requiredPrev;
      r.btn.classList.toggle("disabled", !affordable || !hasPrereq);
      r.btn.disabled = false; // allow click to buy-max fallback

      const subs = Game.Buildings.subBuildingsForParent(b.id);
      if (subs.length && r.suballoc) {
        const allocated = Game.Buildings.allocatedParentUnits(b.id);
        r.suballoc.textContent = "Sub-buildings: " + allocated + " / " + owned + " allocated";
      } else if (r.suballoc) {
        r.suballoc.textContent = "";
      }

      const subRows = (UI._subRows && UI._subRows[b.id]) || null;
      if (subRows) {
        subs.forEach((sb) => {
          const sr = subRows[sb.id];
          if (!sr) return;
          const subOwned = s.subBuildings[sb.id] || 0;
          const level = Game.Buildings.subUpgradeLevel(sb.id);
          const canAllocate = Game.Buildings.canBuySubBuilding(sb.id, 1);
          const canUpgrade = Game.Buildings.canUpgradeSubBuilding(sb.id);
          const upCost = Game.Buildings.subUpgradeCost(sb.id);
          sr.owned.textContent = "x" + subOwned;
          sr.level.textContent = "Lv " + level + " / " + cfg.SUB_BUILDING_MAX_UPGRADES;
          sr.buyCost.textContent = sr.buyLabel;
          sr.upCost.textContent = upCost === Infinity ? "Maxed" : fmt(upCost) + " coins";
          sr.buyBtn.classList.toggle("disabled", !canAllocate);
          sr.upBtn.classList.toggle("disabled", !canUpgrade);
          sr.buyBtn.disabled = false;
          sr.upBtn.disabled = false;
        });
      }
    });
    UI.updateUpgrades();
    UI.updateClickerUpgrades();
  };

  UI.updateUpgrades = function () {
    const list = refs.upgradeList;
    const available = Game.Buildings.availableUpgrades();
    list.innerHTML = "";
    if (available.length === 0) {
      list.appendChild(make("div", "empty-note", "No upgrades available. Buy more buildings to unlock upgrades."));
      return;
    }
    available.forEach((u) => {
      const cost = Game.Buildings.upgradeCost(u.id);
      const affordable = Game.state.coins >= cost;
      const card = make("div", "upgrade-card" + (affordable ? "" : " locked"));
      card.innerHTML =
        '<div class="upgrade-name">' + u.name + "</div>" +
        '<div class="upgrade-building">' + cfg.buildingMap[u.building].name + "</div>" +
        '<div class="upgrade-desc">' + u.desc + "</div>" +
        '<div class="upgrade-cost">' + fmt(cost) + " coins</div>";
      card.addEventListener("click", () => {
        if (Game.Buildings.buyUpgrade(u.id)) UI.update();
      });
      list.appendChild(card);
    });
  };

  UI.wireClickerUpgrades = function () {
    const container = el("clicker-upgrades");
    if (!container) return;
    container.addEventListener("click", (e) => {
      if (e.target.closest("[data-cu-buy]")) {
        if (Game.Buildings.buyClickerUpgrade()) UI.update();
      }
    });
  };

  UI.updateClickerUpgrades = function () {
    const container = el("clicker-upgrades");
    if (!container) return;
    const s = Game.state;
    const level = s.clickerUpgrades || 0;
    const maxed = level >= cfg.CLICKER_UPGRADE_MAX;
    const cost = Game.Buildings.clickerUpgradeCost();
    const affordable = !maxed && s.coins >= cost;
    const def = cfg.clickerUpgradeDefs[level] || null;

    let html = '<div class="cu-header">Click Upgrades <span class="cu-level">' + level + " / " + cfg.CLICKER_UPGRADE_MAX + "</span></div>";
    if (maxed) {
      html += '<div class="cu-maxed">Maximum suffering achieved. The coins are yours.</div>';
    } else {
      const boostPct = Math.round((def.clickBoost - 1) * 100);
      const penaltyPct = Math.round((1 - def.globalPenalty) * 100);
      html +=
        '<div class="cu-next">' +
        '<div class="cu-name">' + def.name + "</div>" +
        '<div class="cu-flavor">' + def.flavor + "</div>" +
        '<div class="cu-effect">+' + boostPct + '% click value &nbsp;|&nbsp; <span class="cu-penalty">-' + penaltyPct + '% global production</span></div>' +
        '<div class="cu-cost">' + fmt(cost) + " coins</div>" +
        '<button class="cu-btn' + (affordable ? "" : " disabled") + '" data-cu-buy>Upgrade</button>' +
        "</div>";
    }
    container.innerHTML = html;
  };

  /* ---------------------------------------------------------------------
     Research
     --------------------------------------------------------------------- */
  UI.buildResearchTabs = function () {
    const bar = el("research-branch-tabs");
    bar.innerHTML = "";
    UI._activeBranch = "economics";
    Object.keys(cfg.researchBranches).forEach((key) => {
      const br = cfg.researchBranches[key];
      const btn = make("button", "branch-tab", br.name);
      btn.style.setProperty("--branch-color", br.color);
      btn.dataset.branch = key;
      btn.addEventListener("click", () => {
        UI._activeBranch = key;
        document.querySelectorAll(".branch-tab").forEach((b) => b.classList.toggle("active", b.dataset.branch === key));
        UI.updateResearch();
      });
      bar.appendChild(btn);
    });
    bar.querySelector(".branch-tab").classList.add("active");
  };

  UI.buildResearch = function () {
    // container populated on update per active branch
    built.research = true;
  };

  UI.updateResearch = function () {
    const container = el("research-nodes");
    if (!container) return;
    const branch = UI._activeBranch || "economics";
    const nodes = cfg.research.filter((r) => r.branch === branch);
    container.innerHTML = "";
    nodes.forEach((r) => {
      const done = Game.Research.purchased(r.id);
      const available = Game.Research.available(r.id);
      const affordable = Game.Research.canAfford(r.id);
      let cls = "research-node";
      if (done) cls += " purchased";
      else if (!available) cls += " locked";
      else if (affordable) cls += " affordable";
      const card = make("div", cls);
      card.innerHTML =
        '<div class="rn-name">' + r.name + "</div>" +
        '<div class="rn-desc">' + r.desc + "</div>" +
        '<div class="rn-cost">' + (done ? "Purchased" : fmt(r.cost) + " RP") + "</div>";
      if (!done && available) {
        card.addEventListener("click", () => {
          if (Game.Research.buy(r.id)) UI.update();
        });
      }
      container.appendChild(card);
    });
    const prog = Game.Research.branchProgress(branch);
    el("research-progress").textContent = "Progress: " + prog.done + " / " + prog.total;
  };

  /* ---------------------------------------------------------------------
     Automation
     --------------------------------------------------------------------- */
  UI.buildAutomation = function () {
    const container = el("automation-list");
    container.innerHTML = "";
    const features = [
      { key: "autoClick", name: "Auto Click", desc: "Automatically clicks the coin button." },
      { key: "autoBuy", name: "Auto Buy", desc: "Automatically purchases affordable buildings." },
      { key: "autoUpgrade", name: "Auto Upgrade", desc: "Automatically buys affordable upgrades." },
      { key: "autoResearch", name: "Auto Research", desc: "Automatically completes the cheapest research." },
      { key: "autoPrestige", name: "Auto Prestige", desc: "Prestiges when it would more than double your PP." },
      { key: "autoAscend", name: "Auto Ascend", desc: "Ascends when at least one shard can be earned." },
    ];
    UI._autoRows = {};
    features.forEach((f) => {
      const row = make("div", "automation-row");
      row.innerHTML =
        '<div class="auto-info"><div class="auto-name">' + f.name + '</div><div class="auto-desc">' + f.desc + "</div>" +
        '<div class="auto-status" data-status></div></div>' +
        '<label class="switch"><input type="checkbox" data-toggle><span class="slider"></span></label>';
      const toggle = row.querySelector("[data-toggle]");
      toggle.addEventListener("change", () => {
        if (!Game.Automation.isUnlocked(f.key)) {
          toggle.checked = false;
          UI.toast(f.name + " is locked. Research it in the Automation branch.", "info");
          return;
        }
        Game.state.automation[f.key] = toggle.checked;
      });
      container.appendChild(row);
      UI._autoRows[f.key] = { row, toggle, status: row.querySelector("[data-status]"), feature: f };
    });

    // Buy amount selector
    const amtWrap = el("buy-amount-selector");
    amtWrap.innerHTML = "";
    [{ v: 1, l: "x1" }, { v: 10, l: "x10" }, { v: 100, l: "x100" }, { v: -1, l: "Max" }].forEach((o) => {
      const b = make("button", "amount-btn", o.l);
      b.dataset.amount = o.v;
      b.addEventListener("click", () => {
        Game.Automation.setBuyAmount(o.v);
        UI.updateAutomation();
        UI.update();
      });
      amtWrap.appendChild(b);
    });
    built.automation = true;
  };

  UI.updateAutomation = function () {
    if (!built.automation) return;
    Object.keys(UI._autoRows).forEach((key) => {
      const r = UI._autoRows[key];
      const unlocked = Game.Automation.isUnlocked(key);
      r.row.classList.toggle("locked", !unlocked);
      r.toggle.checked = !!Game.state.automation[key];
      r.toggle.disabled = false;
      if (!unlocked) {
        r.status.textContent = "Locked — unlock via research";
      } else if (key === "autoClick") {
        r.status.textContent = "Active: " + Game.Automation.clicksPerSecond().toFixed(0) + " clicks/sec";
      } else {
        r.status.textContent = Game.state.automation[key] ? "Enabled" : "Disabled";
      }
    });
    document.querySelectorAll(".amount-btn").forEach((b) => {
      b.classList.toggle("active", parseInt(b.dataset.amount, 10) === Game.state.automation.buyAmount);
    });
  };

  /* ---------------------------------------------------------------------
     Skill trees
     --------------------------------------------------------------------- */
  UI.buildSkillTrees = function () {
    // rendered in update call
  };

  UI.updateSkillTrees = function () {
    const list = el("skilltree-list");
    const powerList = el("skill-power-list");
    if (!list || !powerList || !Game.SkillTrees) return;
    list.innerHTML = "";
    Object.keys(cfg.skillTreeBranches).forEach((treeKey) => {
      const tree = cfg.skillTreeBranches[treeKey];
      const wrap = make("div", "skilltree");
      const header = make("div", "skilltree-header", tree.name + " Tree");
      header.style.borderColor = tree.color;
      wrap.appendChild(header);
      const row = make("div", "skilltree-row");
      const nodes = cfg.skillTreeNodesByTree[treeKey] || [];
      nodes.forEach((n, idx) => {
        const owned = Game.SkillTrees.purchased(n.id);
        const available = Game.SkillTrees.available(n.id);
        const affordable = Game.SkillTrees.canAfford(n.id);
        let actionText = "";
        if (owned) actionText = "Unlocked";
        else if (!available) actionText = "Requires prior node";
        else if (affordable) actionText = "Buy " + fmt(n.cost) + " Prestige Points";
        else actionText = "Need " + fmt(n.cost) + " Prestige Points";
        const card = make("div", "skill-node" + (owned ? " purchased" : available ? "" : " locked"));
        card.style.borderColor = owned ? "#43aa8b" : tree.color;
        card.innerHTML =
          '<div class="skill-node-name">' + n.name + "</div>" +
          '<div class="skill-node-desc">' + n.desc + "</div>" +
          '<button class="talent-buy-btn ' + (owned || !affordable ? "disabled" : "") + '">' + actionText + "</button>";
        const btn = card.querySelector("button");
        btn.disabled = owned || !affordable;
        btn.addEventListener("click", () => {
          if (Game.SkillTrees.buy(n.id)) UI.update();
        });
        const item = make("div", "skill-node-item");
        item.appendChild(card);
        if (idx < nodes.length - 1) item.appendChild(make("div", "skill-node-arrow", "→"));
        row.appendChild(item);
      });
      wrap.appendChild(row);
      list.appendChild(wrap);
    });

    powerList.innerHTML = "";
    const activePowerMap = {};
    Game.SkillTrees.activePowers().forEach((p) => {
      activePowerMap[p.id] = p.remaining;
    });
    Object.keys(cfg.skillPowers || {}).forEach((powerId) => {
      const p = cfg.skillPowers[powerId];
      const activeRemaining = activePowerMap[powerId] || 0;
      const cooldown = Game.SkillTrees.cooldownRemaining(powerId);
      const ready = Game.SkillTrees.canActivate(powerId);
      const status = activeRemaining > 0 ? "Active " + Math.ceil(activeRemaining) + "s" : cooldown > 0 ? "Cooldown " + Math.ceil(cooldown) + "s" : "Ready";
      const row = make("div", "talent-power-row");
      row.innerHTML =
        '<div class="talent-power-info">' +
        '<div class="talent-power-name">' + p.name + "</div>" +
        '<div class="talent-power-meta">' + Math.ceil(p.duration) + "s duration • " + Math.ceil(p.cooldown) + "s cooldown • " + status + "</div>" +
        '<div class="talent-power-desc">' + p.desc + "</div>" +
        "</div>" +
        '<button class="talent-power-btn ' + (ready ? "" : "disabled") + '">Activate</button>';
      const btn = row.querySelector("button");
      btn.disabled = !ready;
      btn.addEventListener("click", () => {
        if (Game.SkillTrees.activate(powerId)) UI.update();
      });
      powerList.appendChild(row);
    });
  };

  /* ---------------------------------------------------------------------
     Bitcoin
     --------------------------------------------------------------------- */
  UI.buildBitcoin = function () {
    const producers = el("energy-producer-list");
    const miners = el("btc-miner-list");
    const batteries = el("battery-list");
    const coinFarmers = el("coin-farmer-list");
    if (!producers || !miners || !batteries || !coinFarmers) return;
    producers.innerHTML = "";
    miners.innerHTML = "";
    batteries.innerHTML = "";
    coinFarmers.innerHTML = "";
    UI._btcRows = { producers: {}, miners: {}, batteries: {}, coinFarmers: {} };

    cfg.energyProducers.forEach((p) => {
      const row = make("div", "market-card");
      row.innerHTML =
        '<div class="market-title">' + p.name + "</div>" +
        '<div class="market-desc">+' + fmt(p.energyPerSec) + " energy/sec</div>" +
        '<button class="settings-btn">Buy</button>';
      const btn = row.querySelector("button");
      btn.addEventListener("click", () => {
        if (Game.Bitcoin.buyProducer(p.id)) UI.update();
      });
      producers.appendChild(row);
      UI._btcRows.producers[p.id] = { row, btn, def: p };
    });
    cfg.btcMiners.forEach((m) => {
      const row = make("div", "market-card");
      row.innerHTML =
        '<div class="market-title">' + m.name + "</div>" +
        '<div class="market-desc">' + fmt(m.btcPerSec) + " BTC/sec • " + fmt(m.energyUse) + " energy/sec</div>" +
        '<button class="settings-btn">Buy</button>';
      const btn = row.querySelector("button");
      btn.addEventListener("click", () => {
        if (Game.Bitcoin.buyMiner(m.id)) UI.update();
      });
      miners.appendChild(row);
      UI._btcRows.miners[m.id] = { row, btn, def: m };
    });
    cfg.batteries.forEach((b) => {
      const row = make("div", "market-card");
      row.innerHTML =
        '<div class="market-title">' + b.name + "</div>" +
        '<div class="market-desc">+' + fmt(b.capacity) + " energy cap</div>" +
        '<button class="settings-btn">Buy</button>';
      const btn = row.querySelector("button");
      btn.addEventListener("click", () => {
        if (Game.Bitcoin.buyBattery(b.id)) UI.update();
      });
      batteries.appendChild(row);
      UI._btcRows.batteries[b.id] = { row, btn, def: b };
    });
    (cfg.coinFarmers || []).forEach((f) => {
      const row = make("div", "market-card");
      row.innerHTML =
        '<div class="market-title">' + f.name + "</div>" +
        '<div class="market-desc">' + fmt(f.coinsPerSec) + " coins/sec • " + fmt(f.energyUse) + " energy/sec</div>" +
        '<button class="settings-btn">Buy</button>';
      const btn = row.querySelector("button");
      btn.addEventListener("click", () => {
        if (Game.Bitcoin.buyCoinFarmer(f.id)) UI.update();
      });
      coinFarmers.appendChild(row);
      UI._btcRows.coinFarmers[f.id] = { row, btn, def: f };
    });
    const collectBtn = el("btn-collect-energy");
    if (collectBtn) {
      collectBtn.onclick = () => {
        if (Game.Bitcoin.collectEnergy()) UI.update();
      };
    }
    const farmBtn = el("btn-farm-btc");
    if (farmBtn) {
      farmBtn.onclick = () => {
        if (Game.Bitcoin.farmBitcoin()) UI.update();
      };
    }
    const sellBtn = el("btn-sell-btc");
    if (sellBtn) {
      sellBtn.onclick = () => {
        if (Game.Bitcoin.sellAll()) UI.update();
      };
    }
    built.bitcoin = true;
  };

  UI.updateBitcoin = function () {
    if (!built.bitcoin || !UI._btcRows) return;
    const s = Game.state;
    const stats = el("bitcoin-stats");
    const snap = Game.Bitcoin.snapshot(1);
    const collectBtn = el("btn-collect-energy");
    const farmBtn = el("btn-farm-btc");
    const sellBtn = el("btn-sell-btc");
    stats.innerHTML =
      '<div class="stat-row"><span class="stat-key">BTC Price</span><span class="stat-val">' + fmt(s.btcPrice) + " coins</span></div>" +
      '<div class="stat-row"><span class="stat-key">BTC Holdings</span><span class="stat-val">' + fmt(s.btc) + "</span></div>" +
      '<div class="stat-row"><span class="stat-key">Energy</span><span class="stat-val">' + fmt(s.energy) + " / " + fmt(s.energyCap) + "</span></div>" +
      '<div class="stat-row"><span class="stat-key">Energy Production</span><span class="stat-val">' + fmt(snap.production) + " / sec</span></div>" +
      '<div class="stat-row"><span class="stat-key">Energy Demand</span><span class="stat-val">' + fmt(snap.totalDemand) + " / sec</span></div>" +
      '<div class="stat-row"><span class="stat-key">Grid Utilization</span><span class="stat-val">' + Math.round(snap.activityRatio * 100) + '%</span></div>' +
      '<div class="stat-row"><span class="stat-key">Mining Rate</span><span class="stat-val">' + fmt(snap.miningRate) + " BTC / sec</span></div>" +
      '<div class="stat-row"><span class="stat-key">Coin Farmer Yield</span><span class="stat-val">' + fmt(snap.coinRate) + " coins / sec</span></div>" +
      '<div class="stat-row"><span class="stat-key">Collect Energy</span><span class="stat-val">+' + fmt(Game.Bitcoin.manualEnergyGain()) + "</span></div>" +
      '<div class="stat-row"><span class="stat-key">Farm Bitcoin</span><span class="stat-val">+' + fmt(Game.Bitcoin.manualBitcoinGain()) + " BTC for " + fmt(Game.Bitcoin.manualMineEnergyCost()) + " energy</span></div>";

    setBtn(collectBtn, s.energy < s.energyCap);
    setBtn(farmBtn, s.energy >= Game.Bitcoin.manualMineEnergyCost());
    setBtn(sellBtn, Game.Bitcoin.canSell());

    Object.keys(UI._btcRows.producers).forEach((id) => {
      const r = UI._btcRows.producers[id];
      const owned = s.energyProducers[id] || 0;
      const cost = Game.Bitcoin.equipmentCost(r.def.baseCost, owned);
      r.btn.textContent = "Buy (" + fmt(cost) + ")";
      r.row.querySelector(".market-desc").textContent = "+" + fmt(r.def.energyPerSec) + " energy/sec • owned: " + fmt(owned);
      setBtn(r.btn, s.coins >= cost);
    });
    Object.keys(UI._btcRows.miners).forEach((id) => {
      const r = UI._btcRows.miners[id];
      const owned = s.btcMiners[id] || 0;
      const cost = Game.Bitcoin.equipmentCost(r.def.baseCost, owned);
      r.btn.textContent = "Buy (" + fmt(cost) + ")";
      r.row.querySelector(".market-desc").textContent = fmt(r.def.btcPerSec) + " BTC/sec • " + fmt(r.def.energyUse) + " energy/sec • owned: " + fmt(owned);
      setBtn(r.btn, s.coins >= cost);
    });
    Object.keys(UI._btcRows.batteries).forEach((id) => {
      const r = UI._btcRows.batteries[id];
      const owned = s.batteries[id] || 0;
      const cost = Game.Bitcoin.equipmentCost(r.def.baseCost, owned);
      r.btn.textContent = "Buy (" + fmt(cost) + ")";
      r.row.querySelector(".market-desc").textContent = "+" + fmt(r.def.capacity) + " energy cap • owned: " + fmt(owned);
      setBtn(r.btn, s.coins >= cost);
    });
    Object.keys(UI._btcRows.coinFarmers).forEach((id) => {
      const r = UI._btcRows.coinFarmers[id];
      const owned = s.coinFarmers[id] || 0;
      const cost = Game.Bitcoin.equipmentCost(r.def.baseCost, owned);
      r.btn.textContent = "Buy (" + fmt(cost) + ")";
      r.row.querySelector(".market-desc").textContent = fmt(r.def.coinsPerSec) + " coins/sec • " + fmt(r.def.energyUse) + " energy/sec • owned: " + fmt(owned);
      setBtn(r.btn, s.coins >= cost);
    });
  };

  /* ---------------------------------------------------------------------
     Stocks
     --------------------------------------------------------------------- */
  UI.buildStocks = function () {
    const list = el("stock-list");
    if (!list) return;
    list.innerHTML = "";
    UI._stockRows = {};
    cfg.stocks.forEach((st) => {
      const row = make("div", "stock-row");
      row.innerHTML =
        '<div class="stock-meta"><div class="stock-name">' + st.name + ' <span class="muted">(' + st.ticker + ")</span></div>" +
        '<div class="stock-price" data-price></div><div class="stock-trend muted" data-trend></div></div>' +
        '<div class="stock-portfolio" data-portfolio></div>' +
        '<div class="stock-actions"><button data-buy class="settings-btn">Buy 1</button><button data-sell class="settings-btn">Sell 1</button></div>';
      row.querySelector("[data-buy]").addEventListener("click", () => {
        if (Game.Stocks.buy(st.id, 1)) UI.update();
      });
      row.querySelector("[data-sell]").addEventListener("click", () => {
        if (Game.Stocks.sell(st.id, 1)) UI.update();
      });
      list.appendChild(row);
      UI._stockRows[st.id] = row;
    });
    built.stocks = true;
  };

  UI.updateStocks = function () {
    if (!built.stocks || !UI._stockRows) return;
    const s = Game.state;
    const mults = s._mult || { stockInsight: 0, stockFeeReduction: 1 };
    const summary = el("stock-summary");
    summary.innerHTML =
      '<div class="stat-row"><span class="stat-key">Portfolio Value</span><span class="stat-val">' + fmt(Game.Stocks.portfolioValue()) + " coins</span></div>" +
      '<div class="stat-row"><span class="stat-key">Trade Fee</span><span class="stat-val">' + (Game.Stocks.feeRate() * 100).toFixed(2) + "%</span></div>";
    cfg.stocks.forEach((st) => {
      const row = UI._stockRows[st.id];
      const price = s.stocks[st.id];
      const p = s.portfolio[st.id];
      row.querySelector("[data-price]").textContent = "Price: " + fmt(price) + " coins";
      const trend = Game.Stocks.trend(st.id);
      row.querySelector("[data-trend]").textContent = mults.stockInsight > 0 ? "Trend: " + trend : "Trend: locked (unlock via Engineering/Education)";
      const pnl = p.shares > 0 ? (price - p.avgCost) * p.shares : 0;
      row.querySelector("[data-portfolio]").textContent = "Shares: " + fmt(p.shares) + " • Avg: " + fmt(p.avgCost) + " • P/L: " + fmt(pnl);
      row.querySelector("[data-buy]").disabled = s.coins < price * (1 + Game.Stocks.feeRate());
      row.querySelector("[data-sell]").disabled = p.shares < 1;
    });
  };



  /* ---------------------------------------------------------------------
     Casino / Horse Track / Race Track
     --------------------------------------------------------------------- */
  function conditionBar(value) {
    const pct = Math.max(0, Math.min(100, value || 0));
    const cls = pct < 35 ? "low" : pct < 65 ? "mid" : "";
    return '<div class="condition-bar"><div class="condition-fill ' + cls + '" style="width:' + pct.toFixed(1) + '%"></div></div>';
  }

  function bindActionButtons(rootNode, selector, handler) {
    rootNode.querySelectorAll(selector).forEach((btn) => {
      btn.addEventListener("click", () => handler(btn));
    });
  }

  function renderCards(cards, held) {
    return cards.map((card, index) => {
      const cls = [held && held[index] ? "held" : "", Game.Gambling.cardIsRed(card) ? "red" : ""].filter(Boolean).join(" ");
      return '<button class="poker-card ' + cls + '" data-poker-hold="' + index + '">' + Game.Gambling.cardText(card) + '</button>';
    }).join("");
  }

  function renderBlackjackHand(cards, hideLast) {
    return cards.map((card, index) => {
      const shown = hideLast && index === 1 ? "🂠" : Game.Gambling.cardText(card);
      const cls = hideLast && index === 1 ? "" : Game.Gambling.cardIsRed(card) ? " red" : "";
      return '<div class="bj-card' + cls + '">' + shown + '</div>';
    }).join("");
  }

  function setSelectOptions(select, entries, valueKey, labelKey, fallback) {
    if (!select) return;
    const current = select.value;
    select.innerHTML = "";
    entries.forEach((entry) => {
      const option = document.createElement("option");
      option.value = entry[valueKey];
      option.textContent = entry[labelKey];
      select.appendChild(option);
    });
    select.value = entries.some((entry) => String(entry[valueKey]) === String(current)) ? current : (fallback !== undefined ? fallback : (entries[0] ? entries[0][valueKey] : ""));
  }

  function renderRaceField(entries, lastRace, className) {
    return '<div class="race-field">' + entries.map((entry) => {
      const lastWinner = lastRace && lastRace.winner === entry.name;
      return '<div class="race-entry' + (entry.owned ? ' owned' : '') + (lastWinner ? ' winner' : '') + '">' +
        '<div class="race-entry-pos">•</div>' +
        '<div class="race-entry-name">' + entry.label + '</div>' +
        '<div class="race-entry-odds">W ' + entry.odds.win.toFixed(2) + 'x / P ' + entry.odds.place.toFixed(2) + 'x / S ' + entry.odds.show.toFixed(2) + 'x</div>' +
        '</div>';
    }).join("") + '</div>';
  }

  UI.buildCasino = function () {
    const bar = el("casino-chips-bar");
    const tabs = el("casino-game-tabs");
    const area = el("casino-game-area");
    const stats = el("casino-stats");
    if (!bar || !tabs || !area || !stats) return;
    bar.innerHTML =
      '<div class="casino-chip-balance" id="casino-chip-balance"></div>' +
      '<div class="casino-action-row">' +
      '<input id="casino-buy-input" class="casino-input" type="number" min="1" step="1" value="1000" />' +
      '<button class="settings-btn" id="casino-buy-btn">Buy Chips</button>' +
      '</div>' +
      '<div class="casino-action-row">' +
      '<input id="casino-redeem-input" class="casino-input" type="number" min="1" step="1" value="1000" />' +
      '<button class="settings-btn" id="casino-redeem-btn">Redeem Chips</button>' +
      '</div>';
    tabs.innerHTML = "";
    cfg.casinoGames.forEach((game) => {
      const btn = make("button", "casino-game-tab" + (game.id === activeCasinoGame ? " active" : ""), game.label);
      btn.dataset.game = game.id;
      btn.addEventListener("click", () => {
        activeCasinoGame = game.id;
        UI.renderCasinoGame();
        UI.updateCasino();
      });
      tabs.appendChild(btn);
    });
    el("casino-buy-btn").onclick = () => {
      if (Game.Gambling.buyChips(parseInt(el("casino-buy-input").value, 10) || 0)) UI.update();
    };
    el("casino-redeem-btn").onclick = () => {
      if (Game.Gambling.redeemChips(parseInt(el("casino-redeem-input").value, 10) || 0)) UI.update();
    };
    UI.renderCasinoGame();
    built.gambling = true;
  };

  UI.renderCasinoGame = function () {
    const area = el("casino-game-area");
    if (!area) return;
    if (activeCasinoGame === "slots") {
      area.innerHTML =
        '<div class="casino-action-row"><input id="slots-bet" class="casino-input" type="number" min="10" max="1000000" step="10" value="100" />' +
        '<button class="settings-btn" id="slots-spin-btn">Spin</button></div>' +
        '<div class="slots-reels"><div class="slot-reel" id="slot-0">?</div><div class="slot-reel" id="slot-1">?</div><div class="slot-reel" id="slot-2">?</div></div>' +
        '<div id="slots-result" class="muted">Match symbols to win chips.</div>';
      el("slots-spin-btn").onclick = () => {
        Game.Gambling.spinSlots(parseInt(el("slots-bet").value, 10) || 0);
        UI.updateCasino();
      };
    } else if (activeCasinoGame === "blackjack") {
      area.innerHTML =
        '<div class="casino-action-row"><input id="blackjack-bet" class="casino-input" type="number" min="10" max="1000000" step="10" value="100" />' +
        '<button class="settings-btn" id="blackjack-deal-btn">Deal</button>' +
        '<button class="settings-btn" id="blackjack-hit-btn">Hit</button>' +
        '<button class="settings-btn" id="blackjack-stand-btn">Stand</button>' +
        '<button class="settings-btn" id="blackjack-double-btn">Double Down</button></div>' +
        '<div><strong>Dealer</strong><div class="bj-hand" id="blackjack-dealer-hand"></div><div id="blackjack-dealer-score" class="muted"></div></div>' +
        '<div style="margin-top:10px"><strong>You</strong><div class="bj-hand" id="blackjack-player-hand"></div><div id="blackjack-player-score" class="muted"></div></div>' +
        '<div id="blackjack-result" class="muted" style="margin-top:8px"></div>';
      el("blackjack-deal-btn").onclick = () => { Game.Gambling.blackjackStart(parseInt(el("blackjack-bet").value, 10) || 0); UI.updateCasino(); };
      el("blackjack-hit-btn").onclick = () => { Game.Gambling.blackjackHit(); UI.updateCasino(); };
      el("blackjack-stand-btn").onclick = () => { Game.Gambling.blackjackStand(); UI.updateCasino(); };
      el("blackjack-double-btn").onclick = () => { Game.Gambling.blackjackDouble(); UI.updateCasino(); };
    } else if (activeCasinoGame === "poker") {
      area.innerHTML =
        '<div class="casino-action-row"><input id="poker-bet" class="casino-input" type="number" min="10" max="1000000" step="10" value="100" />' +
        '<button class="settings-btn" id="poker-deal-btn">Deal</button>' +
        '<button class="settings-btn" id="poker-draw-btn">Draw</button></div>' +
        '<div class="poker-hand" id="poker-hand"></div>' +
        '<div id="poker-result" class="muted"></div>';
      el("poker-deal-btn").onclick = () => { Game.Gambling.pokerDeal(parseInt(el("poker-bet").value, 10) || 0); UI.updateCasino(); };
      el("poker-draw-btn").onclick = () => { Game.Gambling.pokerDraw(); UI.updateCasino(); };
    } else if (activeCasinoGame === "roulette") {
      area.innerHTML =
        '<div class="casino-action-row">' +
        '<select id="roulette-type" class="casino-input"><option value="redblack">Red / Black</option><option value="oddeven">Odd / Even</option><option value="lowhigh">Low / High</option><option value="dozen">Dozens</option><option value="column">Columns</option><option value="straight">Straight</option></select>' +
        '<input id="roulette-value" class="casino-input" value="red" />' +
        '<input id="roulette-bet" class="casino-input" type="number" min="10" max="1000000" step="10" value="100" />' +
        '<button class="settings-btn" id="roulette-spin-btn">Spin</button></div>' +
        '<div class="roulette-grid">' + Array.from({ length: 12 }, (_, i) => '<button class="roulette-bet-btn" data-roulette-sample="' + (i + 1) + '">' + (i + 1) + '</button>').join("") + '</div>' +
        '<div class="roulette-result" id="roulette-result">—</div>' +
        '<div id="roulette-note" class="muted"></div>';
      el("roulette-spin-btn").onclick = () => {
        Game.Gambling.rouletteSpin(el("roulette-type").value, el("roulette-value").value, parseInt(el("roulette-bet").value, 10) || 0);
        UI.updateCasino();
      };
      bindActionButtons(area, "[data-roulette-sample]", (btn) => {
        el("roulette-type").value = "straight";
        el("roulette-value").value = btn.dataset.rouletteSample;
      });
    } else if (activeCasinoGame === "dice") {
      area.innerHTML =
        '<div class="casino-action-row">' +
        '<select id="dice-type" class="casino-input"><option value="over7">Over 7</option><option value="under7">Under 7</option><option value="exactly7">Exactly 7</option>' +
        Array.from({ length: 11 }, (_, i) => '<option value="exact-' + (i + 2) + '">Exact ' + (i + 2) + '</option>').join("") +
        '</select>' +
        '<input id="dice-bet" class="casino-input" type="number" min="10" max="1000000" step="10" value="100" />' +
        '<button class="settings-btn" id="dice-roll-btn">Roll</button></div>' +
        '<div class="dice-result" id="dice-result">🎲</div>' +
        '<div id="dice-note" class="muted"></div>';
      el("dice-roll-btn").onclick = () => {
        Game.Gambling.rollDice(el("dice-type").value, parseInt(el("dice-bet").value, 10) || 0);
        UI.updateCasino();
      };
    } else if (activeCasinoGame === "plinko") {
      area.innerHTML =
        '<div class="casino-action-row"><input id="plinko-bet" class="casino-input" type="number" min="10" max="1000000" step="10" value="100" />' +
        '<button class="settings-btn" id="plinko-play-btn">Drop Ball</button></div>' +
        '<div class="plinko-board" id="plinko-board">Path: —\nSlots: ' + cfg.plinkoMultipliers.map((mult) => mult + 'x').join(' | ') + '</div>' +
        '<div id="plinko-note" class="muted"></div>';
      el("plinko-play-btn").onclick = () => {
        Game.Gambling.plinkoPlay(parseInt(el("plinko-bet").value, 10) || 0);
        UI.updateCasino();
      };
    }
  };

  UI.updateCasino = function () {
    if (!built.gambling) return;
    Game.Gambling.ensureState();
    const s = Game.state;
    const g = s.gambling;
    const balance = el("casino-chip-balance");
    const stats = el("casino-stats");
    if (balance) balance.textContent = "Chips: " + fmt(g.chips) + " • Coins: " + fmt(s.coins);
    document.querySelectorAll(".casino-game-tab").forEach((btn) => btn.classList.toggle("active", btn.dataset.game === activeCasinoGame));
    if (stats) {
      stats.innerHTML =
        '<div class="stat-row"><span class="stat-key">Games Played</span><span class="stat-val">' + fmt(g.gamesPlayed) + '</span></div>' +
        '<div class="stat-row"><span class="stat-key">Games Won</span><span class="stat-val">' + fmt(g.gamesWon) + '</span></div>' +
        '<div class="stat-row"><span class="stat-key">Net Chips Won</span><span class="stat-val">' + fmt(g.totalChipsWon - g.totalChipsLost) + '</span></div>' +
        '<div class="stat-row"><span class="stat-key">Slots Big Wins</span><span class="stat-val">' + fmt(g.slotStats.bigWins || 0) + '</span></div>';
    }
    const noChipsMsg = "Not enough chips. Use 'Buy Chips' above to convert coins.";
    if (activeCasinoGame === "slots") {
      const last = g.lastSlotsResult || [];
      for (let i = 0; i < 3; i++) {
        const reel = el("slot-" + i);
        if (reel) reel.textContent = last[i] || "?";
      }
      const note = el("slots-result");
      if (note) {
        if (last.length) {
          note.innerHTML = 'Last spin: ' + last.join(' ') + ' • Chips: ' + fmt(g.chips);
        } else if (g.chips < cfg.CASINO_MIN_BET) {
          note.textContent = noChipsMsg;
        }
      }
    } else if (activeCasinoGame === "blackjack") {
      const bj = g.blackjackState;
      const player = Game.Gambling.blackjackValue(bj.playerHand || []);
      const dealer = Game.Gambling.blackjackValue(bj.dealerHand || []);
      const hideDealer = bj.phase === "player" && bj.dealerHand.length >= 2;
      if (el("blackjack-player-hand")) el("blackjack-player-hand").innerHTML = renderBlackjackHand(bj.playerHand || []);
      if (el("blackjack-dealer-hand")) el("blackjack-dealer-hand").innerHTML = renderBlackjackHand(bj.dealerHand || [], hideDealer);
      if (el("blackjack-player-score")) el("blackjack-player-score").textContent = bj.playerHand.length ? "Score: " + player.best : "";
      if (el("blackjack-dealer-score")) el("blackjack-dealer-score").textContent = hideDealer ? "Score: ?" : (bj.dealerHand.length ? "Score: " + dealer.best : "");
      let bjMsg;
      if (bj.result) {
        bjMsg = bj.result;
      } else if (bj.phase === "player") {
        bjMsg = "Your move.";
      } else if (g.chips < cfg.CASINO_MIN_BET) {
        bjMsg = noChipsMsg;
      } else {
        bjMsg = "Place a bet and click Deal.";
      }
      if (el("blackjack-result")) el("blackjack-result").textContent = bjMsg;
      setBtn(el("blackjack-deal-btn"), bj.phase !== "player" && g.chips >= cfg.CASINO_MIN_BET);
      setBtn(el("blackjack-hit-btn"), bj.phase === "player");
      setBtn(el("blackjack-stand-btn"), bj.phase === "player");
      setBtn(el("blackjack-double-btn"), bj.phase === "player" && (bj.playerHand || []).length === 2 && g.chips >= bj.bet && !bj.doubled);
    } else if (activeCasinoGame === "poker") {
      const ps = g.pokerState;
      if (el("poker-hand")) el("poker-hand").innerHTML = renderCards(ps.hand || [], ps.held || []);
      let pokerMsg;
      if (ps.result) {
        pokerMsg = ps.result;
      } else if (ps.phase === "draw") {
        pokerMsg = "Select cards to hold, then click Draw.";
      } else if (g.chips < cfg.CASINO_MIN_BET) {
        pokerMsg = noChipsMsg;
      } else {
        pokerMsg = "Deal a hand.";
      }
      if (el("poker-result")) el("poker-result").textContent = pokerMsg;
      bindActionButtons(el("poker-hand"), "[data-poker-hold]", (btn) => {
        if (Game.Gambling.pokerToggleHold(parseInt(btn.dataset.pokerHold, 10))) UI.updateCasino();
      });
      setBtn(el("poker-deal-btn"), ps.phase !== "draw" && g.chips >= cfg.CASINO_MIN_BET);
      setBtn(el("poker-draw-btn"), ps.phase === "draw");
    } else if (activeCasinoGame === "roulette") {
      const rr = g.lastRouletteResult || {};
      if (el("roulette-result")) el("roulette-result").textContent = rr.number !== undefined ? rr.number : "—";
      if (el("roulette-note")) {
        if (rr.number !== undefined) {
          el("roulette-note").textContent = rr.payout > 0 ? "Payout: " + fmt(rr.payout) + " chips" : "No payout.";
        } else {
          el("roulette-note").textContent = g.chips < cfg.CASINO_MIN_BET ? noChipsMsg : "American wheel with 0 and 00.";
        }
      }
    } else if (activeCasinoGame === "dice") {
      const dr = g.lastDiceResult || {};
      if (el("dice-result")) el("dice-result").textContent = dr.sum ? dr.dice[0] + " + " + dr.dice[1] + " = " + dr.sum : "🎲";
      if (el("dice-note")) {
        if (dr.sum) {
          el("dice-note").textContent = dr.payout > 0 ? "Payout: " + fmt(dr.payout) + " chips" : "House wins this roll.";
        } else {
          el("dice-note").textContent = g.chips < cfg.CASINO_MIN_BET ? noChipsMsg : "Pick a bet and roll.";
        }
      }
    } else if (activeCasinoGame === "plinko") {
      const pr = g.lastPlinkoResult || {};
      if (el("plinko-board")) el("plinko-board").textContent = pr.path ? "Path: " + pr.path.join(" → ") + "\nSlot: " + pr.slotIndex + " • Multiplier: " + pr.multiplier + "x" : "Path: —\nSlots: " + cfg.plinkoMultipliers.map((mult) => mult + 'x').join(' | ');
      if (el("plinko-note")) {
        el("plinko-note").textContent = pr.payout ? "Payout: " + fmt(pr.payout) + " chips" : (g.chips < cfg.CASINO_MIN_BET ? noChipsMsg : "Center lands are safer. Edges are chaos.");
      }
    }
  };

  UI.buildHorseTrack = function () {
    const betPanel = el("horse-betting-panel");
    if (!betPanel) return;
    betPanel.innerHTML =
      '<div class="bet-panel">' +
      '<div class="bet-row"><select id="horse-bet-horse" class="casino-input"></select><select id="horse-bet-type" class="casino-input"><option value="win">Win</option><option value="place">Place</option><option value="show">Show</option></select><input id="horse-bet-amount" class="casino-input" type="number" min="10" step="10" value="100" /><button class="settings-btn" id="horse-place-bet-btn">Place Bet</button></div>' +
      '<div id="horse-pending-bets"></div>' +
      '</div>';
    el("horse-place-bet-btn").onclick = () => {
      Game.Gambling.placeBet(el("horse-bet-horse").value, el("horse-bet-type").value, parseInt(el("horse-bet-amount").value, 10) || 0);
      UI.updateHorseTrack();
    };
    built.horseTrack = true;
  };

  UI.updateHorseTrack = function () {
    if (!built.horseTrack) return;
    Game.Gambling.ensureHorseState();
    const hs = Game.state.horses;
    const race = hs.currentRace;
    const bettingOpen = Game.Gambling.horseBettingOpen();
    setBtn(el("horse-place-bet-btn"), bettingOpen);
    if (race) {
      setSelectOptions(el("horse-bet-horse"), race.entries.map((entry) => ({ id: entry.id, name: entry.label })), "id", "name");
      const info = el("horse-race-info");
      if (info) {
        info.innerHTML =
          '<div class="race-countdown">' + Math.ceil(hs.nextRaceIn) + 's</div>' +
          '<div class="race-meta-grid"><div class="race-accent-horse">Betting ' + (bettingOpen ? 'OPEN' : 'LOCKED') + '</div><div>Stable: ' + hs.owned.length + ' / ' + cfg.HORSE_OWNERSHIP_LIMIT + '</div></div>' +
          renderRaceField(race.entries, hs.lastRaceResult, "horse") +
          (hs.lastRaceResult ? '<div class="muted">Last winner: ' + hs.lastRaceResult.winner + ' • Passive income: ' + fmt(hs.lastRaceResult.passiveIncome || 0) + '</div>' : '<div class="muted">Eight NPC runners plus up to three of your available horses race automatically.</div>');
      }
    }
    const pending = el("horse-pending-bets");
    if (pending) {
      pending.innerHTML = hs.pendingBets.map((bet, index) =>
        '<div class="race-history-row"><span>' + bet.horseName + ' • ' + bet.type + ' • ' + fmt(bet.amount) + ' coins @ ' + bet.odds.toFixed(2) + 'x</span><button class="settings-btn" data-horse-cancel="' + index + '">Cancel</button></div>'
      ).join("") || '<div class="muted">No horse bets placed.</div>';
      bindActionButtons(pending, "[data-horse-cancel]", (btn) => {
        if (Game.Gambling.cancelBet(parseInt(btn.dataset.horseCancel, 10))) UI.updateHorseTrack();
      });
    }
    const history = el("horse-race-history");
    if (history) {
      history.innerHTML = '<div class="race-history-list">' + (hs.raceHistory.map((row) =>
        '<div class="race-history-row"><span>' + new Date(row.time).toLocaleTimeString() + '</span><span>Winner: ' + row.winner + '</span><span>' + (row.owned.join(', ') || 'No owned horses') + '</span></div>'
      ).join("") || '<div class="muted">No races run yet.</div>') + '</div>';
    }
    const stable = el("horse-stable");
    if (stable) {
      stable.innerHTML = '<div class="stable-grid">' + (hs.owned.map((horse) =>
        '<div class="horse-card' + (horse.resting ? ' resting' : '') + (horse.retired ? ' retired' : '') + '">' +
        '<div><strong>' + horse.name + '</strong> <span class="muted">(' + horse.breed + ')</span></div>' +
        conditionBar(horse.condition) +
        '<div class="horse-stats">' +
        '<div class="horse-stat">SPD <span>' + horse.speed + '</span></div>' +
        '<div class="horse-stat">STA <span>' + horse.stamina + '</span></div>' +
        '<div class="horse-stat">AGI <span>' + horse.agility + '</span></div>' +
        '<div class="horse-stat">Form <span>' + horse.form.toFixed(0) + '</span></div>' +
        '<div class="horse-stat">Training <span>' + horse.training.toFixed(0) + '</span></div>' +
        '<div class="horse-stat">Age <span>' + horse.age + '</span></div>' +
        '</div>' +
        '<div class="muted">Jockey: ' + horse.jockey + ' • Wins: ' + horse.wins + ' • Places: ' + horse.places + ' • Races: ' + horse.races + '</div>' +
        '<div class="muted">Upkeep: ' + fmt(horse.upkeepPerMin) + '/min • Last action: ' + horse.lastAction + (horse.actionTimer > 0 ? ' (' + Math.ceil(horse.actionTimer) + 's)' : '') + '</div>' +
        '<div class="horse-actions">' +
        '<button class="settings-btn" data-horse-feed="' + horse.id + '">Feed (' + fmt(Game.Gambling.horseActionCost(horse, 'feed')) + ')</button>' +
        '<button class="settings-btn" data-horse-train="' + horse.id + '">Train (' + fmt(Game.Gambling.horseActionCost(horse, 'train')) + ')</button>' +
        '<button class="settings-btn" data-horse-rest="' + horse.id + '">Rest</button>' +
        '<button class="settings-btn" data-horse-jockey="' + horse.id + '">Premium Jockey</button>' +
        '</div></div>'
      ).join("") || '<div class="muted">Buy horses from the market to start your stable.</div>') + '</div>';
      bindActionButtons(stable, "[data-horse-feed]", (btn) => { if (Game.Gambling.feedHorse(btn.dataset.horseFeed)) UI.updateHorseTrack(); });
      bindActionButtons(stable, "[data-horse-train]", (btn) => { if (Game.Gambling.trainHorse(btn.dataset.horseTrain)) UI.updateHorseTrack(); });
      bindActionButtons(stable, "[data-horse-rest]", (btn) => { if (Game.Gambling.restHorse(btn.dataset.horseRest)) UI.updateHorseTrack(); });
      bindActionButtons(stable, "[data-horse-jockey]", (btn) => { if (Game.Gambling.hirePremiumJockey(btn.dataset.horseJockey)) UI.updateHorseTrack(); });
    }
    const market = el("horse-market");
    if (market) {
      market.innerHTML = hs.market.map((horse, index) =>
        '<div class="market-horse-card"><div><strong>' + horse.name + '</strong> <span class="muted">(' + horse.breed + ')</span></div>' +
        '<div class="horse-stats"><div class="horse-stat">SPD <span>' + horse.speed + '</span></div><div class="horse-stat">STA <span>' + horse.stamina + '</span></div><div class="horse-stat">AGI <span>' + horse.agility + '</span></div><div class="horse-stat">Age <span>' + horse.age + '</span></div></div>' +
        '<div class="muted">Condition ' + horse.condition + ' • Form ' + horse.form + ' • Upkeep ' + fmt(horse.upkeepPerMin) + '/min</div>' +
        '<button class="settings-btn" data-horse-buy="' + index + '">Buy for ' + fmt(horse.purchaseCost) + '</button></div>'
      ).join("") + '<div class="muted">Refresh in ' + Math.ceil(hs.marketRefreshIn) + 's</div>';
      bindActionButtons(market, "[data-horse-buy]", (btn) => { if (Game.Gambling.buyHorse(parseInt(btn.dataset.horseBuy, 10))) UI.updateHorseTrack(); });
    }
  };

  UI.buildRaceTrack = function () {
    const betPanel = el("car-betting-panel");
    if (!betPanel) return;
    betPanel.innerHTML =
      '<div class="bet-panel">' +
      '<div class="bet-row"><select id="car-bet-car" class="casino-input"></select><select id="car-bet-type" class="casino-input"><option value="win">Win</option><option value="place">Place</option><option value="show">Show</option></select><input id="car-bet-amount" class="casino-input" type="number" min="10" step="10" value="100" /><button class="settings-btn" id="car-place-bet-btn">Place Bet</button></div>' +
      '<div id="car-pending-bets"></div>' +
      '</div>';
    el("car-place-bet-btn").onclick = () => {
      Game.Gambling.placeCarBet(el("car-bet-car").value, el("car-bet-type").value, parseInt(el("car-bet-amount").value, 10) || 0);
      UI.updateRaceTrack();
    };
    built.raceTrack = true;
  };

  UI.updateRaceTrack = function () {
    if (!built.raceTrack) return;
    Game.Gambling.ensureCarState();
    const cs = Game.state.cars;
    const race = cs.currentRace;
    const bettingOpen = Game.Gambling.carBettingOpen();
    setBtn(el("car-place-bet-btn"), bettingOpen);
    if (race) {
      setSelectOptions(el("car-bet-car"), race.entries.map((entry) => ({ id: entry.id, name: entry.label })), "id", "name");
      const info = el("car-race-info");
      if (info) {
        info.innerHTML =
          '<div class="race-countdown">' + Math.ceil(cs.nextRaceIn) + 's</div>' +
          '<div class="race-meta-grid"><div class="race-accent-car">Track: ' + race.track.name + '</div><div>Betting ' + (bettingOpen ? 'OPEN' : 'LOCKED') + '</div></div>' +
          renderRaceField(race.entries, cs.lastRaceResult, "car") +
          (cs.lastRaceResult ? '<div class="muted">Last winner: ' + cs.lastRaceResult.winner + ' • Passive income: ' + fmt(cs.lastRaceResult.passiveIncome || 0) + '</div>' : '<div class="muted">Circuits rotate every race and reward different car setups.</div>');
      }
    }
    const pending = el("car-pending-bets");
    if (pending) {
      pending.innerHTML = cs.pendingBets.map((bet, index) =>
        '<div class="race-history-row"><span>' + bet.carName + ' • ' + bet.type + ' • ' + fmt(bet.amount) + ' coins @ ' + bet.odds.toFixed(2) + 'x</span><button class="settings-btn" data-car-cancel="' + index + '">Cancel</button></div>'
      ).join("") || '<div class="muted">No car bets placed.</div>';
      bindActionButtons(pending, "[data-car-cancel]", (btn) => {
        if (Game.Gambling.cancelCarBet(parseInt(btn.dataset.carCancel, 10))) UI.updateRaceTrack();
      });
    }
    const history = el("car-race-history");
    if (history) {
      history.innerHTML = '<div class="race-history-list">' + (cs.raceHistory.map((row) =>
        '<div class="race-history-row"><span>' + new Date(row.time).toLocaleTimeString() + '</span><span>' + row.track + '</span><span>Winner: ' + row.winner + '</span><span>' + (row.owned.join(', ') || 'No owned cars') + '</span></div>'
      ).join("") || '<div class="muted">No races run yet.</div>') + '</div>';
    }
    const garage = el("car-garage");
    if (garage) {
      garage.innerHTML = '<div class="stable-grid">' + (cs.owned.map((car) =>
        '<div class="car-card"><div><strong>' + car.name + '</strong> <span class="muted">' + car.make + ' ' + car.model + ' (' + car.year + ')</span></div>' +
        conditionBar(car.condition) +
        '<div class="horse-stats"><div class="horse-stat">ENG <span>' + car.enginePower + '</span></div><div class="horse-stat">HAN <span>' + car.handling + '</span></div><div class="horse-stat">REL <span>' + car.reliability + '</span></div><div class="horse-stat">AERO <span>' + car.aerodynamics + '</span></div><div class="horse-stat">Fuel <span>' + car.fuel.toFixed(0) + '/' + car.fuelCapacity + '</span></div></div>' +
        '<div class="muted">Driver: ' + car.driver + ' • Wins: ' + car.wins + ' • Podiums: ' + car.podiums + ' • Races: ' + car.races + '</div>' +
        '<div class="muted">Tuning: Aggression ' + car.tuning.aggression + ' • Fuel Mode ' + car.tuning.fuelMode + ' • Upkeep ' + fmt(car.upkeepPerMin) + '/min</div>' +
        '<div class="car-upgrades">' + ['engine', 'tires', 'aero', 'chassis', 'fuel'].map((type) => '<div class="car-upgrade-slot">' + type + ': <span>' + car.upgrades[type] + '/5</span></div>').join('') + '</div>' +
        '<div class="horse-actions">' +
        '<button class="settings-btn" data-car-refuel="' + car.id + '">Refuel (' + fmt(Game.Gambling.refuelCarCost(car)) + ')</button>' +
        '<button class="settings-btn" data-car-repair="' + car.id + '">Repair (' + fmt(Game.Gambling.repairCarCost(car)) + ')</button>' +
        '<button class="settings-btn" data-car-fuelmode="' + car.id + '">Fuel Mode</button>' +
        '</div>' +
        '<div class="horse-actions">' + ['engine', 'tires', 'aero', 'chassis', 'fuel'].map((type) => '<button class="settings-btn" data-car-upgrade="' + car.id + '" data-upgrade-type="' + type + '">' + type + ' +' + ' (' + fmt(Game.Gambling.carUpgradeCost(car.upgrades[type])) + ')</button>').join('') + '</div>' +
        '<div class="horse-actions"><button class="settings-btn" data-car-aggression="' + car.id + '" data-aggr-delta="-10">Agg -10</button><button class="settings-btn" data-car-aggression="' + car.id + '" data-aggr-delta="10">Agg +10</button></div>' +
        '</div>'
      ).join("") || '<div class="muted">Buy cars from the market to enter the circuit.</div>') + '</div>';
      bindActionButtons(garage, "[data-car-refuel]", (btn) => { if (Game.Gambling.refuelCar(btn.dataset.carRefuel)) UI.updateRaceTrack(); });
      bindActionButtons(garage, "[data-car-repair]", (btn) => { if (Game.Gambling.repairCar(btn.dataset.carRepair)) UI.updateRaceTrack(); });
      bindActionButtons(garage, "[data-car-upgrade]", (btn) => { if (Game.Gambling.upgradeCar(btn.dataset.carUpgrade, btn.dataset.upgradeType)) UI.updateRaceTrack(); });
      bindActionButtons(garage, "[data-car-aggression]", (btn) => {
        const car = Game.state.cars.owned.find((entry) => entry.id === btn.dataset.carAggression);
        if (!car) return;
        const next = Math.max(0, Math.min(100, (car.tuning.aggression || 0) + parseInt(btn.dataset.aggrDelta, 10)));
        if (Game.Gambling.tuneCar(btn.dataset.carAggression, 'aggression', next)) UI.updateRaceTrack();
      });
      bindActionButtons(garage, "[data-car-fuelmode]", (btn) => {
        const car = Game.state.cars.owned.find((entry) => entry.id === btn.dataset.carFuelmode);
        if (!car) return;
        const next = car.tuning.fuelMode === 'eco' ? 'normal' : car.tuning.fuelMode === 'normal' ? 'push' : 'eco';
        if (Game.Gambling.tuneCar(car.id, 'fuelMode', next)) UI.updateRaceTrack();
      });
    }
    const market = el("car-market");
    if (market) {
      market.innerHTML = cs.market.map((car, index) =>
        '<div class="market-car-card"><div><strong>' + car.name + '</strong> <span class="muted">' + car.make + ' ' + car.model + ' (' + car.year + ')</span></div>' +
        '<div class="horse-stats"><div class="horse-stat">ENG <span>' + car.enginePower + '</span></div><div class="horse-stat">HAN <span>' + car.handling + '</span></div><div class="horse-stat">REL <span>' + car.reliability + '</span></div><div class="horse-stat">AERO <span>' + car.aerodynamics + '</span></div></div>' +
        '<div class="muted">Fuel ' + car.fuel + '/' + car.fuelCapacity + ' • Condition ' + car.condition + ' • Upkeep ' + fmt(car.upkeepPerMin) + '/min</div>' +
        '<button class="settings-btn" data-car-buy="' + index + '">Buy for ' + fmt(car.purchaseCost) + '</button></div>'
      ).join("") + '<div class="muted">Refresh in ' + Math.ceil(cs.marketRefreshIn) + 's</div>';
      bindActionButtons(market, "[data-car-buy]", (btn) => { if (Game.Gambling.buyCar(parseInt(btn.dataset.carBuy, 10))) UI.updateRaceTrack(); });
    }
  };

  /* ---------------------------------------------------------------------
     Achievements
     --------------------------------------------------------------------- */
  UI.buildAchievements = function () {
    const grid = el("achievement-grid");
    grid.innerHTML = "";
    UI._achCards = {};
    cfg.achievements.forEach((a) => {
      const card = make("div", "achievement-card locked");
      card.innerHTML =
        '<div class="ach-name">' + a.name + "</div>" +
        '<div class="ach-desc">' + a.desc + "</div>" +
        '<div class="ach-bonus">+' + Math.round(a.bonus * 100) + "% production</div>" +
        '<div class="progress-bar"><div class="progress-fill" data-fill></div></div>';
      grid.appendChild(card);
      UI._achCards[a.id] = { card, fill: card.querySelector("[data-fill]") };
    });
    built.achievements = true;
  };

  UI.updateAchievements = function () {
    if (!built.achievements) return;
    cfg.achievements.forEach((a) => {
      const c = UI._achCards[a.id];
      const unlocked = !!Game.state.achievements[a.id];
      c.card.classList.toggle("locked", !unlocked);
      c.card.classList.toggle("unlocked", unlocked);
      c.fill.style.width = (Game.Achievements.progress(a) * 100).toFixed(1) + "%";
    });
    el("achievement-count").textContent = Game.Achievements.count() + " / " + cfg.achievements.length;
  };

  /* ---------------------------------------------------------------------
     Milestones
     --------------------------------------------------------------------- */
  UI.buildMilestones = function () {
    const list = el("milestone-list");
    list.innerHTML = "";
    UI._msRows = {};
    cfg.milestones.forEach((m) => {
      const row = make("div", "milestone-row locked");
      row.innerHTML =
        '<div class="ms-info"><div class="ms-name">' + m.name + "</div>" +
        '<div class="ms-desc">' + m.desc + '</div></div>' +
        '<div class="ms-bonus">+' + Math.round(m.bonus * 100) + "% CPS</div>" +
        '<div class="progress-bar wide"><div class="progress-fill" data-fill></div></div>';
      list.appendChild(row);
      UI._msRows[m.id] = { row, fill: row.querySelector("[data-fill]") };
    });
    built.milestones = true;
  };

  UI.updateMilestones = function () {
    if (!built.milestones) return;
    cfg.milestones.forEach((m) => {
      const r = UI._msRows[m.id];
      const unlocked = !!Game.state.milestones[m.id];
      r.row.classList.toggle("locked", !unlocked);
      r.row.classList.toggle("unlocked", unlocked);
      r.fill.style.width = (Game.Milestones.progress(m) * 100).toFixed(1) + "%";
    });
    el("milestone-count").textContent = Game.Milestones.count() + " / " + cfg.milestones.length;
  };

  /* ---------------------------------------------------------------------
     Prestige tab
     --------------------------------------------------------------------- */
  UI.updatePrestige = function () {
    const s = Game.state;
    const DEFAULT_PRESTIGE_GAIN = 1;
    const DEFAULT_EFFECTIVENESS_MULTIPLIER = 1;
    // Prevent division-by-zero/Infinity when modifiers temporarily reduce gain multipliers to 0.
    const MIN_PRESTIGE_GAIN_MULT = 0.000001;
    const fmtCeiledInt = (value) => Math.max(0, Math.ceil(value)).toLocaleString("en-US");
    const mult = s._mult || Game.computeMultipliers();
    const prestigeGain = mult.prestigeGain || DEFAULT_PRESTIGE_GAIN;
    // GAIN_EFFECTIVENESS scales gains (resources/progression), while BONUS_EFFECTIVENESS scales bonus potency.
    const gainEffectiveness = cfg.GAIN_EFFECTIVENESS_MULT || DEFAULT_EFFECTIVENESS_MULTIPLIER;
    const gainMult = Math.max(MIN_PRESTIGE_GAIN_MULT, prestigeGain * gainEffectiveness);
    // Derived from Game.potentialPrestige(): potential = floor(sqrt(lifetime / required) * gainMult).
    // Solving for the first prestige (potential >= 1) gives required = PRESTIGE_REQUIRED_COINS / (gainMult^2).
    const prestigeTarget = cfg.PRESTIGE_REQUIRED_COINS / Math.pow(gainMult, 2);
    const prestigeProgress = prestigeTarget > 0 ? Math.min(1, s.lifetimeCoins / prestigeTarget) : 1;
    const remainingToPrestige = Math.max(0, prestigeTarget - s.lifetimeCoins);
    el("prestige-current-pp").textContent = fmt(s.prestigePoints);
    el("prestige-lifetime-pp").textContent = fmt(s.lifetimePrestigePoints);
    el("prestige-potential").textContent = fmt(Game.Prestige.potential());
    el("prestige-mult").textContent = "+" + fmt(s.prestigePoints * cfg.PRESTIGE_PER_POINT_MULT * (cfg.BONUS_EFFECTIVENESS_MULT || 1) * 100) + "%";
    el("prestige-progress-text").textContent =
      `Progress to Prestige: ${fmtCeiledInt(s.lifetimeCoins)} / ${fmtCeiledInt(prestigeTarget)} lifetime coins (${fmtCeiledInt(remainingToPrestige)} left)`;
    el("prestige-progress-fill").style.width = (prestigeProgress * 100).toFixed(1) + "%";

    el("prestige-count").textContent = fmt(s.stats.prestigeCount);
    el("ascension-count").textContent = fmt(s.stats.ascensionCount);

    el("research-reset-info").textContent =
      "You have " + fmt(s.prestigePoints) + " PP. Spend " + cfg.RESEARCH_RESET_PP_COST +
      " PP to gain " + fmt(cfg.RESEARCH_RESET_RP_GAIN * (cfg.GAIN_EFFECTIVENESS_MULT || 1)) + " RP.";

    el("ascension-current-shards").textContent = fmt(s.ascensionShards);
    el("ascension-mult").textContent = "+" + fmt(s.ascensionShards * cfg.ASCENSION_PER_SHARD_MULT * (cfg.BONUS_EFFECTIVENESS_MULT || 1) * 100) + "%";
    el("ascension-potential").textContent = fmt(Game.Prestige.potentialShards());
    const ppPerShard = cfg.ASCENSION_REQUIRED_PP / (cfg.GAIN_EFFECTIVENESS_MULT || 1);
    el("ascension-req").textContent =
      "Requires about " + fmt(ppPerShard) + " PP per shard. You have " + fmt(s.prestigePoints) + " PP.";

    setBtn(el("btn-prestige"), Game.Prestige.canPrestige());
    setBtn(el("btn-research-reset"), Game.Prestige.canResearchReset());
    setBtn(el("btn-ascend"), Game.Prestige.canAscend());

    // Layer 4 — Empire Legacy
    const legacyPotential = Game.Prestige.potentialLegacies ? Game.Prestige.potentialLegacies() : 0;
    el("empire-current-el").textContent  = fmt(s.empireLegacies || 0);
    el("empire-lifetime-el").textContent = fmt(s.lifetimeEmpireLegacies || 0);
    el("empire-mult").textContent = "+" + fmt((s.empireLegacies || 0) * cfg.EMPIRE_PER_LEGACY_MULT * (cfg.BONUS_EFFECTIVENESS_MULT || 1) * 100) + "%";
    el("empire-count").textContent = fmt(s.stats.empireCount || 0);
    el("empire-potential").textContent = fmt(legacyPotential);
    el("empire-req").textContent = "Requires " + fmt(cfg.EMPIRE_REQUIRED_SHARDS) + " Ascension Shards per Legacy. You have " + fmt(s.ascensionShards) + " Shards.";
    setBtn(el("btn-empire"), Game.Prestige.canEmpire && Game.Prestige.canEmpire());

    // Layer 5 — Time Fragments
    const fragPotential = Game.Prestige.potentialFragments ? Game.Prestige.potentialFragments() : 0;
    el("time-current-tf").textContent  = fmt(s.timeFragments || 0);
    el("time-lifetime-tf").textContent = fmt(s.lifetimeTimeFragments || 0);
    el("time-mult").textContent = "+" + fmt((s.timeFragments || 0) * cfg.TIME_PER_FRAGMENT_MULT * (cfg.BONUS_EFFECTIVENESS_MULT || 1) * 100) + "%";
    el("time-count").textContent = fmt(s.stats.timeCount || 0);
    el("time-potential").textContent = fmt(fragPotential);
    el("time-req").textContent = "Requires " + fmt(cfg.TIME_REQUIRED_LEGACIES) + " Empire Legacies per Fragment. You have " + fmt(s.empireLegacies || 0) + " Legacies.";
    setBtn(el("btn-timerift"), Game.Prestige.canTimeRift && Game.Prestige.canTimeRift());

    // Layer 6 — Reality Cores
    const corePotential = Game.Prestige.potentialCores ? Game.Prestige.potentialCores() : 0;
    el("reality-current-rc").textContent  = fmt(s.realityCores || 0);
    el("reality-lifetime-rc").textContent = fmt(s.lifetimeRealityCores || 0);
    el("reality-mult").textContent = "+" + fmt((s.realityCores || 0) * cfg.REALITY_PER_CORE_MULT * (cfg.BONUS_EFFECTIVENESS_MULT || 1) * 100) + "%";
    el("reality-count").textContent = fmt(s.stats.realityCount || 0);
    el("reality-potential").textContent = fmt(corePotential);
    el("reality-req").textContent = "Requires " + fmt(cfg.REALITY_REQUIRED_FRAGMENTS) + " Time Fragments per Core. You have " + fmt(s.timeFragments || 0) + " Fragments.";
    setBtn(el("btn-realitycollapse"), Game.Prestige.canRealityCollapse && Game.Prestige.canRealityCollapse());

    UI.updatePrestigePaths();
    UI.updateActiveAbilities();
    UI.updateTalents();
    UI.updateGodsTitans();
  };

  /* -----------------------------------------------------------------
     Prestige Path cards
     ----------------------------------------------------------------- */
  UI.buildPrestigePaths = function () {
    const container = el("prestige-path-list");
    if (!container) return;
    container.innerHTML = "";
    cfg.prestigePaths.forEach(function (p) {
      const card = make("div", "prestige-path-card" + (Game.state.prestigePath === p.id ? " selected" : ""));
      card.dataset.pathId = p.id;
      card.innerHTML =
        '<div class="path-icon">' + p.icon + "</div>" +
        '<div class="path-name">' + p.name + "</div>" +
        '<div class="path-short">' + p.shortDesc + "</div>" +
        '<div class="path-desc">' + p.desc + "</div>";
      card.addEventListener("click", function () {
        Game.Prestige.setPrestigePath(p.id);
        UI.buildPrestigePaths();
        UI.updatePrestigePaths();
      });
      container.appendChild(card);
    });
  };

  UI.updatePrestigePaths = function () {
    const s = Game.state;
    const nameEl = el("prestige-path-name");
    if (nameEl) {
      if (s.prestigePath && cfg.prestigePathMap[s.prestigePath]) {
        const p = cfg.prestigePathMap[s.prestigePath];
        nameEl.textContent = p.icon + " " + p.name;
      } else {
        nameEl.textContent = "None";
      }
    }
    const container = el("prestige-path-list");
    if (!container) return;
    container.querySelectorAll(".prestige-path-card").forEach(function (card) {
      card.classList.toggle("selected", card.dataset.pathId === s.prestigePath);
    });
  };

  /* -----------------------------------------------------------------
     Active Abilities
     ----------------------------------------------------------------- */
  UI.buildActiveAbilities = function () {
    const container = el("active-ability-list");
    if (!container) return;
    container.innerHTML = "";
    cfg.activeAbilities.forEach(function (ab) {
      const row = make("div", "ability-row");
      row.dataset.abilityId = ab.id;
      row.innerHTML =
        '<div class="ability-icon">' + ab.icon + "</div>" +
        '<div class="ability-info">' +
          '<div class="ability-name">' + ab.name + "</div>" +
          '<div class="ability-desc">' + ab.desc + "</div>" +
          '<div class="ability-meta" data-meta>' + ab.duration + "s • " + ab.cooldown + "s cooldown</div>" +
        "</div>" +
        '<div><button class="settings-btn ability-btn" data-btn>' + "Activate" + "</button></div>";
      const btn = row.querySelector("[data-btn]");
      btn.addEventListener("click", function () {
        UI.activateAbility(ab.id);
      });
      container.appendChild(row);
    });
  };

  UI.updateActiveAbilities = function () {
    const container = el("active-ability-list");
    if (!container) return;
    if (!container.children.length) UI.buildActiveAbilities();
    const s = Game.state;
    const nowSec = Date.now() / 1000;
    cfg.activeAbilities.forEach(function (ab) {
      const row = container.querySelector('[data-ability-id="' + ab.id + '"]');
      if (!row) return;
      // Unlock check
      const unlocked = UI._abilityUnlocked(ab, s);
      row.classList.toggle("locked", !unlocked);

      const abState = s.abilities && s.abilities[ab.id] ? s.abilities[ab.id] : {};
      const isActive = abState.activeEnd && nowSec < abState.activeEnd;
      const onCooldown = !isActive && abState.cooldownEnd && nowSec < abState.cooldownEnd;
      const ready = unlocked && !isActive && !onCooldown;

      const btn = row.querySelector("[data-btn]");
      btn.disabled = !ready;
      btn.classList.toggle("disabled", !ready);

      const meta = row.querySelector("[data-meta]");
      if (!unlocked) {
        btn.textContent = "Locked";
        if (meta) meta.innerHTML = '<span class="ability-unlock-hint">Unlock: ' + ab.unlockKey + " ≥ " + ab.unlockValue + "</span>";
      } else if (isActive) {
        btn.textContent = "Active";
        if (meta) meta.innerHTML = '<span class="ability-status-active">Active ' + Math.ceil(abState.activeEnd - nowSec) + "s</span>";
      } else if (onCooldown) {
        btn.textContent = "Cooldown";
        if (meta) meta.innerHTML = '<span class="ability-status-cooldown">Cooldown ' + Math.ceil(abState.cooldownEnd - nowSec) + "s</span>";
      } else {
        btn.textContent = "Activate";
        if (meta) meta.textContent = ab.duration + "s • " + ab.cooldown + "s cooldown";
      }
    });
  };

  UI._abilityUnlocked = function (ab, s) {
    const key = ab.unlockKey;
    const val = ab.unlockValue;
    if (!key) return true;
    let cur = 0;
    if (key === "prestigeCount")      cur = s.stats.prestigeCount || 0;
    else if (key === "ascensionShards") cur = s.ascensionShards || 0;
    else if (key === "researchCompleted") cur = s.stats.researchCompleted || 0;
    else if (key === "empireLegacies") cur = s.empireLegacies || 0;
    else cur = s[key] || (s.stats && s.stats[key]) || 0;
    return cur >= val;
  };

  UI.activateAbility = function (id) {
    const ab = cfg.activeAbilityMap[id];
    if (!ab) return;
    const s = Game.state;
    if (!UI._abilityUnlocked(ab, s)) return;
    if (!s.abilities) s.abilities = {};
    const nowSec = Date.now() / 1000;
    const abState = s.abilities[id] || {};
    if (abState.activeEnd && nowSec < abState.activeEnd) return;
    if (abState.cooldownEnd && nowSec < abState.cooldownEnd) return;
    s.abilities[id] = {
      activeEnd: nowSec + ab.duration,
      cooldownEnd: nowSec + ab.duration + ab.cooldown,
    };
    s.stats.powersActivated = (s.stats.powersActivated || 0) + 1;
    Game.recalculate();
    UI.toast(ab.icon + " " + ab.name + " activated! " + ab.flavor, "success");
    UI.update();
  };

  /* -----------------------------------------------------------------
     Mega Projects
     ----------------------------------------------------------------- */
  UI.buildMegaProjects = function () {
    const container = el("megaproject-list");
    if (!container) return;
    container.innerHTML = "";
    cfg.megaProjects.forEach(function (proj) {
      const card = make("div", "megaproject-card");
      card.dataset.projId = proj.id;
      const costsHtml = Object.entries(proj.costs || {}).map(function ([k, v]) {
        const label = k === "coins" ? "Coins" :
                      k === "researchPoints" ? "Research Points" :
                      k === "ascensionShards" ? "Ascension Shards" :
                      k === "empireLegacies" ? "Empire Legacies" :
                      k === "timeFragments" ? "Time Fragments" :
                      k === "realityCores" ? "Reality Cores" : k;
        return label + ": <span>" + fmt(v) + "</span>";
      }).join(" • ");
      card.innerHTML =
        '<div class="megaproject-header">' +
          '<div class="megaproject-icon">' + proj.icon + "</div>" +
          '<div class="megaproject-name">' + proj.name + "</div>" +
        "</div>" +
        '<div class="megaproject-desc">' + proj.desc + "</div>" +
        '<div class="megaproject-reward">✅ ' + proj.reward + "</div>" +
        '<div class="megaproject-costs">Cost: ' + costsHtml + "</div>" +
        '<div class="megaproject-progress"><div class="megaproject-progress-fill" data-fill style="width:0%"></div></div>' +
        '<div data-action></div>';
      container.appendChild(card);
    });
  };

  UI.updateMegaProjects = function () {
    const container = el("megaproject-list");
    if (!container) return;
    if (!container.children.length) UI.buildMegaProjects();
    cfg.megaProjects.forEach(function (proj) {
      const card = container.querySelector('[data-proj-id="' + proj.id + '"]');
      if (!card) return;
      const done = Game.MegaProjects && Game.MegaProjects.completed(proj.id);
      const canAfford = Game.MegaProjects && Game.MegaProjects.canAfford(proj.id);
      card.classList.toggle("completed", !!done);
      card.classList.toggle("affordable", !done && !!canAfford);
      const fill = card.querySelector("[data-fill]");
      if (fill) fill.style.width = (Game.MegaProjects ? Game.MegaProjects.progress(proj.id) * 100 : 0).toFixed(1) + "%";
      const action = card.querySelector("[data-action]");
      if (!action) return;
      action.innerHTML = "";
      if (done) {
        action.innerHTML = '<span class="megaproject-complete-badge">🏆 Completed!</span>';
      } else {
        const btn = make("button", "settings-btn megaproject-btn" + (canAfford ? "" : " disabled"), "Fund Project");
        btn.disabled = !canAfford;
        btn.addEventListener("click", function () {
          if (Game.MegaProjects && Game.MegaProjects.purchase(proj.id)) UI.update();
        });
        action.appendChild(btn);
      }
    });
  };

  UI.updateGodsTitans = function () {
    const list = el("god-titan-list");
    const count = el("god-titan-count");
    if (!list || !count) return;
    const purchased = cfg.godsTitans.filter((gt) => Game.Prestige.godTitanPurchased(gt.id)).length;
    count.textContent = purchased + " / " + cfg.godsTitans.length + " unlocked";
    list.innerHTML = "";

    cfg.godsTitans.forEach((gt) => {
      const owned = Game.Prestige.godTitanPurchased(gt.id);
      const available = Game.Prestige.godTitanAvailable(gt.id);
      const canAfford = Game.Prestige.canAffordGodTitan(gt.id);
      const card = make("div", "talent-card" + (owned ? " purchased" : available ? "" : " locked"));

      let actionText = "";
      if (owned) actionText = "Unlocked";
      else if (!available) actionText = "Requires previous God/Titan";
      else if (canAfford) actionText = "Buy for " + fmt(gt.cost) + " Shards";
      else actionText = "Need " + fmt(gt.cost) + " Shards";

      card.innerHTML =
        '<div class="talent-header"><span class="talent-name">' + gt.name + "</span>" +
        '<span class="talent-branch">God/Titan</span></div>' +
        '<div class="talent-desc">' + gt.desc + "</div>" +
        '<button class="talent-buy-btn ' + (owned || !canAfford ? "disabled" : "") + '">' + actionText + "</button>";

      const btn = card.querySelector("button");
      btn.disabled = owned || !canAfford;
      btn.addEventListener("click", () => {
        if (Game.Prestige.buyGodTitan(gt.id)) UI.update();
      });
      list.appendChild(card);
    });
  };

  UI.updateTalents = function () {
    const s = Game.state;
    const list = el("talent-list");
    const powerList = el("talent-power-list");
    const count = el("talent-count");
    if (!list || !powerList || !count || !Game.Talents) return;

    const purchased = Game.Talents.totalPurchased();
    count.textContent = purchased + " / " + cfg.talents.length + " Talents";

    list.innerHTML = "";
    cfg.talents.forEach((t) => {
      const owned = Game.Talents.purchased(t.id);
      const available = Game.Talents.available(t.id);
      const canAfford = Game.Talents.canAfford(t.id);
      const card = make("div", "talent-card" + (owned ? " purchased" : available ? "" : " locked"));

      let actionText = "";
      if (owned) actionText = "Purchased";
      else if (!available) actionText = "Requires previous talent";
      else if (canAfford) actionText = "Buy for " + fmt(t.cost) + " PP";
      else actionText = "Need " + fmt(t.cost) + " PP";

      card.innerHTML =
        '<div class="talent-header"><span class="talent-name">' + t.name + "</span>" +
        '<span class="talent-branch">' + t.branch + "</span></div>" +
        '<div class="talent-desc">' + t.desc + "</div>" +
        '<button class="talent-buy-btn ' + (owned || !canAfford ? "disabled" : "") + '">' + actionText + "</button>";

      const btn = card.querySelector("button");
      btn.disabled = owned || !canAfford;
      btn.addEventListener("click", () => {
        if (Game.Talents.buy(t.id)) UI.update();
      });
      list.appendChild(card);
    });

    const activeMap = {};
    Game.Talents.activePowers().forEach((p) => {
      activeMap[p.id] = p.remaining;
    });

    powerList.innerHTML = "";
    const powers = cfg.talents.filter((t) => t.type === "power" && Game.Talents.purchased(t.id));
    if (!powers.length) {
      powerList.appendChild(make("div", "empty-note", "Purchase power talents to unlock abilities."));
      return;
    }

    powers.forEach((p) => {
      const activeRemaining = activeMap[p.powerId] || 0;
      const cooldown = Game.Talents.cooldownRemaining(p.powerId);
      const ready = Game.Talents.canActivate(p.powerId);
      const row = make("div", "talent-power-row");

      let status = "Ready";
      if (activeRemaining > 0) status = "Active " + Math.ceil(activeRemaining) + "s";
      else if (cooldown > 0) status = "Cooldown " + Math.ceil(cooldown) + "s";

      row.innerHTML =
        '<div class="talent-power-info">' +
        '<div class="talent-power-name">' + p.name + "</div>" +
        '<div class="talent-power-meta">' + Math.ceil(p.duration) + "s duration • " + Math.ceil(p.cooldown) + "s cooldown • " + status + "</div>" +
        '<div class="talent-power-desc">' + p.desc + "</div>" +
        "</div>" +
        '<button class="talent-power-btn ' + (ready ? "" : "disabled") + '">Activate</button>';
      const btn = row.querySelector("button");
      btn.disabled = !ready;
      btn.addEventListener("click", () => {
        if (Game.Talents.activate(p.powerId)) UI.update();
      });
      powerList.appendChild(row);
    });
  };

  function setBtn(btn, enabled) {
    if (!btn) return;
    btn.classList.toggle("disabled", !enabled);
    btn.disabled = !enabled;
  }

  /* ---------------------------------------------------------------------
     Statistics
     --------------------------------------------------------------------- */
  UI.updateStatistics = function () {
    const s = Game.state;
    const stats = s.stats;
    const { happiness, happinessMult } = getDiplomacyStats(s);
    const happinessEffect = ((happinessMult - 1) * 100).toFixed(1);
    const rows = [
      ["Total Coins Earned (lifetime)", fmt(stats.totalCoinsEarned)],
      ["Current Coins", fmt(s.coins)],
      ["Total Coins Spent", fmt(stats.totalCoinsSpent)],
      ["Coins Per Second", fmt(s._cps)],
      ["Research Per Second", fmt(s._rps)],
      ["Click Value", fmt(s._clickValue)],
      ["Total Clicks", fmt(stats.totalClicks)],
      ["Total Buildings Owned", fmt(Game.Buildings.totalOwned())],
      ["Total Sub-buildings", fmt(cfg.subBuildings.reduce((sum, sb) => sum + (s.subBuildings[sb.id] || 0), 0))],
      ["Upgrades Purchased", fmt(Object.keys(s.upgrades).filter((k) => s.upgrades[k]).length) + " / 108"],
      ["Research Completed", fmt(stats.researchCompleted) + " / 80"],
      ["Diplomatic Actions", fmt(stats.diplomaticActions || 0)],
      ["Diplomacy Coins Earned", fmt(stats.diplomacyCoins || 0)],
      ["Diplomacy RP Gained", fmt(stats.diplomacyResearch || 0)],
      ["Population (Workers Hired)", fmt(s.population || 0)],
      ["Population Happiness", happiness + " / 100 (" + (parseFloat(happinessEffect) >= 0 ? "+" : "") + happinessEffect + "% CPS)"],
      ["Talents Purchased", fmt(stats.talentsPurchased || 0) + " / " + cfg.talents.length],
      ["Skill Nodes Purchased", fmt(stats.skillNodesPurchased || 0) + " / " + cfg.skillTreeNodes.length],
      ["Talent Powers Used", fmt(stats.powersActivated || 0)],
      ["Bitcoin Holdings", fmt(s.btc)],
      ["BTC Price", fmt(s.btcPrice)],
      ["Lifetime BTC Mined", fmt(stats.totalBtcMined || 0)],
      ["BTC Sold", fmt(stats.totalBtcSold || 0)],
      ["Manual BTC Mined", fmt(stats.totalManualBtcMined || 0)],
      ["Energy", fmt(s.energy) + " / " + fmt(s.energyCap)],
      ["Energy Generated", fmt(stats.totalEnergyGenerated || 0)],
      ["Energy Spent", fmt(stats.totalEnergySpent || 0)],
      ["Manual Energy Collected", fmt(stats.totalEnergyCollected || 0)],
      ["Coin Farmer Rate", fmt(Game.Bitcoin ? Game.Bitcoin.coinFarmerRate() : 0)],
      ["Portfolio Value", fmt(Game.Stocks ? Game.Stocks.portfolioValue() : 0)],
      ["Casino Chips", fmt((s.gambling && s.gambling.chips) || 0)],
      ["Casino Net Chips", fmt(((s.gambling && s.gambling.totalChipsWon) || 0) - ((s.gambling && s.gambling.totalChipsLost) || 0))],
      ["Horse Track Winnings", fmt((s.horses && s.horses.totalWinnings) || 0)],
      ["Horse Track Losses", fmt((s.horses && s.horses.totalLosses) || 0)],
      ["Race Track Winnings", fmt((s.cars && s.cars.totalWinnings) || 0)],
      ["Race Track Losses", fmt((s.cars && s.cars.totalLosses) || 0)],
      ["Prestige Points", fmt(s.prestigePoints)],
      ["Lifetime Prestige Points", fmt(s.lifetimePrestigePoints)],
      ["Prestige Count", fmt(stats.prestigeCount)],
      ["Research Points", fmt(s.researchPoints)],
      ["Ascension Shards", fmt(s.ascensionShards)],
      ["Gods/Titans Unlocked", fmt(cfg.godsTitans.filter((gt) => s.godsTitans[gt.id]).length) + " / " + cfg.godsTitans.length],
      ["Ascension Count", fmt(stats.ascensionCount)],
      ["Achievements", Game.Achievements.count() + " / " + cfg.achievements.length],
      ["Milestones", Game.Milestones.count() + " / " + cfg.milestones.length],
      ["Events Triggered", fmt(stats.eventsTriggered)],
      ["Offline Earnings (total)", fmt(stats.offlineEarnings)],
      ["Play Time", Game.formatTime(stats.playTime)],
    ];
    const perBuilding = cfg.buildings
      .map((b) => [b.name + " owned", fmt(s.buildings[b.id] || 0)]);
    const all = rows.concat([["— Buildings —", ""]]).concat(perBuilding);
    const container = el("statistics-list");
    container.innerHTML = "";
    all.forEach(([k, v]) => {
      const r = make("div", "stat-row");
      r.innerHTML = '<span class="stat-key">' + k + '</span><span class="stat-val">' + v + "</span>";
      container.appendChild(r);
    });
  };

  /* ---------------------------------------------------------------------
     Settings
     --------------------------------------------------------------------- */
  UI.wireSettings = function () {
    el("btn-save").addEventListener("click", () => {
      Game.Save.save();
      UI.toast("Game saved.", "success");
    });
    el("btn-export").addEventListener("click", () => {
      const str = Game.Save.exportSave();
      el("save-string").value = str;
      el("save-string").select();
      UI.toast("Save exported to text box. Copy it!", "info");
    });
    el("btn-import").addEventListener("click", () => {
      const str = el("save-string").value;
      if (!str.trim()) {
        UI.toast("Paste a save string first.", "error");
        return;
      }
      if (Game.Save.importSave(str)) {
        UI.toast("Save imported!", "success");
        UI.rebuildAll();
        UI.update();
      } else {
        UI.toast("Import failed — invalid save string.", "error");
      }
    });
    el("btn-hardreset").addEventListener("click", () => {
      if (confirm("Hard reset will DELETE all progress permanently. Continue?")) {
        Game.Save.hardReset();
        UI.rebuildAll();
        UI.update();
        UI.toast("Game reset to defaults.", "info");
      }
    });
    const notif = el("toggle-notifications");
    notif.checked = Game.state.settings.notifications;
    notif.addEventListener("change", () => {
      Game.state.settings.notifications = notif.checked;
    });
  };

  UI.rebuildAll = function () {
    UI.buildBuildingList();
    UI.buildCasino();
    UI.buildHorseTrack();
    UI.buildRaceTrack();
    UI.updateResearch();
    UI.updateAutomation();
    const notif = el("toggle-notifications");
    if (notif) notif.checked = Game.state.settings.notifications;
  };

  /* ---------------------------------------------------------------------
     Main per-frame update
     --------------------------------------------------------------------- */
  UI.update = function () {
    const s = Game.state;
    if (Game.Bitcoin && Game.Bitcoin.energyCap) s.energyCap = Game.Bitcoin.energyCap();
    refs.coins.textContent = fmt(s.coins);
    refs.cps.textContent = fmt(s._cps) + " / sec";
    refs.clickValue.textContent = "+" + fmt(s._clickValue) + " / click";

    // Conditional resource displays
    toggleWrap(refs.ppWrap, s.prestigePoints > 0 || s.lifetimePrestigePoints > 0 || Game.Prestige.canPrestige());
    toggleWrap(refs.rpWrap, s.researchPoints > 0 || s.stats.researchCompleted > 0 || (s.buildings.laboratory || 0) > 0);
    toggleWrap(refs.asWrap, s.ascensionShards > 0 || s.stats.ascensionCount > 0);
    toggleWrap(refs.btcWrap, s.btc > 0 || (s.stats.totalBtcMined || 0) > 0 || Object.values(s.btcMiners || {}).some((v) => v > 0));
    toggleWrap(refs.energyWrap, s.energy > 0 || Object.values(s.energyProducers || {}).some((v) => v > 0) || Object.values(s.btcMiners || {}).some((v) => v > 0) || Object.values(s.coinFarmers || {}).some((v) => v > 0) || Object.values(s.batteries || {}).some((v) => v > 0));

    // New meta layers
    const hasEL = (s.empireLegacies || 0) > 0 || (s.lifetimeEmpireLegacies || 0) > 0;
    const hasTF = (s.timeFragments  || 0) > 0 || (s.lifetimeTimeFragments  || 0) > 0;
    const hasRC = (s.realityCores   || 0) > 0 || (s.lifetimeRealityCores   || 0) > 0;
    toggleWrap(refs.elWrap, hasEL);
    toggleWrap(refs.tfWrap, hasTF);
    toggleWrap(refs.rcWrap, hasRC);
    if (refs.el) refs.el.textContent = fmt(s.empireLegacies || 0);
    if (refs.tf) refs.tf.textContent = fmt(s.timeFragments  || 0);
    if (refs.rc) refs.rc.textContent = fmt(s.realityCores   || 0);

    // Cycle display (show after first prestige)
    const showCycle = s.stats.prestigeCount > 0;
    toggleWrap(refs.cycleWrap, showCycle);
    if (showCycle && Game.Cycles) {
      const cyc = Game.Cycles.current();
      const rem = Math.ceil(Game.Cycles.timeRemaining());
      if (refs.cycleDisplay) refs.cycleDisplay.textContent = (cyc ? cyc.icon + " " + cyc.name : "Stable") + " — " + rem + "s";
    }

    // Population tracker (show once any workers have been hired)
    const population = s.population || 0;
    toggleWrap(refs.populationWrap, population > 0);
    if (refs.population) refs.population.textContent = fmt(population);

    // Happiness (show once an empire county has been chosen)
    const hasEmpire = !!(s.map && s.map.selectedCounty);
    toggleWrap(refs.happinessWrap, hasEmpire);
    if (refs.happiness && hasEmpire) {
      const { happiness: hval } = getDiplomacyStats(s);
      const hEmoji = Game.happinessEmoji(hval);
      refs.happiness.textContent = hEmoji + " " + hval + " / 100";
    }

    refs.pp.textContent = fmt(s.prestigePoints);
    refs.rp.textContent = fmt(s.researchPoints);
    refs.as.textContent = fmt(s.ascensionShards);
    refs.btc.textContent = fmt(s.btc);
    refs.energy.textContent = fmt(s.energy) + " / " + fmt(s.energyCap);

    UI.updateActiveEvents();

    switch (currentTab) {
      case "economy":
        UI.updateBuildings();
        break;
      case "research":
        UI.updateResearch();
        break;
      case "automation":
        UI.updateAutomation();
        break;
      case "skilltrees":
        UI.updateSkillTrees();
        break;
      case "bitcoin":
        UI.updateBitcoin();
        break;
      case "stocks":
        UI.updateStocks();
        break;
      case "casino":
        UI.updateCasino();
        break;
      case "horsetrack":
        UI.updateHorseTrack();
        break;
      case "racetrack":
        UI.updateRaceTrack();
        break;
      case "achievements":
        UI.updateAchievements();
        break;
      case "milestones":
        UI.updateMilestones();
        break;
      case "prestige":
        UI.updatePrestige();
        break;
      case "megaprojects":
        UI.updateMegaProjects();
        break;
      case "statistics":
        UI.updateStatistics();
        break;
    }
  };

  function toggleWrap(wrap, show) {
    if (wrap) wrap.style.display = show ? "" : "none";
  }

  UI.updateActiveEvents = function () {
    const list = Game.Events.activeList();
    const container = refs.activeEvents;
    if (!container) return;
    container.innerHTML = "";
    list.forEach((e) => {
      if (!e.def) return;
      const chip = make("div", "event-chip", e.def.name + " — " + Math.ceil(e.remaining) + "s");
      chip.style.borderColor = e.def.color;
      chip.style.color = e.def.color;
      container.appendChild(chip);
    });
  };

  /* ---------------------------------------------------------------------
     Visual feedback: toasts, click floats, event banners
     --------------------------------------------------------------------- */
  UI.toast = function (msg, type) {
    if (!Game.state.settings.notifications && type === "info") return;
    const t = make("div", "toast toast-" + (type || "info"), msg);
    refs.toastContainer.appendChild(t);
    setTimeout(() => t.classList.add("show"), 10);
    setTimeout(() => {
      t.classList.remove("show");
      setTimeout(() => t.remove(), 400);
    }, 3200);
  };

  UI.eventBanner = function (def) {
    const banner = refs.eventBanner;
    banner.textContent = def.name + " — " + def.desc;
    banner.style.background = def.color;
    banner.classList.add("show");
    setTimeout(() => banner.classList.remove("show"), 4000);
  };

  UI.spawnClickFloat = function (e, value) {
    const float = make("div", "click-float", "+" + fmt(value));
    const rect = refs.coinButton.getBoundingClientRect();
    const x = (e.clientX || rect.left + rect.width / 2) - rect.left;
    const y = (e.clientY || rect.top + rect.height / 2) - rect.top;
    float.style.left = x + "px";
    float.style.top = y + "px";
    refs.coinButton.parentElement.appendChild(float);
    setTimeout(() => float.remove(), 900);
  };

  function pulse(node) {
    node.classList.remove("pulse");
    void node.offsetWidth;
    node.classList.add("pulse");
  }

  function autoFlash(node) {
    node.classList.remove("auto-flash");
    void node.offsetWidth; // force reflow so animation restarts
    node.classList.add("auto-flash");
    setTimeout(() => node.classList.remove("auto-flash"), 350);
  }

  const AUTO_CLICK_VISUAL_THROTTLE_MS = 120; // ~8 visuals/sec max
  let _lastAutoClickVisual = 0;
  UI.autoClickVisual = function (value) {
    const now = Date.now();
    if (now - _lastAutoClickVisual < AUTO_CLICK_VISUAL_THROTTLE_MS) return;
    _lastAutoClickVisual = now;
    autoFlash(refs.coinButton);
    const rect = refs.coinButton.getBoundingClientRect();
    UI.spawnClickFloat(
      { clientX: rect.left + rect.width / 2, clientY: rect.top + rect.height / 2 },
      value
    );
  };

  /* Prestige/ascension action buttons (wired after DOM ready) */
  UI.wirePrestigeButtons = function () {
    el("btn-prestige").addEventListener("click", () => {
      if (Game.Prestige.prestige()) UI.update();
    });
    el("btn-research-reset").addEventListener("click", () => {
      if (Game.Prestige.researchReset()) UI.update();
    });
    el("btn-ascend").addEventListener("click", () => {
      if (Game.Prestige.ascend()) {
        UI.rebuildAll();
        UI.update();
      }
    });
    el("btn-empire").addEventListener("click", () => {
      if (Game.Prestige.empire()) {
        UI.rebuildAll();
        UI.update();
      }
    });
    el("btn-timerift").addEventListener("click", () => {
      if (Game.Prestige.timeRift()) {
        UI.rebuildAll();
        UI.update();
      }
    });
    el("btn-realitycollapse").addEventListener("click", () => {
      if (Game.Prestige.realityCollapse()) {
        UI.rebuildAll();
        UI.update();
      }
    });
  };

  /* ---------------------------------------------------------------------
     Offline popup
     --------------------------------------------------------------------- */
  UI.showOffline = function (data) {
    const popup = el("offline-popup");
    el("offline-time").textContent = Game.formatTime(data.seconds);
    el("offline-coins").textContent = fmt(data.coins);
    el("offline-rp").textContent = fmt(data.rp);

    // Build offline events summary
    const eventsEl = el("offline-events");
    if (eventsEl) {
      const s = Game.state;
      const lines = [];

      // Estimate stock dividends paid
      const divInterval = cfg.STOCK_DIVIDEND_SECONDS || 30;
      const dividendRounds = Math.floor(data.seconds / divInterval);
      if (dividendRounds > 0) {
        lines.push({ icon: "📈", text: "Stock dividends paid", count: dividendRounds + "×" });
      }

      // Estimate events triggered
      const avgEventDelay = ((cfg.eventMinDelay || 60) + (cfg.eventMaxDelay || 180)) / 2;
      const eventEst = Math.floor(data.seconds / avgEventDelay);
      if (eventEst > 0) {
        lines.push({ icon: "⚡", text: "Random events occurred", count: "~" + eventEst });
      }

      // BTC mining (rough estimate based on current miners)
      if (data.btc && data.btc > 0) {
        lines.push({ icon: "⛏️", text: "BTC mined", count: fmt(data.btc) });
      }

      // RP gained
      if (data.rp > 0) {
        lines.push({ icon: "🔬", text: "Research accumulated", count: "+" + fmt(data.rp) + " RP" });
      }

      if (lines.length > 0) {
        eventsEl.innerHTML = "<div style='margin-bottom:6px;font-weight:600;color:#e6ecff'>While you were away:</div>" +
          lines.map(function (l) {
            return '<div class="offline-event-row">' + l.icon + " " + l.text + ": <span>" + l.count + "</span></div>";
          }).join("");
      } else {
        eventsEl.innerHTML = "";
      }
    }

    popup.classList.add("show");
    el("offline-close").onclick = () => popup.classList.remove("show");
  };

  Game.UI = UI;
})();
