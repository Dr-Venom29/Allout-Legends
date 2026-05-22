/**
 * Runtime Mutation Helper: setHp
 * 
 * Safely mutates a combatant's HP and emits telemetry.
 * 
 * @param {Object} context - The ReactionContext
 * @param {Object} target - The combatant object (must be the reference from context.state)
 * @param {string} targetTag - "player" or "enemy"
 * @param {number} newHp - The new HP value
 */
export function setHp(context, target, targetTag, newHp) {
  const oldHp = target.currentHp;
  const boundedHp = Math.max(0, Math.min(newHp, target.maxHp));
  
  if (oldHp !== boundedHp) {
    target.currentHp = boundedHp;
    
    context.trace.mutation({
      mutationType: "HP_CHANGE",
      targetTag,
      payload: {
        oldHp,
        newHp: boundedHp,
        delta: boundedHp - oldHp
      }
    });
  }

  return boundedHp;
}
