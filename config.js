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
  BONUS_EFFECTIVENESS_MULT: 0.1,
  GAIN_EFFECTIVENESS_MULT: 0.1,
  // How many of the previous building are consumed to buy one current building, by target tier.
  BUILDING_PREREQ_BY_TIER: { 1: 10, 2: 50, 3: 200 },
  CLICKER_UPGRADE_BASE_COST: 50,
  CLICKER_UPGRADE_MAX: 10,
  CLICKER_UPGRADE_COST_MULT: 3,
};

/* --------------------------------------------------------------------------
   Clicker upgrade definitions (10 levels, punishing theme)
   Each level multiplies click value by clickBoost (applied directly, not
   scaled by BONUS_EFFECTIVENESS_MULT) and multiplies global production by
   globalPenalty (also direct — the price of obsession).
   -------------------------------------------------------------------------- */
Game.config.clickerUpgradeDefs = [
  { name: "Calloused Fingers",   flavor: "Flesh yields. Coins do not.",                       clickBoost: 1.15, globalPenalty: 0.99 },
  { name: "Knuckle Grease",      flavor: "Blood is currency. Joints are for the weak.",        clickBoost: 1.18, globalPenalty: 0.98 },
  { name: "Torn Ligaments",      flavor: "The ache sharpens focus.",                           clickBoost: 1.22, globalPenalty: 0.97 },
  { name: "Fractured Bones",     flavor: "Hairline cracks whisper of ambition.",               clickBoost: 1.26, globalPenalty: 0.96 },
  { name: "Severed Tendons",     flavor: "Pain is a reminder you are still useful.",           clickBoost: 1.32, globalPenalty: 0.95 },
  { name: "Crushed Nerves",      flavor: "Numbness is a gift. Work never stops.",              clickBoost: 1.38, globalPenalty: 0.94 },
  { name: "Withered Grip",       flavor: "The hand forgets rest. So must you.",                clickBoost: 1.45, globalPenalty: 0.93 },
  { name: "Ruined Flesh",        flavor: "Bone and determination are all that remain.",        clickBoost: 1.55, globalPenalty: 0.92 },
  { name: "Cursed Touch",        flavor: "Every coin carries a cost of flesh.",                clickBoost: 1.65, globalPenalty: 0.91 },
  { name: "Fist of Desperation", flavor: "Shattered. Relentless. Irreplaceable.",              clickBoost: 1.80, globalPenalty: 0.90 },
];

Game.config.DIPLOMACY_RELATION_MIN = -100;
Game.config.DIPLOMACY_RELATION_MAX = 100;
Game.config.DIPLOMACY_STAT_MIN = 0;
Game.config.DIPLOMACY_STAT_MAX = 100;
Game.config.DIPLOMACY_BASE_TRADE_CPS = 0.00022;
Game.config.DIPLOMACY_MIN_GLOBAL_MULT = 0.75;
Game.config.DIPLOMACY_HOSTILITY_PRODUCTION_PENALTY = 0.00045;
Game.config.DIPLOMACY_PROPAGANDA_CLICK_SCALE = 0.00025;
Game.config.DIPLOMACY_INTEL_RP_SCALE = 0.0015;
Game.config.DIPLOMACY_SMUGGLING_REWARD_MULT = 0.32;
Game.config.DIPLOMACY_SUSPICION_HOSTILITY_WEIGHT = 0.3;
Game.config.DIPLOMACY_RELATION_DECAY = 0.7;
Game.config.DIPLOMACY_SUSPICION_DECAY = 0.4;
Game.config.DIPLOMACY_INFLUENCE_DECAY = 0.14;
Game.config.DIPLOMACY_INTEL_DECAY = 0.18;
Game.config.DIPLOMACY_PROSPERITY_SWING = 0.9;
Game.config.DIPLOMACY_TRADE_SWING = 1.15;
Game.config.DIPLOMACY_RELATION_SEED_BASE = -58;
Game.config.DIPLOMACY_RELATION_SEED_INDEX_FACTOR = 17;
Game.config.DIPLOMACY_RELATION_SEED_RESOURCE_FACTOR = 5;
Game.config.DIPLOMACY_RELATION_SEED_MOD = 74;
Game.config.DIPLOMACY_PROSPERITY_SEED_BASE = 34;
Game.config.DIPLOMACY_PROSPERITY_SEED_RESOURCE_FACTOR = 6;
Game.config.DIPLOMACY_PROSPERITY_SEED_INDEX_FACTOR = 7;
Game.config.DIPLOMACY_PROSPERITY_SEED_MOD = 18;
Game.config.DIPLOMACY_PROSPERITY_SEED_MIN = 18;
Game.config.DIPLOMACY_PROSPERITY_SEED_MAX = 84;
Game.config.DIPLOMACY_TRADE_SEED_BASE = 18;
Game.config.DIPLOMACY_TRADE_SEED_RESOURCE_FACTOR = 5;
Game.config.DIPLOMACY_TRADE_SEED_INDEX_FACTOR = 11;
Game.config.DIPLOMACY_TRADE_SEED_MOD = 22;
Game.config.DIPLOMACY_TRADE_SEED_MIN = 10;
Game.config.DIPLOMACY_TRADE_SEED_MAX = 90;
Game.config.DIPLOMACY_INFLUENCE_SEED_BASE = 10;
Game.config.DIPLOMACY_INFLUENCE_SEED_INDEX_FACTOR = 9;
Game.config.DIPLOMACY_INFLUENCE_SEED_MOD = 26;
Game.config.DIPLOMACY_INFLUENCE_SEED_MAX = 70;
Game.config.DIPLOMACY_SUSPICION_SEED_BASE = 8;
Game.config.DIPLOMACY_SUSPICION_SEED_INDEX_FACTOR = 4;
Game.config.DIPLOMACY_SUSPICION_SEED_MOD = 14;
Game.config.DIPLOMACY_SUSPICION_SEED_MAX = 60;
Game.config.DIPLOMACY_PROSPERITY_TARGET_BASE = 44;
Game.config.DIPLOMACY_PROSPERITY_RELATION_FACTOR = 0.12;
Game.config.DIPLOMACY_PROSPERITY_SUSPICION_FACTOR = 0.1;
Game.config.DIPLOMACY_PROSPERITY_TARGET_MIN = 18;
Game.config.DIPLOMACY_PROSPERITY_TARGET_MAX = 82;
Game.config.DIPLOMACY_TRADE_TARGET_BASE = 32;
Game.config.DIPLOMACY_TRADE_RELATION_FACTOR = 0.16;
Game.config.DIPLOMACY_TRADE_INFLUENCE_FACTOR = 0.08;
Game.config.DIPLOMACY_TRADE_SUSPICION_FACTOR = 0.08;
Game.config.DIPLOMACY_TRADE_TARGET_MIN = 10;
Game.config.DIPLOMACY_TRADE_TARGET_MAX = 88;
Game.config.DIPLOMACY_RELATION_TARGET_BASE = -20;
Game.config.DIPLOMACY_RELATION_PROSPERITY_FACTOR = 0.45;
Game.config.DIPLOMACY_RELATION_INFLUENCE_FACTOR = 0.2;
Game.config.DIPLOMACY_RELATION_SUSPICION_FACTOR = 0.5;
Game.config.DIPLOMACY_RELATION_TARGET_MIN = -55;
Game.config.DIPLOMACY_RELATION_TARGET_MAX = 35;
Game.config.diplomacyStances = [
  { key: "allied", min: 60, label: "Allied Rival", emoji: "🤝", className: "status-allied", stroke: "#63e6be" },
  { key: "friendly", min: 25, label: "Friendly Rival", emoji: "🙂", className: "status-friendly", stroke: "#8ce99a" },
  { key: "wary", min: -10, label: "Wary Rival", emoji: "👀", className: "status-wary", stroke: "#ffd166" },
  { key: "hostile", min: -45, label: "Hostile Rival", emoji: "📣", className: "status-hostile", stroke: "#ff8a80" },
  { key: "nemesis", min: -100, label: "Economic Nemesis", emoji: "🧨", className: "status-nemesis", stroke: "#ff5252" },
];
Game.config.diplomacyActions = [
  {
    id: "trade_deal",
    name: "Trade Deal",
    desc: "Open a low-friction market deal to grow commerce and calm tensions.",
    coinCost: 250,
    rpCost: 0,
    cooldown: 45,
    relation: 8,
    prosperity: 6,
    trade: 18,
    influence: 2,
    suspicion: -4,
  },
  {
    id: "aid_convoy",
    name: "Aid Convoy",
    desc: "Send food, tools and coin reserves to stabilize a county economy.",
    coinCost: 1200,
    rpCost: 0,
    cooldown: 70,
    relation: 14,
    prosperity: 18,
    trade: 5,
    influence: 4,
    suspicion: -6,
  },
  {
    id: "cultural_festival",
    name: "Cultural Festival",
    desc: "Win hearts with pageantry, media coverage and shared markets.",
    coinCost: 1800,
    rpCost: 0,
    cooldown: 80,
    relation: 10,
    prosperity: 5,
    trade: 4,
    influence: 18,
    suspicion: -2,
  },
  {
    id: "propaganda_blitz",
    name: "Propaganda Blitz",
    desc: "Flood their papers and radio waves with your narrative.",
    coinCost: 900,
    rpCost: 0,
    cooldown: 55,
    relation: -4,
    prosperity: -2,
    trade: 0,
    influence: 26,
    suspicion: 16,
  },
  {
    id: "chastise",
    name: "Chastise",
    desc: "Publicly scold their leadership and demand better behavior.",
    coinCost: 0,
    rpCost: 0,
    cooldown: 40,
    relation: -12,
    prosperity: -8,
    trade: -8,
    influence: 6,
    suspicion: 6,
  },
  {
    id: "spy_network",
    name: "Espionage",
    desc: "Fund spies, leaks and stolen ledgers for secrets and leverage.",
    coinCost: 1400,
    rpCost: 4,
    cooldown: 65,
    relation: -9,
    prosperity: 0,
    trade: -2,
    influence: 0,
    suspicion: 22,
    intel: 18,
  },
  {
    id: "sanctions",
    name: "Sanctions",
    desc: "Disrupt their merchants and squeeze their economy for tribute.",
    coinCost: 2200,
    rpCost: 0,
    cooldown: 90,
    relation: -16,
    prosperity: -18,
    trade: -20,
    influence: -4,
    suspicion: 10,
  },
  {
    id: "smuggling_ring",
    name: "Smuggling Ring",
    desc: "Run gray-market cargo through their docks for quick profit.",
    coinCost: 1800,
    rpCost: 0,
    cooldown: 75,
    relation: -12,
    prosperity: 0,
    trade: 12,
    influence: 0,
    suspicion: 20,
    intel: 10,
  },
  {
    id: "cover_story",
    name: "Cover Story",
    desc: "Clean up scandals, bribe witnesses and cool their counterintel.",
    coinCost: 750,
    rpCost: 0,
    cooldown: 35,
    relation: 4,
    prosperity: 0,
    trade: 0,
    influence: -5,
    suspicion: -24,
  },
  {
    id: "non_aggression_pact",
    name: "Non-Aggression Pact",
    desc: "Freeze active feuds and redirect both counties toward trade.",
    coinCost: 4500,
    rpCost: 10,
    cooldown: 120,
    minRelation: -20,
    relation: 18,
    prosperity: 8,
    trade: 10,
    influence: 4,
    suspicion: -12,
  },
  {
    id: "media_buyout",
    name: "Media Buyout",
    desc: "Acquire their loudest outlets and steer public opinion.",
    coinCost: 6000,
    rpCost: 0,
    cooldown: 95,
    relation: -2,
    prosperity: 0,
    trade: 3,
    influence: 34,
    suspicion: 14,
  },
  {
    id: "joint_venture",
    name: "Joint Venture",
    desc: "Create a prestige industry pact with shared supply chains and R&D.",
    coinCost: 12000,
    rpCost: 25,
    cooldown: 140,
    minRelation: 15,
    relation: 14,
    prosperity: 22,
    trade: 24,
    influence: 10,
    suspicion: -8,
    intel: 8,
  },
];
Game.config.diplomacyActionMap = {};
Game.config.diplomacyActions.forEach(function (action) {
  Game.config.diplomacyActionMap[action.id] = action;
});

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
const SUB_BUILDING_UPGRADE_STEP = 0.35;
const MIN_BUILDING_MULTIPLIER = 0.1;
const SUB_BUILDING_UPGRADE_COST_FACTORS = [12, 60];
// Sub-building effects are intentionally tuned as moderate tradeoffs:
// each option gives a meaningful boost while applying a smaller penalty.
const SUB_BUILDING_EFFECT_SETS = [
  [{ self: 0.12 }, { next: -0.04 }],
  [{ prev: 0.08 }, { self: 0.06 }, { next: -0.06 }],
  [{ self: 0.14 }, { prev: -0.07 }],
];
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

function formatSignedPercentage(v) {
  const percent = v * 100;
  const rounded = Number.isInteger(percent) ? percent.toFixed(0) : percent.toFixed(1);
  return (v >= 0 ? "+" : "") + rounded + "%";
}
function wrapIndex(index, length) {
  return (index + length) % length;
}
function subDesc(effects, nameMap) {
  return effects
    .map((e) => formatSignedPercentage(e.value) + " " + nameMap[e.target])
    .join(" • ");
}

const SUB_BUILDINGS = [];
const subParents = BUILDING_DATA.filter((b) => b.id !== "worker");
const subNameMap = {};
BUILDING_DATA.forEach((b) => {
  subNameMap[b.id] = b.name;
});
subParents.forEach((b, i) => {
  const prev = subParents[wrapIndex(i - 1, subParents.length)];
  const next = subParents[wrapIndex(i + 1, subParents.length)];
  const names = SUB_BUILDING_NAMES[b.id] || DEFAULT_SUB_NAMES;
  const effectSets = SUB_BUILDING_EFFECT_SETS.map((set) =>
    set.map((effect) => ({
      target: effect.self !== undefined ? b.id : effect.prev !== undefined ? prev.id : next.id,
      value: effect.self !== undefined ? effect.self : effect.prev !== undefined ? effect.prev : effect.next,
    }))
  );
  for (let subIndex = 0; subIndex < 3; subIndex++) {
    const effects = effectSets[subIndex];
    SUB_BUILDINGS.push({
      id: b.id + "_sub" + subIndex,
      parent: b.id,
      index: subIndex,
      name: names[subIndex] || DEFAULT_SUB_NAMES[subIndex],
      parentCost: SUB_BUILDING_PARENT_COST,
      effects,
      desc: subDesc(effects, subNameMap),
      upgradeCosts: SUB_BUILDING_UPGRADE_COST_FACTORS.map((factor) => b.baseCost * factor),
    });
  }
});

Game.config.SUB_BUILDING_PARENT_COST = SUB_BUILDING_PARENT_COST;
Game.config.SUB_BUILDING_MAX_UPGRADES = SUB_BUILDING_MAX_UPGRADES;
Game.config.SUB_BUILDING_UPGRADE_STEP = SUB_BUILDING_UPGRADE_STEP;
Game.config.MIN_BUILDING_MULTIPLIER = MIN_BUILDING_MULTIPLIER;
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
      desc: "+" + (Game.config.BONUS_EFFECTIVENESS_MULT * 100) + "% " + b.name + " production. Requires " + UPGRADE_THRESHOLDS[i] + " owned.",
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

/* Convert a raw bonus value to a display percentage string, rounded to one decimal place.
   Raw values are multiplied by BONUS_EFFECTIVENESS_MULT before display so the shown
   percentage matches the actual in-game effect computed by scaledMultiplierFromEffect. */
function scaledDisplayPct(rawValue) {
  return Math.round(rawValue * Game.config.BONUS_EFFECTIVENESS_MULT * 1000) / 10;
}

Object.keys(RESEARCH_BRANCHES).forEach((branchKey) => {
  const branch = RESEARCH_BRANCHES[branchKey];
  branch.nodes.forEach((node, i) => {
    const [name, cost] = node;
    const eff = branchEffectBase[branchKey];
    const id = branchKey + "_" + i;
    const value = eff.base * (1 + i * 0.15);
    const scaledPct = scaledDisplayPct(value);
    let desc = "";
    if (eff.type === "coin") desc = "+" + scaledPct + "% coin income.";
    else if (eff.type === "building") desc = "+" + scaledPct + "% building production.";
    else if (eff.type === "global") desc = "+" + scaledPct + "% global production.";
    else if (eff.type === "prestige") desc = "+" + scaledPct + "% prestige points earned.";
    else if (eff.type === "automation") {
      if (AUTOMATION_UNLOCKS[id]) desc = "Unlocks " + AUTOMATION_UNLOCKS[id] + " automation. ";
      desc += "+" + scaledPct + "% global production.";
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
  { id: "golden", name: "Golden Coin", desc: "+90% income!", duration: 30, weight: 25, kind: "coinMult", value: 10, color: "#f6c453" },
  { id: "boom", name: "Market Boom", desc: "+20% production!", duration: 60, weight: 20, kind: "coinMult", value: 3, color: "#43aa8b" },
  { id: "breakthrough", name: "Scientific Breakthrough", desc: "+50 free RP!", duration: 0, weight: 20, kind: "instantRP", value: 50, color: "#4ea8de" },
  { id: "crisis", name: "Economic Crisis", desc: "-50% income!", duration: 30, weight: 15, kind: "coinMult", value: 0.5, color: "#e63946" },
  { id: "cosmic", name: "Cosmic Alignment", desc: "+50% all production!", duration: 15, weight: 5, kind: "coinMult", value: 6, color: "#b388eb" },
  { id: "surge", name: "Prestige Surge", desc: "+10% prestige points!", duration: 60, weight: 15, kind: "prestigeMult", value: 2, color: "#c77dff" },
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
  { id: "talent_econ_0", branch: "economics", name: "Legacy Ledger", cost: 10, type: "globalMult", value: 0.05, desc: "+0.5% global production.", requires: null },
  { id: "talent_econ_1", branch: "economics", name: "Efficient Tribute", cost: 20, type: "prestigeGain", value: 0.1, desc: "+1% prestige points earned.", requires: "talent_econ_0" },
  { id: "talent_econ_2", branch: "economics", name: "Investment Guild", cost: 35, type: "costReduction", value: 0.05, desc: "-0.5% building and upgrade costs.", requires: "talent_econ_1" },
  { id: "talent_econ_3", branch: "economics", name: "Golden Touch", cost: 50, type: "clickMult", value: 0.2, desc: "+2% click value.", requires: "talent_econ_2" },
  { id: "talent_econ_4", branch: "economics", name: "Compound Legacy", cost: 80, type: "globalMult", value: 0.08, desc: "+0.8% global production.", requires: "talent_econ_3" },
  { id: "talent_econ_5", branch: "economics", name: "Prosperity Engines", cost: 120, type: "rpMult", value: 0.15, desc: "+1.5% research point gain.", requires: "talent_econ_4" },
  { id: "talent_econ_6", branch: "economics", name: "Prestige Arbitrage", cost: 180, type: "prestigeGain", value: 0.15, desc: "+1.5% prestige points earned.", requires: "talent_econ_5" },
  { id: "talent_econ_7", branch: "economics", name: "Lean Procurement", cost: 260, type: "costReduction", value: 0.06, desc: "-0.6% building and upgrade costs.", requires: "talent_econ_6" },
  { id: "talent_econ_8", branch: "economics", name: "Hypercapitalism", cost: 380, type: "globalMult", value: 0.12, desc: "+1.2% global production.", requires: "talent_econ_7" },
  { id: "talent_econ_9", branch: "economics", name: "Eternal Treasury", cost: 550, type: "clickMult", value: 0.35, desc: "+3.5% click value.", requires: "talent_econ_8" },

  // Industry branch (10)
  { id: "talent_ind_0", branch: "industry", name: "Fertile Soil", cost: 15, type: "buildingMult", building: "farm", value: 0.25, desc: "+2.5% Farm output.", requires: null },
  { id: "talent_ind_1", branch: "industry", name: "Deep Shafts", cost: 25, type: "buildingMult", building: "mine", value: 0.25, desc: "+2.5% Mine output.", requires: "talent_ind_0" },
  { id: "talent_ind_2", branch: "industry", name: "Efficient Assembly", cost: 40, type: "buildingMult", building: "factory", value: 0.2, desc: "+2% Factory output.", requires: "talent_ind_1" },
  { id: "talent_ind_3", branch: "industry", name: "Smart Grid", cost: 65, type: "buildingMult", building: "powerplant", value: 0.2, desc: "+2% Power Plant output.", requires: "talent_ind_2" },
  { id: "talent_ind_4", branch: "industry", name: "Academic Grants", cost: 90, type: "buildingMult", building: "university", value: 0.25, desc: "+2.5% University output.", requires: "talent_ind_3" },
  { id: "talent_ind_5", branch: "industry", name: "Quantum Servers", cost: 140, type: "buildingMult", building: "datacenter", value: 0.3, desc: "+3% Data Center output.", requires: "talent_ind_4" },
  { id: "talent_ind_6", branch: "industry", name: "Orbital Logistics", cost: 220, type: "buildingMult", building: "spaceport", value: 0.3, desc: "+3% Space Port output.", requires: "talent_ind_5" },
  { id: "talent_ind_7", branch: "industry", name: "Stellar Refinement", cost: 320, type: "buildingMult", building: "refinery", value: 0.35, desc: "+3.5% Refinery output.", requires: "talent_ind_6" },
  { id: "talent_ind_8", branch: "industry", name: "Nexus Optimization", cost: 480, type: "buildingMult", building: "galacticnexus", value: 0.4, desc: "+4% Galactic Nexus output.", requires: "talent_ind_7" },
  { id: "talent_ind_9", branch: "industry", name: "Interstellar Supply Chain", cost: 700, type: "globalMult", value: 0.15, desc: "+1.5% global production.", requires: "talent_ind_8" },

  // Climate branch (4 passive + 6 active powers)
  { id: "talent_climate_0", branch: "climate", name: "Weather Bureau", cost: 20, type: "rpMult", value: 0.1, desc: "+1% research point gain.", requires: null },
  { id: "talent_climate_1", branch: "climate", name: "Forecasting Models", cost: 35, type: "globalMult", value: 0.06, desc: "+0.6% global production.", requires: "talent_climate_0" },
  { id: "talent_climate_2", branch: "climate", name: "Seasonal Harvest", cost: 55, type: "buildingMult", building: "farm", value: 0.3, desc: "+3% Farm output.", requires: "talent_climate_1" },
  { id: "talent_climate_3", branch: "climate", name: "Geological Survey", cost: 80, type: "buildingMult", building: "mine", value: 0.3, desc: "+3% Mine output.", requires: "talent_climate_2" },

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
    desc: "Trigger a quantum storm: +10% global output, +8% prestige gain, -5% click value.",
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

/* --------------------------------------------------------------------------
   Ascension Shard Upgrades: Gods and Titans
   -------------------------------------------------------------------------- */
const GODS_TITANS = [
  // effect values are fractional: 0.08 = +8%, -0.03 = -3%
  {
    id: "god_harvest",
    name: "Demeter's Blessing",
    cost: 3,
    desc: "Farms produce more, mines produce less.",
    effects: [
      { type: "buildingMult", building: "farm", value: 0.08 },
      { type: "buildingMult", building: "mine", value: -0.03 },
    ],
    requires: null,
  },
  {
    id: "titan_forge",
    name: "Hephaestus' Forge",
    cost: 4,
    desc: "Factories and refineries improve, click value weakens.",
    effects: [
      { type: "buildingMult", building: "factory", value: 0.08 },
      { type: "buildingMult", building: "refinery", value: 0.06 },
      { type: "clickMult", value: -0.04 },
    ],
    requires: "god_harvest",
  },
  {
    id: "god_wisdom",
    name: "Athena's Insight",
    cost: 5,
    desc: "Research gains rise, prestige point growth slows slightly.",
    effects: [
      { type: "rpMult", value: 0.08 },
      { type: "prestigeGain", value: -0.03 },
    ],
    requires: "titan_forge",
  },
  {
    id: "titan_storm",
    name: "Atlas' Burden",
    cost: 7,
    desc: "Global output rises, costs become a bit higher.",
    effects: [
      { type: "globalMult", value: 0.07 },
      { type: "costReduction", value: -0.04 },
    ],
    requires: "god_wisdom",
  },
  {
    id: "god_fortune",
    name: "Tyche's Favor",
    cost: 9,
    desc: "Prestige gains and banks improve, universities lose some output.",
    effects: [
      { type: "prestigeGain", value: 0.06 },
      { type: "buildingMult", building: "bank", value: 0.08 },
      { type: "buildingMult", building: "university", value: -0.04 },
    ],
    requires: "titan_storm",
  },
  {
    id: "titan_void",
    name: "Cronus' Reflection",
    cost: 12,
    desc: "Late-game buildings improve while early workers weaken.",
    effects: [
      { type: "buildingMult", building: "dysonswarm", value: 0.07 },
      { type: "buildingMult", building: "galacticnexus", value: 0.07 },
      { type: "buildingMult", building: "worker", value: -0.05 },
    ],
    requires: "god_fortune",
  },
];
Game.config.godsTitans = GODS_TITANS;
Game.config.godTitanMap = {};
GODS_TITANS.forEach((gt) => {
  Game.config.godTitanMap[gt.id] = gt;
});

/* --------------------------------------------------------------------------
   Skill Trees (6 branches x 8 nodes)
   -------------------------------------------------------------------------- */
const SKILL_TREE_BRANCHES = {
  civic: { name: "Civic", color: "#f6c453" },
  engineering: { name: "Engineering", color: "#e07a5f" },
  education: { name: "Education", color: "#4ea8de" },
  spiritual: { name: "Spiritual", color: "#b388eb" },
  military: { name: "Military", color: "#ef476f" },
  hashforge: { name: "Hash Forge", color: "#48cae4" },
};

const SKILL_TREE_NAMES = {
  civic: ["Town Hall Charters", "Civil Services", "Public Works", "Policy Coordination", "Bureau of Trade", "Urban Harmonization", "Grand Senate", "Unified Commonwealth"],
  engineering: ["Blueprint Standards", "Precision Tooling", "Process Control", "Industrial Optimization", "Power Architecture", "Deep Infrastructure", "Megaproject Cadence", "Singularity Fabrication"],
  education: ["Literacy Program", "Open Libraries", "Scholarly Exchange", "Applied Academia", "Research Consortium", "Experimental Campus", "Think Tank Assembly", "Cognitive Nexus"],
  spiritual: ["Temple Network", "Ritual Discipline", "Pilgrim Unity", "Meditative Economy", "Sacred Oaths", "Harmony Doctrine", "Transcendent Creed", "Eternal Chorus"],
  military: ["Logistics Corps", "Drill Grounds", "Tactical Schools", "Armor Works", "Fleet Doctrine", "War Office", "Combined Arms", "Strategic Command"],
  hashforge: ["Finger Conditioning", "Click Cadence", "Reflex Overdrive", "Input Pipeline", "Burst Protocol", "Hyper Tapping", "Neural Rhythm", "Mythic Throughput"],
};

const SKILL_TREE_EFFECTS = {
  civic: [
    { type: "globalMult", value: 0.04 },
    { type: "costReduction", value: 0.03 },
    { type: "clickMult", value: 0.06 },
    { type: "eventDelayMult", mult: 0.95 },
    { type: "stockFeeReduction", value: 0.04 },
    { type: "globalMult", value: 0.05, penaltyType: "rpMult", penaltyMult: 0.97 },
    { type: "costReduction", value: 0.04, penaltyType: "rpMult", penaltyMult: 0.96 },
    { type: "stockFeeReduction", value: 0.06, penaltyType: "rpMult", penaltyMult: 0.95 },
  ],
  engineering: [
    { type: "buildingMult", building: "factory", value: 0.14 },
    { type: "buildingMult", building: "mine", value: 0.14 },
    { type: "buildingMult", building: "refinery", value: 0.14 },
    { type: "buildingMult", building: "powerplant", value: 0.16 },
    { type: "costReduction", value: 0.03 },
    { type: "minerEfficiency", value: 0.08, penaltyType: "globalMult", penaltyMult: 0.98 },
    { type: "minerEfficiency", value: 0.1, penaltyType: "globalMult", penaltyMult: 0.975 },
    { type: "stockInsight", value: 1, penaltyType: "globalMult", penaltyMult: 0.97 },
  ],
  education: [
    { type: "rpMult", value: 0.08 },
    { type: "buildingMult", building: "university", value: 0.18 },
    { type: "buildingMult", building: "laboratory", value: 0.18 },
    { type: "buildingMult", building: "datacenter", value: 0.2, penaltyType: "clickMult", penaltyMult: 0.97 },
    { type: "btcPriceMult", value: 0.05, penaltyType: "clickMult", penaltyMult: 0.97 },
    { type: "stockInsight", value: 1 },
    { type: "rpMult", value: 0.1 },
    { type: "skillPower", powerId: "research_burst" },
  ],
  spiritual: [
    { type: "prestigeGain", value: 0.06 },
    { type: "globalMult", value: 0.04 },
    { type: "milestoneMult", value: 0.05 },
    { type: "prestigeGain", value: 0.07 },
    { type: "globalMult", value: 0.05, penaltyType: "automationMult", penaltyMult: 0.97 },
    { type: "prestigeGain", value: 0.08, penaltyType: "automationMult", penaltyMult: 0.96 },
    { type: "globalMult", value: 0.06, penaltyType: "automationMult", penaltyMult: 0.95 },
    { type: "milestoneMult", value: 0.08, penaltyType: "automationMult", penaltyMult: 0.94 },
  ],
  military: [
    { type: "buildingMult", building: "factory", value: 0.12 },
    { type: "buildingMult", building: "shipyard", value: 0.14 },
    { type: "globalMult", value: 0.04 },
    { type: "clickMult", value: 0.08 },
    { type: "buildingMult", building: "refinery", value: 0.14, penaltyType: "costReduction", penaltyMult: 1.02 },
    { type: "globalMult", value: 0.05, penaltyType: "costReduction", penaltyMult: 1.025 },
    { type: "buildingMult", building: "spaceport", value: 0.16, penaltyType: "costReduction", penaltyMult: 1.03 },
    { type: "clickMult", value: 0.12, penaltyType: "costReduction", penaltyMult: 1.035 },
  ],
  hashforge: [
    { type: "clickMult", value: 0.12 },
    { type: "clickCpsFractionMult", value: 0.08 },
    { type: "clickMult", value: 0.14 },
    { type: "autoClickBoost", value: 1, penaltyType: "globalMult", penaltyMult: 0.985 },
    { type: "clickCpsFractionMult", value: 0.1, penaltyType: "globalMult", penaltyMult: 0.985 },
    { type: "clickMult", value: 0.16, penaltyType: "globalMult", penaltyMult: 0.98 },
    { type: "autoClickBoost", value: 1, penaltyType: "globalMult", penaltyMult: 0.98 },
    { type: "clickMult", value: 0.2, penaltyType: "globalMult", penaltyMult: 0.975 },
  ],
};

const SKILL_BASE_COST = 12;
const SKILL_COST_INCREMENT = 8;
// Hash Forge offers strong click scaling, so its node costs are slightly higher.
const HASHFORGE_COST_MULTIPLIER = 1.05;
const SKILL_TREE_NODES = [];
Object.keys(SKILL_TREE_NAMES).forEach((branch) => {
  SKILL_TREE_NAMES[branch].forEach((name, index) => {
    const effect = SKILL_TREE_EFFECTS[branch][index];
    const id = "skill_" + branch + "_" + index;
    const cost = Math.floor((SKILL_BASE_COST + index * SKILL_COST_INCREMENT) * (branch === "hashforge" ? HASHFORGE_COST_MULTIPLIER : 1));
    let desc = "";
    if (effect.type === "buildingMult") desc = "+" + scaledDisplayPct(effect.value) + "% " + ((Game.config.buildingMap[effect.building] && Game.config.buildingMap[effect.building].name) || "Building") + " output.";
    else if (effect.type === "costReduction") desc = "-" + scaledDisplayPct(effect.value) + "% building/upgrade cost.";
    else if (effect.type === "globalMult") desc = "+" + scaledDisplayPct(effect.value) + "% global production.";
    else if (effect.type === "clickMult") desc = "+" + scaledDisplayPct(effect.value) + "% click value.";
    else if (effect.type === "rpMult") desc = "+" + scaledDisplayPct(effect.value) + "% research gain.";
    else if (effect.type === "prestigeGain") desc = "+" + scaledDisplayPct(effect.value) + "% prestige gain.";
    else if (effect.type === "milestoneMult") desc = "+" + scaledDisplayPct(effect.value) + "% milestone power.";
    else if (effect.type === "eventDelayMult") desc = "Events occur more often.";
    else if (effect.type === "minerEfficiency") desc = "+" + scaledDisplayPct(effect.value) + "% bitcoin miner efficiency.";
    else if (effect.type === "btcPriceMult") desc = "+" + scaledDisplayPct(effect.value) + "% BTC sell value.";
    else if (effect.type === "stockFeeReduction") desc = "Reduce stock trade fees.";
    else if (effect.type === "stockInsight") desc = "Unlock stock trend insight.";
    else if (effect.type === "clickCpsFractionMult") desc = "Clicks gain more from CPS.";
    else if (effect.type === "autoClickBoost") desc = "Boost auto-click speed.";
    else if (effect.type === "skillPower") desc = "Unlock power: Research Burst.";
    if (effect.penaltyType) desc += " Tradeoff applies.";
    SKILL_TREE_NODES.push({
      id,
      tree: branch,
      index,
      name,
      cost,
      requires: index > 0 ? "skill_" + branch + "_" + (index - 1) : null,
      ...effect,
      desc,
    });
  });
});

Game.config.skillTreeBranches = SKILL_TREE_BRANCHES;
Game.config.skillTreeNodes = SKILL_TREE_NODES;
Game.config.skillTreeNodeMap = {};
Game.config.skillTreeNodesByTree = {};
SKILL_TREE_NODES.forEach((n) => {
  Game.config.skillTreeNodeMap[n.id] = n;
  if (!Game.config.skillTreeNodesByTree[n.tree]) Game.config.skillTreeNodesByTree[n.tree] = [];
  Game.config.skillTreeNodesByTree[n.tree].push(n);
});

Game.config.RESEARCH_BURST_COOLDOWN = 240;
Game.config.skillPowers = {
  research_burst: {
    id: "research_burst",
    name: "Research Burst",
    desc: "Temporarily boosts RP gain and reduces global output.",
    duration: 30,
    cooldown: Game.config.RESEARCH_BURST_COOLDOWN,
    effects: [
      { type: "rpMult", mult: 2.2 },
      { type: "globalMult", mult: 0.9 },
    ],
  },
};

/* --------------------------------------------------------------------------
   Bitcoin Mining
   -------------------------------------------------------------------------- */
const ENERGY_PRODUCERS = [
  { id: "solar_panel", name: "Solar Panel", baseCost: 20000, energyPerSec: 2 },
  { id: "wind_turbine", name: "Wind Turbine", baseCost: 150000, energyPerSec: 12 },
  { id: "coal_generator", name: "Coal Generator", baseCost: 900000, energyPerSec: 45 },
  { id: "nuclear_reactor", name: "Nuclear Reactor", baseCost: 6000000, energyPerSec: 180 },
  { id: "fusion_cell", name: "Fusion Cell", baseCost: 40000000, energyPerSec: 650 },
];

const BTC_MINERS = [
  { id: "gpu_rig", name: "Basic GPU Rig", baseCost: 50000, energyUse: 4, btcPerSec: 0.00005 },
  { id: "asic_miner", name: "ASIC Miner", baseCost: 450000, energyUse: 22, btcPerSec: 0.00032 },
  { id: "mining_farm", name: "Mining Farm", baseCost: 2800000, energyUse: 120, btcPerSec: 0.0022 },
  { id: "quantum_miner", name: "Quantum Miner", baseCost: 18000000, energyUse: 650, btcPerSec: 0.014 },
];

const BATTERIES = [
  { id: "small_battery", name: "Small Battery", baseCost: 35000, capacity: 100 },
  { id: "large_battery", name: "Large Battery", baseCost: 300000, capacity: 800 },
  { id: "quantum_cell", name: "Quantum Cell", baseCost: 2500000, capacity: 7000 },
];

Game.config.energyProducers = ENERGY_PRODUCERS;
Game.config.btcMiners = BTC_MINERS;
Game.config.batteries = BATTERIES;
Game.config.BTC_EQUIPMENT_COST_SCALE = 1.17;
Game.config.BTC_BASE_ENERGY_CAP = 250;
Game.config.BTC_BASE_PRICE = 25000;
Game.config.BTC_MIN_PRICE = 3000;
Game.config.BTC_MAX_PRICE = 300000;
Game.config.BTC_PRICE_OSCILLATION = 0.12;
Game.config.BTC_PRICE_VOLATILITY = 0.05;
Game.config.BTC_PRICE_OSCILLATION_PERIOD = 20;

/* --------------------------------------------------------------------------
   Stock Market
   -------------------------------------------------------------------------- */
const STOCKS = [
  { id: "stock_novatek", ticker: "NVT", name: "NovaTek Systems", sector: "Tech", basePrice: 42, volatility: 0.032, drift: 0.0012 },
  { id: "stock_solaris", ticker: "SLR", name: "Solaris Energy", sector: "Energy", basePrice: 34, volatility: 0.028, drift: 0.001 },
  { id: "stock_ironpeak", ticker: "IRP", name: "IronPeak Mining", sector: "Industry", basePrice: 29, volatility: 0.035, drift: 0.0008 },
  { id: "stock_aurum", ticker: "AUR", name: "Aurum Finance", sector: "Finance", basePrice: 51, volatility: 0.03, drift: 0.0011 },
  { id: "stock_hyperlane", ticker: "HYP", name: "Hyperlane Logistics", sector: "Logistics", basePrice: 24, volatility: 0.027, drift: 0.0009 },
  { id: "stock_orbitex", ticker: "ORX", name: "Orbitex Aerospace", sector: "Space", basePrice: 63, volatility: 0.04, drift: 0.0013 },
  { id: "stock_biozen", ticker: "BZN", name: "BioZen Labs", sector: "Biotech", basePrice: 38, volatility: 0.031, drift: 0.001 },
  { id: "stock_quantis", ticker: "QNT", name: "Quantis Compute", sector: "Compute", basePrice: 57, volatility: 0.036, drift: 0.0012 },
  { id: "stock_tidewater", ticker: "TDW", name: "Tidewater Foods", sector: "Consumer", basePrice: 19, volatility: 0.022, drift: 0.0007 },
  { id: "stock_crown", ticker: "CRW", name: "Crown Estates", sector: "Realty", basePrice: 47, volatility: 0.026, drift: 0.0009 },
];
Game.config.stocks = STOCKS;
Game.config.STOCK_TICK_SECONDS = 5;
Game.config.STOCK_HISTORY_POINTS = 20;
Game.config.STOCK_TRADING_FEE = 0.01;
Game.config.STOCK_DIVIDEND_SECONDS = 30;
Game.config.STOCK_DIVIDEND_PRICE_THRESHOLD_MULT = 1.1;
Game.config.STOCK_DIVIDEND_RATE = 0.0005;
Game.config.STOCK_EVENT_BEAR_CHANCE = 0.03;
Game.config.STOCK_EVENT_BULL_CHANCE = 0.97;
Game.config.STOCK_EVENT_BEAR_SHIFT = -0.08;
Game.config.STOCK_EVENT_BULL_SHIFT = 0.1;
Game.config.STOCK_EVENT_CORRELATION_MIN = 0.6;
Game.config.STOCK_EVENT_CORRELATION_RANGE = 0.8;

Game.config.MIN_EVENT_DELAY_MULT = 0.5;
Game.config.MAX_EVENT_DELAY_MULT = 1.5;
