import { BATTLE_EVENTS } from "./eventTypes";

let nextEventId = 1;

/**
 * Core Event Builder - Enforces the strict event schema for the queue.
 * @param {string} type - Event type from BATTLE_EVENTS
 * @param {Object} payload - The semantic data for the event
 * @param {Object} meta - Metadata (blocking, skippable, etc)
 * @returns {Object} { id, type, payload, meta, timestamp }
 */
function buildEvent(type, payload = {}, meta = {}) {
  const event = {
    id: `evt_${nextEventId++}`,
    type,
    payload,
    meta: {
      blocking: false,
      skippable: false,
      source: "engine",
      ...meta,
    },
    timestamp: Date.now(),
  };
  return event;
}

export function resetEventCounter() {
  nextEventId = 1;
}

// ── Presentation / Visual Events ──

export function createTextEvent(message) {
  return buildEvent(BATTLE_EVENTS.TEXT, { message });
}

export function createWaitEvent(durationMs) {
  return buildEvent(BATTLE_EVENTS.WAIT, { duration: durationMs });
}

// ── Combat Simulation Events ──

export function createDamageEvent({ target, previousHp, newHp, effectiveness, critical, message }) {
  return buildEvent(BATTLE_EVENTS.DAMAGE, {
    target, // 'player' or 'enemy'
    previousHp,
    newHp,
    effectiveness,
    critical,
    message, // Optional extra text to show (e.g. "It's super effective!")
  });
}

export function createFaintEvent(target) {
  return buildEvent(BATTLE_EVENTS.FAINT, { target });
}

export function createEndBattleEvent(reason) {
  return buildEvent(BATTLE_EVENTS.END_BATTLE, { reason }); // 'win', 'lose', 'run'
}

export function createStatusTickEvent(target, status, damage, newHp) {
  return buildEvent(BATTLE_EVENTS.STATUS_TICK, {
    target,
    status,
    damage,
    newHp,
  });
}

export function createStatusBlockEvent(target, reason) {
  return buildEvent(BATTLE_EVENTS.STATUS_BLOCK, {
    target,
    reason, // e.g. "PARALYSIS", "SLEEP", "FREEZE", "CONFUSION"
  });
}

export function createStatusCureEvent(target, status) {
  return buildEvent(BATTLE_EVENTS.STATUS_CURE, {
    target,
    status,
  });
}

// ── Progression Simulation Events ──

export function createExpGainEvent(pokemonId, amount) {
  return buildEvent(BATTLE_EVENTS.EXP_GAIN, {
    pokemonId,
    amount,
  });
}

export function createLevelUpEvent(pokemonId, newLevel) {
  return buildEvent(BATTLE_EVENTS.LEVEL_UP, {
    pokemonId,
    newLevel,
  });
}

export function createStatUpdateEvent(pokemonId, stats) {
  return buildEvent(BATTLE_EVENTS.STAT_UPDATE, {
    pokemonId,
    stats,
  });
}

export function createMoveLearnRequestEvent(pokemonId, newMove, currentMoves) {
  return buildEvent(BATTLE_EVENTS.MOVE_LEARN_REQUEST, {
    pokemonId,
    newMove,
    currentMoves,
  }, { blocking: true }); // Marks this event as requiring interactive pause
}

export function createEvolutionStartEvent(pokemonId, currentSpecies, newSpecies) {
  return buildEvent(BATTLE_EVENTS.EVOLUTION_START, {
    pokemonId,
    currentSpecies,
    newSpecies,
  });
}

export function createEvolutionCompleteEvent(pokemonId, newSpecies) {
  return buildEvent(BATTLE_EVENTS.EVOLUTION_COMPLETE, {
    pokemonId,
    newSpecies,
  });
}
