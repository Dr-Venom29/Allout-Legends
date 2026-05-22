/**
 * Formalizes participant intents into explicit actions.
 * A turn orchestrator evaluates intents rather than assuming moves.
 */
export const BATTLE_ACTIONS = {
  MOVE: "MOVE",
  SWITCH: "SWITCH",
  ITEM: "ITEM",
  RUN: "RUN",
  CAPTURE: "CAPTURE",
  NONE: "NONE", // Explicitly doing nothing (e.g., waiting out a turn or already consumed action)
};
