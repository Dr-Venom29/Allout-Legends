/* eslint-disable no-unused-vars */
import { COMMANDS } from "./presentationCommands";
import { assertCommandShape } from "./commandValidation";

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Command Handlers Registry
 * 
 * Each handler processes a specific presentation command and dictates how the React UI should react.
 */
const COMMAND_HANDLERS = {
  [COMMANDS.SHOW_MESSAGE]: async (payload, callbacks) => {
    if (callbacks.setMessage) callbacks.setMessage(payload.message);
  },

  [COMMANDS.WAIT]: async (_payload, _callbacks) => {
    await sleep(_payload.duration);
  },

  [COMMANDS.UPDATE_HP_BAR]: async (payload, callbacks) => {
    if (payload.target === "enemy" && callbacks.setEnemyHp) {
      callbacks.setEnemyHp(payload.newHp);
    } else if (callbacks.setPlayerHp) {
      callbacks.setPlayerHp(payload.newHp);
    }
  },

  [COMMANDS.UPDATE_EXP_BAR]: async (payload, callbacks) => {
    if (callbacks.setExpBar) callbacks.setExpBar(payload.amount);
  },

  [COMMANDS.LEVEL_UP_ANIMATION]: async (payload, callbacks) => {
    if (callbacks.onLevelUp) callbacks.onLevelUp(payload.newLevel);
  },

  [COMMANDS.STAT_UPDATE_ANIMATION]: async (payload, callbacks) => {
    if (callbacks.onStatUpdate) callbacks.onStatUpdate(payload.stats);
  },

  [COMMANDS.EVOLUTION_START_ANIMATION]: async (payload, callbacks) => {
    if (callbacks.onEvolutionStart) {
      callbacks.onEvolutionStart(payload.currentSpecies, payload.newSpecies);
    }
  },

  [COMMANDS.EVOLUTION_COMPLETE_ANIMATION]: async (payload, callbacks) => {
    if (callbacks.onEvolutionComplete) {
      callbacks.onEvolutionComplete(payload.newSpecies);
    }
  },

  [COMMANDS.RESOLVE_FAINT]: async (payload, callbacks) => {
    if (callbacks.onFaint) callbacks.onFaint(payload.target);
  },

  [COMMANDS.RESOLVE_END_BATTLE]: async (payload, callbacks) => {
    if (callbacks.onEndBattle) callbacks.onEndBattle(payload.reason);
  },

  [COMMANDS.PAUSE_QUEUE]: async (_payload, _callbacks) => {
    // No-op in adapter; orchestrator handles lifecycle pauses.
  }
};

/**
 * Presentation Adapter
 * 
 * Bridges the pure Semantic Event Queue with the React UI.
 * Consumes declarative presentation commands and executes imperative React callbacks.
 */
export async function executeCommands(commands, callbacks) {
  if (!commands || !Array.isArray(commands)) return;

  for (const cmd of commands) {
    // 1. Validate Command Shape (recursive pure json check)
    assertCommandShape(cmd);

    // 2. Look up the specific Presentation Command Handler
    const handler = COMMAND_HANDLERS[cmd.type];

    if (!handler) {
      console.warn(`[Presentation Adapter] Unhandled command type: ${cmd.type}`);
      continue;
    }

    // 3. Execute Command
    await handler(cmd.payload, callbacks);
  }
}
