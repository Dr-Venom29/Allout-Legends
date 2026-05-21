# AllOut Legends

A modern, highly-modular, browser-based Pokémon-style RPG engine built with React 19 and Vite. 

**AllOut Legends** isn't just a basic React game—it is a deeply engineered, headless-capable RPG runtime featuring a deterministic event-queue battle system, a persistent World/Map Editor, and robust systems mimicking the authenticity of Gen 4 Pokémon mechanics.

---

## 🚀 Engine Architecture & The "Headless Runtime"

The crown jewel of AllOut Legends is its **Deterministic Battle Orchestrator**. We explicitly separated the game logic from the React rendering lifecycle to create a truly portable engine.

- **The Semantic Engine**: Combat math (damage calculation, speed sorting, status ticks) resolves instantly and deterministically. It produces a flat queue of pure Semantic Events (`{ id, type, payload, meta, timestamp }`).
- **The Event Orchestrator (`useBattleQueue`)**: A strict state machine (`IDLE`, `RUNNING`, `PAUSED`) that pipelines the semantic events. It natively supports pausing execution for interactive prompts (like Move Replacement modals) without corrupting game state.
- **Pure Event Handlers**: Semantic events are parsed into declarative JSON **Presentation Commands** (e.g., `UPDATE_HP_BAR`, `SHOW_MESSAGE`).
- **The Presentation Adapter**: React acts merely as a "dumb terminal" adapter. It consumes these serialized commands and renders them. This means the core game engine could theoretically be run in headless Node.js AI simulations, replay viewers, or multiplayer servers.
- **Save Integrity via Dual-Phase Progression**: RPG progression (multi-level ups, EXP gains, Evolutions) is fully calculated *before* visual playback begins. The updated save data is cached and only committed to `localStorage` when the queue perfectly drains. Closing the browser mid-animation will never corrupt your save file.

---

## ⚔️ Authentic Combat & Progression

- **Gen 4 Damage Formula**: Deep damage pipeline factoring in STAB, 18-type effectiveness, random variance, and critical hits (1/16 base chance).
- **Turn-Based Resolution**: Turn orders dynamically sorted by Pokémon Speed, Move Priority, and Paralysis debuffs.
- **Status Ecosystem**: Full support for Burn, Freeze, Paralysis, Poison, Sleep, and Volatiles (Confusion). Handles pre-turn interruptions and end-turn tick damage natively.
- **Resource Management (PP)**: Moves are gated by Power Points (PP) with accuracy and evasion checks. Exhausting all moves forces the authentic `Struggle` attack.
- **Deep Progression**: Includes experience scaling, dynamic level-ups, stat recalculations, and evolution triggers.
- **Mid-Battle Move Learning**: When a Pokémon learns a 5th move, the engine dynamically pauses the battle queue, prompts the user with a modal to replace an old move, and smoothly resumes playback.
- **Capture Mechanics**: HP and rarity-based Poké Ball catch rates.

---

## 🌍 World Exploration & Tools

- **Interconnected Realms**: Explore multiple tile-based maps with smooth camera tracking, collision detection, and gate-based transitions.
- **Dynamic Biome Encounters**: Grass, Cave, Water, and Snow biomes generate random wild encounters governed by weighted rarity tables.
- **Built-in Map Editor**: Press `P` at any time to toggle into Map Editing Mode. Paint, fill, and erase tiles with live visual feedback. Export your custom maps directly to JSON layouts.
- **Zero-Backend Persistence**: Complete state persistence leveraging `localStorage`. Player position, modified maps, inventory, PC storage, and party progression are automatically saved.

---

## 🎒 robust RPG Systems & UI

- **Pokédex**: A full Pokédex index system tracking all 493 Gen 1–4 Pokémon natively supported by the engine.
- **PC Box Storage**: Expansive PC storage system allowing drag-and-drop party management.
- **Poké Mart Economy**: Buy and sell items (Pokéballs, Potions, Revives) using in-game currency.
- **Skins & Profiles**: Clean, custom CSS interfaces including a **3D rotating Skins Carousel** for player customization.
- **Responsive Controls**: Play via Desktop keyboard (Arrow Keys/WASD) or an intuitive on-screen reactive D-Pad for Mobile browsers.

---

## 🛠️ Tech Stack

| Technology | Purpose |
| ---------- | ------- |
| **React 19** | Component orchestration and UI Presentation |
| **Vite 8** | Rapid development & build tooling |
| **CSS Grid/Transforms** | High-performance 2D tile rendering & 3D UI carousels |
| **localStorage** | Client-side save state and serialization |

*Note: The engine leverages O(1) lookups and immutable data patterns to handle all 493 Pokémon variants efficiently without performance degradation.*

---

## 🚀 Quick Start

```bash
git clone <repo>
cd AllOut-Legends/pokemon-frontend
npm install
npm run dev
```

*Required assets (sprites, tilesets, sounds) must be placed in `public/assets/` to render correctly.*

---

## 🗺️ Roadmap & Future Horizons

**Currently in v1.0** — The core Deterministic Engine, 493 Pokémon data layer, and RPG UI systems are fully integrated.

**Upcoming Milestones:**
- 🌩️ **Complex Combat**: Weather Effects (Rain/Sandstorm), Terrains, Held Items, and passive Abilities.
- 🏙️ **World Expansion**: NPC Trainers, Gym Leaders, Dialogue trees, and an overarching Quest system.
- 🌐 **Multiplayer**: Expanding the Headless runtime to a Node.js/Redis backend for Online Battles, Matchmaking, and Trading.

---

*Custom engine architecture developed by the AllOut Legends Team.*
*License: MIT*
