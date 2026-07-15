/* ==========================================================================
   Idle Empire Ultimate - config.js
   Static game configuration: buildings, upgrades, research, achievements,
   milestones, events, constants and formatting helpers.
   ========================================================================== */

const Game = (window.Game = window.Game || {});

/* --------------------------------------------------------------------------
   Number formatting
   -------------------------------------------------------------------------- */
function formatNumber(n) {
  if (n === Infinity) return "Infinity";
  if (isNaN(n)) return "0";
  if (n < 0) return "-" + formatNumber(-n);
  if (n < 1000) return n.toFixed(n < 10 ? (n === Math.floor(n) ? 0 : 2) : 0);
  const suffixes = ["", "K", "M", "B", "T", "Qa", "Qi", "Sx", "Sp", "Oc", "No", "Dc"];
  const exp = Math.floor(Math.log10(n) / 3);
  if (exp < suffixes.length) return (n / Math.pow(1000, exp)).toFixed(2) + suffixes[exp];
  return n.toExponential(2);
}

function formatTime(seconds) {
  seconds = Math.floor(seconds);
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  const parts = [];
  if (d) parts.push(d + "d");
  if (h || d) parts.push(h + "h");
  if (m || h || d) parts.push(m + "m");
  parts.push(s + "s");
  return parts.join(" ");
}

Game.formatNumber = formatNumber;
Game.formatTime = formatTime;

/* --------------------------------------------------------------------------
   Global constants
   -------------------------------------------------------------------------- */
Game.config = {
  TICK_MS: 50,
  UI_MS: 250,
  AUTOSAVE_MS: 30000,
  OFFLINE_CAP_SECONDS: 72 * 3600,
  SAVE_KEY: "idleEmpireUltimateSave",
  COST_SCALE: 1.15,
  PRESTIGE_REQUIRED_COINS: 1e6,
  PRESTIGE_PER_POINT_MULT: 0.01,
  ASCENSION_REQUIRED_PP: 1000,
  ASCENSION_PER_SHARD_MULT: 0.02,
  RESEARCH_RESET_PP_COST: 100,
  RESEARCH_RESET_RP_GAIN: 10,
  CLICK_CPS_FRACTION: 0.05,
  MAX_COST_REDUCTION_MULT: 0.1,
};

/* --------------------------------------------------------------------------
   Buildings (18 total)
   -------------------------------------------------------------------------- */
const BUILDING_DATA = [
  // Tier 1 - Civilization
  { id: "worker", name: "Worker", role: "Basic labor", tier: 1, baseCost: 10, baseCps: 0.1 },
  { id: "farm", name: "Farm", role: "Food economy", tier: 1, baseCost: 100, baseCps: 0.5 },
  { id: "mine", name: "Mine", role: "Resources", tier: 1, baseCost: 500, baseCps: 2 },
  { id: "factory", name: "Factory", role: "Manufacturing", tier: 1, baseCost: 2500, baseCps: 10 },
  { id: "bank", name: "Bank", role: "Finance", tier: 1, baseCost: 10000, baseCps: 50 },
  { id: "corporation", name: "Corporation", role: "Global trade", tier: 1, baseCost: 75000, baseCps: 200 },
  // Tier 2 - Industrial Age
  { id: "laboratory", name: "Laboratory", role: "Research", tier: 2, baseCost: 500000, baseCps: 800 },
  { id: "powerplant", name: "Power Plant", role: "Energy", tier: 2, baseCost: 2000000, baseCps: 3000 },
  { id: "refinery", name: "Refinery", role: "Fuel", tier: 2, baseCost: 7500000, baseCps: 10000 },
  { id: "shipyard", name: "Shipyard", role: "Logistics", tier: 2, baseCost: 25000000, baseCps: 30000 },
  { id: "university", name: "University", role: "Education", tier: 2, baseCost: 100000000, baseCps: 100000 },
  { id: "datacenter", name: "Data Center", role: "Computing", tier: 2, baseCost: 500000000, baseCps: 300000 },
  // Tier 3 - Space Age
  { id: "spaceport", name: "Space Port", role: "Launches", tier: 3, baseCost: 3e9, baseCps: 1000000 },
  { id: "orbital", name: "Orbital Station", role: "Orbital industry", tier: 3, baseCost: 2e10, baseCps: 3000000 },
  { id: "mooncolony", name: "Moon Colony", role: "Lunar economy", tier: 3, baseCost: 1e11, baseCps: 10000000 },
  { id: "marscolony", name: "Mars Colony", role: "Interplanetary", tier: 3, baseCost: 5e11, baseCps: 30000000 },
  { id: "dysonswarm", name: "Dyson Swarm", role: "Stellar energy", tier: 3, baseCost: 3e12, baseCps: 100000000 },
  { id: "galacticnexus", name: "Galactic Nexus", role: "Endgame production", tier: 3, baseCost: 2e13, baseCps: 350000000 },
];

/* Upgrade names per building (6 each = 108 total) */
const UPGRADE_NAMES = {
  worker: ["Better Tools", "Team Leaders", "Trade Unions", "Mechanization", "AI Assistance", "Quantum Workforce"],
  farm: ["Irrigation", "Crop Rotation", "Greenhouses", "Hydroponics", "Vertical Farms", "Quantum Agriculture"],
  mine: ["Better Drills", "Explosives", "Underground Rails", "Deep Mining", "Quantum Excavation", "Matter Extraction"],
  factory: ["Assembly Lines", "Quality Control", "Lean Manufacturing", "Automated Factories", "Nanotech Production", "Quantum Fabrication"],
  bank: ["ATM Networks", "Online Banking", "Algorithmic Trading", "Quantum Finance", "Infinite Capital", "Cosmic Banking"],
  corporation: ["Global Offices", "Trade Networks", "Monopolization", "Cosmic Commerce", "Quantum Economics", "Universal Markets"],
  laboratory: ["Advanced Equipment", "Peer Review", "Grant Funding", "Supercomputers", "Quantum Labs", "Cosmic Research"],
  powerplant: ["Turbine Upgrades", "Grid Expansion", "Fusion Reactors", "Antimatter Cores", "Quantum Energy", "Stellar Power"],
  refinery: ["Catalytic Cracking", "Distillation", "Synthetic Fuels", "Plasma Refining", "Quantum Refining", "Cosmic Fuels"],
  shipyard: ["Dry Docks", "Automation Cranes", "Nuclear Ships", "Warp Drives", "Quantum Logistics", "Cosmic Fleets"],
  university: ["Online Courses", "Research Chairs", "Global Campuses", "Neural Learning", "Quantum Education", "Cosmic Academy"],
  datacenter: ["SSD Arrays", "Fiber Optics", "GPU Clusters", "Quantum Computing", "Neural Datacenters", "Cosmic Cloud"],
  spaceport: ["Reusable Rockets", "Launch Loops", "Space Elevators", "Warp Gates", "Quantum Launches", "Cosmic Portals"],
  orbital: ["Solar Arrays", "Zero-G Factories", "Ring Habitats", "Quantum Stations", "Cosmic Orbitals", "Galactic Rings"],
  mooncolony: ["Regolith Mining", "Lunar Domes", "Helium-3 Extraction", "Moon Cities", "Quantum Colonies", "Cosmic Moons"],
  marscolony: ["Terraforming", "Red Domes", "Martian Cities", "Fusion Colonies", "Quantum Mars", "Cosmic Mars"],
  dysonswarm: ["Solar Collectors", "Swarm Expansion", "Stellar Harvesting", "Quantum Swarm", "Cosmic Dyson", "Galactic Sphere"],
  galacticnexus: ["Nexus Cores", "Star Networks", "Galactic Web", "Quantum Nexus", "Cosmic Nexus", "Universal Nexus"],
};

const UPGRADE_THRESHOLDS = [1, 5, 25, 50, 100, 200];
const UPGRADE_COST_FACTORS = [15, 100, 750, 6000, 60000, 750000];

Game.config.buildings = BUILDING_DATA;
Game.config.buildingMap = {};
BUILDING_DATA.forEach((b) => (Game.config.buildingMap[b.id] = b));

/* --------------------------------------------------------------------------
   Sub-buildings (3 per non-worker building)
   -------------------------------------------------------------------------- */
const SUB_BUILDING_PARENT_COST = 1;
const SUB_BUILDING_MAX_UPGRADES = 2;
const SUB_BUILDING_UPGRADE_COST_FACTORS = [12, 60];
const DEFAULT_SUB_NAMES = ["Specialization Wing", "Optimization Hub", "Tradeoff Module"];
const SUB_BUILDING_NAMES = {
  farm: ["Silo", "Tractor Garage", "Animal Husbandry"],
  mine: ["Coal Shaft", "Iron Pit", "Gold Vein"],
  factory: ["Assembly Cell", "Machine Shop", "Foundry Line"],
  bank: ["Vault Wing", "Loan Office", "Trading Desk"],
  corporation: ["Regional HQ", "Logistics Hub", "Media Division"],
  laboratory: ["Test Rig", "Clean Room", "Prototype Bay"],
  powerplant: ["Boiler Hall", "Turbine Wing", "Storage Grid"],
  refinery: ["Cracker Unit", "Blend Tower", "Catalyst Lab"],
  shipyard: ["Slipway", "Dock Crane", "Hull Forge"],
  university: ["Campus Annex", "Research Wing", "Scholar Guild"],
  datacenter: ["Server Cluster", "Cooling Plant", "AI Rack"],
  spaceport: ["Fuel Depot", "Orbital Pad", "Cargo Terminal"],
  orbital: ["Solar Ring", "Habitat Node", "Dock Ring"],
  mooncolony: ["Ice Extractor", "Lunar Dome", "Helium Trench"],
  marscolony: ["Green Dome", "Dust Processor", "Drone Depot"],
  dysonswarm: ["Collector Array", "Relay Node", "Forge Pod"],
  galacticnexus: ["Trade Spire", "Warp Anchor", "Council Core"],
};

function signedPercent(v) {
  return (v >= 0 ? "+" : "") + Math.round(v * 100) + "%";
}
function subDesc(parentName, effects, nameMap) {
  return effects
    .map((e) => signedPercent(e.value) + " " + nameMap[e.target])
    .join(" • ");
}

const SUB_BUILDINGS = [];
const subParents = BUILDING_DATA.filter((b) => b.id !== "worker");
const subNameMap = {};
BUILDING_DATA.forEach((b) => {
  subNameMap[b.id] = b.name;
});
subParents.forEach((b, i) => {
  const prev = subParents[(i - 1 + subParents.length) % subParents.length];
  const next = subParents[(i + 1) % subParents.length];
  const names = SUB_BUILDING_NAMES[b.id] || DEFAULT_SUB_NAMES;
  const effectSets = [
    [{ target: b.id, value: 0.12 }, { target: next.id, value: -0.04 }],
    [{ target: prev.id, value: 0.08 }, { target: b.id, value: 0.06 }, { target: next.id, value: -0.06 }],
    [{ target: b.id, value: 0.14 }, { target: prev.id, value: -0.07 }],
  ];
  for (let subIndex = 0; subIndex < 3; subIndex++) {
    const effects = effectSets[subIndex];
    SUB_BUILDINGS.push({
      id: b.id + "_sub" + subIndex,
      parent: b.id,
      index: subIndex,
      name: names[subIndex] || DEFAULT_SUB_NAMES[subIndex],
      parentCost: SUB_BUILDING_PARENT_COST,
      effects,
      desc: subDesc(b.name, effects, subNameMap),
      upgradeCosts: SUB_BUILDING_UPGRADE_COST_FACTORS.map((factor) => b.baseCost * factor),
    });
  }
});

Game.config.SUB_BUILDING_PARENT_COST = SUB_BUILDING_PARENT_COST;
Game.config.SUB_BUILDING_MAX_UPGRADES = SUB_BUILDING_MAX_UPGRADES;
Game.config.subBuildings = SUB_BUILDINGS;
Game.config.subBuildingMap = {};
Game.config.subBuildingsByParent = {};
SUB_BUILDINGS.forEach((sb) => {
  Game.config.subBuildingMap[sb.id] = sb;
  if (!Game.config.subBuildingsByParent[sb.parent]) Game.config.subBuildingsByParent[sb.parent] = [];
  Game.config.subBuildingsByParent[sb.parent].push(sb);
});

/* Build the full upgrade list (108) */
const UPGRADES = [];
BUILDING_DATA.forEach((b) => {
  const names = UPGRADE_NAMES[b.id];
  for (let i = 0; i < 6; i++) {
    UPGRADES.push({
      id: b.id + "_up" + i,
      building: b.id,
      index: i,
      name: names[i],
      threshold: UPGRADE_THRESHOLDS[i],
      cost: b.baseCost * UPGRADE_COST_FACTORS[i],
      desc: "Doubles " + b.name + " production. Requires " + UPGRADE_THRESHOLDS[i] + " owned.",
    });
  }
});
Game.config.upgrades = UPGRADES;
Game.config.upgradeMap = {};
UPGRADES.forEach((u) => (Game.config.upgradeMap[u.id] = u));

/* --------------------------------------------------------------------------
   Research Tree (80 nodes across 5 branches)
   -------------------------------------------------------------------------- */
const RESEARCH_BRANCHES = {
  economics: {
    name: "Economics",
    color: "#f6c453",
    nodes: [
      ["Basic Accounting", 1], ["Efficient Markets", 2], ["Compound Interest", 5], ["Commodity Trading", 10],
      ["Global Investments", 20], ["Infinite Capital Theory", 50], ["Market Psychology", 75], ["Behavioral Economics", 100],
      ["Venture Capital", 150], ["Hedge Funds", 200], ["Sovereign Wealth", 300], ["Dark Pools", 500],
      ["Quantum Finance", 750], ["Cosmic Economics", 1000], ["Universal Markets", 1500], ["Omniversal Trade", 2000],
    ],
  },
  industry: {
    name: "Industry",
    color: "#e07a5f",
    nodes: [
      ["Metallurgy", 1], ["Steam Power", 2], ["Industrial Automation", 5], ["Robotics", 10],
      ["Nanotechnology", 20], ["Advanced Materials", 50], ["Biomaterials", 75], ["Smart Manufacturing", 100],
      ["Molecular Assembly", 150], ["Atomic Fabrication", 200], ["Quantum Manufacturing", 300], ["Energy Weapons", 500],
      ["Dyson Engineering", 750], ["Stellar Forge", 1000], ["Galactic Industry", 1500], ["Universal Production", 2000],
    ],
  },
  science: {
    name: "Science",
    color: "#4ea8de",
    nodes: [
      ["Mathematics", 1], ["Physics", 2], ["Quantum Mechanics", 5], ["Fusion Energy", 10],
      ["Dark Matter Engineering", 20], ["String Theory", 50], ["M-Theory", 75], ["Unified Field Theory", 100],
      ["Reality Engineering", 150], ["Consciousness Upload", 200], ["Time Manipulation", 300], ["Dimensional Science", 500],
      ["Multiverse Theory", 750], ["Cosmic Engineering", 1000], ["Universal Science", 1500], ["Omniscience", 2000],
    ],
  },
  automation: {
    name: "Automation",
    color: "#48cae4",
    nodes: [
      ["Auto Clicker", 5], ["Auto Purchase", 10], ["Smart Managers", 25], ["AI Governors", 50],
      ["Neural Networks", 75], ["Quantum AI", 100], ["Self-Improving AI", 150], ["Recursive Enhancement", 200],
      ["Superintelligence", 300], ["Cosmic AI", 500], ["Universal Mind", 750], ["Omnipotent Automation", 1000],
      ["Reality Bending AI", 1500], ["Existence Optimizer", 2000], ["Perfection Engine", 3000], ["Transcendence", 5000],
    ],
  },
  prestige: {
    name: "Prestige",
    color: "#b388eb",
    nodes: [
      ["Legacy Wealth", 10], ["Prestige Efficiency", 25], ["Eternal Production", 50], ["Ascension Engineering", 100],
      ["Temporal Wealth", 150], ["Quantum Prestige", 200], ["Infinite Regression", 300], ["Cosmic Legacy", 500],
      ["Universal Prestige", 750], ["Existence Prestige", 1000], ["Reality Prestige", 1500], ["Multiverse Prestige", 2000],
      ["Omniversal Prestige", 3000], ["Perfect Prestige", 5000], ["Infinite Loop", 7500], ["Singularity", 10000],
    ],
  },
};

/* Automation feature unlocks tied to specific automation nodes */
const AUTOMATION_UNLOCKS = {
  automation_0: "autoClick",
  automation_1: "autoBuy",
  automation_2: "autoUpgrade",
  automation_3: "autoResearch",
  automation_5: "autoPrestige",
  automation_7: "autoAscend",
};
/* Nodes that boost the auto-clicker tier (clicks per second) */
const AUTOCLICK_TIER_NODES = ["automation_0", "automation_4", "automation_6", "automation_8", "automation_10", "automation_12", "automation_14"];

Game.config.automationUnlocks = AUTOMATION_UNLOCKS;
Game.config.autoclickTierNodes = AUTOCLICK_TIER_NODES;

const RESEARCH = [];
const branchEffectBase = {
  economics: { type: "coin", base: 0.1 },
  industry: { type: "building", base: 0.12 },
  science: { type: "global", base: 0.1 },
  automation: { type: "automation", base: 0.08 },
  prestige: { type: "prestige", base: 0.2 },
};

Object.keys(RESEARCH_BRANCHES).forEach((branchKey) => {
  const branch = RESEARCH_BRANCHES[branchKey];
  branch.nodes.forEach((node, i) => {
    const [name, cost] = node;
    const eff = branchEffectBase[branchKey];
    const id = branchKey + "_" + i;
    const value = eff.base * (1 + i * 0.15);
    let desc = "";
    if (eff.type === "coin") desc = "+" + Math.round(value * 100) + "% coin income.";
    else if (eff.type === "building") desc = "+" + Math.round(value * 100) + "% building production.";
    else if (eff.type === "global") desc = "+" + Math.round(value * 100) + "% global production.";
    else if (eff.type === "prestige") desc = "+" + Math.round(value * 100) + "% prestige points earned.";
    else if (eff.type === "automation") {
      if (AUTOMATION_UNLOCKS[id]) desc = "Unlocks " + AUTOMATION_UNLOCKS[id] + " automation. ";
      desc += "+" + Math.round(value * 100) + "% global production.";
    }
    RESEARCH.push({
      id,
      branch: branchKey,
      index: i,
      name,
      cost,
      value,
      effectType: eff.type,
      unlock: AUTOMATION_UNLOCKS[id] || null,
      requires: i > 0 ? branchKey + "_" + (i - 1) : null,
      desc,
    });
  });
});

Game.config.researchBranches = RESEARCH_BRANCHES;
Game.config.research = RESEARCH;
Game.config.researchMap = {};
RESEARCH.forEach((r) => (Game.config.researchMap[r.id] = r));

/* --------------------------------------------------------------------------
   Achievements (52) - each with a check() and a production bonus
   -------------------------------------------------------------------------- */
function anyBuilding(state, count) {
  return BUILDING_DATA.some((b) => (state.buildings[b.id] || 0) >= count);
}
function totalBuildings(state) {
  return BUILDING_DATA.reduce((s, b) => s + (state.buildings[b.id] || 0), 0);
}
function tierBuilding(state, tier, count) {
  return BUILDING_DATA.filter((b) => b.tier === tier).some((b) => (state.buildings[b.id] || 0) >= count);
}
function upgradeCount(state) {
  return Object.keys(state.upgrades).filter((k) => state.upgrades[k]).length;
}

const ACHIEVEMENTS = [
  // Clicking
  { id: "click1", name: "First Click", desc: "Click once.", bonus: 0.01, check: (s) => s.stats.totalClicks >= 1, progress: (s) => Math.min(1, s.stats.totalClicks / 1) },
  { id: "click100", name: "Click Addict", desc: "Click 100 times.", bonus: 0.02, check: (s) => s.stats.totalClicks >= 100, progress: (s) => s.stats.totalClicks / 100 },
  { id: "click1k", name: "Click Master", desc: "Click 1,000 times.", bonus: 0.03, check: (s) => s.stats.totalClicks >= 1000, progress: (s) => s.stats.totalClicks / 1000 },
  { id: "click10k", name: "Click God", desc: "Click 10,000 times.", bonus: 0.05, check: (s) => s.stats.totalClicks >= 10000, progress: (s) => s.stats.totalClicks / 10000 },
  { id: "click1m", name: "Click Infinity", desc: "Click 1,000,000 times.", bonus: 0.1, check: (s) => s.stats.totalClicks >= 1e6, progress: (s) => s.stats.totalClicks / 1e6 },
  // Buildings
  { id: "build1", name: "First Building", desc: "Own any building.", bonus: 0.01, check: (s) => totalBuildings(s) >= 1, progress: (s) => totalBuildings(s) / 1 },
  { id: "build10any", name: "Getting Started", desc: "Own 10 of any building.", bonus: 0.02, check: (s) => anyBuilding(s, 10), progress: (s) => Math.max(...BUILDING_DATA.map((b) => s.buildings[b.id] || 0)) / 10 },
  { id: "build100any", name: "Mass Production", desc: "Own 100 of any building.", bonus: 0.05, check: (s) => anyBuilding(s, 100), progress: (s) => Math.max(...BUILDING_DATA.map((b) => s.buildings[b.id] || 0)) / 100 },
  { id: "tier2", name: "Industrial Age", desc: "Own a Tier 2 building.", bonus: 0.05, check: (s) => tierBuilding(s, 2, 1), progress: (s) => (tierBuilding(s, 2, 1) ? 1 : 0) },
  { id: "tier3", name: "Space Age", desc: "Own a Tier 3 building.", bonus: 0.1, check: (s) => tierBuilding(s, 3, 1), progress: (s) => (tierBuilding(s, 3, 1) ? 1 : 0) },
  { id: "workers1k", name: "Workforce", desc: "Own 1,000 Workers.", bonus: 0.1, check: (s) => (s.buildings.worker || 0) >= 1000, progress: (s) => (s.buildings.worker || 0) / 1000 },
  { id: "factories1k", name: "Factory Line", desc: "Own 1,000 Factories.", bonus: 0.1, check: (s) => (s.buildings.factory || 0) >= 1000, progress: (s) => (s.buildings.factory || 0) / 1000 },
  { id: "totalbuild10", name: "Small Empire", desc: "Own 10 buildings total.", bonus: 0.02, check: (s) => totalBuildings(s) >= 10, progress: (s) => totalBuildings(s) / 10 },
  { id: "totalbuild50", name: "Growing Empire", desc: "Own 50 buildings total.", bonus: 0.03, check: (s) => totalBuildings(s) >= 50, progress: (s) => totalBuildings(s) / 50 },
  { id: "totalbuild100", name: "Vast Empire", desc: "Own 100 buildings total.", bonus: 0.05, check: (s) => totalBuildings(s) >= 100, progress: (s) => totalBuildings(s) / 100 },
  { id: "totalbuild500", name: "Colossal Empire", desc: "Own 500 buildings total.", bonus: 0.1, check: (s) => totalBuildings(s) >= 500, progress: (s) => totalBuildings(s) / 500 },
  { id: "totalbuild1000", name: "Ultimate Empire", desc: "Own 1,000 buildings total.", bonus: 0.15, check: (s) => totalBuildings(s) >= 1000, progress: (s) => totalBuildings(s) / 1000 },
  // Wealth (lifetime coins)
  { id: "wealth1k", name: "Pocket Change", desc: "Earn 1K coins.", bonus: 0.01, check: (s) => s.lifetimeCoins >= 1e3, progress: (s) => s.lifetimeCoins / 1e3 },
  { id: "wealth1m", name: "Millionaire", desc: "Earn 1M coins.", bonus: 0.02, check: (s) => s.lifetimeCoins >= 1e6, progress: (s) => s.lifetimeCoins / 1e6 },
  { id: "wealth1b", name: "Billionaire", desc: "Earn 1B coins.", bonus: 0.03, check: (s) => s.lifetimeCoins >= 1e9, progress: (s) => s.lifetimeCoins / 1e9 },
  { id: "wealth1t", name: "Trillionaire", desc: "Earn 1T coins.", bonus: 0.05, check: (s) => s.lifetimeCoins >= 1e12, progress: (s) => s.lifetimeCoins / 1e12 },
  { id: "wealth1e15", name: "Quadrillionaire", desc: "Earn 1e15 coins.", bonus: 0.07, check: (s) => s.lifetimeCoins >= 1e15, progress: (s) => s.lifetimeCoins / 1e15 },
  { id: "wealth1e20", name: "Cosmic Wealth", desc: "Earn 1e20 coins.", bonus: 0.1, check: (s) => s.lifetimeCoins >= 1e20, progress: (s) => s.lifetimeCoins / 1e20 },
  { id: "wealth1e30", name: "Galactic Wealth", desc: "Earn 1e30 coins.", bonus: 0.12, check: (s) => s.lifetimeCoins >= 1e30, progress: (s) => s.lifetimeCoins / 1e30 },
  { id: "wealth1e40", name: "Universal Wealth", desc: "Earn 1e40 coins.", bonus: 0.15, check: (s) => s.lifetimeCoins >= 1e40, progress: (s) => s.lifetimeCoins / 1e40 },
  { id: "wealth1e50", name: "Transcendent Wealth", desc: "Earn 1e50 coins.", bonus: 0.18, check: (s) => s.lifetimeCoins >= 1e50, progress: (s) => s.lifetimeCoins / 1e50 },
  { id: "wealth1e75", name: "Infinite Wealth", desc: "Earn 1e75 coins.", bonus: 0.2, check: (s) => s.lifetimeCoins >= 1e75, progress: (s) => s.lifetimeCoins / 1e75 },
  { id: "wealth1e100", name: "Omniversal Wealth", desc: "Earn 1e100 coins.", bonus: 0.25, check: (s) => s.lifetimeCoins >= 1e100, progress: (s) => s.lifetimeCoins / 1e100 },
  // CPS
  { id: "cps1k", name: "Steady Income", desc: "Reach 1K CPS.", bonus: 0.02, check: (s) => (s._cps || 0) >= 1e3, progress: (s) => (s._cps || 0) / 1e3 },
  { id: "cps1m", name: "Big Income", desc: "Reach 1M CPS.", bonus: 0.03, check: (s) => (s._cps || 0) >= 1e6, progress: (s) => (s._cps || 0) / 1e6 },
  { id: "cps1b", name: "Massive Income", desc: "Reach 1B CPS.", bonus: 0.05, check: (s) => (s._cps || 0) >= 1e9, progress: (s) => (s._cps || 0) / 1e9 },
  { id: "cps1t", name: "Insane Income", desc: "Reach 1T CPS.", bonus: 0.07, check: (s) => (s._cps || 0) >= 1e12, progress: (s) => (s._cps || 0) / 1e12 },
  { id: "cps1e15", name: "Cosmic Income", desc: "Reach 1e15 CPS.", bonus: 0.1, check: (s) => (s._cps || 0) >= 1e15, progress: (s) => (s._cps || 0) / 1e15 },
  // Prestige
  { id: "prestige1", name: "First Prestige", desc: "Prestige once.", bonus: 0.03, check: (s) => s.stats.prestigeCount >= 1, progress: (s) => s.stats.prestigeCount / 1 },
  { id: "prestige10", name: "Reborn", desc: "Prestige 10 times.", bonus: 0.05, check: (s) => s.stats.prestigeCount >= 10, progress: (s) => s.stats.prestigeCount / 10 },
  { id: "prestige100", name: "Eternal", desc: "Prestige 100 times.", bonus: 0.1, check: (s) => s.stats.prestigeCount >= 100, progress: (s) => s.stats.prestigeCount / 100 },
  { id: "prestige1000", name: "Immortal", desc: "Prestige 1,000 times.", bonus: 0.2, check: (s) => s.stats.prestigeCount >= 1000, progress: (s) => s.stats.prestigeCount / 1000 },
  // Research
  { id: "research1", name: "First Research", desc: "Complete 1 research.", bonus: 0.03, check: (s) => s.stats.researchCompleted >= 1, progress: (s) => s.stats.researchCompleted / 1 },
  { id: "research10", name: "Scholar", desc: "Complete 10 research.", bonus: 0.05, check: (s) => s.stats.researchCompleted >= 10, progress: (s) => s.stats.researchCompleted / 10 },
  { id: "research50", name: "Scientist", desc: "Complete 50 research.", bonus: 0.1, check: (s) => s.stats.researchCompleted >= 50, progress: (s) => s.stats.researchCompleted / 50 },
  { id: "research80", name: "Omniscient", desc: "Complete all 80 research.", bonus: 0.25, check: (s) => s.stats.researchCompleted >= 80, progress: (s) => s.stats.researchCompleted / 80 },
  // Ascension
  { id: "ascend1", name: "First Ascension", desc: "Ascend once.", bonus: 0.05, check: (s) => s.stats.ascensionCount >= 1, progress: (s) => s.stats.ascensionCount / 1 },
  { id: "ascend10", name: "Ascendant", desc: "Ascend 10 times.", bonus: 0.1, check: (s) => s.stats.ascensionCount >= 10, progress: (s) => s.stats.ascensionCount / 10 },
  { id: "ascend100", name: "Master Ascendant", desc: "Ascend 100 times.", bonus: 0.25, check: (s) => s.stats.ascensionCount >= 100, progress: (s) => s.stats.ascensionCount / 100 },
  // Events
  { id: "event1", name: "First Event", desc: "Trigger an event.", bonus: 0.02, check: (s) => s.stats.eventsTriggered >= 1, progress: (s) => s.stats.eventsTriggered / 1 },
  { id: "event100", name: "Event Hunter", desc: "Trigger 100 events.", bonus: 0.1, check: (s) => s.stats.eventsTriggered >= 100, progress: (s) => s.stats.eventsTriggered / 100 },
  // Upgrades
  { id: "upgrade1", name: "First Upgrade", desc: "Buy an upgrade.", bonus: 0.02, check: (s) => upgradeCount(s) >= 1, progress: (s) => upgradeCount(s) / 1 },
  { id: "upgrade10", name: "Optimizer", desc: "Buy 10 upgrades.", bonus: 0.03, check: (s) => upgradeCount(s) >= 10, progress: (s) => upgradeCount(s) / 10 },
  { id: "upgrade50", name: "Perfectionist", desc: "Buy 50 upgrades.", bonus: 0.1, check: (s) => upgradeCount(s) >= 50, progress: (s) => upgradeCount(s) / 50 },
  { id: "upgrade108", name: "Fully Upgraded", desc: "Buy all 108 upgrades.", bonus: 0.25, check: (s) => upgradeCount(s) >= 108, progress: (s) => upgradeCount(s) / 108 },
  // Special
  { id: "industrialgiant", name: "Industrial Giant", desc: "Own 1,000 Factories.", bonus: 0.1, check: (s) => (s.buildings.factory || 0) >= 1000, progress: (s) => (s.buildings.factory || 0) / 1000 },
  { id: "masterascendant", name: "Grand Ascendant", desc: "Ascend 100 times (bonus prestige).", bonus: 0.25, check: (s) => s.stats.ascensionCount >= 100, progress: (s) => s.stats.ascensionCount / 100 },
];
Game.config.achievements = ACHIEVEMENTS;

/* --------------------------------------------------------------------------
   Milestones (41) - each gives +5% CPS
   -------------------------------------------------------------------------- */
const MILESTONES = [];
const MS_BONUS = 0.05;
function ms(id, name, desc, check, progress) {
  MILESTONES.push({ id, name, desc, bonus: MS_BONUS, check, progress });
}
// Lifetime coins (12)
[
  ["1M", 1e6], ["1B", 1e9], ["1T", 1e12], ["1e15", 1e15], ["1e18", 1e18], ["1e21", 1e21],
  ["1e24", 1e24], ["1e30", 1e30], ["1e40", 1e40], ["1e50", 1e50], ["1e75", 1e75], ["1e100", 1e100],
].forEach(([label, val]) => {
  ms("mscoin" + label, "Wealth: " + label, "Earn " + label + " lifetime coins.", (s) => s.lifetimeCoins >= val, (s) => s.lifetimeCoins / val);
});
// CPS (5)
[["1", 1], ["100", 100], ["10K", 1e4], ["1M", 1e6], ["1B", 1e9]].forEach(([label, val]) => {
  ms("mscps" + label, "Production: " + label + " CPS", "Reach " + label + " CPS.", (s) => (s._cps || 0) >= val, (s) => (s._cps || 0) / val);
});
// Prestige count (5)
[1, 10, 50, 100, 500].forEach((n) => {
  ms("msprestige" + n, "Prestige x" + n, "Prestige " + n + " times.", (s) => s.stats.prestigeCount >= n, (s) => s.stats.prestigeCount / n);
});
// Buildings owned (5)
[10, 50, 100, 500, 1000].forEach((n) => {
  ms("msbuild" + n, "Empire: " + n, "Own " + n + " buildings total.", (s) => totalBuildings(s) >= n, (s) => totalBuildings(s) / n);
});
// Research (4)
[5, 20, 50, 80].forEach((n) => {
  ms("msresearch" + n, "Research x" + n, "Complete " + n + " research.", (s) => s.stats.researchCompleted >= n, (s) => s.stats.researchCompleted / n);
});
// Ascension (4)
[1, 10, 50, 100].forEach((n) => {
  ms("msascend" + n, "Ascension x" + n, "Ascend " + n + " times.", (s) => s.stats.ascensionCount >= n, (s) => s.stats.ascensionCount / n);
});
// Events (3)
[10, 50, 100].forEach((n) => {
  ms("msevent" + n, "Events x" + n, "Trigger " + n + " events.", (s) => s.stats.eventsTriggered >= n, (s) => s.stats.eventsTriggered / n);
});
// Upgrades (3)
[10, 50, 108].forEach((n) => {
  ms("msupgrade" + n, "Upgrades x" + n, "Buy " + n + " upgrades.", (s) => upgradeCount(s) >= n, (s) => upgradeCount(s) / n);
});
Game.config.milestones = MILESTONES;

/* --------------------------------------------------------------------------
   Events
   -------------------------------------------------------------------------- */
const EVENTS = [
  { id: "golden", name: "Golden Coin", desc: "10x income!", duration: 30, weight: 25, kind: "coinMult", value: 10, color: "#f6c453" },
  { id: "boom", name: "Market Boom", desc: "+200% production!", duration: 60, weight: 20, kind: "coinMult", value: 3, color: "#43aa8b" },
  { id: "breakthrough", name: "Scientific Breakthrough", desc: "+50 free RP!", duration: 0, weight: 20, kind: "instantRP", value: 50, color: "#4ea8de" },
  { id: "crisis", name: "Economic Crisis", desc: "-50% income!", duration: 30, weight: 15, kind: "coinMult", value: 0.5, color: "#e63946" },
  { id: "cosmic", name: "Cosmic Alignment", desc: "+500% all production!", duration: 15, weight: 5, kind: "coinMult", value: 6, color: "#b388eb" },
  { id: "surge", name: "Prestige Surge", desc: "+100% prestige points!", duration: 60, weight: 15, kind: "prestigeMult", value: 2, color: "#c77dff" },
];
Game.config.events = EVENTS;
Game.config.eventMinDelay = 120; // seconds
Game.config.eventMaxDelay = 300;

/* --------------------------------------------------------------------------
   Prestige Talents (30)
   -------------------------------------------------------------------------- */
/* Passive talents use `value` (added as 1 + value multiplier).
   Power effects use explicit `mult` values (direct multipliers, including penalties when mult < 1). */
const TALENTS = [
  // Economics branch (10)
  { id: "talent_econ_0", branch: "economics", name: "Legacy Ledger", cost: 10, type: "globalMult", value: 0.05, desc: "+5% global production.", requires: null },
  { id: "talent_econ_1", branch: "economics", name: "Efficient Tribute", cost: 20, type: "prestigeGain", value: 0.1, desc: "+10% prestige points earned.", requires: "talent_econ_0" },
  { id: "talent_econ_2", branch: "economics", name: "Investment Guild", cost: 35, type: "costReduction", value: 0.05, desc: "-5% building and upgrade costs.", requires: "talent_econ_1" },
  { id: "talent_econ_3", branch: "economics", name: "Golden Touch", cost: 50, type: "clickMult", value: 0.2, desc: "+20% click value.", requires: "talent_econ_2" },
  { id: "talent_econ_4", branch: "economics", name: "Compound Legacy", cost: 80, type: "globalMult", value: 0.08, desc: "+8% global production.", requires: "talent_econ_3" },
  { id: "talent_econ_5", branch: "economics", name: "Prosperity Engines", cost: 120, type: "rpMult", value: 0.15, desc: "+15% research point gain.", requires: "talent_econ_4" },
  { id: "talent_econ_6", branch: "economics", name: "Prestige Arbitrage", cost: 180, type: "prestigeGain", value: 0.15, desc: "+15% prestige points earned.", requires: "talent_econ_5" },
  { id: "talent_econ_7", branch: "economics", name: "Lean Procurement", cost: 260, type: "costReduction", value: 0.06, desc: "-6% building and upgrade costs.", requires: "talent_econ_6" },
  { id: "talent_econ_8", branch: "economics", name: "Hypercapitalism", cost: 380, type: "globalMult", value: 0.12, desc: "+12% global production.", requires: "talent_econ_7" },
  { id: "talent_econ_9", branch: "economics", name: "Eternal Treasury", cost: 550, type: "clickMult", value: 0.35, desc: "+35% click value.", requires: "talent_econ_8" },

  // Industry branch (10)
  { id: "talent_ind_0", branch: "industry", name: "Fertile Soil", cost: 15, type: "buildingMult", building: "farm", value: 0.25, desc: "+25% Farm output.", requires: null },
  { id: "talent_ind_1", branch: "industry", name: "Deep Shafts", cost: 25, type: "buildingMult", building: "mine", value: 0.25, desc: "+25% Mine output.", requires: "talent_ind_0" },
  { id: "talent_ind_2", branch: "industry", name: "Efficient Assembly", cost: 40, type: "buildingMult", building: "factory", value: 0.2, desc: "+20% Factory output.", requires: "talent_ind_1" },
  { id: "talent_ind_3", branch: "industry", name: "Smart Grid", cost: 65, type: "buildingMult", building: "powerplant", value: 0.2, desc: "+20% Power Plant output.", requires: "talent_ind_2" },
  { id: "talent_ind_4", branch: "industry", name: "Academic Grants", cost: 90, type: "buildingMult", building: "university", value: 0.25, desc: "+25% University output.", requires: "talent_ind_3" },
  { id: "talent_ind_5", branch: "industry", name: "Quantum Servers", cost: 140, type: "buildingMult", building: "datacenter", value: 0.3, desc: "+30% Data Center output.", requires: "talent_ind_4" },
  { id: "talent_ind_6", branch: "industry", name: "Orbital Logistics", cost: 220, type: "buildingMult", building: "spaceport", value: 0.3, desc: "+30% Space Port output.", requires: "talent_ind_5" },
  { id: "talent_ind_7", branch: "industry", name: "Stellar Refinement", cost: 320, type: "buildingMult", building: "refinery", value: 0.35, desc: "+35% Refinery output.", requires: "talent_ind_6" },
  { id: "talent_ind_8", branch: "industry", name: "Nexus Optimization", cost: 480, type: "buildingMult", building: "galacticnexus", value: 0.4, desc: "+40% Galactic Nexus output.", requires: "talent_ind_7" },
  { id: "talent_ind_9", branch: "industry", name: "Interstellar Supply Chain", cost: 700, type: "globalMult", value: 0.15, desc: "+15% global production.", requires: "talent_ind_8" },

  // Climate branch (4 passive + 6 active powers)
  { id: "talent_climate_0", branch: "climate", name: "Weather Bureau", cost: 20, type: "rpMult", value: 0.1, desc: "+10% research point gain.", requires: null },
  { id: "talent_climate_1", branch: "climate", name: "Forecasting Models", cost: 35, type: "globalMult", value: 0.06, desc: "+6% global production.", requires: "talent_climate_0" },
  { id: "talent_climate_2", branch: "climate", name: "Seasonal Harvest", cost: 55, type: "buildingMult", building: "farm", value: 0.3, desc: "+30% Farm output.", requires: "talent_climate_1" },
  { id: "talent_climate_3", branch: "climate", name: "Geological Survey", cost: 80, type: "buildingMult", building: "mine", value: 0.3, desc: "+30% Mine output.", requires: "talent_climate_2" },

  {
    id: "talent_climate_4",
    branch: "climate",
    name: "Heavy Rain",
    cost: 120,
    type: "power",
    powerId: "heavy_rain",
    duration: 45,
    cooldown: 180,
    desc: "Call heavy rain: boosts Farms, hurts Mines and Factories.",
    requires: "talent_climate_3",
    effects: [
      { type: "buildingMult", building: "farm", mult: 2.5 },
      { type: "buildingMult", building: "mine", mult: 0.6 },
      { type: "buildingMult", building: "factory", mult: 0.75 },
    ],
  },
  {
    id: "talent_climate_5",
    branch: "climate",
    name: "Solar Flare",
    cost: 180,
    type: "power",
    powerId: "solar_flare",
    duration: 35,
    cooldown: 200,
    desc: "Call a solar flare: boosts energy/computing, hurts labs.",
    requires: "talent_climate_4",
    effects: [
      { type: "buildingMult", building: "powerplant", mult: 2.2 },
      { type: "buildingMult", building: "datacenter", mult: 1.8 },
      { type: "buildingMult", building: "laboratory", mult: 0.7 },
    ],
  },
  {
    id: "talent_climate_6",
    branch: "climate",
    name: "Mineral Rush",
    cost: 260,
    type: "power",
    powerId: "mineral_rush",
    duration: 40,
    cooldown: 220,
    desc: "Force a mineral rush: boosts Mines and Refineries, hurts Farms.",
    requires: "talent_climate_5",
    effects: [
      { type: "buildingMult", building: "mine", mult: 2.0 },
      { type: "buildingMult", building: "refinery", mult: 1.8 },
      { type: "buildingMult", building: "farm", mult: 0.6 },
    ],
  },
  {
    id: "talent_climate_7",
    branch: "climate",
    name: "Market Festival",
    cost: 360,
    type: "power",
    powerId: "market_festival",
    duration: 35,
    cooldown: 240,
    desc: "Host a festival: boosts Banks/Corporations and clicks, hurts Factories.",
    requires: "talent_climate_6",
    effects: [
      { type: "buildingMult", building: "bank", mult: 2.0 },
      { type: "buildingMult", building: "corporation", mult: 1.9 },
      { type: "buildingMult", building: "factory", mult: 0.7 },
      { type: "clickMult", mult: 1.6 },
    ],
  },
  {
    id: "talent_climate_8",
    branch: "climate",
    name: "Arcology Monsoon",
    cost: 500,
    type: "power",
    powerId: "arcology_monsoon",
    duration: 50,
    cooldown: 300,
    desc: "Call an arcology monsoon: huge Farms, better Universities, weaker Data Centers.",
    requires: "talent_climate_7",
    effects: [
      { type: "buildingMult", building: "farm", mult: 3.0 },
      { type: "buildingMult", building: "university", mult: 1.6 },
      { type: "buildingMult", building: "datacenter", mult: 0.65 },
    ],
  },
  {
    id: "talent_climate_9",
    branch: "climate",
    name: "Quantum Storm",
    cost: 700,
    type: "power",
    powerId: "quantum_storm",
    duration: 25,
    cooldown: 320,
    desc: "Trigger a quantum storm: doubles global output and prestige gain, but weakens clicks.",
    requires: "talent_climate_8",
    effects: [
      { type: "globalMult", mult: 2.0 },
      { type: "prestigeGain", mult: 1.8 },
      { type: "clickMult", mult: 0.5 },
    ],
  },
];

Game.config.talents = TALENTS;
Game.config.talentMap = {};
Game.config.talentPowerMap = {};
TALENTS.forEach((t) => {
  Game.config.talentMap[t.id] = t;
  if (t.type === "power" && t.powerId) Game.config.talentPowerMap[t.powerId] = t;
});
