import { BATTLE_ACTIONS } from "../battleActions";
import { checkMoveHit } from "../battleAccuracy";
import { createTextEvent, createWaitEvent } from "../../events/createEvent";
import { PHASES } from "../triggerPhases";
import { dispatchPhasePipeline } from "./dispatchPhasePipeline";
import { executeDamagePipeline } from "./damagePipeline";

/**
 * Executes a participant's selected action for the turn.
 */
export function executeActionPipeline(context, isPlayerAttacking) {
  const { playerPokemon, enemy, playerAction, enemyAction } = context.state;

  const action = isPlayerAttacking ? playerAction : enemyAction;
  const attacker = isPlayerAttacking ? playerPokemon : enemy;
  const defender = isPlayerAttacking ? enemy : playerPokemon;
  const targetTag = isPlayerAttacking ? "enemy" : "player";
  const attackerTag = isPlayerAttacking ? "player" : "enemy";

  // Skip if not an engine-evaluated move (e.g. running or switching was handled pre-engine)
  if (!action || action.type !== BATTLE_ACTIONS.MOVE || !action.move) {
    return;
  }

  const move = action.move;

  // 1. PRE_MOVE Hooks (Statuses, flinching, etc.)
  context.executionBlocked = false;
  dispatchPhasePipeline(context, PHASES.PRE_MOVE, { attacker, targetTag, attackerTag });

  if (context.executionBlocked) return;

  // 2. Announce Move
  context.pushCoreEvent(createTextEvent(`${attacker.name} used ${move.name}!`));
  context.pushCoreEvent(createWaitEvent(500));

  // 3. Decrement PP (use context helper to keep mutation centralized and traced)
  context.decrementPP(move, attackerTag);

  // 4. Accuracy Check
  const hitCheck = checkMoveHit(move, attacker, defender, context.rng);
  if (!hitCheck.hit) {
    context.pushCoreEvent(createTextEvent(`${attacker.name}'s attack missed!`));
    context.pushCoreEvent(createWaitEvent(800));
    // Ensure POST_MOVE hooks always fire even on misses (some mechanics trigger on "after attempting a move").
    dispatchPhasePipeline(context, PHASES.POST_MOVE, { attacker, defender, move, attackerTag, defenderTag: targetTag });
    return;
  }

  // 5. Execute Damage
  executeDamagePipeline(context, attacker, defender, move, attackerTag, targetTag);

  // 6. POST_MOVE Hooks
  dispatchPhasePipeline(context, PHASES.POST_MOVE, { attacker, defender, move, attackerTag, defenderTag: targetTag });
}
