import { SeededRNG } from "./SeededRNG";
import { RuntimeTrace } from "./RuntimeTrace";

import { cloneBattleState } from "./cloneBattleState";

const MAX_REACTION_DEPTH = 10;

/**
 * ReactionContext
 * 
 * The central orchestration owner for a battle turn.
 * Manages deterministic RNG, controlled event insertion, modifier pipelines,
 * structured telemetry, and recursion protection.
 */
export class ReactionContext {
  /**
   * @param {Object} initialState - { playerPokemon, enemy, weather, playerAction, enemyAction }
   * @param {Object} options
   * @param {number} [options.seed] - Optional seed for deterministic RNG. Auto-generated if omitted.
   */
  constructor(initialState, { seed } = {}) {
    this.state = cloneBattleState(initialState); // Deep clone for immutability
    this.events = [];          // The flat semantic queue being generated
    this.depth = 0;
    this.pendingReactions = [];
    
    // Deterministic RNG — ALL randomness flows through this
    const rngInstance = new SeededRNG(seed);
    this.seed = rngInstance.seed;
    this.rng = rngInstance.bound((source, roll) => this.trace.rngRoll(source, roll));
    
    // Structured modifier pipeline
    this.modifiers = {
      power: [],
      crit: [],
      accuracy: [],
      defense: [],
      finalDamage: [],
    };
    
    // Centralized telemetry
    this.trace = new RuntimeTrace();
  }

  /** The seed used for this turn's RNG. Useful for replay serialization. */
  get seed() {
    return this._rng.seed;
  }

  /**
   * Request an event or sequence of events to be inserted into the queue.
   * @param {Object} reaction
   * @param {number} reaction.priority - PRIORITY constant governing resolution order
   * @param {Array} reaction.events - Semantic events to inject
   * @param {string} reaction.source - The entity/system generating this reaction
   * @param {string} reaction.originPhase - The phase during which this reaction was triggered
   */
  emitReaction({ priority, events, source = "UNKNOWN", originPhase = "UNKNOWN" }) {
    if (!events || !Array.isArray(events)) {
      throw new Error(`[ReactionContext] emitReaction requires an array of semantic events.`);
    }

    if (this.depth >= MAX_REACTION_DEPTH) {
      this.trace.warn(`MAX_REACTION_DEPTH reached! Truncating infinite reaction chain from source: ${source}`);
      return;
    }

    this.trace.reaction(source, originPhase, priority);
    this.pendingReactions.push({ priority, events, source, originPhase });
  }

  /**
   * Evaluates a specific phase by triggering all registered hooks,
   * collecting their reactions, sorting by priority, and flushing to the main queue.
   * 
   * @param {string} phase - The PHASES constant being triggered
   * @param {Function} evaluator - A callback where registries are checked
   * @param {Object} phaseContext - Data available to registries during this phase
   */
  dispatchPhase(phase, evaluator, phaseContext = {}) {
    this.depth++;
    this.trace.phaseStart(phase);

    // Clear previous pending reactions
    this.pendingReactions = [];

    // Evaluate phase (registries will call emitReaction internally)
    evaluator(this, phaseContext);

    // Sort reactions deterministically (highest priority first)
    this.pendingReactions.sort((a, b) => b.priority - a.priority);

    // Flush to flat semantic queue
    for (const reaction of this.pendingReactions) {
      this.events.push(...reaction.events);
    }
    
    this.trace.phaseEnd(phase);
    this.depth--;
  }

  // Helper to directly push core lifecycle events (damage, faint) bypassing reactions
  // (Core engine events are linear and shouldn't compete with reactive effects)
  pushCoreEvent(event) {
    this.events.push(event);
  }

  // Batch push for arrays of core events (e.g. from applyDamage)
  pushCoreEvents(eventArray) {
    for (const event of eventArray) {
      this.events.push(event);
    }
  }

  /** Reset a modifier bucket by name (future-proofed cleanup hook). */
  resetModifierBucket(bucketName) {
    if (!this.modifiers[bucketName]) {
      this.trace.warn(`[ReactionContext] resetModifierBucket unknown bucket: ${bucketName}`);
      return;
    }
    this.modifiers[bucketName] = [];
    this.trace.log(`resetModifierBucket: ${bucketName}`);
  }

  /** Decrement a move's PP in a consistent, traceable way. */
  decrementPP(move, ownerTag = null) {
    if (!move) return;
    if (move.currentPP != null && move.currentPP > 0) {
      move.currentPP -= 1;
      this.trace.mutation({ mutationType: "DECREMENT_PP", targetTag: ownerTag, payload: { moveName: move.name, remaining: move.currentPP } });
    }
  }

  /** Decrement weather turns and clear if expired. Returns true if cleared. */
  decrementWeatherTurns() {
    if (!this.state.weather) return false;
    if (this.state.weather.turnsRemaining > 0) {
      this.state.weather.turnsRemaining -= 1;
      this.trace.mutation({ mutationType: "DECREMENT_WEATHER_TURNS", targetTag: "weather", payload: { remaining: this.state.weather.turnsRemaining } });
      if (this.state.weather.turnsRemaining === 0) {
        this.clearWeather();
        return true;
      }
    }
    return false;
  }

  /** Clear active weather via a mutation helper. */
  clearWeather() {
    if (!this.state.weather) return;
    this.state.weather.type = "NONE";
    this.trace.mutation({ mutationType: "CLEAR_WEATHER", targetTag: "weather", payload: {} });
  }
}
