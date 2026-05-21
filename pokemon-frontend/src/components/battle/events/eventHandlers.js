import { BATTLE_EVENTS } from "./eventTypes";
import { COMMANDS } from "../presentation/presentationCommands";

/**
 * Event Handlers Map
 * 
 * PURE HANDLERS. 
 * They take semantic payloads and return a structured outcome containing presentation commands.
 * No UI mutation happens here.
 */
export const EVENT_HANDLERS = {
  
  [BATTLE_EVENTS.TEXT]: async (payload, nextIndex) => {
    return {
      status: "completed",
      commands: [
        { type: COMMANDS.SHOW_MESSAGE, payload: { message: payload.message } }
      ]
    };
  },

  [BATTLE_EVENTS.WAIT]: async (payload, nextIndex) => {
    return {
      status: "completed",
      commands: [
        { type: COMMANDS.WAIT, payload: { duration: payload.duration } }
      ]
    };
  },

  [BATTLE_EVENTS.DAMAGE]: async (payload, nextIndex) => {
    return {
      status: "completed",
      commands: [
        { type: COMMANDS.UPDATE_HP_BAR, payload: { target: payload.target, newHp: payload.newHp } }
      ]
    };
  },

  [BATTLE_EVENTS.STATUS_TICK]: async (payload, nextIndex) => {
    return {
      status: "completed",
      commands: [
        { type: COMMANDS.UPDATE_HP_BAR, payload: { target: payload.target, newHp: payload.newHp } }
      ]
    };
  },

  [BATTLE_EVENTS.STATUS_BLOCK]: async (payload, nextIndex) => {
    return {
      status: "completed",
      commands: []
    };
  },

  [BATTLE_EVENTS.STATUS_CURE]: async (payload, nextIndex) => {
    return {
      status: "completed",
      commands: []
    };
  },

  [BATTLE_EVENTS.FAINT]: async (payload, nextIndex) => {
    return {
      status: "completed",
      commands: [
        { type: COMMANDS.RESOLVE_FAINT, payload: { target: payload.target } }
      ]
    };
  },

  [BATTLE_EVENTS.END_BATTLE]: async (payload, nextIndex) => {
    return {
      status: "completed",
      commands: [
        { type: COMMANDS.RESOLVE_END_BATTLE, payload: { reason: payload.reason } }
      ]
    };
  },

  [BATTLE_EVENTS.EXP_GAIN]: async (payload, nextIndex) => {
    return {
      status: "completed",
      commands: [
        { type: COMMANDS.UPDATE_EXP_BAR, payload: { amount: payload.amount } }
      ]
    };
  },

  [BATTLE_EVENTS.LEVEL_UP]: async (payload, nextIndex) => {
    return {
      status: "completed",
      commands: [
        { type: COMMANDS.LEVEL_UP_ANIMATION, payload: { newLevel: payload.newLevel } }
      ]
    };
  },

  [BATTLE_EVENTS.STAT_UPDATE]: async (payload, nextIndex) => {
    return {
      status: "completed",
      commands: [
        { type: COMMANDS.STAT_UPDATE_ANIMATION, payload: { stats: payload.stats } }
      ]
    };
  },

  [BATTLE_EVENTS.EVOLUTION_START]: async (payload, nextIndex) => {
    return {
      status: "completed",
      commands: [
        { type: COMMANDS.EVOLUTION_START_ANIMATION, payload: { currentSpecies: payload.currentSpecies, newSpecies: payload.newSpecies } }
      ]
    };
  },

  [BATTLE_EVENTS.EVOLUTION_COMPLETE]: async (payload, nextIndex) => {
    return {
      status: "completed",
      commands: [
        { type: COMMANDS.EVOLUTION_COMPLETE_ANIMATION, payload: { newSpecies: payload.newSpecies } }
      ]
    };
  },

  [BATTLE_EVENTS.MOVE_LEARN_REQUEST]: async (payload, nextIndex) => {
    return {
      status: "paused",
      reason: "MOVE_LEARN",
      data: payload,
      nextIndex,
      commands: [
        { type: COMMANDS.PAUSE_QUEUE, payload: { reason: "MOVE_LEARN", data: payload } }
      ]
    };
  }
};
