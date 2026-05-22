import { createTextEvent, createWaitEvent, createFaintEvent, createEndBattleEvent } from "../events/createEvent";
import { calculateDamage, getEffectivenessText } from "../../../data/pokemon/battleHelpers";
import { checkMoveHit } from "../battleAccuracy";
import { applyDamage, DAMAGE_REASONS } from "./applyDamage";
import { STATUS_EFFECTS } from "./statusRegistry";
import { dispatchAbilityPhase } from "./abilityRegistry";
import { resolvePowerModifiers } from "./resolvePowerModifiers";
import { ReactionContext } from "./ReactionContext";
import { PHASES } from "./triggerPhases";
import { WEATHER_EFFECTS } from "./weatherRegistry";

const NO_OP_MOVE = {
  name: "NO_OP",
  power: 0,
  type: "Normal",
  category: "status",
  accuracy: null,
  maxPP: null,
  currentPP: null,
  priority: 0,
  description: null,
  effects: null,
};

function assertValidEnemyOnlyState(state) {
  if (!state?.playerPokemon || typeof state.playerPokemon.currentHp !== "number") {
    throw new Error(`[Engine Validation] Invalid playerPokemon state.`);
  }

  if (!state?.enemy || typeof state.enemy.currentHp !== "number") {
    throw new Error(`[Engine Validation] Invalid enemy state.`);
  }

  if (!state?.enemyMove) {
    throw new Error(`[Engine Validation] Enemy must have a selected move to evaluate an enemy-only turn.`);
  }

  if (state.playerPokemon.currentHp < 0 || state.enemy.currentHp < 0) {
    throw new Error(`[Engine Validation] Negative HP detected before turn start. HP must never fall below 0.`);
  }
}

/**
 * PURE FUNCTION
 * Resolves an "enemy-only" turn instantly (player action already consumed elsewhere)
 * and returns an ordered semantic event queue.
 *
 * Used for: failed RUN, failed CAPTURE, manual SWITCH retaliation.
 */
export function buildEnemyOnlyTurnEvents(state, seed) {
  assertValidEnemyOnlyState(state);

  const context = new ReactionContext({
    playerPokemon: { ...state.playerPokemon },
    enemy: { ...state.enemy },
    weather: state.weather || { type: "NONE", turnsRemaining: 0 },
    playerMove: { ...(state.playerMove || NO_OP_MOVE) },
    enemyMove: { ...state.enemyMove },
  }, { seed });

  const { playerPokemon, enemy, enemyMove } = context.state;

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

  const executeEnemyAttack = () => {
    const attacker = enemy;
    const defender = playerPokemon;
    const move = enemyMove;

    // 1. PRE_MOVE hooks
    context.executionBlocked = false;
    context.dispatchPhase(
      PHASES.PRE_MOVE,
      (ctx, pCtx) => {
        const statusCondition = attacker.status?.condition;
        if (statusCondition && STATUS_EFFECTS[statusCondition]?.[PHASES.PRE_MOVE]) {
          STATUS_EFFECTS[statusCondition][PHASES.PRE_MOVE](ctx, pCtx);
        }

        const volatileStatuses = attacker.volatileStatuses || [];
        for (const vStatus of volatileStatuses) {
          if (STATUS_EFFECTS[vStatus.condition]?.[PHASES.PRE_MOVE]) {
            STATUS_EFFECTS[vStatus.condition][PHASES.PRE_MOVE](ctx, pCtx);
          }
        }
      },
      { attacker, targetTag: "player", attackerTag: "enemy" }
    );

    if (context.executionBlocked) return;

    // 2. Execute move
    context.pushCoreEvent(createTextEvent(`${attacker.name} used ${move.name}!`));
    context.pushCoreEvent(createWaitEvent(500));

    if (move.currentPP !== null && move.currentPP > 0) {
      move.currentPP -= 1;
    }

    const hitCheck = checkMoveHit(move, attacker, defender, context.rng);
    if (!hitCheck.hit) {
      context.pushCoreEvent(createTextEvent(`${attacker.name}'s attack missed!`));
      context.pushCoreEvent(createWaitEvent(800));
      return;
    }

    context.modifiers.power = [];
    context.dispatchPhase(
      PHASES.ON_DAMAGE,
      (ctx, pCtx) => {
        const weatherEffect = WEATHER_EFFECTS[ctx.state.weather.type];
        if (weatherEffect && weatherEffect[PHASES.ON_DAMAGE]) {
          weatherEffect[PHASES.ON_DAMAGE](ctx, pCtx);
        }
        
        // Evaluate Ability ON_DAMAGE modifiers
        dispatchAbilityPhase(PHASES.ON_DAMAGE, ctx, pCtx);
      },
      { attacker, defender, move, attackerTag: "enemy", defenderTag: "player" }
    );

    if (move.power > 0) {
      const finalPowerMultiplier = resolvePowerModifiers(context.modifiers.power);
      
      const { damage, effectiveness, critical } = calculateDamage(
        move,
        attacker,
        defender,
        finalPowerMultiplier,
        context.rng
      );

      const damageEvents = applyDamage({
        context,
        target: defender,
        targetTag: "player",
        amount: damage,
        reason: DAMAGE_REASONS.MOVE,
      });

      context.pushCoreEvents(damageEvents);

      if (critical) context.pushCoreEvent(createTextEvent("A critical hit!"));
      const effText = getEffectivenessText(effectiveness);
      if (effText) context.pushCoreEvent(createTextEvent(effText));

      context.pushCoreEvent(createWaitEvent(800));
    }

    context.dispatchPhase(PHASES.POST_DAMAGE, () => {});
    context.dispatchPhase(PHASES.POST_MOVE, () => {});
  };

  context.dispatchPhase(PHASES.ON_TURN_START, () => {});

  executeEnemyAttack();

  if (checkFaint()) return finalizeContext(context);

  context.dispatchPhase(PHASES.TURN_END, (ctx) => {
    const weatherEffect = WEATHER_EFFECTS[ctx.state.weather.type];
    if (weatherEffect && weatherEffect[PHASES.TURN_END]) {
      weatherEffect[PHASES.TURN_END](ctx);
    }

    [playerPokemon, enemy].forEach((combatant) => {
      const statusCondition = combatant.status?.condition;
      if (statusCondition && STATUS_EFFECTS[statusCondition]?.[PHASES.TURN_END]) {
        STATUS_EFFECTS[statusCondition][PHASES.TURN_END](ctx, {
          combatant,
          targetTag: combatant === playerPokemon ? "player" : "enemy",
        });
      }
    });
  });

  if (context.state.weather.turnsRemaining > 0) {
    context.state.weather.turnsRemaining -= 1;
    if (context.state.weather.turnsRemaining === 0) {
      context.state.weather.type = "NONE";
      context.pushCoreEvent(createTextEvent("The weather cleared."));
    }
  }

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
