
import { STATUS_EFFECTS } from "../registries/statuses";
import { WEATHER_EFFECTS } from "../weatherRegistry";
import { dispatchAbilityPhase } from "../abilityRegistry";

/**
 * The sole orchestrator of phase evaluations.
 * Protects the core runtime from knowing about specific registries.
 * 
 * @param {Object} context - The ReactionContext
 * @param {string} phase - The phase being evaluated (e.g. PHASES.PRE_MOVE)
 * @param {Object} phaseContext - Contextual data passed to the registries
 */
export function dispatchPhasePipeline(context, phase, phaseContext = {}) {
  context.dispatchPhase(phase, (ctx, pCtx) => {
    
    // 1. Weather
    const weatherEffect = WEATHER_EFFECTS[ctx.state.weather.type];
    if (weatherEffect && weatherEffect[phase]) {
      weatherEffect[phase](ctx, pCtx);
    }

    // 2. Abilities
    // Provide an explicit semantic key (`abilityOwner`) while keeping `attacker` for backwards compatibility.
    if (phaseContext.attacker) {
      dispatchAbilityPhase(phase, ctx, { ...pCtx, abilityOwner: phaseContext.attacker, attacker: phaseContext.attacker });
    }
    if (phaseContext.defender) {
      dispatchAbilityPhase(phase, ctx, { ...pCtx, abilityOwner: phaseContext.defender, attacker: phaseContext.defender });
    }

    // 3. Statuses (Persistent and Volatile)
    // Collect relevant combatants and deduplicate to avoid double-evaluation.
    const combatantsToCheck = [];
    if (pCtx.attacker) combatantsToCheck.push({ c: pCtx.attacker, tag: pCtx.attackerTag });
    if (pCtx.defender) combatantsToCheck.push({ c: pCtx.defender, tag: pCtx.defenderTag });
    if (pCtx.combatant) combatantsToCheck.push({ c: pCtx.combatant, tag: pCtx.targetTag }); // From TURN_END

    const seen = new Set();
    for (const { c, tag } of combatantsToCheck) {
      const uniqueId = c?.uuid || c?.id || `${tag}:${c?.name}`;
      if (seen.has(uniqueId)) continue;
      seen.add(uniqueId);

      // Persistent
      const statusCondition = c.status?.condition;
      if (statusCondition && STATUS_EFFECTS[statusCondition]?.[phase]) {
        // Pass `subject` / `subjectTag` for semantic clarity while retaining `attacker` keys for compatibility.
        STATUS_EFFECTS[statusCondition][phase](ctx, { ...pCtx, combatant: c, subject: c, attacker: c, targetTag: tag, subjectTag: tag, attackerTag: tag });
      }

      // Volatile
      const volatileStatuses = c.volatileStatuses || [];
      for (const vStatus of volatileStatuses) {
        if (STATUS_EFFECTS[vStatus.condition]?.[phase]) {
          STATUS_EFFECTS[vStatus.condition][phase](ctx, { ...pCtx, combatant: c, subject: c, attacker: c, targetTag: tag, subjectTag: tag, attackerTag: tag });
        }
      }
    }

  }, phaseContext);
}
