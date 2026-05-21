# AllOut Legends

A modern, browser-based Pokémon-style RPG engine built with React 19 and Vite. Features a tile-based world, a mathematically authentic turn-based battle system, and a robust built-in map editor.

---

## Core Features

### 🌍 World & Exploration
- **Seamless Interconnected Realms**: Explore multiple tile-based maps with smooth camera tracking, collision detection, and gate-based transitions.
- **In-Game Map Editor**: Press `P` to instantly toggle into map editing mode. Paint, fill, and erase tiles, then export JSON layouts directly from the browser.
- **Dynamic Encounters**: Biome-based wild encounters (grass, cave, snow, water) governed by authentic rarity weighting.
- **State Persistence**: Player position, map modifications, inventory, PC storage, and party data automatically persist in `localStorage`.

### ⚔️ Authentic Battle Engine
- **Event-Driven Orchestrator Architecture**: The combat engine strictly separates Semantic intent from Presentation logic. The pure engine computes combat math and produces standardized deterministic events (`{ id, type, payload, meta }`). A React hook `useBattleQueue` orchestrates these events sequentially for UI dramatization, preventing React state race conditions and ensuring game progression integrity.
- **Turn-Based Combat**: Full sequential turn resolution factoring in Speed, move Priority, and Paralysis modifiers.
- **Damage Pipeline**: Gen 4 authentic formula including STAB, 18-type effectiveness, random variance, and Critical Hits (1/16 chance).
- **Status Ecosystem**: Full support for Burn, Freeze, Paralysis, Poison, Sleep, and Volatile Statuses (Confusion). Handles pre-turn interruption and end-turn tick damage natively in the engine.
- **Resource Management**: Moves are gated by Power Points (PP) with accuracy and evasion checks. Exhausting all moves forces a Struggle attack.
- **Dual-Phase Progression**: Deep XP yield calculation, level scaling, and species evolution. Multi-leveling and interactive move-replacement natively pause the queue for a polished UX without corrupting save states.
- **Capture Mechanics**: HP and rarity-based Poké Ball catch rates.

### 🎒 Systems & UI
- **Responsive Controls**: Desktop keyboard (Arrow Keys) and a reactive on-screen D-Pad for mobile support.
- **Inventory & PC**: Manage a full party of 6, expansive PC storage, and a Poké Mart economy.
- **Interactive UI**: Clean, custom CSS interfaces, including a 3D rotating Skins Carousel for player profiles.

---

## Tech Stack

| Technology | Purpose |
| ---------- | ------- |
| **React 19** | Component architecture & State orchestration |
| **Vite 8** | Rapid development & build tooling |
| **CSS Grid** | High-performance 2D tile rendering |
| **localStorage** | Zero-backend state persistence |

*Note: The engine leverages O(1) lookups and immutable data patterns to handle all 493 Gen 1–4 Pokémon efficiently.*

---

## Quick Start

```bash
git clone <repo>
cd AllOut-Legends/pokemon-frontend
npm install
npm run dev
```

*Required assets (sprites, tilesets) must be placed in `public/assets/` to render correctly.*

---

## Status & Roadmap

**Currently in v1.0** — The core engine, 493 Pokémon, and complete battle mechanics are fully integrated.

**Upcoming Milestones:**
- 🏙️ **World**: NPC Trainers, Gym Leaders, and a Dialogue/Quest system.
- ⚡ **Combat**: Weather Effects, Held Items, and Stat Buffs/Debuffs (Swords Dance, Leer).
- 🌐 **Multiplayer**: Node.js/Flask backend for Online Battles and Trading.

---

*Custom engine developed by the AllOut Legends Team.*
*License: MIT*
