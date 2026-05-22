# Battle Engine Architecture

## 1. Core Philosophy

The fundamental philosophy of the battle engine is simple:

**The Engine computes gameplay instantly.**
**The UI only visualizes engine output.**

This strict decoupling ensures that complex game logic, such as damage calculations, status effects, and turn sequencing, is completely isolated from React's rendering lifecycle. The UI becomes a pure presentation layer consuming engine output.

## 2. The Monolith Problem (BEFORE)

In the legacy model, `Battle.jsx` was a massive monolith. Orchestration relied on nested `setTimeout` chains that quickly became impossible to scale once weather, statuses, and progression systems began interacting simultaneously.

```text
┌──────────────────────────────┐
│          Battle.jsx          │
├──────────────────────────────┤
│ UI Rendering                 │
│ Damage Logic                 │
│ Status Logic                 │
│ EXP / Leveling               │
│ Evolution                    │
│ Turn Sequencing              │
│ Nested setTimeout Chains     │
│ Weather Logic                │
│ State Mutation               │
└──────────────────────────────┘
```

**Problems:**
- Tight UI coupling
- Timing-dependent gameplay
- Impossible sequencing scaling
- Race conditions
- Fragmented mutation ownership
- Feature spaghetti

## 3. The Modern Orchestration Model (AFTER)

To solve these scalability issues, execution was fully pipelined. The Engine computes the exact sequence of events instantly, leaving the UI to simply play back presentation commands.

```text
┌────────────────────┐
│ Semantic Engine    │
│ (Pure Simulation)  │
└─────────┬──────────┘
          │
          ▼
┌────────────────────┐
│ Trigger Phases     │
│ ON_TURN_START      │
│ PRE_MOVE           │
│ ON_DAMAGE          │
│ POST_DAMAGE        │
│ POST_MOVE          │
│ TURN_END           │
└─────────┬──────────┘
          │
          ▼
┌────────────────────┐
│ ReactionContext    │
│ - emitReaction()   │
│ - priority sorting │
│ - recursion guard  │
└─────────┬──────────┘
          │
          ▼
┌────────────────────┐
│ Semantic Queue     │
│ TEXT / WAIT        │
│ DAMAGE / FAINT     │
│ STATUS_TICK        │
│ END_BATTLE         │
│ MOVE_LEARN_REQUEST │
└─────────┬──────────┘
          │
          ▼
┌────────────────────┐
│ Presentation Layer │
│ UPDATE_HP_BAR      │
│ SHOW_MESSAGE       │
└─────────┬──────────┘
          │
          ▼
┌────────────────────┐
│ React Renderer     │
│ UI + Animations    │
└────────────────────┘

The semantic queue is the single source of truth for battle sequencing.
```

## 4. Turn Lifecycle

The orchestration flow is formally divided into semantic trigger phases to establish clear ownership boundaries.

```text
PRE_MOVE      (Paralysis, Sleep, Freeze, Confusion checks)
   ↓
ON_DAMAGE     (Weather power modifiers like Rain/Sun; future abilities/items)
   ↓
applyDamage() (Authoritative HP mutation & DAMAGE event)
   ↓
POST_DAMAGE   (future: contact/reactive effects)
   ↓
POST_MOVE     (future: recoil, secondary effects)
   ↓
TURN_END      (Sandstorm/Hail ticks, Poison/Burn ticks; future: items like Leftovers)
```

By defining these boundaries, we know exactly *when* an effect resolves without needing to write custom timing logic for each new feature.

## 5. Runtime Layers

The architecture strictly separates concepts into four distinct layers:

1. **Semantic Layer** (`BATTLE_EVENTS.DAMAGE`, `BATTLE_EVENTS.FAINT`): Represents pure game logic events.
2. **Reactive Layer** (`ReactionContext.emitReaction`, `dispatchPhase`): Phase-driven middleware where weather and statuses can inject additional semantic events.
3. **Presentation Layer** (`EVENT_HANDLERS` → `COMMANDS.*`): Pure mapping from semantic events to presentation commands.
4. **Renderer Layer** (`presentationAdapter` + React callbacks): Executes presentation commands (setState, waits, animations).

Why semantic events matter: semantic events are renderer-agnostic descriptions of gameplay outcomes, allowing the simulation layer to remain completely independent from visual presentation.

## 6. ReactionContext

`ReactionContext` acts as the deterministic orchestration controller for all reactive systems.

Effects do not mutate the queue directly.
Instead, they emit reactions into `ReactionContext`, which:
- collects reactions for the current trigger phase
- sorts them by priority (highest first)
- prevents recursive overflow via a max reaction depth guard
- flushes the resulting semantic events into a single flat queue

In practice, the core engine uses `dispatchPhase(PHASES.*)` to evaluate a phase, let registries call `emitReaction(...)`, then deterministically order and append those events.

### Semantic Event Example
Semantic events describe what happened in the game world, completely independent of how it looks.

```json
{
   "id": "evt_1",
   "type": "DAMAGE",
   "payload": {
      "target": "enemy",
      "previousHp": 76,
      "newHp": 42
   },
   "meta": {
      "blocking": false,
      "skippable": false,
      "source": "engine"
   },
   "timestamp": 1742391234567
}
```

### Presentation Command Example
Presentation commands are generated by pure handlers mapping semantic events to UI actions.

```json
{
  "type": "UPDATE_HP_BAR",
  "payload": {
    "target": "enemy",
    "newHp": 42
  }
}
```

## 7. Runtime Effect Registries

Instead of hardcoding every effect into the main engine pipeline, we use plugin-style registries. This is one of the biggest scalability improvements in the system.

```text
                ┌───────────────────┐
                │ Trigger Phase     │
                │ TURN_END          │
                └─────────┬─────────┘
                          │
   ┌───────────────────┼───────────────────┐
   ▼                   ▼                   (future)
┌──────────────┐ ┌──────────────┐        ┌──────────────┐
│ Weather      │ │ Status       │        │ Item         │
│ Registry     │ │ Registry     │        │ Registry     │
└──────┬───────┘ └──────┬───────┘        └──────┬───────┘
    ▼                ▼                        ▼
 emitReaction()   emitReaction()            emitReaction()
    ▼                ▼                        ▼
          ┌────────────────────────┐
          │ ReactionContext        │
          │ Deterministic Ordering │
          └────────────────────────┘
```

This ensures:
- **Modularity**: New statuses or weather conditions can be added without touching core engine logic.
- **Scalability**: The engine doesn't need to know *what* an effect does, only *when* to ask it.
- **Deterministic Orchestration (within a run)**: Reactions flow into `ReactionContext`, are sorted by priority (`PRIORITY.*`), and are flushed into the queue in a predictable order.

Implementation note: the repo currently has `weatherRegistry.js`, `statusRegistry.js`, and `abilityRegistry.js`. A dedicated item registry is implied by `PRIORITY.ITEM` but is not implemented yet.

Future systems such as held items, terrains, and field effects are expected to integrate through the same phase-driven registry architecture.

## 8. Centralized Mutation Pipeline

All HP mutations flow exclusively through `applyDamage()`.

The semantic engine is the authoritative owner of gameplay state. Presentation systems are not allowed to mutate gameplay state directly.

No system—whether it be weather, a status effect, or a direct attack—is allowed to mutate HP directly. `applyDamage()` acts as an authoritative bottleneck that handles strict bounds checking, state mutation, and semantic event generation (not UI mutations).

In addition, runtime safety is guaranteed through `assertValidBattleState()`, which strictly validates mathematical boundaries to prevent game state corruption before evaluation even begins.

## 9. Telemetry / Debugging

All runtime diagnostics are routed through a centralized `RuntimeTrace` layer. This replaces scattered `console.group` / `console.log` calls with a structured, inspectable log.

The trace captures:
- **Phase boundaries** (`PHASE_START` / `PHASE_END`) for every `dispatchPhase` call
- **Reaction emissions** with source, origin phase, and priority metadata
- **Modifier applications** with source, category, and multiplier value
- **Warnings** (e.g. recursion depth limits)
- **General engine logs**

In development mode, `finalizeContext()` calls `trace.dump()` to output the structured log to the browser console. The raw `trace.entries` array is also returned alongside the semantic queue for programmatic inspection.

## 10. Seeded RNG & Replay Determinism

All randomness in the engine flows through a `SeededRNG` instance (Mulberry32 algorithm) owned by `ReactionContext`. This includes:
- Critical hit rolls
- Accuracy checks
- Status effect rolls (paralysis, freeze thaw, confusion)
- Speed tie coin flips
- Damage random factor (85-100%)

The seed is auto-generated per turn and returned in the finalized output (`result.seed`). To replay a turn deterministically, pass the same seed back into the `ReactionContext` constructor.

The `rng` is exposed as a bound function matching the `Math.random()` call signature, so all existing consumer functions (`calculateDamage`, `checkMoveHit`, `determineTurnOrder`, status hooks) accept it transparently.

> **Note:** Some higher-level battle logic outside the engine (e.g. `battleLogic.js`, `captureLogic.js`) still uses `Math.random()` directly. These will be migrated as those systems are brought under engine ownership.

## 11. Modifier Pipeline

The engine uses a structured modifier pipeline instead of ad-hoc scalar multiplication:

```javascript
context.modifiers = {
  power: [],      // Weather, abilities, items, STAB (future)
  crit: [],       // Critical hit modifiers (future)
  accuracy: [],   // Accuracy stage modifiers (future)
  defense: [],    // Defense modifiers (future)
  finalDamage: [], // Final damage modifiers like Life Orb (future)
}
```

Registries push modifier objects with provenance:
```javascript
context.modifiers.power.push({ source: "BLAZE", multiplier: 1.5 });
context.modifiers.power.push({ source: "RAIN", multiplier: 1.5 });
```

Before damage calculation, a centralized `resolvePowerModifiers()` reduces the array into a single scalar. This is the **only** authority for computing the final multiplier.

This architecture guarantees:
- **Stacking correctness**: Multiple modifiers compose predictably
- **Telemetry**: Every modifier's source is traceable
- **Ordering control**: Future priority-based resolution is trivial to add
- **Single authority**: No ad-hoc multiplication scattered across the codebase

## 12. Headless Runtime

The battle engine is written as a synchronous evaluator (`buildTurnEvents`) that can run without React. This enables headless usage (tests, background workers, server simulation) as long as the inputs are plain JS objects.

Because orchestration relies entirely on JavaScript data structures and pure functions, the battle engine can run on a Node.js server, in a unit test suite, or as a background worker. This separation completely eliminates visual side effects from corrupting game state.

This unlocks powerful technical implications:
- **AI Battle Simulations**: Thousands of turns can be simulated instantly without rendering.
- **Deterministic Testing**: Scenarios can be verified with exact reproducibility via seeded RNG.
- **Battle Replay Systems**: Any turn can be perfectly recreated by passing the same inputs and seed.

## 13. Why This Architecture Exists

This architecture exists to solve the **N+1 Complexity Problem** in game development.

In the old architecture, adding an item that healed the player at the end of the turn meant writing another `setTimeout` inside an already deeply nested chain. If weather damaged the player, and then Leftovers healed them, and then poison damaged them again, the UI race conditions became unmanageable.

By introducing a formal **Semantic Event Queue** and strict **Trigger Phases**, we no longer "hack features in randomly." When a new ability or item is introduced, we simply ask: *Does this obey the architecture?* If yes, we plug it into the appropriate Phase Registry.
