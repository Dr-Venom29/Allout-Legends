import { resolveModifiers } from "../resolveModifiers";
import { calculateDamage, getEffectivenessText } from "../../../../data/pokemon/battleHelpers";
import { applyDamage, DAMAGE_REASONS } from "../applyDamage";
import { createTextEvent, createWaitEvent } from "../../events/createEvent";
import { dispatchPhasePipeline } from "./dispatchPhasePipeline";
import { PHASES } from "../triggerPhases";

/**
 * Handles all damage resolution, including modifiers, effectiveness, and execution.
 * 
 * @param {Object} context 
 * @param {Object} attacker 
 * @param {Object} defender 
 * @param {Object} move 
 * @param {string} attackerTag 
 * @param {string} defenderTag 
 */
export function executeDamagePipeline(context, attacker, defender, move, attackerTag, defenderTag) {
  if (move.power <= 0) return;
  // 1. Trigger ON_DAMAGE Modifiers using a phase-local modifier bucket (prevents cross-phase contamination)
  const powerBucket = [];
  dispatchPhasePipeline(context, PHASES.ON_DAMAGE, { attacker, defender, move, attackerTag, defenderTag, modifierBuckets: { power: powerBucket } });

  // 2. Resolve Modifiers from the phase-local bucket
  const finalPowerMultiplier = resolveModifiers(powerBucket);
  // Structured trace emit for modifier resolution
  if (context.trace && typeof context.trace.emit === "function") {
    context.trace.emit({ category: "MODIFIER", source: "executeDamagePipeline", payload: { bucket: "power", resolved: finalPowerMultiplier, entries: powerBucket } });
  }
  
  // 3. Calculate Math
  const { damage, effectiveness, critical } = calculateDamage(
    move, 
    attacker, 
    defender, 
    finalPowerMultiplier,
    context.rng
  );
  
  // 4. Apply Mutation and Generate Core Events
  const damageEvents = applyDamage({
    context,
    target: defender,
    targetTag: defenderTag,
    amount: damage,
    reason: DAMAGE_REASONS.MOVE
  });
  
  context.pushCoreEvents(damageEvents);

  if (critical) context.pushCoreEvent(createTextEvent("A critical hit!"));
  const effText = getEffectivenessText(effectiveness);
  if (effText) context.pushCoreEvent(createTextEvent(effText));

  // TRANSITIONAL: presentation pacing coupling. Presentation layer should decide waits.
  context.pushCoreEvent(createWaitEvent(800));

  // 5. Trigger POST_DAMAGE (e.g. Rough Skin recoil)
  dispatchPhasePipeline(context, PHASES.POST_DAMAGE, { attacker, defender, move, attackerTag, defenderTag, damageAmount: damage });
}
