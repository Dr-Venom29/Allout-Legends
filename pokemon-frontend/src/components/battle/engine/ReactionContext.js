const MAX_REACTION_DEPTH = 10;

/**
 * ReactionContext
 * 
 * Manages controlled event insertion during the deterministic evaluation of a battle turn.
 * Prevents direct queue mutation and infinite loop explosions.
 */
export class ReactionContext {
  constructor(initialState) {
    this.state = initialState; // { playerPokemon, enemy, weather, etc }
    this.events = [];          // The flat semantic queue being generated
    this.depth = 0;
    this.pendingReactions = [];
    
    // Shared execution context for modifiers
    this.damageModifiers = {
      powerMultiplier: 1.0
    };
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
      console.warn(`[ReactionContext] ⚠️ MAX_REACTION_DEPTH reached! Truncating infinite reaction chain from source: ${source}`);
      return;
    }

    console.log(`[ReactionContext] ⚡ Reaction Emitted (Source: ${source} | Phase: ${originPhase} | Priority: ${priority})`, events);
    this.pendingReactions.push({ priority, events, source, originPhase });
  }

  /**
   * Evaluates a specific phase by triggering all registered hooks,
   * collecting their reactions, sorting by priority, and flushing to the main queue.
   * 
   * @param {string} phase - The PHASES constant being triggered
   * @param {Function} evaluator - A callback where registries are checked
   */
  dispatchPhase(phase, evaluator, phaseContext = {}) {
    this.depth++;
    
    // Only group logs if we are at the top level to avoid nested spam, or just group always.
    console.group(`[PHASE] ${phase}`);

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
    
    console.groupEnd();
    this.depth--;
  }

  // Helper to directly push core lifecycle events (damage, faint) bypassing reactions
  // (Core engine events are linear and shouldn't compete with reactive effects)
  pushCoreEvent(event) {
    this.events.push(event);
  }
}
