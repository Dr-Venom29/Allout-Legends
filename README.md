# AllOut Legends

A modern, highly-modular, browser-based Pokémon-style RPG engine built with React 19 and Vite. 

**AllOut Legends** isn't just a basic React game—it is an architecturally layered, headless-capable RPG runtime featuring a deterministic-orchestration event-queue battle system, a persistent World/Map Editor, and robust systems modeled after Gen 4 Pokémon mechanics.

For a deep dive into the deterministic battle runtime architecture, see: [pokemon-frontend/docs/battle-engine-architecture.md](pokemon-frontend/docs/battle-engine-architecture.md).

---

## 🚀 Engine Architecture & Headless-Capable Runtime Architecture

The core runtime architecture of AllOut Legends is its **Deterministic Battle Orchestrator**. We explicitly separated the game logic from the React rendering lifecycle to create a truly portable engine.

- **The Semantic Engine**: Combat math (damage calculation, speed sorting, status ticks) resolves synchronously and produces a flat queue of pure Semantic Events — serializable JSON structures (`{ id, type, payload, meta, timestamp }`).
- **Trigger Phases**: The engine is formally divided into phase boundaries (e.g. `PRE_MOVE`, `ON_DAMAGE`, `TURN_END`) so effects resolve in a predictable place without UI timing hacks.
- **ReactionContext (Reactive Orchestration)**: Reactive systems do not mutate the queue directly. Instead, they emit reactions into `ReactionContext`, which collects them per phase, sorts them by priority, prevents recursive overflow, and flushes priority-ordered semantic events into the queue.
- **The Event Orchestrator (`useBattleQueue`)**: A strict state machine (`IDLE`, `RUNNING`, `PAUSED`) that consumes semantic events and executes presentation playback. It natively supports pausing execution for interactive prompts (like Move Replacement modals) without corrupting game state.
- **Pure Event Handlers**: Semantic events are mapped into declarative JSON **Presentation Commands** (e.g., `UPDATE_HP_BAR`, `SHOW_MESSAGE`).
- **The Presentation Adapter**: React acts as a lightweight presentation adapter consuming serialized engine commands and rendering them via callbacks.
- **Save Integrity via Dual-Phase Progression**: RPG progression (multi-level ups, EXP gains, evolutions) is calculated *before* visual playback begins. Updated save data is cached and only committed to `localStorage` when the queue drains cleanly.

### Battle Runtime Flow

```text
Player Input
      ↓
Semantic Engine (buildTurnEvents)
      ↓
Trigger Phases
      ↓
ReactionContext (priority ordering + recursion guard)
      ↓
Semantic Queue (single source of truth)
      ↓
Event Handlers → Presentation Commands
      ↓
Presentation Adapter
      ↓
React UI
```

All reactive systems ultimately resolve into a single flat semantic queue to preserve deterministic ordering and replay-friendly sequencing.

Why determinism matters: a deterministic orchestration architecture enables reproducible debugging, replay systems, large-scale AI simulations, and future multiplayer synchronization.

Authoritative state ownership: gameplay state is owned exclusively by the semantic runtime. Presentation systems are never allowed to mutate gameplay state directly.

### Current Limitations (Technical Honesty)

The architecture is designed to support deterministic replay and multiplayer synchronization, though networking infrastructure is not implemented yet.

Determinism is also a design target, not a current guarantee:
- RNG still defaults to `Math.random()` in multiple places.
- Event timestamps use `Date.now()`.

---

## ⚔️ Authentic Combat & Progression

- **Gen 4 Damage Formula**: Deep damage pipeline factoring in STAB, 18-type effectiveness, random variance, and critical hits (1/16 base chance).
- **Turn-Based Resolution**: Turn orders dynamically sorted by Pokémon Speed, Move Priority, and Paralysis debuffs.
- **Status Ecosystem**: Full support for Burn, Freeze, Paralysis, Poison, Sleep, and Volatiles (Confusion). Handles pre-turn interruptions and end-turn tick damage natively.
- **Resource Management (PP)**: Moves are gated by Power Points (PP) with accuracy checks (accuracy/evasion stage modifiers are planned). Exhausting all moves forces the authentic `Struggle` attack.
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

## 🎒 Robust RPG Systems & UI

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
| **GSAP** | UI motion/animation utilities (e.g., panel interactions) |
| **CSS Grid/Transforms** | High-performance 2D tile rendering & 3D UI carousels |
| **ESLint** | Static checks / linting |
| **localStorage** | Client-side save state and serialization |

*Note: The engine uses data indexing and selectively immutable state-update patterns to keep lookups fast as the content scale grows.*

---

## 🧭 Project Layout

- App + runtime code lives in `pokemon-frontend/` (Vite project).
- Battle runtime core is organized under `pokemon-frontend/src/components/battle/` (subfolders: `engine/` for semantic evaluation/phases/registries, `events/` for event schema + handlers, `presentation/` for presentation commands + adapter).
- World/map data helpers live under `pokemon-frontend/src/data/` (maps, tilesets, walkability).
- Static assets are expected under `pokemon-frontend/public/assets/`.

---

## 🧰 Developer Scripts

From `pokemon-frontend/`:

```bash
npm run dev      # start dev server
npm run build    # production build
npm run preview  # preview production build
npm run lint     # eslint
```

## ✅ Current Engine Scope

Implemented (in-repo today):
- Semantic event architecture (`{ id, type, payload, meta, timestamp }`)
- Deterministic ordering (within a run) via a semantic event queue + strict playback state machine
- Deterministic orchestration architecture designed for replay and synchronization (seeded RNG + stable time are planned)
- Phase-driven reactive orchestration (`dispatchPhase`) with priority-based reaction ordering (`ReactionContext`)
- Centralized HP mutation pipeline via `applyDamage()`
- Status effects with both PRE_MOVE blockers and TURN_END ticks (e.g., poison/burn ticks, paralysis/sleep/freeze/confusion handling)
- Weather registry infrastructure (Sandstorm/Hail end-turn ticks; Rain/Sun power modifiers)
- Dual-phase progression handoff (progression computed before playback; commit after queue completion)

Planned / partial:
- Held items (priority slot exists, registry not implemented)
- Abilities
- Terrains / field effects
- Full replay determinism (seeded RNG + stable time)
- Multiplayer synchronization / networking backend

---

## 🧪 Runtime Validation

The engine includes runtime validation and safety rails to keep sequencing and state mutation predictable:
- deterministic phase orchestration via explicit `PHASES.*` boundaries
- centralized mutation validation via `applyDamage()` (single HP write path)
- battle-state assertions before evaluation (`assertValidBattleState`)
- queue-time event validation before playback (`assertEventShape`)
- reaction recursion protection (max reaction depth guard)

Automated test infrastructure is not set up yet (no Vitest/Jest in the current repo), but the engine is structured to be test-friendly once RNG/time are injected.

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

**Currently** — The core deterministic-orchestration runtime and RPG UI systems are integrated.

**Upcoming Milestones:**
- 🌩️ **Complex Combat**: Expand weather coverage and add Terrains, Held Items, and passive Abilities.
- 🏙️ **World Expansion**: NPC Trainers, Gym Leaders, Dialogue trees, and an overarching Quest system.
- 🌐 **Multiplayer (future)**: Networking + backend infrastructure (e.g. Node.js/Redis) for online battles, matchmaking, and trading.

---

*Custom engine architecture developed by the AllOut Legends Team.*
*License: MIT*
