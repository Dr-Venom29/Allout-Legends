import { createTextEvent, createWaitEvent, createFaintEvent, createEndBattleEvent } from "../events/createEvent";
import { calculateDamage, getEffectivenessText } from "../../../data/pokemon/battleHelpers";
import { determineTurnOrder } from "../battleTurnOrder";
import { checkMoveHit } from "../battleAccuracy";
import { applyDamage, DAMAGE_REASONS } from "./applyDamage";
import { STATUS_EFFECTS } from "./statusRegistry";
import { assertValidBattleState } from "./engineValidation";
import { ReactionContext } from "./ReactionContext";
import { PHASES } from "./triggerPhases";
import { WEATHER_EFFECTS } from "./weatherRegistry";

/**
 * PURE FUNCTION
 * Resolves a full battle turn instantly and returns an ordered queue of events.
 * 
 * @param {Object} state - The current battle state
 * @returns {Object} { events: Array, updatedState: Object }
 */
export function buildTurnEvents(state) {
  // Guard the engine from invalid state injection
  assertValidBattleState(state);

  // Initialize Reaction Context
  const context = new ReactionContext({
    playerPokemon: { ...state.playerPokemon },
    enemy: { ...state.enemy },
    weather: state.weather || { type: "NONE", turnsRemaining: 0 },
    playerMove: { ...state.playerMove },
    enemyMove: { ...state.enemyMove },
  });

  const { playerPokemon, enemy, playerMove, enemyMove } = context.state;

  // Determine order
  const turnOrder = determineTurnOrder(playerPokemon, enemy, playerMove, enemyMove, context.rng);

  const checkFaint = () => {
    if (enemy.currentHp <= 0) {
      context.pushCoreEvent(createFaintEvent("enemy"));
      context.pushCoreEvent(createTextEvent(`${enemy.name} fainted!`));
      context.pushCoreEvent(createWaitEvent(1000));
      context.pushCoreEvent(createTextEvent("You won!"));
      context.pushCoreEvent(createEndBattleEvent("win"));
      return true;
    }
    if (playerPokemon.currentHp <= 0) {
      context.pushCoreEvent(createFaintEvent("player"));
      context.pushCoreEvent(createTextEvent(`${playerPokemon.name} fainted!`));
      context.pushCoreEvent(createWaitEvent(1000));
      context.pushCoreEvent(createEndBattleEvent("lose"));
      return true;
    }
    return false;
  };

  const executeAttack = (isPlayerAttacking) => {
    const attacker = isPlayerAttacking ? playerPokemon : enemy;
    const defender = isPlayerAttacking ? enemy : playerPokemon;
    const move = isPlayerAttacking ? playerMove : enemyMove;
    const targetTag = isPlayerAttacking ? "enemy" : "player";
    const attackerTag = isPlayerAttacking ? "player" : "enemy";

    // 1. PRE_MOVE Hooks (Statuses, flinching, etc.)
    context.executionBlocked = false;
    context.dispatchPhase(PHASES.PRE_MOVE, (ctx, pCtx) => {
      // Evaluate Status Effects
      const statusCondition = attacker.status?.condition;
      if (statusCondition && STATUS_EFFECTS[statusCondition]?.[PHASES.PRE_MOVE]) {
        STATUS_EFFECTS[statusCondition][PHASES.PRE_MOVE](ctx, pCtx);
      }
      
      // Evaluate Volatiles (Confusion)
      const volatileStatuses = attacker.volatileStatuses || [];
      for (const vStatus of volatileStatuses) {
        if (STATUS_EFFECTS[vStatus.condition]?.[PHASES.PRE_MOVE]) {
          STATUS_EFFECTS[vStatus.condition][PHASES.PRE_MOVE](ctx, pCtx);
        }
      }
    }, { attacker, targetTag, attackerTag });

    if (context.executionBlocked) return;

    // 2. Execute Move 
    context.pushCoreEvent(createTextEvent(`${attacker.name} used ${move.name}!`));
    context.pushCoreEvent(createWaitEvent(500));

    // Decrement PP
    if (move.currentPP !== null && move.currentPP > 0) {
      move.currentPP -= 1;
    }

    // Accuracy Check
    const hitCheck = checkMoveHit(move, attacker, defender, context.rng);
    if (!hitCheck.hit) {
      context.pushCoreEvent(createTextEvent(`${attacker.name}'s attack missed!`));
      context.pushCoreEvent(createWaitEvent(800));
      return;
    }

    // ON_DAMAGE Phase (Modifiers)
    context.damageModifiers.powerMultiplier = 1.0; // Reset for each move
    context.dispatchPhase(PHASES.ON_DAMAGE, (ctx, pCtx) => {
      // Evaluate Weather ON_DAMAGE modifiers
      const weatherEffect = WEATHER_EFFECTS[ctx.state.weather.type];
      if (weatherEffect && weatherEffect[PHASES.ON_DAMAGE]) {
        weatherEffect[PHASES.ON_DAMAGE](ctx, pCtx); // e.g. Rain modifying Fire/Water power
      }
      // Future: Abilities like Adaptability, Items like Life Orb
    }, { move });

    // Damage Resolution
    if (move.power > 0) {
      const { damage, effectiveness, critical } = calculateDamage(
        move, 
        attacker, 
        defender, 
        context.damageModifiers.powerMultiplier,
        context.rng
      );
      
      const damageEvents = applyDamage({
        context,
        target: defender,
        targetTag: targetTag,
        amount: damage,
        reason: DAMAGE_REASONS.MOVE
      });
      
      context.pushCoreEvent(...damageEvents);

      if (critical) context.pushCoreEvent(createTextEvent("A critical hit!"));
      const effText = getEffectivenessText(effectiveness);
      if (effText) context.pushCoreEvent(createTextEvent(effText));

      context.pushCoreEvent(createWaitEvent(800));
    }

    // POST_DAMAGE / POST_MOVE Hooks
    context.dispatchPhase(PHASES.POST_DAMAGE, () => {
      // Future: Rough Skin, Rocky Helmet, Berserk
    });

    context.dispatchPhase(PHASES.POST_MOVE, () => {
      // Future: Life Orb recoil, Stat drops from moves like Superpower
    });
  };

  // Turn Flow Execution
  context.dispatchPhase(PHASES.ON_TURN_START, () => {
    // Future: Quick Claw, etc.
  });

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

  // END TURN PHASE
  // Formal TURN_END Phase hooks (Weather ticks, Status ticks, Leftovers, etc)
  context.dispatchPhase(PHASES.TURN_END, (ctx) => {
    
    // 1. Evaluate Weather ticks
    const weatherEffect = WEATHER_EFFECTS[ctx.state.weather.type];
    if (weatherEffect && weatherEffect[PHASES.TURN_END]) {
      weatherEffect[PHASES.TURN_END](ctx);
    }

    // 2. Evaluate Status ticks (Poison/Burn)
    [playerPokemon, enemy].forEach(combatant => {
      const statusCondition = combatant.status?.condition;
      if (statusCondition && STATUS_EFFECTS[statusCondition]?.[PHASES.TURN_END]) {
        STATUS_EFFECTS[statusCondition][PHASES.TURN_END](ctx, { combatant, targetTag: combatant === playerPokemon ? "player" : "enemy" });
      }
    });

  });

  // Decrement Weather State
  if (context.state.weather.turnsRemaining > 0) {
    context.state.weather.turnsRemaining -= 1;
    if (context.state.weather.turnsRemaining === 0) {
      context.state.weather.type = "NONE";
      context.pushCoreEvent(createTextEvent("The weather cleared."));
    }
  }

  // Final Faint Check
  if (checkFaint()) return finalizeContext(context);

  return finalizeContext(context);
}

function finalizeContext(context) {
  return {
    events: context.events,
    updatedState: {
      playerPokemon: context.state.playerPokemon,
      enemy: context.state.enemy,
      weather: context.state.weather,
    },
  };
}
