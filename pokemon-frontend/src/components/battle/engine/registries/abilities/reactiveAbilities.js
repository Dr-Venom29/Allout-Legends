import { PHASES, PRIORITY } from "../../triggerPhases";
import { applyDamage, DAMAGE_REASONS } from "../../applyDamage";
import { applyStatus } from "../../runtimeMutations/statusMutations";
import { STATUS } from "../../../../game/statusConditions";
import { createTextEvent, createWaitEvent } from "../../../events/createEvent";

export const REACTIVE_ABILITIES = {
  ROUGH_SKIN: "ROUGH_SKIN",
  STATIC: "STATIC",
  FLAME_BODY: "FLAME_BODY",
  POISON_POINT: "POISON_POINT",
  EFFECT_SPORE: "EFFECT_SPORE",
  IRON_BARBS: "IRON_BARBS",
  AFTERMATH: "AFTERMATH",
};



export const REACTIVE_ABILITY_EFFECTS = {
  [REACTIVE_ABILITIES.ROUGH_SKIN]: {
    [PHASES.POST_DAMAGE]: (context, pCtx) => {
      // pCtx in POST_DAMAGE: { attacker, defender, move, attackerTag, defenderTag, damageAmount }
      // NOTE: 'attacker' here is the one who used the move.
      // The ability holder is the 'defender' in this context.
      const { attacker, move, attackerTag, abilityOwner } = pCtx;

      // Only trigger if defender actually has the ability
      if (abilityOwner.ability !== REACTIVE_ABILITIES.ROUGH_SKIN) return;
      if (!move.makesContact) return;
      if (attacker.currentHp <= 0) return;

      const recoilDamage = Math.max(1, Math.floor(attacker.maxHp / 8));

      const events = applyDamage({
        context,
        target: attacker,
        targetTag: attackerTag,
        amount: recoilDamage,
        reason: DAMAGE_REASONS.RECOIL,
        message: `${attacker.name} was hurt by ${abilityOwner.name}'s Rough Skin!`
      });

      context.emitReaction({
        priority: PRIORITY.ABILITY,
        source: REACTIVE_ABILITIES.ROUGH_SKIN,
        originPhase: PHASES.POST_DAMAGE,
        events: [...events, createWaitEvent(800)]
      });
    }
  },

  [REACTIVE_ABILITIES.IRON_BARBS]: {
    [PHASES.POST_DAMAGE]: (context, pCtx) => {
      const { attacker, move, attackerTag, abilityOwner } = pCtx;

      // Only trigger if defender actually has the ability
      if (abilityOwner.ability !== REACTIVE_ABILITIES.IRON_BARBS) return;
      if (!move.makesContact) return;
      if (attacker.currentHp <= 0) return;

      const recoilDamage = Math.max(1, Math.floor(attacker.maxHp / 8));

      const events = applyDamage({
        context,
        target: attacker,
        targetTag: attackerTag,
        amount: recoilDamage,
        reason: DAMAGE_REASONS.RECOIL,
        message: `${attacker.name} was hurt by ${abilityOwner.name}'s Iron Barbs!`
      });

      context.emitReaction({
        priority: PRIORITY.ABILITY,
        source: REACTIVE_ABILITIES.IRON_BARBS,
        originPhase: PHASES.POST_DAMAGE,
        events: [...events, createWaitEvent(800)]
      });
    }
  },

  [REACTIVE_ABILITIES.STATIC]: {
    [PHASES.POST_DAMAGE]: (context, pCtx) => {
      const { attacker, move, attackerTag, abilityOwner } = pCtx;
      if (abilityOwner.ability !== REACTIVE_ABILITIES.STATIC) return;
      if (!move.makesContact) return;
      if (attacker.currentHp <= 0 || attacker.status) return;

      const roll = context.rng("ABILITY_STATIC");
      if (roll < 0.30) {
        const applied = applyStatus(context, attacker, attackerTag, STATUS.PARALYSIS);
        if (applied) {
          context.emitReaction({
            priority: PRIORITY.ABILITY,
            source: REACTIVE_ABILITIES.STATIC,
            originPhase: PHASES.POST_DAMAGE,
            events: [
              createTextEvent(`${attacker.name} was paralyzed by ${abilityOwner.name}'s Static!`),
              createWaitEvent(800)
            ]
          });
        }
      }
    }
  },

  [REACTIVE_ABILITIES.FLAME_BODY]: {
    [PHASES.POST_DAMAGE]: (context, pCtx) => {
      const { attacker, move, attackerTag, abilityOwner } = pCtx;
      if (abilityOwner.ability !== REACTIVE_ABILITIES.FLAME_BODY) return;
      if (!move.makesContact) return;
      if (attacker.currentHp <= 0 || attacker.status) return;

      const roll = context.rng("ABILITY_FLAME_BODY");
      if (roll < 0.30) {
        const applied = applyStatus(context, attacker, attackerTag, STATUS.BURN);
        if (applied) {
          context.emitReaction({
            priority: PRIORITY.ABILITY,
            source: REACTIVE_ABILITIES.FLAME_BODY,
            originPhase: PHASES.POST_DAMAGE,
            events: [
              createTextEvent(`${attacker.name} was burned by ${abilityOwner.name}'s Flame Body!`),
              createWaitEvent(800)
            ]
          });
        }
      }
    }
  },

  [REACTIVE_ABILITIES.POISON_POINT]: {
    [PHASES.POST_DAMAGE]: (context, pCtx) => {
      const { attacker, move, attackerTag, abilityOwner } = pCtx;
      if (abilityOwner.ability !== REACTIVE_ABILITIES.POISON_POINT) return;
      if (!move.makesContact) return;
      if (attacker.currentHp <= 0 || attacker.status) return;

      const roll = context.rng("ABILITY_POISON_POINT");
      if (roll < 0.30) {
        const applied = applyStatus(context, attacker, attackerTag, STATUS.POISON);
        if (applied) {
          context.emitReaction({
            priority: PRIORITY.ABILITY,
            source: REACTIVE_ABILITIES.POISON_POINT,
            originPhase: PHASES.POST_DAMAGE,
            events: [
              createTextEvent(`${attacker.name} was poisoned by ${abilityOwner.name}'s Poison Point!`),
              createWaitEvent(800)
            ]
          });
        }
      }
    }
  },

  [REACTIVE_ABILITIES.EFFECT_SPORE]: {
    [PHASES.POST_DAMAGE]: (context, pCtx) => {
      const { attacker, move, attackerTag, abilityOwner } = pCtx;
      if (abilityOwner.ability !== REACTIVE_ABILITIES.EFFECT_SPORE) return;
      if (!move.makesContact) return;
      if (attacker.currentHp <= 0 || attacker.status) return;

      const roll = context.rng("ABILITY_EFFECT_SPORE");
      if (roll < 0.30) { // 30% chance to trigger overall
        const statusRoll = context.rng("ABILITY_EFFECT_SPORE_CONDITION");
        let conditionToApply = STATUS.POISON;
        let msg = "poisoned";

        if (statusRoll < 0.33) {
          conditionToApply = STATUS.PARALYSIS;
          msg = "paralyzed";
        } else if (statusRoll < 0.66) {
          conditionToApply = STATUS.SLEEP;
          msg = "put to sleep";
        }

        const applied = applyStatus(context, attacker, attackerTag, conditionToApply, conditionToApply === STATUS.SLEEP ? 3 : null);
        if (applied) {
          context.emitReaction({
            priority: PRIORITY.ABILITY,
            source: REACTIVE_ABILITIES.EFFECT_SPORE,
            originPhase: PHASES.POST_DAMAGE,
            events: [
              createTextEvent(`${attacker.name} was ${msg} by ${abilityOwner.name}'s Effect Spore!`),
              createWaitEvent(800)
            ]
          });
        }
      }
    }
  },

  [REACTIVE_ABILITIES.AFTERMATH]: {
    [PHASES.POST_FAINT]: (context, pCtx) => {
      // pCtx: { faintedCombatant, faintedTag, move, attacker, attackerTag, abilityOwner }
      const { move, attacker, attackerTag, abilityOwner } = pCtx;

      if (abilityOwner.ability !== REACTIVE_ABILITIES.AFTERMATH) return;
      if (!move || !move.makesContact) return;
      if (!attacker || attacker.currentHp <= 0) return; // Attacker is already dead

      const aftermathDamage = Math.max(1, Math.floor(attacker.maxHp / 4));

      const events = applyDamage({
        context,
        target: attacker,
        targetTag: attackerTag,
        amount: aftermathDamage,
        reason: DAMAGE_REASONS.RECOIL,
        message: `${attacker.name} is hurt by ${abilityOwner.name}'s Aftermath!`
      });

      context.emitReaction({
        priority: PRIORITY.ABILITY,
        source: REACTIVE_ABILITIES.AFTERMATH,
        originPhase: PHASES.POST_FAINT,
        events: [...events, createWaitEvent(800)]
      });
    }
  }
};
