/* ==========================================================================
   Idle Empire Ultimate - gambling.js
   Mega Casino, horse racing and car racing systems.
   ========================================================================== */

(function () {
  const cfg = Game.config;
  const Gambling = {};
  let uidCounter = 0;

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function randRange(min, max) {
    return min + Math.random() * (max - min);
  }

  function randInt(min, max) {
    return Math.floor(randRange(min, max + 1));
  }

  function pick(list) {
    return list[Math.floor(Math.random() * list.length)];
  }

  function weightedPick(list) {
    const total = list.reduce((sum, item) => sum + (item.weight || 1), 0);
    let roll = Math.random() * total;
    for (let i = 0; i < list.length; i++) {
      roll -= list[i].weight || 1;
      if (roll <= 0) return list[i];
    }
    return list[list.length - 1];
  }

  function shuffle(list) {
    const copy = list.slice();
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const tmp = copy[i];
      copy[i] = copy[j];
      copy[j] = tmp;
    }
    return copy;
  }

  function createId(prefix) {
    uidCounter += 1;
    return prefix + "_" + Date.now().toString(36) + "_" + uidCounter.toString(36);
  }

  function ensureNumber(obj, key, fallback) {
    if (typeof obj[key] !== "number" || Number.isNaN(obj[key])) obj[key] = fallback;
  }

  function ensureArray(obj, key, fallback) {
    if (!Array.isArray(obj[key])) obj[key] = fallback || [];
  }

  function ensureObject(obj, key, fallback) {
    if (!obj[key] || typeof obj[key] !== "object" || Array.isArray(obj[key])) obj[key] = fallback || {};
  }

  function roundCurrency(value) {
    return Math.max(0, Math.round(value));
  }

  function sanitizeBet(bet) {
    const amount = Math.floor(bet || 0);
    if (amount < cfg.CASINO_MIN_BET) return 0;
    return clamp(amount, cfg.CASINO_MIN_BET, cfg.CASINO_MAX_BET);
  }

  function canAffordChips(amount) {
    return amount > 0 && Game.state.gambling.chips >= amount;
  }

  function spendChips(amount) {
    if (!canAffordChips(amount)) return false;
    Game.state.gambling.chips -= amount;
    return true;
  }

  function addCoins(amount) {
    if (amount <= 0) return;
    Game.state.coins += amount;
    Game.state.lifetimeCoins += amount;
    Game.state.stats.totalCoinsEarned += amount;
  }

  function spendCoins(amount) {
    amount = Math.max(0, amount || 0);
    if (Game.state.coins < amount) return false;
    Game.state.coins -= amount;
    Game.state.stats.totalCoinsSpent += amount;
    return true;
  }

  function cardText(card) {
    if (!card) return "?";
    return card.rank + card.suit;
  }

  function cardIsRed(card) {
    return !!card && (card.suit === "♥" || card.suit === "♦");
  }

  function createDeck() {
    const suits = ["♠", "♥", "♦", "♣"];
    const ranks = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];
    const deck = [];
    suits.forEach((suit) => {
      ranks.forEach((rank) => {
        deck.push({
          rank,
          suit,
          value: rank === "A" ? 11 : ["K", "Q", "J"].includes(rank) ? 10 : parseInt(rank, 10),
        });
      });
    });
    return shuffle(deck);
  }

  function drawCard(deck) {
    return deck.pop();
  }

  function blackjackValue(hand) {
    let total = 0;
    let aces = 0;
    hand.forEach((card) => {
      total += card.value;
      if (card.rank === "A") aces += 1;
    });
    while (total > 21 && aces > 0) {
      total -= 10;
      aces -= 1;
    }
    return {
      best: total,
      soft: aces > 0,
      blackjack: hand.length === 2 && total === 21,
      bust: total > 21,
    };
  }

  function ensureBlackjackDeck() {
    const bj = Game.state.gambling.blackjackState;
    if (!Array.isArray(bj.deck) || bj.deck.length < 15) bj.deck = createDeck();
  }

  function scoreCasinoGame(statKey, bet, payout) {
    const g = Game.state.gambling;
    const stats = g[statKey];
    g.gamesPlayed += 1;
    stats.played += 1;
    const net = payout - bet;
    if (net > 0) {
      g.gamesWon += 1;
      stats.won += 1;
      g.totalChipsWon += net;
    } else if (net < 0) {
      g.totalChipsLost += -net;
    }
  }

  function averageHorseStats(horse) {
    return (horse.speed + horse.stamina + horse.agility) / 3;
  }

  function horseTier(horse) {
    return clamp(Math.ceil(averageHorseStats(horse) / 15), 1, 10);
  }

  function horseActionCost(horse, action) {
    const tier = horseTier(horse);
    if (action === "feed") return 50 * tier;
    if (action === "train") return 200 * tier;
    return 0;
  }

  function horsePurchaseCost(horse) {
    const avg = averageHorseStats(horse);
    const value = avg * avg * avg * 0.85 + horse.form * 900 + horse.condition * 700 + (5 - horse.age) * 10000;
    return clamp(roundCurrency(value / 1000) * 1000, 5000, 2000000);
  }

  function buildHorseName() {
    return pick(cfg.horseNamePrefixes) + " " + pick(cfg.horseNameSuffixes);
  }

  function createHorseFromBreed(breedDef) {
    const horse = {
      id: createId("horse"),
      name: buildHorseName(),
      breed: breedDef.name,
      age: randInt(2, 4),
      speed: randInt(breedDef.speed[0], breedDef.speed[1]),
      stamina: randInt(breedDef.stamina[0], breedDef.stamina[1]),
      agility: randInt(breedDef.agility[0], breedDef.agility[1]),
      form: randInt(45, 85),
      condition: randInt(70, 100),
      training: 0,
      jockey: pick(cfg.horseJockeyNames),
      wins: 0,
      places: 0,
      races: 0,
      retired: false,
      purchaseCost: 0,
      upkeepPerMin: 0,
      resting: false,
      lastAction: "rest",
      prestigeBonus: 0,
      premiumJockeyRaces: 0,
      actionTimer: 0,
      pendingAction: "",
      ageStep: 0,
    };
    horse.purchaseCost = horsePurchaseCost(horse);
    horse.upkeepPerMin = Math.max(20, roundCurrency(horse.purchaseCost * 0.00055));
    return horse;
  }

  function buildNpcHorse(def) {
    return {
      id: def.id,
      name: def.name,
      breed: def.breed,
      age: def.age,
      speed: def.speed,
      stamina: def.stamina,
      agility: def.agility,
      form: randInt(52, 88),
      condition: randInt(78, 100),
      training: 0,
      jockey: def.jockey,
      wins: 0,
      places: 0,
      races: 0,
      retired: false,
      purchaseCost: 0,
      upkeepPerMin: 0,
      resting: false,
      lastAction: "race",
      prestigeBonus: 0,
      premiumJockeyRaces: 0,
      actionTimer: 0,
      pendingAction: "",
      isNpc: true,
    };
  }

  function availableHorsesForRace() {
    return Game.state.horses.owned
      .filter((horse) => !horse.retired && !horse.resting && !(horse.actionTimer > 0) && horse.condition >= 15)
      .sort((a, b) => Gambling._horseRaceScore(b, true) - Gambling._horseRaceScore(a, true))
      .slice(0, 3);
  }

  function createUpcomingHorseRace() {
    const playerEntries = availableHorsesForRace().map((horse) => ({
      id: horse.id,
      name: horse.name,
      horse,
      owned: true,
      breed: horse.breed,
      label: horse.name + " (You)",
    }));
    const npcEntries = cfg.horseNpcRoster.map((def) => {
      const npcHorse = buildNpcHorse(def);
      return {
        id: npcHorse.id,
        name: npcHorse.name,
        horse: npcHorse,
        owned: false,
        breed: npcHorse.breed,
        label: npcHorse.name,
      };
    });
    const entries = npcEntries.concat(playerEntries);
    const baselines = entries.map((entry) => ({
      id: entry.id,
      value: Gambling._horseRaceScore(entry.horse, true),
    }));
    const total = baselines.reduce((sum, row) => sum + row.value, 0) || 1;
    entries.forEach((entry) => {
      const chance = clamp((baselines.find((row) => row.id === entry.id).value || 1) / total, 0.03, 0.45);
      entry.odds = {
        win: clamp(Math.round((0.86 / chance) * 100) / 100, 3, 8),
        place: clamp(Math.round((0.5 / chance) * 100) / 100, 2, 4),
        show: clamp(Math.round((0.32 / chance) * 100) / 100, 1.5, 2),
      };
    });
    return {
      createdAt: Date.now(),
      entries,
      bettingOpen: true,
    };
  }

  function carUpgradeCost(level) {
    return 5000 * Math.pow(3, level || 0);
  }

  function averageCarStats(car) {
    return (car.enginePower + car.handling + car.reliability + car.aerodynamics) / 4;
  }

  function carPurchaseCost(car) {
    const avg = averageCarStats(car);
    const value = Math.pow(avg, 4) * 0.05 + car.year * 120 + car.condition * 1500 + car.fuelCapacity * 500;
    return clamp(roundCurrency(value / 1000) * 1000, 50000, 10000000);
  }

  function buildCarName(makeDef) {
    return pick(cfg.carNamePrefixes) + " " + pick(cfg.carNameSuffixes) + " " + makeDef.modelPrefix;
  }

  function createCarFromMake(makeDef) {
    const car = {
      id: createId("car"),
      name: buildCarName(makeDef),
      make: makeDef.name,
      model: pick(makeDef.models),
      year: randInt(2016, 2026),
      enginePower: randInt(makeDef.enginePower[0], makeDef.enginePower[1]),
      handling: randInt(makeDef.handling[0], makeDef.handling[1]),
      reliability: randInt(makeDef.reliability[0], makeDef.reliability[1]),
      aerodynamics: randInt(makeDef.aerodynamics[0], makeDef.aerodynamics[1]),
      fuel: randInt(60, 100),
      fuelCapacity: 100,
      condition: randInt(70, 100),
      upgrades: { engine: 0, tires: 0, aero: 0, chassis: 0, fuel: 0 },
      driver: pick(cfg.carDriverNames),
      wins: 0,
      podiums: 0,
      races: 0,
      retired: false,
      purchaseCost: 0,
      upkeepPerMin: 0,
      tuning: { aggression: randInt(35, 65), fuelMode: "normal" },
    };
    car.purchaseCost = carPurchaseCost(car);
    car.upkeepPerMin = Math.max(200, roundCurrency(car.purchaseCost * 0.0004));
    return car;
  }

  function buildNpcCar(def) {
    return {
      id: def.id,
      name: def.name,
      make: def.make,
      model: def.model,
      year: def.year,
      enginePower: def.enginePower,
      handling: def.handling,
      reliability: def.reliability,
      aerodynamics: def.aerodynamics,
      fuel: def.fuelCapacity,
      fuelCapacity: def.fuelCapacity,
      condition: randInt(82, 100),
      upgrades: { engine: 0, tires: 0, aero: 0, chassis: 0, fuel: 0 },
      driver: def.driver,
      wins: 0,
      podiums: 0,
      races: 0,
      retired: false,
      purchaseCost: 0,
      upkeepPerMin: 0,
      tuning: { aggression: randInt(45, 70), fuelMode: "normal" },
      isNpc: true,
    };
  }

  function availableCarsForRace() {
    return Game.state.cars.owned
      .filter((car) => !car.retired && car.fuel >= 5 && car.condition >= 15)
      .sort((a, b) => averageCarStats(b) + b.condition - (averageCarStats(a) + a.condition))
      .slice(0, 2);
  }

  function createUpcomingCarRace() {
    const state = Game.state.cars;
    const track = cfg.carTracks[state.currentTrackIndex % cfg.carTracks.length];
    const playerEntries = availableCarsForRace().map((car) => ({
      id: car.id,
      name: car.name,
      car,
      owned: true,
      label: car.name + " (You)",
    }));
    const npcEntries = cfg.carNpcRoster.map((def) => {
      const npcCar = buildNpcCar(def);
      return {
        id: npcCar.id,
        name: npcCar.name,
        car: npcCar,
        owned: false,
        label: npcCar.name,
      };
    });
    const entries = npcEntries.concat(playerEntries);
    const baselines = entries.map((entry) => ({ id: entry.id, value: Gambling._carRaceScore(entry.car, track, true) }));
    const total = baselines.reduce((sum, row) => sum + row.value, 0) || 1;
    entries.forEach((entry) => {
      const chance = clamp((baselines.find((row) => row.id === entry.id).value || 1) / total, 0.03, 0.5);
      entry.odds = {
        win: clamp(Math.round((0.9 / chance) * 100) / 100, 3, 8),
        place: clamp(Math.round((0.52 / chance) * 100) / 100, 2, 4),
        show: clamp(Math.round((0.34 / chance) * 100) / 100, 1.5, 2),
      };
    });
    return {
      createdAt: Date.now(),
      track,
      entries,
      bettingOpen: true,
    };
  }

  function ensureRaceState() {
    Gambling.ensureHorseState();
    Gambling.ensureCarState();
  }

  function resolveHorseTraining(horse) {
    while (horse.training >= 100) {
      horse.training -= 100;
      horse.speed = clamp(horse.speed + 1, 1, 100);
      horse.stamina = clamp(horse.stamina + 1, 1, 100);
    }
  }

  function resolveHorseAction(horse) {
    if (horse.pendingAction === "feed") {
      horse.condition = clamp(horse.condition + 20, 0, 100);
      horse.form = clamp(horse.form + 4, 0, 100);
    } else if (horse.pendingAction === "train") {
      horse.training += 5;
      horse.form = clamp(horse.form + 2, 0, 100);
      resolveHorseTraining(horse);
    }
    horse.pendingAction = "";
    horse.actionTimer = 0;
  }

  function horseBetOpen() {
    return Game.state.horses.nextRaceIn <= cfg.HORSE_BET_WINDOW && !!Game.state.horses.currentRace;
  }

  function carBetOpen() {
    return Game.state.cars.nextRaceIn <= cfg.CAR_BET_WINDOW && !!Game.state.cars.currentRace;
  }

  Gambling.ensureState = function () {
    const s = Game.state;
    ensureObject(s, "gambling", {});
    const g = s.gambling;
    ensureNumber(g, "chips", 0);
    ensureNumber(g, "totalChipsWon", 0);
    ensureNumber(g, "totalChipsLost", 0);
    ensureNumber(g, "chipsFromCoins", 0);
    ensureNumber(g, "gamesPlayed", 0);
    ensureNumber(g, "gamesWon", 0);
    ["slotStats", "blackjackStats", "pokerStats", "rouletteStats", "diceStats", "plinkoStats"].forEach((key) => {
      ensureObject(g, key, {});
      ensureNumber(g[key], "played", 0);
      ensureNumber(g[key], "won", 0);
      if (key === "slotStats") ensureNumber(g[key], "bigWins", 0);
    });
    ensureObject(g, "blackjackState", {});
    ensureArray(g.blackjackState, "deck", []);
    ensureArray(g.blackjackState, "playerHand", []);
    ensureArray(g.blackjackState, "dealerHand", []);
    ensureNumber(g.blackjackState, "bet", 0);
    if (!g.blackjackState.phase) g.blackjackState.phase = "idle";
    if (typeof g.blackjackState.doubled !== "boolean") g.blackjackState.doubled = false;
    if (typeof g.blackjackState.result !== "string") g.blackjackState.result = "";
    ensureObject(g, "pokerState", {});
    ensureArray(g.pokerState, "deck", []);
    ensureArray(g.pokerState, "hand", []);
    ensureArray(g.pokerState, "held", [false, false, false, false, false]);
    ensureNumber(g.pokerState, "bet", 0);
    if (!g.pokerState.phase) g.pokerState.phase = "idle";
    if (typeof g.pokerState.result !== "string") g.pokerState.result = "";
    ensureNumber(g.pokerState, "payout", 0);
    ensureArray(g, "lastSlotsResult", []);
    ensureObject(g, "lastRouletteResult", {});
    ensureObject(g, "lastDiceResult", {});
    ensureObject(g, "lastPlinkoResult", {});
  };

  Gambling.cardText = cardText;
  Gambling.cardIsRed = cardIsRed;
  Gambling.blackjackValue = blackjackValue;

  Gambling.buyChips = function (coins) {
    Gambling.ensureState();
    const amount = Math.max(0, Math.floor(coins || 0));
    if (amount <= 0 || Game.state.coins < amount) return false;
    Game.state.coins -= amount;
    Game.state.gambling.chips += amount;
    Game.state.gambling.chipsFromCoins += amount;
    return true;
  };

  Gambling.redeemChips = function (chips) {
    Gambling.ensureState();
    const amount = Math.max(0, Math.floor(chips || 0));
    if (amount <= 0 || Game.state.gambling.chips < amount) return false;
    Game.state.gambling.chips -= amount;
    Game.state.coins += amount;
    return true;
  };

  Gambling.spinSlots = function (bet) {
    Gambling.ensureState();
    const wager = sanitizeBet(bet);
    if (!spendChips(wager)) return false;
    let reels = [];
    let payout = 0;
    const forceLoss = Math.random() < 0.6;
    for (let attempts = 0; attempts < 24; attempts++) {
      reels = [weightedPick(cfg.slotSymbols), weightedPick(cfg.slotSymbols), weightedPick(cfg.slotSymbols)];
      if (reels[0].id === reels[1].id && reels[1].id === reels[2].id) {
        payout = roundCurrency(wager * reels[0].payout3);
      } else {
        const cherries = reels.filter((symbol) => symbol.id === "cherry").length;
        payout = cherries === 2 ? roundCurrency(wager * 1.5) : 0;
      }
      if (!forceLoss || payout <= 0) break;
    }
    if (payout > 0) Game.state.gambling.chips += payout;
    scoreCasinoGame("slotStats", wager, payout);
    if (payout >= wager * 10) Game.state.gambling.slotStats.bigWins += 1;
    Game.state.gambling.lastSlotsResult = reels.map((symbol) => symbol.icon);
    return { reels: reels.map((symbol) => symbol.icon), payout, win: payout > wager };
  };

  function resolveBlackjackRound() {
    const state = Game.state.gambling.blackjackState;
    const player = blackjackValue(state.playerHand);
    const dealer = blackjackValue(state.dealerHand);
    let payout = 0;
    if (player.bust) {
      state.result = "Bust! Dealer wins.";
    } else if (dealer.bust) {
      payout = roundCurrency(state.bet * 2);
      state.result = "Dealer busts. You win!";
    } else if (player.blackjack && !dealer.blackjack) {
      payout = roundCurrency(state.bet * 2.5);
      state.result = "Blackjack! Paid 3:2.";
    } else if (!player.blackjack && dealer.blackjack) {
      state.result = "Dealer blackjack.";
    } else if (player.best > dealer.best) {
      payout = roundCurrency(state.bet * 2);
      state.result = "You beat the dealer.";
    } else if (player.best < dealer.best) {
      state.result = "Dealer wins.";
    } else {
      payout = roundCurrency(state.bet);
      state.result = "Push.";
    }
    if (payout > 0) Game.state.gambling.chips += payout;
    state.phase = "result";
    scoreCasinoGame("blackjackStats", state.bet, payout);
    return { result: state.result, payout };
  }

  Gambling.blackjackStart = function (bet) {
    Gambling.ensureState();
    const state = Game.state.gambling.blackjackState;
    const wager = sanitizeBet(bet);
    if (!spendChips(wager)) return false;
    ensureBlackjackDeck();
    state.playerHand = [drawCard(state.deck), drawCard(state.deck)];
    state.dealerHand = [drawCard(state.deck), drawCard(state.deck)];
    state.bet = wager;
    state.doubled = false;
    state.result = "";
    state.phase = "player";
    const player = blackjackValue(state.playerHand);
    const dealer = blackjackValue(state.dealerHand);
    if (player.blackjack || dealer.blackjack) return resolveBlackjackRound();
    return true;
  };

  Gambling.blackjackHit = function () {
    Gambling.ensureState();
    const state = Game.state.gambling.blackjackState;
    if (state.phase !== "player") return false;
    ensureBlackjackDeck();
    state.playerHand.push(drawCard(state.deck));
    if (blackjackValue(state.playerHand).bust) return resolveBlackjackRound();
    return true;
  };

  Gambling.blackjackStand = function () {
    Gambling.ensureState();
    const state = Game.state.gambling.blackjackState;
    if (state.phase !== "player") return false;
    state.phase = "dealer";
    ensureBlackjackDeck();
    while (true) {
      const dealer = blackjackValue(state.dealerHand);
      if (dealer.best > 17) break;
      if (dealer.best === 17 && !dealer.soft) break;
      state.dealerHand.push(drawCard(state.deck));
      ensureBlackjackDeck();
    }
    return resolveBlackjackRound();
  };

  Gambling.blackjackDouble = function () {
    Gambling.ensureState();
    const state = Game.state.gambling.blackjackState;
    if (state.phase !== "player" || state.playerHand.length !== 2 || state.doubled) return false;
    if (!spendChips(state.bet)) return false;
    state.bet *= 2;
    state.doubled = true;
    ensureBlackjackDeck();
    state.playerHand.push(drawCard(state.deck));
    if (blackjackValue(state.playerHand).bust) return resolveBlackjackRound();
    return Gambling.blackjackStand();
  };

  function pokerRankValues(hand) {
    return hand.map((card) => {
      if (card.rank === "A") return 14;
      if (card.rank === "K") return 13;
      if (card.rank === "Q") return 12;
      if (card.rank === "J") return 11;
      return parseInt(card.rank, 10);
    }).sort((a, b) => a - b);
  }

  function evaluatePokerHand(hand) {
    const values = pokerRankValues(hand);
    const counts = {};
    values.forEach((value) => {
      counts[value] = (counts[value] || 0) + 1;
    });
    const groups = Object.keys(counts).map((key) => ({ value: parseInt(key, 10), count: counts[key] })).sort((a, b) => b.count - a.count || b.value - a.value);
    const flush = hand.every((card) => card.suit === hand[0].suit);
    const unique = Array.from(new Set(values));
    let straight = false;
    if (unique.length === 5) {
      straight = unique[4] - unique[0] === 4;
      if (!straight && unique.join(",") === "2,3,4,5,14") straight = true;
    }
    const royal = flush && values.join(",") === "10,11,12,13,14";
    if (royal) return { name: "Royal Flush", multiplier: 800 };
    if (straight && flush) return { name: "Straight Flush", multiplier: 50 };
    if (groups[0].count === 4) return { name: "Four of a Kind", multiplier: 25 };
    if (groups[0].count === 3 && groups[1] && groups[1].count === 2) return { name: "Full House", multiplier: 9 };
    if (flush) return { name: "Flush", multiplier: 6 };
    if (straight) return { name: "Straight", multiplier: 4 };
    if (groups[0].count === 3) return { name: "Three of a Kind", multiplier: 3 };
    if (groups[0].count === 2 && groups[1] && groups[1].count === 2) return { name: "Two Pair", multiplier: 2 };
    if (groups[0].count === 2 && groups[0].value >= 11) return { name: "Jacks or Better", multiplier: 1 };
    return { name: "No Win", multiplier: 0 };
  }

  Gambling.evaluatePokerHand = evaluatePokerHand;

  Gambling.pokerDeal = function (bet) {
    Gambling.ensureState();
    const wager = sanitizeBet(bet);
    if (!spendChips(wager)) return false;
    const state = Game.state.gambling.pokerState;
    state.deck = createDeck();
    state.hand = [drawCard(state.deck), drawCard(state.deck), drawCard(state.deck), drawCard(state.deck), drawCard(state.deck)];
    state.held = [false, false, false, false, false];
    state.bet = wager;
    state.result = "Select cards to hold, then draw.";
    state.payout = 0;
    state.phase = "draw";
    return true;
  };

  Gambling.pokerToggleHold = function (index) {
    Gambling.ensureState();
    const state = Game.state.gambling.pokerState;
    if (state.phase !== "draw" || index < 0 || index >= state.held.length) return false;
    state.held[index] = !state.held[index];
    return true;
  };

  Gambling.pokerDraw = function () {
    Gambling.ensureState();
    const state = Game.state.gambling.pokerState;
    if (state.phase !== "draw") return false;
    for (let i = 0; i < 5; i++) {
      if (!state.held[i]) state.hand[i] = drawCard(state.deck);
    }
    const rank = evaluatePokerHand(state.hand);
    const payout = roundCurrency(state.bet * rank.multiplier);
    if (payout > 0) Game.state.gambling.chips += payout;
    state.payout = payout;
    state.result = rank.name + (payout > 0 ? "!" : ". Better luck next hand.");
    state.phase = "result";
    scoreCasinoGame("pokerStats", state.bet, payout);
    return { rank: rank.name, payout };
  };

  function rouletteOutcome() {
    const wheel = ["00"];
    for (let i = 0; i <= 36; i++) wheel.push(i);
    return pick(wheel);
  }

  function rouletteWin(number, betType, betValue) {
    if (betType === "straight") return String(number) === String(betValue);
    if (number === 0 || number === "00") return false;
    if (betType === "redblack") {
      const isRed = cfg.rouletteRedNumbers.indexOf(number) >= 0;
      return (betValue === "red" && isRed) || (betValue === "black" && !isRed);
    }
    if (betType === "oddeven") return betValue === "odd" ? number % 2 === 1 : number % 2 === 0;
    if (betType === "lowhigh") return betValue === "low" ? number >= 1 && number <= 18 : number >= 19 && number <= 36;
    if (betType === "dozen") {
      const dozen = parseInt(betValue, 10);
      return number >= (dozen - 1) * 12 + 1 && number <= dozen * 12;
    }
    if (betType === "column") {
      const column = parseInt(betValue, 10);
      return ((number - 1) % 3) + 1 === column;
    }
    return false;
  }

  Gambling.rouletteSpin = function (betType, betValue, bet) {
    Gambling.ensureState();
    const wager = sanitizeBet(bet);
    if (!spendChips(wager)) return false;
    const number = rouletteOutcome();
    const payoutMap = { straight: 36, redblack: 2, oddeven: 2, lowhigh: 2, dozen: 3, column: 3 };
    const won = rouletteWin(number, betType, betValue);
    const payout = won ? roundCurrency(wager * (payoutMap[betType] || 0)) : 0;
    if (payout > 0) Game.state.gambling.chips += payout;
    scoreCasinoGame("rouletteStats", wager, payout);
    Game.state.gambling.lastRouletteResult = { number, betType, betValue, payout };
    return { number, payout, win: payout > wager };
  };

  Gambling.rollDice = function (betType, bet) {
    Gambling.ensureState();
    const wager = sanitizeBet(bet);
    if (!spendChips(wager)) return false;
    const d1 = randInt(1, 6);
    const d2 = randInt(1, 6);
    const sum = d1 + d2;
    let payout = 0;
    if (betType.indexOf("exact-") === 0) {
      const target = parseInt(betType.split("-")[1], 10);
      if (sum === target) {
        const oddsMap = { 2: 31, 3: 16, 4: 11, 5: 7, 6: 6, 7: 5, 8: 6, 9: 7, 10: 11, 11: 16, 12: 31 };
        payout = roundCurrency(wager * (oddsMap[target] || 0));
      }
    } else if (betType === "over7" && sum > 7) {
      payout = roundCurrency(wager * 2);
    } else if (betType === "under7" && sum < 7) {
      payout = roundCurrency(wager * 2);
    } else if (betType === "exactly7" && sum === 7) {
      payout = roundCurrency(wager * 5);
    }
    if (payout > 0) Game.state.gambling.chips += payout;
    scoreCasinoGame("diceStats", wager, payout);
    Game.state.gambling.lastDiceResult = { dice: [d1, d2], sum, payout, betType };
    return { dice: [d1, d2], sum, payout, win: payout > wager };
  };

  Gambling.plinkoPlay = function (bet) {
    Gambling.ensureState();
    const MIN_PLINKO_MULTIPLIERS = 2;
    if (!Array.isArray(cfg.plinkoMultipliers) || cfg.plinkoMultipliers.length < MIN_PLINKO_MULTIPLIERS) {
      console.error("Invalid plinkoMultipliers configuration: expected at least 2 multiplier values in the array.");
      return false;
    }
    const multipliers = cfg.plinkoMultipliers;
    const wager = sanitizeBet(bet);
    if (!spendChips(wager)) return false;
    const rows = multipliers.length - 1;
    const path = [];
    let rights = 0;
    for (let i = 0; i < rows; i++) {
      const dir = Math.random() < 0.5 ? "L" : "R";
      path.push(dir);
      if (dir === "R") rights += 1;
    }
    const slotIndex = rights;
    const multiplier = multipliers[slotIndex] || 0;
    const payout = roundCurrency(wager * multiplier);
    if (payout > 0) Game.state.gambling.chips += payout;
    scoreCasinoGame("plinkoStats", wager, payout);
    Game.state.gambling.lastPlinkoResult = { path, slotIndex, multiplier, payout };
    return { path, slotIndex, multiplier, payout };
  };

  Gambling.ensureHorseState = function () {
    const s = Game.state;
    ensureObject(s, "horses", {});
    const hs = s.horses;
    ensureArray(hs, "owned", []);
    ensureArray(hs, "market", []);
    ensureNumber(hs, "marketRefreshIn", cfg.HORSE_MARKET_REFRESH_SECONDS);
    ensureArray(hs, "raceHistory", []);
    ensureNumber(hs, "nextRaceIn", cfg.HORSE_RACE_INTERVAL);
    if (hs.currentRace === undefined) hs.currentRace = null;
    ensureArray(hs, "pendingBets", []);
    if (hs.lastRaceResult === undefined) hs.lastRaceResult = null;
    ensureNumber(hs, "totalRaces", 0);
    ensureNumber(hs, "totalWinnings", 0);
    ensureNumber(hs, "totalLosses", 0);
    if (!hs.market.length) Gambling.refreshHorseMarket();
    if (!hs.currentRace) hs.currentRace = createUpcomingHorseRace();
  };

  Gambling.refreshHorseMarket = function () {
    Gambling.ensureState();
    const hs = Game.state.horses || (Game.state.horses = {});
    if (!Array.isArray(hs.market)) hs.market = [];
    hs.market = [];
    for (let i = 0; i < cfg.HORSE_MARKET_SIZE; i++) {
      hs.market.push(createHorseFromBreed(pick(cfg.horseBreeds)));
    }
    hs.marketRefreshIn = cfg.HORSE_MARKET_REFRESH_SECONDS;
    return hs.market;
  };

  Gambling.buyHorse = function (marketIndex) {
    Gambling.ensureHorseState();
    const hs = Game.state.horses;
    if (hs.owned.length >= cfg.HORSE_OWNERSHIP_LIMIT) return false;
    const horse = hs.market[marketIndex];
    if (!horse || !spendCoins(horse.purchaseCost)) return false;
    hs.owned.push(JSON.parse(JSON.stringify(horse)));
    hs.market.splice(marketIndex, 1);
    return true;
  };

  Gambling.feedHorse = function (horseId) {
    Gambling.ensureHorseState();
    const horse = Game.state.horses.owned.find((entry) => entry.id === horseId);
    if (!horse || horse.retired || horse.actionTimer > 0) return false;
    const cost = horseActionCost(horse, "feed");
    if (!spendCoins(cost)) return false;
    horse.resting = false;
    horse.actionTimer = 5;
    horse.pendingAction = "feed";
    horse.lastAction = "feed";
    return true;
  };

  Gambling.trainHorse = function (horseId) {
    Gambling.ensureHorseState();
    const horse = Game.state.horses.owned.find((entry) => entry.id === horseId);
    if (!horse || horse.retired || horse.actionTimer > 0) return false;
    const cost = horseActionCost(horse, "train");
    if (!spendCoins(cost)) return false;
    horse.resting = false;
    horse.condition = clamp(horse.condition - 10, 0, 100);
    horse.actionTimer = 30;
    horse.pendingAction = "train";
    horse.lastAction = "train";
    return true;
  };

  Gambling.restHorse = function (horseId) {
    Gambling.ensureHorseState();
    const horse = Game.state.horses.owned.find((entry) => entry.id === horseId);
    if (!horse || horse.retired) return false;
    horse.resting = true;
    horse.pendingAction = "";
    horse.actionTimer = 0;
    horse.lastAction = "rest";
    return true;
  };

  Gambling.hirePremiumJockey = function (horseId) {
    Gambling.ensureHorseState();
    const horse = Game.state.horses.owned.find((entry) => entry.id === horseId);
    if (!horse || horse.retired) return false;
    if (!spendCoins(cfg.HORSE_PREMIUM_JOCKEY_COST)) return false;
    horse.premiumJockeyRaces = 3;
    horse.jockey = "Premium Jockey";
    return true;
  };

  Gambling.placeBet = function (horseId, type, amount) {
    Gambling.ensureHorseState();
    const hs = Game.state.horses;
    const wager = Math.max(10, Math.floor(amount || 0));
    if (!horseBetOpen() || !spendCoins(wager)) return false;
    const entry = (hs.currentRace && hs.currentRace.entries || []).find((candidate) => candidate.id === horseId);
    if (!entry) {
      Game.state.coins += wager;
      Game.state.stats.totalCoinsSpent -= wager;
      return false;
    }
    hs.pendingBets.push({ horseId, horseName: entry.name, type, amount: wager, odds: entry.odds[type] || 1 });
    return true;
  };

  Gambling.cancelBet = function (index) {
    Gambling.ensureHorseState();
    const hs = Game.state.horses;
    if (!horseBetOpen() || index < 0 || index >= hs.pendingBets.length) return false;
    const bet = hs.pendingBets.splice(index, 1)[0];
    if (!bet) return false;
    Game.state.coins += bet.amount;
    Game.state.stats.totalCoinsSpent = Math.max(0, Game.state.stats.totalCoinsSpent - bet.amount);
    return true;
  };

  Gambling._horseRaceScore = function (horse, dryRun) {
    const speed = horse.speed * 1.2;
    const stamina = horse.stamina * 1.05;
    const agility = horse.agility * 0.95;
    const condition = horse.condition * 0.7;
    const form = horse.form * 0.6;
    const training = (horse.training || 0) * 0.06;
    const prestige = (horse.prestigeBonus || 0) * 1.8;
    const jockey = (horse.premiumJockeyRaces || 0) > 0 ? horse.speed * 0.1 : 0;
    const randomness = dryRun ? 0 : randRange(-18, 18);
    const cornering = horse.agility * 0.22 + (dryRun ? 0 : randRange(-3, 3));
    return speed + stamina + agility + condition + form + training + prestige + jockey + cornering + randomness;
  };

  Gambling._runHorseRace = function () {
    Gambling.ensureHorseState();
    const s = Game.state;
    const hs = s.horses;
    const race = hs.currentRace || createUpcomingHorseRace();
    const results = race.entries.map((entry) => ({
      id: entry.id,
      name: entry.name,
      owned: entry.owned,
      odds: entry.odds,
      score: Gambling._horseRaceScore(entry.horse, false),
      horse: entry.horse,
    })).sort((a, b) => b.score - a.score);
    let passiveIncome = 0;
    results.forEach((row, index) => {
      row.position = index + 1;
      if (!row.owned) return;
      const horse = row.horse;
      horse.races += 1;
      if (row.position === 1) {
        horse.wins += 1;
        horse.places += 1;
        horse.form = clamp(horse.form + 10, 0, 100);
        horse.prestigeBonus += 0.8;
        passiveIncome += horse.purchaseCost * 0.01;
      } else if (row.position <= 3) {
        horse.places += 1;
        horse.form = clamp(horse.form + 4, 0, 100);
        horse.prestigeBonus += 0.2;
        passiveIncome += horse.purchaseCost * (row.position === 2 ? 0.005 : 0.002);
      } else {
        horse.form = clamp(horse.form - 5, 0, 100);
      }
      horse.condition = clamp(horse.condition - 3, 0, 100);
      horse.resting = false;
      horse.lastAction = "race";
      if (horse.premiumJockeyRaces > 0) {
        horse.premiumJockeyRaces -= 1;
        if (horse.premiumJockeyRaces <= 0) horse.jockey = pick(cfg.horseJockeyNames);
      }
      if (horse.races >= 50 && Math.floor(horse.races / 50) > (horse.ageStep || 0)) {
        horse.age += 1;
        horse.ageStep = Math.floor(horse.races / 50);
      }
      if (horse.age >= 10) horse.retired = true;
    });
    passiveIncome = roundCurrency(passiveIncome);
    addCoins(passiveIncome);

    let betPayoutTotal = 0;
    hs.pendingBets.forEach((bet) => {
      const result = results.find((entry) => entry.id === bet.horseId);
      if (!result) {
        hs.totalLosses += bet.amount;
        return;
      }
      const won = (bet.type === "win" && result.position === 1) ||
        (bet.type === "place" && result.position <= 2) ||
        (bet.type === "show" && result.position <= 3);
      if (!won) {
        hs.totalLosses += bet.amount;
        return;
      }
      const payout = roundCurrency(bet.amount * (bet.odds || 1));
      hs.totalWinnings += Math.max(0, payout - bet.amount);
      betPayoutTotal += payout;
    });
    addCoins(betPayoutTotal);
    hs.pendingBets = [];

    const ownedSummary = results.filter((entry) => entry.owned).map((entry) => entry.name + " #" + entry.position);
    const historyEntry = {
      time: Date.now(),
      winner: results[0] ? results[0].name : "—",
      owned: ownedSummary,
      passiveIncome,
      betPayout: betPayoutTotal,
    };
    hs.lastRaceResult = historyEntry;
    hs.raceHistory.unshift(historyEntry);
    if (hs.raceHistory.length > 10) hs.raceHistory.length = 10;
    hs.totalRaces += 1;
    hs.nextRaceIn = cfg.HORSE_RACE_INTERVAL;
    hs.currentRace = createUpcomingHorseRace();
    return results;
  };

  Gambling.ensureCarState = function () {
    const s = Game.state;
    ensureObject(s, "cars", {});
    const cs = s.cars;
    ensureArray(cs, "owned", []);
    ensureArray(cs, "market", []);
    ensureNumber(cs, "marketRefreshIn", cfg.CAR_MARKET_REFRESH_SECONDS);
    ensureArray(cs, "raceHistory", []);
    ensureNumber(cs, "nextRaceIn", cfg.CAR_RACE_INTERVAL);
    if (cs.currentRace === undefined) cs.currentRace = null;
    ensureArray(cs, "pendingBets", []);
    if (cs.lastRaceResult === undefined) cs.lastRaceResult = null;
    ensureNumber(cs, "totalRaces", 0);
    ensureNumber(cs, "totalWinnings", 0);
    ensureNumber(cs, "totalLosses", 0);
    ensureNumber(cs, "currentTrackIndex", 0);
    if (!cs.market.length) Gambling.refreshCarMarket();
    if (!cs.currentRace) cs.currentRace = createUpcomingCarRace();
  };

  Gambling.refreshCarMarket = function () {
    Gambling.ensureState();
    const cs = Game.state.cars || (Game.state.cars = {});
    if (!Array.isArray(cs.market)) cs.market = [];
    cs.market = [];
    for (let i = 0; i < cfg.CAR_MARKET_SIZE; i++) {
      cs.market.push(createCarFromMake(pick(cfg.carMakes)));
    }
    cs.marketRefreshIn = cfg.CAR_MARKET_REFRESH_SECONDS;
    return cs.market;
  };

  Gambling.buyCar = function (marketIndex) {
    Gambling.ensureCarState();
    const cs = Game.state.cars;
    if (cs.owned.length >= cfg.CAR_OWNERSHIP_LIMIT) return false;
    const car = cs.market[marketIndex];
    if (!car || !spendCoins(car.purchaseCost)) return false;
    cs.owned.push(JSON.parse(JSON.stringify(car)));
    cs.market.splice(marketIndex, 1);
    return true;
  };

  Gambling.refuelCarCost = function (car) {
    return roundCurrency(Math.max(0, (car.fuelCapacity - car.fuel) * cfg.CAR_REFUEL_COST_PER_UNIT));
  };

  Gambling.repairCarCost = function (car) {
    return roundCurrency(Math.max(0, 100 - car.condition) * cfg.CAR_REPAIR_COST_PER_POINT);
  };

  Gambling.refuelCar = function (carId) {
    Gambling.ensureCarState();
    const car = Game.state.cars.owned.find((entry) => entry.id === carId);
    if (!car || car.retired) return false;
    const cost = Gambling.refuelCarCost(car);
    if (cost <= 0 || !spendCoins(cost)) return false;
    car.fuel = car.fuelCapacity;
    return true;
  };

  Gambling.repairCar = function (carId) {
    Gambling.ensureCarState();
    const car = Game.state.cars.owned.find((entry) => entry.id === carId);
    if (!car || car.retired) return false;
    const cost = Gambling.repairCarCost(car);
    if (cost <= 0 || !spendCoins(cost)) return false;
    car.condition = 100;
    return true;
  };

  Gambling.upgradeCar = function (carId, upgradeType) {
    Gambling.ensureCarState();
    const car = Game.state.cars.owned.find((entry) => entry.id === carId);
    if (!car || car.retired || !car.upgrades || car.upgrades[upgradeType] === undefined) return false;
    const level = car.upgrades[upgradeType] || 0;
    if (level >= 5) return false;
    const cost = carUpgradeCost(level);
    if (!spendCoins(cost)) return false;
    car.upgrades[upgradeType] += 1;
    if (upgradeType === "engine") car.enginePower = clamp(car.enginePower + 10, 1, 100);
    if (upgradeType === "tires") car.handling = clamp(car.handling + 10, 1, 100);
    if (upgradeType === "aero") car.aerodynamics = clamp(car.aerodynamics + 10, 1, 100);
    if (upgradeType === "chassis") car.reliability = clamp(car.reliability + 10, 1, 100);
    if (upgradeType === "fuel") {
      car.fuelCapacity += 10;
      car.fuel = Math.min(car.fuelCapacity, car.fuel + 10);
    }
    return true;
  };

  Gambling.carUpgradeCost = carUpgradeCost;

  Gambling.tuneCar = function (carId, setting, value) {
    Gambling.ensureCarState();
    const car = Game.state.cars.owned.find((entry) => entry.id === carId);
    if (!car || car.retired) return false;
    if (setting === "aggression") {
      car.tuning.aggression = clamp(Math.floor(value || 0), 0, 100);
      return true;
    }
    if (setting === "fuelMode" && ["eco", "normal", "push"].includes(value)) {
      car.tuning.fuelMode = value;
      return true;
    }
    return false;
  };

  Gambling.placeCarBet = function (carId, type, amount) {
    Gambling.ensureCarState();
    const cs = Game.state.cars;
    const wager = Math.max(10, Math.floor(amount || 0));
    if (!carBetOpen() || !spendCoins(wager)) return false;
    const entry = (cs.currentRace && cs.currentRace.entries || []).find((candidate) => candidate.id === carId);
    if (!entry) {
      Game.state.coins += wager;
      Game.state.stats.totalCoinsSpent -= wager;
      return false;
    }
    cs.pendingBets.push({ carId, carName: entry.name, type, amount: wager, odds: entry.odds[type] || 1 });
    return true;
  };

  Gambling.cancelCarBet = function (index) {
    Gambling.ensureCarState();
    const cs = Game.state.cars;
    if (!carBetOpen() || index < 0 || index >= cs.pendingBets.length) return false;
    const bet = cs.pendingBets.splice(index, 1)[0];
    if (!bet) return false;
    Game.state.coins += bet.amount;
    Game.state.stats.totalCoinsSpent = Math.max(0, Game.state.stats.totalCoinsSpent - bet.amount);
    return true;
  };

  Gambling._carRaceScore = function (car, track, dryRun) {
    const weights = track.weights;
    const fuelMode = car.tuning && car.tuning.fuelMode ? car.tuning.fuelMode : "normal";
    const aggression = car.tuning && typeof car.tuning.aggression === "number" ? car.tuning.aggression : 50;
    const fuelModeBonus = fuelMode === "push" ? 8 : fuelMode === "eco" ? -6 : 0;
    const aggressionBonus = (aggression - 50) * 0.09;
    const randomness = dryRun ? 0 : randRange(-15, 15);
    let score =
      car.enginePower * weights.enginePower +
      car.handling * weights.handling +
      car.reliability * weights.reliability +
      car.aerodynamics * weights.aerodynamics +
      Math.min(100, car.fuel) * weights.fuel +
      car.condition * 0.4 +
      fuelModeBonus +
      aggressionBonus +
      randomness;
    if (car.fuel < 20) score -= (20 - car.fuel) * 0.8;
    return score;
  };

  Gambling._runCarRace = function () {
    Gambling.ensureCarState();
    const s = Game.state;
    const cs = s.cars;
    const race = cs.currentRace || createUpcomingCarRace();
    const track = race.track;
    const results = race.entries.map((entry) => ({
      id: entry.id,
      name: entry.name,
      owned: entry.owned,
      odds: entry.odds,
      car: entry.car,
      score: Gambling._carRaceScore(entry.car, track, false),
    })).sort((a, b) => b.score - a.score);

    let passiveIncome = 0;
    results.forEach((row, index) => {
      row.position = index + 1;
      if (!row.owned) return;
      const car = row.car;
      const fuelMode = car.tuning.fuelMode;
      const aggression = car.tuning.aggression;
      const fuelBurnBase = fuelMode === "eco" ? randRange(20, 26) : fuelMode === "push" ? randRange(32, 40) : randRange(26, 34);
      const wearBase = randRange(5, 15) + aggression * 0.03;
      const wear = wearBase * (1.15 - car.reliability / 200);
      car.races += 1;
      if (row.position === 1) {
        car.wins += 1;
        car.podiums += 1;
        passiveIncome += car.purchaseCost * 0.008;
      } else if (row.position <= 3) {
        car.podiums += 1;
        passiveIncome += car.purchaseCost * (row.position === 2 ? 0.004 : 0.002);
      }
      car.fuel = clamp(car.fuel - fuelBurnBase, 0, car.fuelCapacity);
      car.condition = clamp(car.condition - wear, 0, 100);
    });
    passiveIncome = roundCurrency(passiveIncome);
    addCoins(passiveIncome);

    let betPayoutTotal = 0;
    cs.pendingBets.forEach((bet) => {
      const result = results.find((entry) => entry.id === bet.carId);
      if (!result) {
        cs.totalLosses += bet.amount;
        return;
      }
      const won = (bet.type === "win" && result.position === 1) ||
        (bet.type === "place" && result.position <= 2) ||
        (bet.type === "show" && result.position <= 3);
      if (!won) {
        cs.totalLosses += bet.amount;
        return;
      }
      const payout = roundCurrency(bet.amount * (bet.odds || 1));
      cs.totalWinnings += Math.max(0, payout - bet.amount);
      betPayoutTotal += payout;
    });
    addCoins(betPayoutTotal);
    cs.pendingBets = [];

    const ownedSummary = results.filter((entry) => entry.owned).map((entry) => entry.name + " #" + entry.position);
    const historyEntry = {
      time: Date.now(),
      winner: results[0] ? results[0].name : "—",
      track: track.name,
      owned: ownedSummary,
      passiveIncome,
      betPayout: betPayoutTotal,
    };
    cs.lastRaceResult = historyEntry;
    cs.raceHistory.unshift(historyEntry);
    if (cs.raceHistory.length > 10) cs.raceHistory.length = 10;
    cs.totalRaces += 1;
    cs.currentTrackIndex = (cs.currentTrackIndex + 1) % cfg.carTracks.length;
    cs.nextRaceIn = cfg.CAR_RACE_INTERVAL;
    cs.currentRace = createUpcomingCarRace();
    return results;
  };

  Gambling.horseActionCost = horseActionCost;
  Gambling.horseTier = horseTier;
  Gambling.horseBettingOpen = horseBetOpen;
  Gambling.carBettingOpen = carBetOpen;

  Gambling.update = function (dtSeconds) {
    Gambling.ensureState();
    ensureRaceState();
    const s = Game.state;
    const hs = s.horses;
    const cs = s.cars;

    hs.marketRefreshIn -= dtSeconds;
    if (hs.marketRefreshIn <= 0) Gambling.refreshHorseMarket();
    cs.marketRefreshIn -= dtSeconds;
    if (cs.marketRefreshIn <= 0) Gambling.refreshCarMarket();

    let upkeepCost = 0;
    hs.owned.forEach((horse) => {
      upkeepCost += (horse.upkeepPerMin || 0) / 60 * dtSeconds;
      if (horse.actionTimer > 0) {
        horse.actionTimer -= dtSeconds;
        if (horse.actionTimer <= 0) resolveHorseAction(horse);
      } else if (horse.resting) {
        horse.condition = clamp(horse.condition + 2 * dtSeconds, 0, 100);
        horse.form = clamp(horse.form + 0.18 * dtSeconds, 0, 100);
      } else {
        horse.form = clamp(horse.form + (50 - horse.form) * 0.01 * dtSeconds, 0, 100);
      }
      resolveHorseTraining(horse);
    });
    cs.owned.forEach((car) => {
      upkeepCost += (car.upkeepPerMin || 0) / 60 * dtSeconds;
    });
    const actualUpkeep = Math.min(s.coins, upkeepCost);
    s.coins -= actualUpkeep;
    s.stats.totalCoinsSpent += actualUpkeep;

    hs.nextRaceIn -= dtSeconds;
    if (hs.nextRaceIn <= 0) Gambling._runHorseRace();

    cs.nextRaceIn -= dtSeconds;
    if (cs.nextRaceIn <= 0) Gambling._runCarRace();
  };

  Game.Gambling = Gambling;
})();
