/* ==========================================================================
   Idle Empire Ultimate - ui.js
   Rendering, tab management, event wiring and per-frame updates.
   ========================================================================== */

(function () {
  const cfg = Game.config;
  const fmt = Game.formatNumber;
  const UI = {};

  let refs = {};
  let built = { research: false, achievements: false, milestones: false, automation: false, bitcoin: false, stocks: false };
  let currentTab = "economy";

  function el(id) {
    return document.getElementById(id);
  }
  function make(tag, cls, html) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html !== undefined) e.innerHTML = html;
    return e;
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
    UI.buildResearchTabs();
    UI.wireSettings();
    UI.wirePrestigeButtons();

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
    Object.keys(cfg.skillPowers || {}).forEach((powerId) => {
      const p = cfg.skillPowers[powerId];
      const active = Game.SkillTrees.activePowers().find((a) => a.id === powerId);
      const cooldown = Game.SkillTrees.cooldownRemaining(powerId);
      const ready = Game.SkillTrees.canActivate(powerId);
      const status = active ? "Active " + Math.ceil(active.remaining) + "s" : cooldown > 0 ? "Cooldown " + Math.ceil(cooldown) + "s" : "Ready";
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
    if (!producers || !miners || !batteries) return;
    producers.innerHTML = "";
    miners.innerHTML = "";
    batteries.innerHTML = "";
    UI._btcRows = { producers: {}, miners: {}, batteries: {} };

    cfg.energyProducers.forEach((p) => {
      const row = make("div", "market-card");
      row.innerHTML =
        '<div class="market-title">' + p.name + "</div>" +
        '<div class="market-desc">+' + p.energyPerSec + " energy/sec</div>" +
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
        '<div class="market-desc">' + m.btcPerSec + " BTC/sec • " + m.energyUse + " energy/sec</div>" +
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
    const ep = Game.Bitcoin.energyProduction();
    const ec = Game.Bitcoin.energyConsumption();
    const br = Game.Bitcoin.miningRate();
    stats.innerHTML =
      '<div class="stat-row"><span class="stat-key">BTC Price</span><span class="stat-val">' + fmt(s.btcPrice) + " coins</span></div>" +
      '<div class="stat-row"><span class="stat-key">BTC Holdings</span><span class="stat-val">' + fmt(s.btc) + "</span></div>" +
      '<div class="stat-row"><span class="stat-key">Energy</span><span class="stat-val">' + fmt(s.energy) + " / " + fmt(s.energyCap) + "</span></div>" +
      '<div class="stat-row"><span class="stat-key">Net Energy</span><span class="stat-val">' + fmt(ep - ec) + " / sec</span></div>" +
      '<div class="stat-row"><span class="stat-key">Mining Rate</span><span class="stat-val">' + fmt(br) + " BTC / sec</span></div>";

    Object.keys(UI._btcRows.producers).forEach((id) => {
      const r = UI._btcRows.producers[id];
      const owned = s.energyProducers[id] || 0;
      const cost = Game.Bitcoin.equipmentCost(r.def.baseCost, owned);
      r.btn.textContent = "Buy (" + fmt(cost) + ")";
      r.row.querySelector(".market-desc").textContent = "+" + r.def.energyPerSec + " energy/sec • owned: " + fmt(owned);
      r.btn.disabled = s.coins < cost;
    });
    Object.keys(UI._btcRows.miners).forEach((id) => {
      const r = UI._btcRows.miners[id];
      const owned = s.btcMiners[id] || 0;
      const cost = Game.Bitcoin.equipmentCost(r.def.baseCost, owned);
      r.btn.textContent = "Buy (" + fmt(cost) + ")";
      r.row.querySelector(".market-desc").textContent = r.def.btcPerSec + " BTC/sec • " + r.def.energyUse + " energy/sec • owned: " + fmt(owned);
      r.btn.disabled = s.coins < cost;
    });
    Object.keys(UI._btcRows.batteries).forEach((id) => {
      const r = UI._btcRows.batteries[id];
      const owned = s.batteries[id] || 0;
      const cost = Game.Bitcoin.equipmentCost(r.def.baseCost, owned);
      r.btn.textContent = "Buy (" + fmt(cost) + ")";
      r.row.querySelector(".market-desc").textContent = "+" + fmt(r.def.capacity) + " energy cap • owned: " + fmt(owned);
      r.btn.disabled = s.coins < cost;
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
    const mults = s._mult || { stockInsight: 0 };
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
    el("prestige-current-pp").textContent = fmt(s.prestigePoints);
    el("prestige-lifetime-pp").textContent = fmt(s.lifetimePrestigePoints);
    el("prestige-potential").textContent = fmt(Game.Prestige.potential());
    el("prestige-mult").textContent = "+" + fmt(s.prestigePoints * cfg.PRESTIGE_PER_POINT_MULT * (cfg.BONUS_EFFECTIVENESS_MULT || 1) * 100) + "%";

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

    UI.updateTalents();
    UI.updateGodsTitans();
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
      ["Talents Purchased", fmt(stats.talentsPurchased || 0) + " / " + cfg.talents.length],
      ["Skill Nodes Purchased", fmt(stats.skillNodesPurchased || 0) + " / " + cfg.skillTreeNodes.length],
      ["Talent Powers Used", fmt(stats.powersActivated || 0)],
      ["Bitcoin Holdings", fmt(s.btc)],
      ["BTC Price", fmt(s.btcPrice)],
      ["Energy", fmt(s.energy) + " / " + fmt(s.energyCap)],
      ["Portfolio Value", fmt(Game.Stocks ? Game.Stocks.portfolioValue() : 0)],
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
    refs.coins.textContent = fmt(s.coins);
    refs.cps.textContent = fmt(s._cps) + " / sec";
    refs.clickValue.textContent = "+" + fmt(s._clickValue) + " / click";

    // Conditional resource displays
    toggleWrap(refs.ppWrap, s.prestigePoints > 0 || s.lifetimePrestigePoints > 0 || Game.Prestige.canPrestige());
    toggleWrap(refs.rpWrap, s.researchPoints > 0 || s.stats.researchCompleted > 0 || (s.buildings.laboratory || 0) > 0);
    toggleWrap(refs.asWrap, s.ascensionShards > 0 || s.stats.ascensionCount > 0);
    toggleWrap(refs.btcWrap, s.btc > 0 || Object.values(s.btcMiners || {}).some((v) => v > 0));
    toggleWrap(refs.energyWrap, Object.values(s.energyProducers || {}).some((v) => v > 0) || Object.values(s.btcMiners || {}).some((v) => v > 0));
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
      case "achievements":
        UI.updateAchievements();
        break;
      case "milestones":
        UI.updateMilestones();
        break;
      case "prestige":
        UI.updatePrestige();
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
  };

  /* ---------------------------------------------------------------------
     Offline popup
     --------------------------------------------------------------------- */
  UI.showOffline = function (data) {
    const popup = el("offline-popup");
    el("offline-time").textContent = Game.formatTime(data.seconds);
    el("offline-coins").textContent = fmt(data.coins);
    el("offline-rp").textContent = fmt(data.rp);
    popup.classList.add("show");
    el("offline-close").onclick = () => popup.classList.remove("show");
  };

  Game.UI = UI;
})();
