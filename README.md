# Idle Empire Ultimate

A browser-based incremental/idle game built with plain HTML, CSS, and JavaScript.

You start by clicking for coins, then scale into a multi-system economy with buildings, research, automation, diplomacy, bitcoin mining, stocks, and layered prestige progression.

---

## Table of Contents

- [Overview](#overview)
- [Core Gameplay](#core-gameplay)
- [Major Systems](#major-systems)
- [Resource & Progression Model](#resource--progression-model)
- [How to Run](#how-to-run)
- [Save System](#save-system)
- [Project Structure](#project-structure)
- [Development Notes](#development-notes)

---

## Overview

**Idle Empire Ultimate** is a single-page idle game where progress comes from compounding production systems and long-term resets.

Key characteristics:

- Real-time tick-based simulation (`TICK_MS`, `UI_MS`)
- Manual and automated progression
- Multiple currencies and meta-currencies
- Strategic side-systems (county diplomacy, bitcoin, stocks)
- Offline progression and persistent saves via `localStorage`

The game UI is tab-based and includes:

- Economy
- Map
- Research
- Automation
- Skill Trees
- Bitcoin
- Stocks
- Achievements
- Milestones
- Prestige
- Statistics
- Settings

---

## Core Gameplay

1. **Click** to earn base coins.
2. **Buy buildings** to increase passive coin production.
3. **Purchase upgrades/research** to improve multipliers and unlock systems.
4. **Automate** routine actions (clicking, buying, upgrading, resets).
5. **Use side systems** (diplomacy, bitcoin, stock market) for additional scaling paths.
6. **Prestige/Reset** to gain permanent progression currencies.

The game is designed around exponential growth and reset loops, where short-term sacrifices unlock long-term acceleration.

---

## Major Systems

### Economy & Buildings

- Building purchase logic with cost scaling and bulk-buy support
- Building upgrades and configurable sub-building mechanics
- Click value upgrades with tradeoff-based balancing

### Research

- Branch-based research progression
- Unlocks multipliers, automation capabilities, and advanced systems
- Research points earned through reset flow and production systems

### Automation

Unlockable automation features include:

- Auto Click
- Auto Buy
- Auto Upgrade
- Auto Research
- Auto Prestige
- Auto Ascend

### Prestige Layers

Three reset layers are implemented:

1. **Prestige** (coin/building reset for Prestige Points)
2. **Research Reset** (spend PP for Research Points)
3. **Ascension** (higher reset tier for Ascension Shards)

These provide permanent multipliers and drive long-term progression.

### Talents & Skill Trees

- Prestige-point talents (passives + activatable powers)
- Skill tree nodes with cooldown-driven powers and branch progression

### Map & Diplomacy

- Nova Scotia county map with county selection and pinning
- County rivalry/diplomacy simulation with actions that affect relation, trade, suspicion, and influence
- Diplomacy state integrated into game multipliers and reward flow

### Bitcoin System

- Energy production and storage
- Manual BTC farming actions
- Mining equipment and battery purchases
- BTC selling and price-driven economy interactions
- Coin farmer progression integrated into bitcoin branch

### Stocks

- Simulated stock prices with history tracking
- Buy/sell shares with portfolio accounting
- Dividend timer payouts

### Achievements & Milestones

- Achievement unlock checks with rewards
- Milestone progression tied to growth thresholds

### Events

- Weighted random timed events
- Temporary bonuses/penalties affecting production and progression

---

## Resource & Progression Model

Primary and meta resources tracked in state include:

- **Coins** (base currency)
- **Prestige Points**
- **Research Points**
- **Ascension Shards**
- **Bitcoin (BTC)**
- **Energy**

Additional progression/state buckets include:

- Buildings and sub-buildings
- Upgrades and research purchases
- Talents/skill tree unlocks and active powers
- County diplomacy state
- Stock market portfolio and price history
- Statistics (clicks, playtime, resets, generated/spent resources)

---

## How to Run

No build step is required.

### Option 1: Open directly

Open this file in your browser:

- `index.html`

### Option 2: Use a local static server (recommended)

From the repository root, serve files with any static server and open `index.html`.

Example (Python 3):

```bash
python3 -m http.server 8000
```

Then visit `http://localhost:8000`.

---

## Save System

Implemented in `save.js`:

- Autosave on interval
- Manual save
- Export/import save string (base64)
- Hard reset support
- Offline earnings calculation when returning to the game

Save key is configured in `Game.config.SAVE_KEY`.

---

## Project Structure

Main files in the repository root:

- `index.html` – layout, tabs, script bootstrapping
- `styles.css` – game styling
- `config.js` – static config/constants/game definitions
- `game.js` – core state, loop, multiplier math
- `buildings.js` – building and upgrade purchasing logic
- `research.js` – research purchase/effect logic
- `automation.js` – automation behavior
- `prestige.js` – reset layers and prestige calculations
- `talents.js` – prestige talents and powers
- `skilltrees.js` – skill tree node progression/powers
- `map.js` – county data and terrain/resource metadata
- `map_ui.js` – map rendering and selector UI
- `diplomacy.js` – county diplomacy systems/actions
- `bitcoin.js` – energy/BTC/mining logic
- `stocks.js` – stock market simulation and trading
- `events.js` – timed random events
- `achievements.js` – achievement checking/unlocks
- `milestones.js` – milestone tracking/rewards
- `save.js` – persistence/export/import/reset
- `ui.js` – DOM rendering and event wiring

---

## Development Notes

### JavaScript validation

A simple syntax check for all JS files:

```bash
for f in *.js; do node --check "$f"; done
```

### Architecture style

- Vanilla JS modules attached to the global `Game` object
- State-first design (`Game.state`) plus config-driven definitions (`Game.config`)
- Logic split by gameplay domain (economy, research, reset systems, map, bitcoin, stocks, UI)

---

If you want, I can also generate a **player-focused guide** (early-game, mid-game, and reset strategy) as a separate section.
