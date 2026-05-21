import { createTextEvent, createDamageEvent, createWaitEvent, createFaintEvent, createEndBattleEvent } from "../events/createEvent";
import { calculateDamage, getEffectivenessText } from "../../../data/pokemon/battleHelpers";
import { determineTurnOrder } from "../battleTurnOrder";
import { checkMoveHit } from "../battleAccuracy";
import { processPreTurnStatuses } from "./processPreTurnStatuses";
import { processEndTurnStatuses } from "./processEndTurnStatuses";

/**
 * PURE FUNCTION
 * Resolves a full battle turn instantly and returns an ordered queue of events.
 * 
 * @param {Object} state - The current battle state
 * @returns {Object} { events: Array, updatedState: Object }
 */
export function buildTurnEvents(state) {
  // The Context Object: The backbone of the deterministic engine
  const context = {
    queue: [],
    player: { ...state.playerPokemon },
    enemy: { ...state.enemy },
    rng: Math.random, // In the future, this can be seeded for replays
  };
  
  // Clone moves
  const playerMove = { ...state.playerMove };
  const enemyMove = { ...state.enemyMove };

  // Determine order (Turn order natively respects Paralysis speed drops from getModifiedStats if implemented)
  const turnOrder = determineTurnOrder(context.player, context.enemy, playerMove, enemyMove);

  const checkFaint = () => {
    if (context.enemy.currentHp <= 0) {
      context.queue.push(createFaintEvent("enemy"));
      context.queue.push(createTextEvent(`${context.enemy.name} fainted!`));
      context.queue.push(createWaitEvent(1000));
      context.queue.push(createTextEvent("You won!"));
      context.queue.push(createEndBattleEvent("win"));
      return true;
    }
    if (context.player.currentHp <= 0) {
      context.queue.push(createFaintEvent("player"));
      context.queue.push(createTextEvent(`${context.player.name} fainted!`));
      context.queue.push(createWaitEvent(1000));
      context.queue.push(createEndBattleEvent("lose"));
      return true;
    }
    return false;
  };

  const executeAttack = (isPlayerAttacking) => {
    const attacker = isPlayerAttacking ? context.player : context.enemy;
    const defender = isPlayerAttacking ? context.enemy : context.player;
    const move = isPlayerAttacking ? playerMove : enemyMove;
    const targetTag = isPlayerAttacking ? "enemy" : "player";
    const attackerTag = isPlayerAttacking ? "player" : "enemy";

    // 1. Pre-Turn Status Check (e.g. Paralysis)
    const isBlocked = processPreTurnStatuses(context, attacker, attackerTag);
    if (isBlocked) return;

    // 2. Text Event
    context.queue.push(createTextEvent(`${attacker.name} used ${move.name}!`));
    context.queue.push(createWaitEvent(500));

    // Decrement PP (Engine state only)
    if (move.currentPP !== null && move.currentPP > 0) {
      move.currentPP -= 1;
    }

    // 3. Accuracy Check
    const hitCheck = checkMoveHit(move, attacker, defender);
    if (!hitCheck.hit) {
      context.queue.push(createTextEvent(`${attacker.name}'s attack missed!`));
      context.queue.push(createWaitEvent(800));
      return;
    }

    // 4. Damage Resolution
    if (move.power > 0) {
      const { damage, effectiveness, critical } = calculateDamage(move, attacker, defender);
      
      const prevHp = defender.currentHp;
      const newHp = Math.max(0, prevHp - damage);
      
      defender.currentHp = newHp;

      // Queue UI update
      context.queue.push(createDamageEvent({
        target: targetTag,
        previousHp: prevHp,
        newHp: newHp,
      }));

      // Queue text
      if (critical) context.queue.push(createTextEvent("A critical hit!"));
      const effText = getEffectivenessText(effectiveness);
      if (effText) context.queue.push(createTextEvent(effText));

      context.queue.push(createWaitEvent(800));
    }
  };

  // Turn 1
  if (turnOrder.first === "player") {
    executeAttack(true);
  } else {
    executeAttack(false);
  }

  // Faint Check 1
  if (checkFaint()) return finalizeContext(context);

  // Turn 2
  if (turnOrder.first === "player") {
    executeAttack(false);
  } else {
    executeAttack(true);
  }

  // Faint Check 2
  if (checkFaint()) return finalizeContext(context);

  // End of Turn Statuses (Poison/Burn)
  processEndTurnStatuses(context);
  
  // Final faint check after status damage
  if (checkFaint()) return finalizeContext(context);

  return finalizeContext(context);
}

function finalizeContext(context) {
  return {
    events: context.queue,
    updatedState: {
      playerPokemon: context.player,
      enemy: context.enemy,
    },
  };
}
