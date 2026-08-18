/* ==========================================================================
   Idle Empire Ultimate - realestate.js
   Real Estate system: purchase, rent, upgrade, maintain 50 property types.
   Rental income flows into the production tracker (stats.totalCoinsEarned).
   Independent from the main civilization tier buildings.
   ========================================================================== */

(function () {
  const RealEstate = {};

  /* ------------------------------------------------------------------
     Property catalogue  (50 types)
     Fields:
       id          – unique string key
       name        – display name
       emoji       – icon
       tier        – 1-10 (cosmetic grouping)
       baseCost    – purchase price (coins)
       baseRent    – coins/second from one owned unit when fully occupied
       maintenancePct – fraction of rent consumed by upkeep (0–0.5)
       maxOwned    – cap on how many the player can own simultaneously
       sellBack    – fraction of purchase price returned on sale (0–0.9)
       desc        – flavour text
  ------------------------------------------------------------------ */
  const PROPERTIES = [
    /* --- Tier 1: Street-level / improvised --- */
    {
      id: "cardboard_box",
      name: "Cardboard Box",
      emoji: "📦",
      tier: 1,
      baseCost: 50,
      baseRent: 0.1,
      maintenancePct: 0.05,
      maxOwned: 20,
      sellBack: 0.4,
      desc: "A surprisingly popular option in the downtown corridor.",
    },
    {
      id: "park_bench",
      name: "Park Bench",
      emoji: "🪑",
      tier: 1,
      baseCost: 150,
      baseRent: 0.25,
      maintenancePct: 0.05,
      maxOwned: 15,
      sellBack: 0.4,
      desc: "Premium outdoor accommodations. Pigeons included.",
    },
    {
      id: "storage_unit",
      name: "Storage Unit",
      emoji: "🗄️",
      tier: 1,
      baseCost: 500,
      baseRent: 0.8,
      maintenancePct: 0.08,
      maxOwned: 10,
      sellBack: 0.5,
      desc: "Climate-controlled, if the AC unit cooperates.",
    },
    {
      id: "parking_lot",
      name: "Parking Lot",
      emoji: "🅿️",
      tier: 1,
      baseCost: 1200,
      baseRent: 1.5,
      maintenancePct: 0.07,
      maxOwned: 10,
      sellBack: 0.5,
      desc: "Just a patch of asphalt. Rent it by the hour.",
    },
    {
      id: "mobile_home",
      name: "Mobile Home",
      emoji: "🚐",
      tier: 1,
      baseCost: 4000,
      baseRent: 3.5,
      maintenancePct: 0.1,
      maxOwned: 8,
      sellBack: 0.5,
      desc: "On wheels — technically mobile, rarely actually moved.",
    },

    /* --- Tier 2: Basic residences --- */
    {
      id: "studio_apartment",
      name: "Studio Apartment",
      emoji: "🛏️",
      tier: 2,
      baseCost: 15000,
      baseRent: 12,
      maintenancePct: 0.1,
      maxOwned: 8,
      sellBack: 0.55,
      desc: "Cozy. Very cozy. The kitchen IS the bedroom.",
    },
    {
      id: "one_bed_flat",
      name: "One-Bedroom Flat",
      emoji: "🏠",
      tier: 2,
      baseCost: 40000,
      baseRent: 30,
      maintenancePct: 0.1,
      maxOwned: 6,
      sellBack: 0.55,
      desc: "A classic starter rental. Leaky faucet not guaranteed.",
    },
    {
      id: "two_bed_flat",
      name: "Two-Bedroom Flat",
      emoji: "🏡",
      tier: 2,
      baseCost: 90000,
      baseRent: 65,
      maintenancePct: 0.12,
      maxOwned: 6,
      sellBack: 0.55,
      desc: "Perfect for a small family or two roommates who hate each other.",
    },
    {
      id: "row_house",
      name: "Row House",
      emoji: "🏘️",
      tier: 2,
      baseCost: 200000,
      baseRent: 140,
      maintenancePct: 0.12,
      maxOwned: 5,
      sellBack: 0.6,
      desc: "One of a long chain of identical neighbours.",
    },
    {
      id: "duplex",
      name: "Duplex",
      emoji: "🏚️",
      tier: 2,
      baseCost: 380000,
      baseRent: 260,
      maintenancePct: 0.13,
      maxOwned: 4,
      sellBack: 0.6,
      desc: "Two units in one. Double the tenants, double the fun.",
    },

    /* --- Tier 3: Mid-range homes --- */
    {
      id: "suburban_house",
      name: "Suburban House",
      emoji: "🏠",
      tier: 3,
      baseCost: 650000,
      baseRent: 420,
      maintenancePct: 0.13,
      maxOwned: 4,
      sellBack: 0.6,
      desc: "White picket fence sold separately.",
    },
    {
      id: "farmhouse",
      name: "Farmhouse",
      emoji: "🌾",
      tier: 3,
      baseCost: 900000,
      baseRent: 580,
      maintenancePct: 0.15,
      maxOwned: 4,
      sellBack: 0.6,
      desc: "Rolling fields, rickety barn, mysterious smells.",
    },
    {
      id: "townhouse",
      name: "Townhouse",
      emoji: "🏙️",
      tier: 3,
      baseCost: 1500000,
      baseRent: 950,
      maintenancePct: 0.13,
      maxOwned: 4,
      sellBack: 0.6,
      desc: "Urban townhouse with a tiny private garden.",
    },
    {
      id: "condo",
      name: "Condominium",
      emoji: "🏢",
      tier: 3,
      baseCost: 2500000,
      baseRent: 1600,
      maintenancePct: 0.14,
      maxOwned: 4,
      sellBack: 0.65,
      desc: "Part of a homeowners association that is politely aggressive.",
    },
    {
      id: "beach_cottage",
      name: "Beach Cottage",
      emoji: "🏖️",
      tier: 3,
      baseCost: 4000000,
      baseRent: 2500,
      maintenancePct: 0.15,
      maxOwned: 3,
      sellBack: 0.65,
      desc: "Salt air adds to renovation costs.",
    },

    /* --- Tier 4: Upscale residences --- */
    {
      id: "luxury_apartment",
      name: "Luxury Apartment",
      emoji: "🛎️",
      tier: 4,
      baseCost: 8000000,
      baseRent: 5000,
      maintenancePct: 0.15,
      maxOwned: 3,
      sellBack: 0.65,
      desc: "Concierge service and heated floors. Tenants are demanding.",
    },
    {
      id: "penthouse",
      name: "Penthouse Suite",
      emoji: "🌃",
      tier: 4,
      baseCost: 20000000,
      baseRent: 13000,
      maintenancePct: 0.15,
      maxOwned: 3,
      sellBack: 0.65,
      desc: "Sky-high views to match sky-high maintenance fees.",
    },
    {
      id: "villa",
      name: "Mediterranean Villa",
      emoji: "🌴",
      tier: 4,
      baseCost: 45000000,
      baseRent: 28000,
      maintenancePct: 0.15,
      maxOwned: 2,
      sellBack: 0.65,
      desc: "Private pool, vineyard, and an army of gardeners.",
    },
    {
      id: "ski_chalet",
      name: "Ski Chalet",
      emoji: "⛷️",
      tier: 4,
      baseCost: 70000000,
      baseRent: 44000,
      maintenancePct: 0.17,
      maxOwned: 2,
      sellBack: 0.65,
      desc: "Seasonal income surges; off-season is expensive.",
    },
    {
      id: "vineyard_estate",
      name: "Vineyard Estate",
      emoji: "🍷",
      tier: 4,
      baseCost: 120000000,
      baseRent: 75000,
      maintenancePct: 0.17,
      maxOwned: 2,
      sellBack: 0.65,
      desc: "Premium grapes and premium guests.",
    },

    /* --- Tier 5: Commercial basics --- */
    {
      id: "corner_shop",
      name: "Corner Shop",
      emoji: "🏪",
      tier: 5,
      baseCost: 200000000,
      baseRent: 120000,
      maintenancePct: 0.18,
      maxOwned: 2,
      sellBack: 0.65,
      desc: "Local community anchor. Always out of milk.",
    },
    {
      id: "strip_mall",
      name: "Strip Mall",
      emoji: "🛍️",
      tier: 5,
      baseCost: 500000000,
      baseRent: 300000,
      maintenancePct: 0.18,
      maxOwned: 2,
      sellBack: 0.65,
      desc: "Six units; three are always vacant.",
    },
    {
      id: "office_building",
      name: "Office Building",
      emoji: "🏣",
      tier: 5,
      baseCost: 1200000000,
      baseRent: 720000,
      maintenancePct: 0.18,
      maxOwned: 2,
      sellBack: 0.65,
      desc: "Fluorescent lights and printer jams included.",
    },
    {
      id: "warehouse",
      name: "Industrial Warehouse",
      emoji: "🏭",
      tier: 5,
      baseCost: 2500000000,
      baseRent: 1500000,
      maintenancePct: 0.2,
      maxOwned: 2,
      sellBack: 0.65,
      desc: "Cold, cavernous, and always in demand.",
    },
    {
      id: "hotel",
      name: "Boutique Hotel",
      emoji: "🏨",
      tier: 5,
      baseCost: 5000000000,
      baseRent: 3000000,
      maintenancePct: 0.2,
      maxOwned: 2,
      sellBack: 0.65,
      desc: "Twelve rooms, a spa, and one perpetually broken elevator.",
    },

    /* --- Tier 6: Large commercial / mixed use --- */
    {
      id: "apartment_complex",
      name: "Apartment Complex",
      emoji: "🏗️",
      tier: 6,
      baseCost: 12000000000,
      baseRent: 7200000,
      maintenancePct: 0.2,
      maxOwned: 2,
      sellBack: 0.7,
      desc: "Hundreds of units; hundreds of complaints.",
    },
    {
      id: "shopping_centre",
      name: "Shopping Centre",
      emoji: "🛒",
      tier: 6,
      baseCost: 30000000000,
      baseRent: 18000000,
      maintenancePct: 0.2,
      maxOwned: 2,
      sellBack: 0.7,
      desc: "Anchor tenants keep the riff-raff at bay.",
    },
    {
      id: "resort",
      name: "Beach Resort",
      emoji: "🏝️",
      tier: 6,
      baseCost: 70000000000,
      baseRent: 42000000,
      maintenancePct: 0.22,
      maxOwned: 2,
      sellBack: 0.7,
      desc: "Infinity pool, five restaurants, hurricane insurance nightmare.",
    },
    {
      id: "stadium",
      name: "Sports Stadium",
      emoji: "🏟️",
      tier: 6,
      baseCost: 150000000000,
      baseRent: 90000000,
      maintenancePct: 0.22,
      maxOwned: 2,
      sellBack: 0.7,
      desc: "Event nights are profitable; off days are costly.",
    },
    {
      id: "hospital_complex",
      name: "Medical Campus",
      emoji: "🏥",
      tier: 6,
      baseCost: 300000000000,
      baseRent: 180000000,
      maintenancePct: 0.22,
      maxOwned: 1,
      sellBack: 0.7,
      desc: "Steady tenants who never, ever leave.",
    },

    /* --- Tier 7: Prestige commercial --- */
    {
      id: "5star_hotel",
      name: "Five-Star Grand Hotel",
      emoji: "⭐",
      tier: 7,
      baseCost: 700000000000,
      baseRent: 420000000,
      maintenancePct: 0.22,
      maxOwned: 1,
      sellBack: 0.7,
      desc: "Marble floors, butler service, Michelin stars.",
    },
    {
      id: "tech_campus",
      name: "Tech Campus",
      emoji: "💻",
      tier: 7,
      baseCost: 1500000000000,
      baseRent: 900000000,
      maintenancePct: 0.23,
      maxOwned: 1,
      sellBack: 0.7,
      desc: "Ping-pong tables cost more than some buildings.",
    },
    {
      id: "data_center_tower",
      name: "Data Centre Tower",
      emoji: "🖥️",
      tier: 7,
      baseCost: 3000000000000,
      baseRent: 1800000000,
      maintenancePct: 0.23,
      maxOwned: 1,
      sellBack: 0.7,
      desc: "Cooling costs alone could fund a small nation.",
    },
    {
      id: "financial_tower",
      name: "Financial District Tower",
      emoji: "💹",
      tier: 7,
      baseCost: 6000000000000,
      baseRent: 3600000000,
      maintenancePct: 0.23,
      maxOwned: 1,
      sellBack: 0.7,
      desc: "Glass and steel monument to compound interest.",
    },
    {
      id: "convention_centre",
      name: "Convention Centre",
      emoji: "🎪",
      tier: 7,
      baseCost: 12000000000000,
      baseRent: 7200000000,
      maintenancePct: 0.24,
      maxOwned: 1,
      sellBack: 0.7,
      desc: "Expo season brings rivers of gold.",
    },

    /* --- Tier 8: Mega-structures --- */
    {
      id: "skyscraper",
      name: "City Skyscraper",
      emoji: "🏙️",
      tier: 8,
      baseCost: 30000000000000,
      baseRent: 18000000000,
      maintenancePct: 0.24,
      maxOwned: 1,
      sellBack: 0.72,
      desc: "A landmark silhouette on the city skyline.",
    },
    {
      id: "luxury_tower",
      name: "Luxury Residential Tower",
      emoji: "🌆",
      tier: 8,
      baseCost: 70000000000000,
      baseRent: 42000000000,
      maintenancePct: 0.24,
      maxOwned: 1,
      sellBack: 0.72,
      desc: "Floors dedicated to penthouses all the way down.",
    },
    {
      id: "supertall",
      name: "Supertall Skyscraper",
      emoji: "🗼",
      tier: 8,
      baseCost: 150000000000000,
      baseRent: 90000000000,
      maintenancePct: 0.25,
      maxOwned: 1,
      sellBack: 0.72,
      desc: "Over 600 m. Winds make elevator rides interesting.",
    },
    {
      id: "mega_mall",
      name: "Mega Mall",
      emoji: "🛍️",
      tier: 8,
      baseCost: 300000000000000,
      baseRent: 180000000000,
      maintenancePct: 0.25,
      maxOwned: 1,
      sellBack: 0.72,
      desc: "Its own ZIP code. And its own monorail.",
    },
    {
      id: "floating_city",
      name: "Floating City Platform",
      emoji: "⛴️",
      tier: 8,
      baseCost: 600000000000000,
      baseRent: 360000000000,
      maintenancePct: 0.26,
      maxOwned: 1,
      sellBack: 0.72,
      desc: "International waters, zero regulations, maximum rent.",
    },

    /* --- Tier 9: Iconic landmarks --- */
    {
      id: "island_resort",
      name: "Private Island Resort",
      emoji: "🏝️",
      tier: 9,
      baseCost: 1500000000000000,
      baseRent: 900000000000,
      maintenancePct: 0.26,
      maxOwned: 1,
      sellBack: 0.75,
      desc: "Your island. Your rules.",
    },
    {
      id: "space_hotel",
      name: "Space Station Hotel",
      emoji: "🛸",
      tier: 9,
      baseCost: 4000000000000000,
      baseRent: 2400000000000,
      maintenancePct: 0.27,
      maxOwned: 1,
      sellBack: 0.75,
      desc: "Zero gravity suite. Rates are astronomical.",
    },
    {
      id: "underwater_dome",
      name: "Underwater Dome Residence",
      emoji: "🌊",
      tier: 9,
      baseCost: 10000000000000000,
      baseRent: 6000000000000,
      maintenancePct: 0.27,
      maxOwned: 1,
      sellBack: 0.75,
      desc: "Sharks peer in envy. Pressure hull maintenance is brutal.",
    },
    {
      id: "arctic_complex",
      name: "Arctic Luxury Complex",
      emoji: "🧊",
      tier: 9,
      baseCost: 25000000000000000,
      baseRent: 15000000000000,
      maintenancePct: 0.28,
      maxOwned: 1,
      sellBack: 0.75,
      desc: "Northern Lights viewing. Heating bill to match.",
    },
    {
      id: "volcano_fortress",
      name: "Volcanic Island Fortress",
      emoji: "🌋",
      tier: 9,
      baseCost: 60000000000000000,
      baseRent: 36000000000000,
      maintenancePct: 0.28,
      maxOwned: 1,
      sellBack: 0.75,
      desc: "Supervillain aesthetic. Occasional lava damage.",
    },

    /* --- Tier 10: Dubai / ultra-premium --- */
    {
      id: "dubai_palace",
      name: "Dubai Gold Palace",
      emoji: "👑",
      tier: 10,
      baseCost: 200000000000000000,
      baseRent: 120000000000000,
      maintenancePct: 0.28,
      maxOwned: 1,
      sellBack: 0.8,
      desc: "Every surface gilded. Chandeliers weigh a ton.",
    },
    {
      id: "artificial_island_complex",
      name: "Artificial Island Complex",
      emoji: "🌴",
      tier: 10,
      baseCost: 600000000000000000,
      baseRent: 360000000000000,
      maintenancePct: 0.28,
      maxOwned: 1,
      sellBack: 0.8,
      desc: "Palm-shaped. Sand imported from four countries.",
    },
    {
      id: "megatower",
      name: "Megatower (1 km+)",
      emoji: "🗼",
      tier: 10,
      baseCost: 1500000000000000000,
      baseRent: 900000000000000,
      maintenancePct: 0.29,
      maxOwned: 1,
      sellBack: 0.8,
      desc: "Visible from orbit. Redefines the city's skyline forever.",
    },
    {
      id: "trillion_skyscraper",
      name: "Trillion-Dollar Dubai Skyscraper",
      emoji: "💎",
      tier: 10,
      baseCost: 5000000000000000000,
      baseRent: 3000000000000000,
      maintenancePct: 0.3,
      maxOwned: 1,
      sellBack: 0.8,
      desc: "The pinnacle of real estate. Gold-clad, cloud-piercing, incomprehensible luxury.",
    },
  ];

  /* Build a lookup map */
  const PROPERTY_MAP = {};
  PROPERTIES.forEach((p) => (PROPERTY_MAP[p.id] = p));

  /* Expose catalogue */
  RealEstate.properties = PROPERTIES;
  RealEstate.propertyMap = PROPERTY_MAP;

  /* ------------------------------------------------------------------
     Real-estate-specific events
     Each event has:
       id, name, desc, weight, duration (seconds), positive (bool), kind:
         "rent_modifier"       – multiplies rental income (value = mult)
         "maintenance_modifier"– multiplies maintenance cost (value = mult)
         "maintenance_fee"     – one-time coin deduction (value = fraction of portfolio value)
         "windfall"            – bonus lump-sum coins (value = seconds of current rental income)
  ------------------------------------------------------------------ */
  const RE_EVENTS = [
    /* Positive */
    {
      id: "re_boom",
      name: "Real Estate Boom",
      emoji: "📈",
      desc: "Surging demand boosts rental income by 50% for a while.",
      weight: 8,
      duration: 120,
      kind: "rent_modifier",
      value: 1.5,
      positive: true,
    },
    {
      id: "re_tourism_surge",
      name: "Tourism Surge",
      emoji: "✈️",
      desc: "A flood of tourists drives vacancy to zero and rents up 30%.",
      weight: 8,
      duration: 90,
      kind: "rent_modifier",
      value: 1.3,
      positive: true,
    },
    {
      id: "re_tax_break",
      name: "Property Tax Holiday",
      emoji: "🎉",
      desc: "A government tax break cuts maintenance costs in half.",
      weight: 7,
      duration: 180,
      kind: "maintenance_modifier",
      value: 0.5,
      positive: true,
    },
    {
      id: "re_renovation_windfall",
      name: "Renovation Windfall",
      emoji: "🔨",
      desc: "Smart renovations boost property value — bonus rent payout worth 1 minute of income.",
      weight: 6,
      duration: 0,
      kind: "windfall",
      value: 60,
      positive: true,
    },
    {
      id: "re_tech_tenant",
      name: "Tech Company Signs Long Lease",
      emoji: "💼",
      desc: "A lucrative tech tenant floods your commercial properties with cash.",
      weight: 5,
      duration: 200,
      kind: "rent_modifier",
      value: 2.0,
      positive: true,
    },
    {
      id: "re_celebrity_tenant",
      name: "Celebrity Tenant",
      emoji: "⭐",
      desc: "Fame attracts more applicants — rent income up 25%.",
      weight: 5,
      duration: 150,
      kind: "rent_modifier",
      value: 1.25,
      positive: true,
    },
    {
      id: "re_infrastructure_boost",
      name: "New Transit Line Nearby",
      emoji: "🚇",
      desc: "New metro station nearby raises property desirability.",
      weight: 7,
      duration: 300,
      kind: "rent_modifier",
      value: 1.2,
      positive: true,
    },
    {
      id: "re_insurance_rebate",
      name: "Insurance Rebate",
      emoji: "📋",
      desc: "Your insurer issues a rebate — bonus payout worth 30 seconds of income.",
      weight: 6,
      duration: 0,
      kind: "windfall",
      value: 30,
      positive: true,
    },

    /* Negative */
    {
      id: "re_recession",
      name: "Housing Recession",
      emoji: "📉",
      desc: "Market downturn cuts rental income by 35% for a while.",
      weight: 8,
      duration: 120,
      kind: "rent_modifier",
      value: 0.65,
      positive: false,
    },
    {
      id: "re_plumbing_emergency",
      name: "Plumbing Emergency",
      emoji: "🚿",
      desc: "Burst pipes across multiple properties require urgent repairs.",
      weight: 9,
      duration: 0,
      kind: "maintenance_fee",
      value: 0.02,
      positive: false,
    },
    {
      id: "re_roof_collapse",
      name: "Roof Damage",
      emoji: "🌧️",
      desc: "Severe storm damage forces emergency roof repairs.",
      weight: 7,
      duration: 0,
      kind: "maintenance_fee",
      value: 0.04,
      positive: false,
    },
    {
      id: "re_tenant_dispute",
      name: "Tenant Legal Dispute",
      emoji: "⚖️",
      desc: "Costly legal proceedings reduce net rental income.",
      weight: 8,
      duration: 90,
      kind: "rent_modifier",
      value: 0.8,
      positive: false,
    },
    {
      id: "re_vacancy_wave",
      name: "Vacancy Wave",
      emoji: "🚪",
      desc: "Several tenants leave simultaneously — income drops 40%.",
      weight: 7,
      duration: 100,
      kind: "rent_modifier",
      value: 0.6,
      positive: false,
    },
    {
      id: "re_pest_infestation",
      name: "Pest Infestation",
      emoji: "🐀",
      desc: "Exterminators cost a fortune and tenants are unhappy.",
      weight: 7,
      duration: 0,
      kind: "maintenance_fee",
      value: 0.015,
      positive: false,
    },
    {
      id: "re_hoa_fine",
      name: "HOA Violation Fine",
      emoji: "📝",
      desc: "A homeowners association levies a stiff penalty.",
      weight: 6,
      duration: 0,
      kind: "maintenance_fee",
      value: 0.01,
      positive: false,
    },
    {
      id: "re_rent_freeze",
      name: "Government Rent Freeze",
      emoji: "🏛️",
      desc: "Authorities cap rent increases — income stagnates.",
      weight: 6,
      duration: 240,
      kind: "rent_modifier",
      value: 0.75,
      positive: false,
    },
    {
      id: "re_elevator_breakdown",
      name: "Elevator Breakdown",
      emoji: "🛗",
      desc: "Tenants are furious; repairs are expensive.",
      weight: 7,
      duration: 60,
      kind: "rent_modifier",
      value: 0.85,
      positive: false,
    },
    {
      id: "re_fire_inspection_fail",
      name: "Fire Code Violation",
      emoji: "🔥",
      desc: "Mandatory upgrades required — heavy maintenance cost.",
      weight: 6,
      duration: 0,
      kind: "maintenance_fee",
      value: 0.03,
      positive: false,
    },
    {
      id: "re_earthquake_damage",
      name: "Minor Earthquake Damage",
      emoji: "🏚️",
      desc: "Structural cracks need immediate attention.",
      weight: 4,
      duration: 0,
      kind: "maintenance_fee",
      value: 0.05,
      positive: false,
    },
    {
      id: "re_mold_outbreak",
      name: "Mold Outbreak",
      emoji: "🍄",
      desc: "Toxic mold forces partial evacuation and remediation.",
      weight: 6,
      duration: 80,
      kind: "rent_modifier",
      value: 0.7,
      positive: false,
    },
  ];

  const RE_EVENT_MAP = {};
  RE_EVENTS.forEach((e) => (RE_EVENT_MAP[e.id] = e));

  RealEstate.events = RE_EVENTS;

  /* ------------------------------------------------------------------
     Upgrade multipliers (1 upgrade slot per property, up to 5 levels)
     Each upgrade increases baseRent by 20% (compounding).
  ------------------------------------------------------------------ */
  const UPGRADE_RENT_BONUS = 0.2; // +20% rent per upgrade level
  const MAX_UPGRADE_LEVEL = 5;

  /* ------------------------------------------------------------------
     State helpers
  ------------------------------------------------------------------ */
  function reState() {
    if (!Game.state.realEstate) Game.state.realEstate = RealEstate.defaultRealEstateState();
    return Game.state.realEstate;
  }

  RealEstate.defaultRealEstateState = function () {
    const owned = {};
    const upgrades = {};
    PROPERTIES.forEach((p) => {
      owned[p.id] = 0;
      upgrades[p.id] = 0;
    });
    return {
      owned,
      upgrades,
      activeEvents: [],
      nextEventTime: 0,
      totalEarned: 0,
      totalSpent: 0,
    };
  };

  /* ------------------------------------------------------------------
     Cost / income calculations
  ------------------------------------------------------------------ */

  /* Purchase price of a single additional unit (scales slightly with owned) */
  RealEstate.buyPrice = function (id) {
    const p = PROPERTY_MAP[id];
    if (!p) return Infinity;
    const re = reState();
    const owned = re.owned[id] || 0;
    // Mild inflation: each unit costs 15% more than the previous
    return Math.ceil(p.baseCost * Math.pow(1.15, owned));
  };

  /* Sell proceeds for one unit */
  RealEstate.sellPrice = function (id) {
    const p = PROPERTY_MAP[id];
    if (!p) return 0;
    return Math.floor(p.baseCost * p.sellBack);
  };

  /* Net rent per second from a single unit of the property */
  RealEstate.unitRentPerSecond = function (id) {
    const p = PROPERTY_MAP[id];
    if (!p) return 0;
    const re = reState();
    const upgradeLevel = re.upgrades[id] || 0;
    const upgradeMult = Math.pow(1 + UPGRADE_RENT_BONUS, upgradeLevel);
    const rentModifier = RealEstate.activeRentModifier();
    const maintenanceMod = RealEstate.activeMaintenanceModifier();
    const net = p.baseRent * upgradeMult * (1 - p.maintenancePct * maintenanceMod) * rentModifier;
    return Math.max(0, net);
  };

  /* Total portfolio net rent per second */
  RealEstate.totalRentPerSecond = function () {
    const re = reState();
    let total = 0;
    PROPERTIES.forEach((p) => {
      const count = re.owned[p.id] || 0;
      if (count > 0) total += count * RealEstate.unitRentPerSecond(p.id);
    });
    return total;
  };

  /* Total portfolio value (for maintenance fee calculations) */
  RealEstate.portfolioValue = function () {
    const re = reState();
    let total = 0;
    PROPERTIES.forEach((p) => {
      total += (re.owned[p.id] || 0) * p.baseCost;
    });
    return total;
  };

  /* Upgrade cost for the next level of a property */
  RealEstate.upgradeCost = function (id) {
    const p = PROPERTY_MAP[id];
    if (!p) return Infinity;
    const re = reState();
    const level = re.upgrades[id] || 0;
    if (level >= MAX_UPGRADE_LEVEL) return Infinity;
    // upgrade costs 50% of base cost per level
    return Math.ceil(p.baseCost * 0.5 * (level + 1));
  };

  /* ------------------------------------------------------------------
     Event modifiers (read active events on the RE sub-state)
  ------------------------------------------------------------------ */
  RealEstate.activeRentModifier = function () {
    const re = reState();
    let mult = 1;
    re.activeEvents.forEach(function (ev) {
      const def = RE_EVENT_MAP[ev.id];
      if (def && def.kind === "rent_modifier") mult *= def.value;
    });
    return mult;
  };

  RealEstate.activeMaintenanceModifier = function () {
    const re = reState();
    let mult = 1;
    re.activeEvents.forEach(function (ev) {
      const def = RE_EVENT_MAP[ev.id];
      if (def && def.kind === "maintenance_modifier") mult *= def.value;
    });
    return mult;
  };

  /* ------------------------------------------------------------------
     Actions
  ------------------------------------------------------------------ */

  RealEstate.buy = function (id) {
    const p = PROPERTY_MAP[id];
    if (!p) return false;
    const re = reState();
    const owned = re.owned[id] || 0;
    if (owned >= p.maxOwned) return false;
    const price = RealEstate.buyPrice(id);
    if (Game.state.coins < price) return false;
    Game.state.coins -= price;
    Game.state.stats.totalCoinsSpent = (Game.state.stats.totalCoinsSpent || 0) + price;
    re.owned[id] = owned + 1;
    re.totalSpent = (re.totalSpent || 0) + price;
    Game.recalculate();
    return true;
  };

  RealEstate.sell = function (id) {
    const p = PROPERTY_MAP[id];
    if (!p) return false;
    const re = reState();
    const owned = re.owned[id] || 0;
    if (owned <= 0) return false;
    const proceeds = RealEstate.sellPrice(id);
    // Sell is a return of capital — credit coins only, do not inflate lifetime totals.
    Game.state.coins += proceeds;
    re.owned[id] = owned - 1;
    // Reset upgrades when last unit is sold
    if (re.owned[id] === 0) re.upgrades[id] = 0;
    Game.recalculate();
    return true;
  };

  RealEstate.upgrade = function (id) {
    const p = PROPERTY_MAP[id];
    if (!p) return false;
    const re = reState();
    if ((re.owned[id] || 0) <= 0) return false;
    const level = re.upgrades[id] || 0;
    if (level >= MAX_UPGRADE_LEVEL) return false;
    const cost = RealEstate.upgradeCost(id);
    if (Game.state.coins < cost) return false;
    Game.state.coins -= cost;
    Game.state.stats.totalCoinsSpent = (Game.state.stats.totalCoinsSpent || 0) + cost;
    re.upgrades[id] = level + 1;
    re.totalSpent = (re.totalSpent || 0) + cost;
    return true;
  };

  /* ------------------------------------------------------------------
     Event system (runs independently from the global events system)
  ------------------------------------------------------------------ */
  const RE_EVENT_MIN_DELAY = 45;  // seconds
  const RE_EVENT_MAX_DELAY = 180; // seconds

  RealEstate.scheduleNextEvent = function () {
    const re = reState();
    const delay = RE_EVENT_MIN_DELAY + Math.random() * (RE_EVENT_MAX_DELAY - RE_EVENT_MIN_DELAY);
    re.nextEventTime = (Game.state.stats.playTime || 0) + delay;
  };

  RealEstate.pickEvent = function () {
    const total = RE_EVENTS.reduce((s, e) => s + e.weight, 0);
    let roll = Math.random() * total;
    for (let i = 0; i < RE_EVENTS.length; i++) {
      roll -= RE_EVENTS[i].weight;
      if (roll <= 0) return RE_EVENTS[i];
    }
    return RE_EVENTS[0];
  };

  RealEstate.triggerEvent = function (def) {
    const re = reState();
    const s = Game.state;

    if (def.kind === "maintenance_fee") {
      const portfolioVal = RealEstate.portfolioValue();
      const fee = portfolioVal * def.value;
      if (fee > 0) {
        // Deduct from coins (clamped at 0)
        const actual = Math.min(fee, s.coins);
        s.coins -= actual;
        // Does NOT subtract from lifetimeCoins (maintenance is pure spending)
        s.stats.totalCoinsSpent = (s.stats.totalCoinsSpent || 0) + actual;
      }
    } else if (def.kind === "windfall") {
      // value = seconds of current rental income to award as a lump sum
      const bonus = RealEstate.totalRentPerSecond() * def.value;
      if (bonus > 0) {
        s.coins += bonus;
        s.lifetimeCoins += bonus;
        s.stats.totalCoinsEarned = (s.stats.totalCoinsEarned || 0) + bonus;
        re.totalEarned = (re.totalEarned || 0) + bonus;
        s.stats.realEstateEarned = (s.stats.realEstateEarned || 0) + bonus;
      }
    } else {
      // Timed modifier event
      re.activeEvents.push({
        id: def.id,
        endTime: (s.stats.playTime || 0) + def.duration,
      });
    }

    // Show toast notification if UI is available
    if (s.settings && s.settings.notifications && Game.UI && Game.UI.toast) {
      const toastType = def.positive ? "event" : "warn";
      Game.UI.toast("🏠 Real Estate: " + def.name + " — " + def.desc, toastType);
    }
  };

  /* ------------------------------------------------------------------
     Tick – called every game tick
  ------------------------------------------------------------------ */
  RealEstate.update = function (dtSeconds) {
    // Only fire events if the player has at least one property
    const re = reState();
    const s = Game.state;
    const hasProperties = PROPERTIES.some((p) => (re.owned[p.id] || 0) > 0);

    // Expire finished timed events
    if (re.activeEvents.length) {
      const before = re.activeEvents.length;
      re.activeEvents = re.activeEvents.filter(function (ev) {
        return ev.endTime > (s.stats.playTime || 0);
      });
      if (re.activeEvents.length !== before) Game.recalculate && Game.recalculate();
    }

    if (hasProperties) {
      // Schedule first event if not yet scheduled
      if (!re.nextEventTime || re.nextEventTime <= 0) {
        RealEstate.scheduleNextEvent();
      }

      // Fire event if due
      if ((s.stats.playTime || 0) >= re.nextEventTime) {
        const def = RealEstate.pickEvent();
        RealEstate.triggerEvent(def);
        RealEstate.scheduleNextEvent();
      }

      // Collect rental income
      const rent = RealEstate.totalRentPerSecond() * dtSeconds;
      if (rent > 0) {
        s.coins += rent;
        s.lifetimeCoins += rent;
        s.stats.totalCoinsEarned = (s.stats.totalCoinsEarned || 0) + rent;
        re.totalEarned = (re.totalEarned || 0) + rent;
        s.stats.realEstateEarned = (s.stats.realEstateEarned || 0) + rent;
      }
    }
  };

  /* ------------------------------------------------------------------
     Helpers for UI
  ------------------------------------------------------------------ */
  RealEstate.maxUpgradeLevel = MAX_UPGRADE_LEVEL;
  RealEstate.upgradeRentBonus = UPGRADE_RENT_BONUS;

  RealEstate.activeEventList = function () {
    const re = reState();
    const s = Game.state;
    return re.activeEvents.map(function (ev) {
      const def = RE_EVENT_MAP[ev.id];
      return {
        name: def ? def.name : ev.id,
        emoji: def ? def.emoji : "❓",
        desc: def ? def.desc : "",
        remaining: Math.max(0, ev.endTime - (s.stats.playTime || 0)),
      };
    });
  };

  /* Format large numbers */
  RealEstate.fmt = function (n) {
    if (typeof Game !== "undefined" && Game.UI && Game.UI.fmt) return Game.UI.fmt(n);
    if (n >= 1e18) return (n / 1e18).toFixed(2) + "Qi";
    if (n >= 1e15) return (n / 1e15).toFixed(2) + "Qa";
    if (n >= 1e12) return (n / 1e12).toFixed(2) + "T";
    if (n >= 1e9)  return (n / 1e9).toFixed(2)  + "B";
    if (n >= 1e6)  return (n / 1e6).toFixed(2)  + "M";
    if (n >= 1e3)  return (n / 1e3).toFixed(2)  + "K";
    return Math.floor(n).toLocaleString();
  };

  Game.RealEstate = RealEstate;
})();
