import { PHASES } from "../triggerPhases";
import { dispatchPhasePipeline } from "./dispatchPhasePipeline";
import { createTextEvent } from "../../events/createEvent";

/**
 * Executes the end-of-turn mechanics (Weather ticks, Poison, Burn, etc.).
 */
export function turnEndPipeline(context) {
  // 1. Evaluate Turn End Triggers
  // Evaluate Turn End Triggers for each combatant (stabilized API: pass `combatant` + `targetTag`).
  dispatchPhasePipeline(context, PHASES.TURN_END, { combatant: context.state.playerPokemon, targetTag: "player" });
  dispatchPhasePipeline(context, PHASES.TURN_END, { combatant: context.state.enemy, targetTag: "enemy" });

  // 2. Decrement Weather State via mutation helpers
  const cleared = context.decrementWeatherTurns();
  if (cleared) {
    context.pushCoreEvent(createTextEvent("The weather cleared."));
  }
}
