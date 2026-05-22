/**
 * Runtime Mutation Helper: applyStatus
 * 
 * Safely applies a persistent status to a combatant and emits telemetry.
 * 
 * @param {Object} context - The ReactionContext
 * @param {Object} target - The combatant object
 * @param {string} targetTag - "player" or "enemy"
 * @param {string} statusCondition - e.g. STATUS.POISON
 * @param {number} [turnsRemaining=null] - Optional turn duration (e.g. Sleep)
 */
export function applyStatus(context, target, targetTag, statusCondition, turnsRemaining = null) {
  if (target.status?.condition === statusCondition) return false;

  target.status = { condition: statusCondition, turnsRemaining };

  context.trace.mutation({
    mutationType: "STATUS_APPLY",
    targetTag,
    payload: {
      condition: statusCondition,
      turnsRemaining
    }
  });

  return true;
}

/**
 * Runtime Mutation Helper: removeStatus
 * 
 * Safely removes a persistent status from a combatant and emits telemetry.
 */
export function removeStatus(context, target, targetTag) {
  if (!target.status) return false;

  const oldStatus = target.status.condition;
  target.status = null;

  context.trace.mutation({
    mutationType: "STATUS_REMOVE",
    targetTag,
    payload: {
      condition: oldStatus
    }
  });

  return true;
}

/**
 * Runtime Mutation Helper: addVolatileStatus
 */
export function addVolatileStatus(context, target, targetTag, condition, turnsRemaining = null) {
  if (!target.volatileStatuses) target.volatileStatuses = [];
  
  if (target.volatileStatuses.some(vs => vs.condition === condition)) {
    return false; // Already has it
  }

  target.volatileStatuses.push({ condition, turnsRemaining });

  context.trace.mutation({
    mutationType: "VOLATILE_STATUS_APPLY",
    targetTag,
    payload: { condition, turnsRemaining }
  });

  return true;
}

/**
 * Runtime Mutation Helper: removeVolatileStatus
 */
export function removeVolatileStatus(context, target, targetTag, condition) {
  if (!target.volatileStatuses) return false;

  const index = target.volatileStatuses.findIndex(vs => vs.condition === condition);
  if (index === -1) return false;

  target.volatileStatuses.splice(index, 1);

  context.trace.mutation({
    mutationType: "VOLATILE_STATUS_REMOVE",
    targetTag,
    payload: { condition }
  });

  return true;
}
