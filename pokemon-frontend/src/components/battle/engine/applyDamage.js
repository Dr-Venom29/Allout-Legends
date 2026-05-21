import { createDamageEvent, createTextEvent } from "../events/createEvent";

export const DAMAGE_REASONS = {
  MOVE: "MOVE",
  WEATHER: "WEATHER",
  STATUS: "STATUS",
  CONFUSION: "CONFUSION",
  RECOIL: "RECOIL",
};

/**
 * Authoritative Centralized Damage Pipeline
 * 
 * Handles strict state mutation, bounds checking, and deterministic event emission.
 * No system (weather, status, moves) should mutate HP directly outside this function.
 * 
 * @param {Object} payload
 * @param {Object} payload.context - The active ReactionContext
 * @param {Object} payload.target - The specific Pokemon object being damaged (reference to state)
 * @param {string} payload.targetTag - "player" or "enemy" (for UI routing)
 * @param {number} payload.amount - The calculated integer damage
 * @param {string} payload.reason - Reason for telemetry/logging (DAMAGE_REASONS)
 * @param {string} payload.message - Optional text message to emit
 */
export function applyDamage({ target, targetTag, amount, reason, message }) {
  if (!target || typeof target.currentHp !== 'number') {
    throw new Error(`[applyDamage] Invalid target state. Expected a Pokemon object.`);
  }
  
  if (amount < 0) {
    throw new Error(`[applyDamage] Damage amount cannot be negative: ${amount}`);
  }

  // 1. Apply Bounds-Checked Mutation
  const previousHp = target.currentHp;
  const newHp = Math.max(0, previousHp - Math.floor(amount));
  target.currentHp = newHp;

  // 2. Generate Semantic Events
  const events = [];

  if (message) {
    events.push(createTextEvent(message));
  }

  events.push(createDamageEvent({
    target: targetTag,
    previousHp,
    newHp,
    reason, // Optional telemetry addition in the payload
  }));

  // 3. Optional: Core faint checks could happen here in the future
  // Currently, buildTurnEvents manages core execution blocks. We will migrate that gradually.

  return events;
}
