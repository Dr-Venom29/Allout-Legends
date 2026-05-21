import { PHASES, PRIORITY } from "./triggerPhases";
import { STATUS, VOLATILE_STATUS } from "../../game/statusConditions";
import { createTextEvent, createWaitEvent, createStatusBlockEvent } from "../events/createEvent";
import { applyDamage, DAMAGE_REASONS } from "./applyDamage";
import { calculateDamage } from "../../../data/pokemon/battleHelpers";

/**
 * Status Effect Registry
 * 
 * Formalizes all legacy pre-turn and end-turn logic into pure phase hooks.
 * All effect resolution must be synchronous and emit reactions to the context.
 */
export const STATUS_EFFECTS = {
  
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
        priority: PRIORITY.NORMAL,
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
        priority: PRIORITY.NORMAL,
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
        // Block execution
        context.executionBlocked = true;
        
        context.emitReaction({
          priority: PRIORITY.NORMAL,
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
          priority: PRIORITY.NORMAL,
          source: `STATUS_${STATUS.SLEEP}`,
          originPhase: PHASES.PRE_MOVE,
          events: [
            createStatusBlockEvent(phaseContext.targetTag, STATUS.SLEEP),
            createTextEvent(`${attacker.name} is fast asleep!`),
            createWaitEvent(800)
          ]
        });
      } else {
        attacker.status = null;
        context.emitReaction({
          priority: PRIORITY.NORMAL,
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
        attacker.status = null;
        context.emitReaction({
          priority: PRIORITY.NORMAL,
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
          priority: PRIORITY.NORMAL,
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
  },

  // ==========================================
  // VOLATILE Statuses
  // ==========================================

  [VOLATILE_STATUS.CONFUSION]: {
    [PHASES.PRE_MOVE]: (context, phaseContext) => {
      const attacker = phaseContext.attacker;
      const volatileStatuses = attacker.volatileStatuses || [];
      const confusionIndex = volatileStatuses.findIndex(vs => vs.condition === VOLATILE_STATUS.CONFUSION);
      
      if (confusionIndex === -1) return;
      const confusion = volatileStatuses[confusionIndex];

      confusion.turnsRemaining -= 1;

      if (confusion.turnsRemaining <= 0) {
        // Snap out
        attacker.volatileStatuses.splice(confusionIndex, 1);
        context.emitReaction({
          priority: PRIORITY.NORMAL,
          source: `VOLATILE_${VOLATILE_STATUS.CONFUSION}`,
          originPhase: PHASES.PRE_MOVE,
          events: [
            createTextEvent(`${attacker.name} snapped out of confusion!`),
            createWaitEvent(800)
          ]
        });
      } else {
        // Still confused
        const roll = context.rng();
        const events = [
          createTextEvent(`${attacker.name} is confused!`),
          createWaitEvent(500)
        ];

        if (roll < 0.33) {
          context.executionBlocked = true; // Hits itself instead of attacking
          
          // Confusion damage is typeless physical 40 BP
          const mockMove = { power: 40, category: 'physical', type: null };
          
          // Calculate pure math
          const { damage } = calculateDamage(mockMove, attacker, attacker, 1.0, context.rng);

          // Apply authoritative damage
          const damageEvents = applyDamage({
            context,
            target: attacker,
            targetTag: phaseContext.attackerTag,
            amount: damage,
            reason: DAMAGE_REASONS.CONFUSION,
            message: `It hurt itself in its confusion!`
          });

          events.push(...damageEvents, createWaitEvent(800));
        }

        context.emitReaction({
          priority: PRIORITY.NORMAL,
          source: `VOLATILE_${VOLATILE_STATUS.CONFUSION}`,
          originPhase: PHASES.PRE_MOVE,
          events
        });
      }
    }
  }

};
