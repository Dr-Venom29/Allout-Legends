import { PHASES, PRIORITY } from "../../triggerPhases";
import { STATUS } from "../../../../game/statusConditions";
import { createTextEvent, createWaitEvent, createStatusBlockEvent } from "../../../events/createEvent";
import { applyDamage, DAMAGE_REASONS } from "../../applyDamage";
import { removeStatus } from "../../runtimeMutations/statusMutations";

/**
 * Persistent Status Effects (Burn, Poison, Paralysis, Sleep, Freeze)
 * These persist across switches and are represented by the main status icon.
 */
export const PERSISTENT_STATUSES = {
  // ==========================================
  // TURN_END Statuses (Damage Ticks)
  // ==========================================

  [STATUS.POISON]: {
    [PHASES.TURN_END]: (context, phaseContext) => {
      const combatant = phaseContext.combatant;
      if (combatant.currentHp <= 0) return;

      const damage = Math.max(1, Math.floor(combatant.maxHp / 8));
      
      const events = applyDamage({
        context,
        target: combatant,
        targetTag: phaseContext.targetTag,
        amount: damage,
        reason: DAMAGE_REASONS.STATUS,
        message: `${combatant.name} is hurt by poison!`
      });

      context.emitReaction({
        priority: PRIORITY.STATUS,
        source: `STATUS_${STATUS.POISON}`,
        originPhase: PHASES.TURN_END,
        events
      });
    }
  },

  [STATUS.BURN]: {
    [PHASES.TURN_END]: (context, phaseContext) => {
      const combatant = phaseContext.combatant;
      if (combatant.currentHp <= 0) return;

      const damage = Math.max(1, Math.floor(combatant.maxHp / 16));
      
      const events = applyDamage({
        context,
        target: combatant,
        targetTag: phaseContext.targetTag,
        amount: damage,
        reason: DAMAGE_REASONS.STATUS,
        message: `${combatant.name} is hurt by its burn!`
      });

      context.emitReaction({
        priority: PRIORITY.STATUS,
        source: `STATUS_${STATUS.BURN}`,
        originPhase: PHASES.TURN_END,
        events
      });
    }
  },

  // ==========================================
  // PRE_MOVE Statuses (Execution Blockers)
  // ==========================================

  [STATUS.PARALYSIS]: {
    [PHASES.PRE_MOVE]: (context, phaseContext) => {
      const attacker = phaseContext.attacker;
      const roll = context.rng();
      
      if (roll < 0.25) {
        context.executionBlocked = true;
        
        context.emitReaction({
          priority: PRIORITY.STATUS,
          source: `STATUS_${STATUS.PARALYSIS}`,
          originPhase: PHASES.PRE_MOVE,
          events: [
            createStatusBlockEvent(phaseContext.targetTag, STATUS.PARALYSIS),
            createTextEvent(`${attacker.name} is fully paralyzed!`),
            createWaitEvent(800)
          ]
        });
      }
    }
  },

  [STATUS.SLEEP]: {
    [PHASES.PRE_MOVE]: (context, phaseContext) => {
      const attacker = phaseContext.attacker;
      const turns = attacker.status?.turnsRemaining ?? 0;
      
      if (turns > 1) {
        attacker.status.turnsRemaining -= 1;
        context.executionBlocked = true;

        context.emitReaction({
          priority: PRIORITY.STATUS,
          source: `STATUS_${STATUS.SLEEP}`,
          originPhase: PHASES.PRE_MOVE,
          events: [
            createStatusBlockEvent(phaseContext.targetTag, STATUS.SLEEP),
            createTextEvent(`${attacker.name} is fast asleep!`),
            createWaitEvent(800)
          ]
        });
      } else {
        removeStatus(context, attacker, phaseContext.attackerTag);
        context.emitReaction({
          priority: PRIORITY.STATUS,
          source: `STATUS_${STATUS.SLEEP}`,
          originPhase: PHASES.PRE_MOVE,
          events: [
            createTextEvent(`${attacker.name} woke up!`),
            createWaitEvent(800)
          ]
        });
      }
    }
  },

  [STATUS.FREEZE]: {
    [PHASES.PRE_MOVE]: (context, phaseContext) => {
      const attacker = phaseContext.attacker;
      const roll = context.rng();

      if (roll < 0.2) {
        removeStatus(context, attacker, phaseContext.attackerTag);
        context.emitReaction({
          priority: PRIORITY.STATUS,
          source: `STATUS_${STATUS.FREEZE}`,
          originPhase: PHASES.PRE_MOVE,
          events: [
            createTextEvent(`${attacker.name} thawed out!`),
            createWaitEvent(800)
          ]
        });
      } else {
        context.executionBlocked = true;
        context.emitReaction({
          priority: PRIORITY.STATUS,
          source: `STATUS_${STATUS.FREEZE}`,
          originPhase: PHASES.PRE_MOVE,
          events: [
            createStatusBlockEvent(phaseContext.targetTag, STATUS.FREEZE),
            createTextEvent(`${attacker.name} is frozen solid!`),
            createWaitEvent(800)
          ]
        });
      }
    }
  }
};
