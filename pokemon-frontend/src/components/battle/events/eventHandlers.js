import { BATTLE_EVENTS } from "./eventTypes";

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Event Handlers Map
 * 
 * Each handler processes a specific semantic event and dictates how it is presented.
 * Handlers return an outcome object: { status: "completed" | "paused", ... }
 */
export const EVENT_HANDLERS = {
  
  [BATTLE_EVENTS.TEXT]: async (payload, callbacks) => {
    callbacks.setMessage(payload.message);
    return { status: "completed" };
  },

  [BATTLE_EVENTS.WAIT]: async (payload, callbacks) => {
    await sleep(payload.duration);
    return { status: "completed" };
  },

  [BATTLE_EVENTS.DAMAGE]: async (payload, callbacks) => {
    if (payload.target === "enemy") {
      callbacks.setEnemyHp(payload.newHp);
    } else {
      callbacks.setPlayerHp(payload.newHp);
    }
    return { status: "completed" };
  },

  [BATTLE_EVENTS.STATUS_TICK]: async (payload, callbacks) => {
    if (payload.target === "enemy") {
      callbacks.setEnemyHp(payload.newHp);
    } else {
      callbacks.setPlayerHp(payload.newHp);
    }
    return { status: "completed" };
  },

  [BATTLE_EVENTS.STATUS_BLOCK]: async (payload, callbacks) => {
    // Currently visual-only via text events that accompany them,
    // but could trigger specific visual shakes or particle effects later.
    return { status: "completed" };
  },

  [BATTLE_EVENTS.STATUS_CURE]: async (payload, callbacks) => {
    return { status: "completed" };
  },

  [BATTLE_EVENTS.FAINT]: async (payload, callbacks) => {
    callbacks.onFaint(payload.target);
    return { status: "completed" };
  },

  [BATTLE_EVENTS.END_BATTLE]: async (payload, callbacks) => {
    callbacks.onEndBattle(payload.reason);
    return { status: "completed" };
  },

  [BATTLE_EVENTS.EXP_GAIN]: async (payload, callbacks) => {
    if (callbacks.setExpBar) callbacks.setExpBar(payload.amount);
    return { status: "completed" };
  },

  [BATTLE_EVENTS.LEVEL_UP]: async (payload, callbacks) => {
    if (callbacks.onLevelUp) callbacks.onLevelUp(payload.newLevel);
    return { status: "completed" };
  },

  [BATTLE_EVENTS.STAT_UPDATE]: async (payload, callbacks) => {
    if (callbacks.onStatUpdate) callbacks.onStatUpdate(payload.stats);
    return { status: "completed" };
  },

  [BATTLE_EVENTS.EVOLUTION_START]: async (payload, callbacks) => {
    if (callbacks.onEvolutionStart) callbacks.onEvolutionStart(payload.currentSpecies, payload.newSpecies);
    return { status: "completed" };
  },

  [BATTLE_EVENTS.EVOLUTION_COMPLETE]: async (payload, callbacks) => {
    if (callbacks.onEvolutionComplete) callbacks.onEvolutionComplete(payload.newSpecies);
    return { status: "completed" };
  },

  [BATTLE_EVENTS.MOVE_LEARN_REQUEST]: async (payload, callbacks, nextIndex) => {
    return {
      status: "paused",
      reason: "MOVE_LEARN",
      data: payload,
      nextIndex,
    };
  }
};
