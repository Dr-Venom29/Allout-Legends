import { BATTLE_EVENTS } from "./eventTypes";

/**
 * Validates the standardized structure of a BattleEvent.
 * Ensures the event conforms to the { id, type, payload, meta, timestamp } schema.
 * 
 * @param {Object} event - The event to validate
 * @throws {Error} If the event is malformed
 */
export function assertEventShape(event) {
  if (!event || typeof event !== "object") {
    throw new Error(`[BattleQueue Validation] Event is not an object: ${event}`);
  }

  if (typeof event.id !== "string" || !event.id) {
    throw new Error(`[BattleQueue Validation] Event missing valid 'id': ${JSON.stringify(event)}`);
  }

  if (typeof event.type !== "string" || !Object.values(BATTLE_EVENTS).includes(event.type)) {
    throw new Error(`[BattleQueue Validation] Event missing valid 'type': ${JSON.stringify(event)}`);
  }

  if (!event.payload || typeof event.payload !== "object") {
    throw new Error(`[BattleQueue Validation] Event missing 'payload' object: ${JSON.stringify(event)}`);
  }

  if (!event.meta || typeof event.meta !== "object") {
    throw new Error(`[BattleQueue Validation] Event missing 'meta' object: ${JSON.stringify(event)}`);
  }

  if (typeof event.timestamp !== "number") {
    throw new Error(`[BattleQueue Validation] Event missing numeric 'timestamp': ${JSON.stringify(event)}`);
  }
}
