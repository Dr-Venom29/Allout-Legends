import { PHASES } from "../triggerPhases";
import { dispatchPhasePipeline } from "./dispatchPhasePipeline";
import { createTextEvent } from "../../events/createEvent";

/**
 * Executes the end-of-turn mechanics (Weather ticks, Poison, Burn, etc.).
 */
export function turnEndPipeline(context) {
  // 1. Evaluate Turn End Triggers — dispatch once with both combatants so ordering is deterministic.
  dispatchPhasePipeline(context, PHASES.TURN_END, {
    attacker: context.state.playerPokemon,
    attackerTag: "player",
    defender: context.state.enemy,
    defenderTag: "enemy",
  });

  // 2. Decrement Weather State via mutation helpers
  const cleared = context.decrementWeatherTurns();
  if (cleared) {
    context.pushCoreEvent(createTextEvent("The weather cleared."));
  }
}
