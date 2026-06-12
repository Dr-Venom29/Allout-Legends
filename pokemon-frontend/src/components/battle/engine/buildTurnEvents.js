import { assertValidBattleState } from "./engineValidation";
import { ReactionContext } from "./ReactionContext";
import { determineTurnOrder } from "../battleTurnOrder";
import { executeActionPipeline } from "./pipelines/executeActionPipeline";
import { turnEndPipeline } from "./pipelines/turnEndPipeline";
import { dispatchPhasePipeline } from "./pipelines/dispatchPhasePipeline";
import { PHASES } from "./triggerPhases";
import { createFaintEvent, createTextEvent, createWaitEvent, createEndBattleEvent } from "../events/createEvent";

/**
 * PURE FUNCTION
 * Resolves a full battle turn instantly and returns an ordered queue of events.
 * 
 * @param {Object} state - The current battle state
 * @param {number} seed - The deterministic seed for the turn
 * @returns {Object} { events: Array, updatedState: Object }
 */
export function buildTurnEvents(state, seed) {
  // Guard the engine from invalid state injection
  assertValidBattleState(state);

  // Initialize Reaction Context
  const context = new ReactionContext(state, { seed });
  const { playerPokemon, enemy, playerAction, enemyAction } = context.state;

  // Determine order
  const turnOrder = determineTurnOrder(playerPokemon, enemy, playerAction, enemyAction, context.rng);

  const checkFaint = (causingMove = null, moveAttacker = null, moveAttackerTag = null) => {
    if (enemy.currentHp <= 0) {
      dispatchPhasePipeline(context, PHASES.POST_FAINT, { 
        faintedCombatant: enemy, 
        faintedTag: "enemy", 
        move: causingMove, 
        attacker: moveAttacker,
        attackerTag: moveAttackerTag 
      });

      context.pushCoreEvent(createFaintEvent("enemy"));
      context.pushCoreEvent(createTextEvent(`${enemy.name} fainted!`));
      context.pushCoreEvent(createWaitEvent(1000));
      // NOTE: We only end battle here if player hasn't also fainted, or handle win/loss properly.
      // For now we keep existing logic
      context.pushCoreEvent(createTextEvent("You won!"));
      context.pushCoreEvent(createEndBattleEvent("win"));
      return true;
    }
    if (playerPokemon.currentHp <= 0) {
      dispatchPhasePipeline(context, PHASES.POST_FAINT, { 
        faintedCombatant: playerPokemon, 
        faintedTag: "player", 
        move: causingMove, 
        attacker: moveAttacker,
        attackerTag: moveAttackerTag 
      });

      context.pushCoreEvent(createFaintEvent("player"));
      context.pushCoreEvent(createTextEvent(`${playerPokemon.name} fainted!`));
      context.pushCoreEvent(createWaitEvent(1000));
      context.pushCoreEvent(createEndBattleEvent("lose"));
      return true;
    }
    return false;
  };

  const executeAndCheck = (isPlayerAttacking) => {
    const action = isPlayerAttacking ? playerAction : enemyAction;
    const attacker = isPlayerAttacking ? playerPokemon : enemy;
    const attackerTag = isPlayerAttacking ? "player" : "enemy";

    executeActionPipeline(context, isPlayerAttacking);

    return checkFaint(action?.move, attacker, attackerTag);
  };

  // Turn Flow Execution
  dispatchPhasePipeline(context, PHASES.ON_TURN_START, {});

  // Turn 1
  if (executeAndCheck(turnOrder.first === "player")) return finalizeContext(context);

  // Turn 2
  if (executeAndCheck(turnOrder.first === "enemy")) return finalizeContext(context);

  // End Turn Phase
  turnEndPipeline(context);
  if (checkFaint()) return finalizeContext(context);

  return finalizeContext(context);
}

function finalizeContext(context) {
  // Dump trace to console in development
  if (!import.meta.env?.PROD) {
    context.trace.dump();
  }

  return {
    events: context.events,
    updatedState: {
      playerPokemon: context.state.playerPokemon,
      enemy: context.state.enemy,
      weather: context.state.weather,
    },
    seed: context.seed,
    trace: context.trace.entries,
  };
}
