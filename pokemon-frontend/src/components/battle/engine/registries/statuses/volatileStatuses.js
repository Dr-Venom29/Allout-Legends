import { PHASES, PRIORITY } from "../../triggerPhases";
import { VOLATILE_STATUS } from "../../../../game/statusConditions";
import { createTextEvent, createWaitEvent } from "../../../events/createEvent";
import { applyDamage, DAMAGE_REASONS } from "../../applyDamage";
import { calculateDamage } from "../../../../../data/pokemon/battleHelpers";
import { removeVolatileStatus } from "../../runtimeMutations/statusMutations";

/**
 * Volatile Status Effects (Confusion, Flinch, etc.)
 * These reset upon switching out and are not tracked via main status icon.
 */
export const VOLATILE_STATUSES = {
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
        removeVolatileStatus(context, attacker, phaseContext.attackerTag, VOLATILE_STATUS.CONFUSION);
        context.emitReaction({
          priority: PRIORITY.STATUS,
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
          // Hits itself instead of attacking — signal blocked without mutating global state.
          
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
          priority: PRIORITY.STATUS,
          source: `VOLATILE_${VOLATILE_STATUS.CONFUSION}`,
          originPhase: PHASES.PRE_MOVE,
          events
        });
        if (roll < 0.33) return { blocked: true };
      }
    }
  }
};
