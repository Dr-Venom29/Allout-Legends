
import { STATUS_EFFECTS } from "../registries/statuses";
import { WEATHER_EFFECTS } from "../weatherRegistry";
import { dispatchAbilityPhase } from "../abilityRegistry";
import { getEffectiveSpeed } from "../../../../battle/battleTurnOrder";

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
    const originalModifiers = ctx.modifiers;

    // Overlay modifiers if provided — ensure restoration even when registries throw.
    if (phaseContext.modifierBuckets) {
      ctx.modifiers = { ...originalModifiers, ...phaseContext.modifierBuckets };
      if (ctx.trace && typeof ctx.trace.emit === "function") {
        ctx.trace.emit({ category: "MODIFIER", source: "dispatchPhasePipeline", payload: { action: "overlayModifiers" } });
      }
    }

    // Create a shallow frozen snapshot of pCtx to reduce accidental top-level mutations by registries.
    const safePctx = Object.freeze({ ...pCtx });

    // Internal dispatch helpers keep separation of concerns inside this file.
    // Merge two phase results conservatively for now (OR blocked). Future: expand schema.
    function mergePhaseResults(a, b) {
      if (!a) return b || null;
      if (!b) return a || null;
      return { blocked: Boolean(a.blocked) || Boolean(b.blocked) };
    }

    // Determine a deterministic combatant evaluation order. Uses explicit ordering if provided,
    // otherwise sorts by effective speed (descending), then by uuid/name fallback for stability.
    function computeCombatantOrder(combatantEntries = []) {
      if (!Array.isArray(combatantEntries) || combatantEntries.length === 0) return [];
      // If caller provided explicit order (array of tags), respect it
      if (phaseContext.ordering && Array.isArray(phaseContext.ordering)) {
        const map = new Map(combatantEntries.map(e => [e.tag, e]));
        const ordered = [];
        for (const tag of phaseContext.ordering) {
          if (map.has(tag)) ordered.push(map.get(tag));
        }
        // Append any remaining not listed
        for (const e of combatantEntries) if (!ordered.includes(e)) ordered.push(e);
        return ordered;
      }

      // Default: sort by effective speed desc, then deterministic uuid/name
      return [...combatantEntries].sort((a, b) => {
        const sa = getEffectiveSpeed(a.c || {});
        const sb = getEffectiveSpeed(b.c || {});
        if (sa !== sb) return sb - sa; // higher speed first
        const ua = a.c?.uuid || a.tag || a.c?.name || "";
        const ub = b.c?.uuid || b.tag || b.c?.name || "";
        return ua < ub ? -1 : ua > ub ? 1 : 0;
      });
    }
    function dispatchWeather() {
      const weatherEffect = WEATHER_EFFECTS[ctx.state.weather.type];
      if (weatherEffect && weatherEffect[phase]) {
        return weatherEffect[phase](ctx, safePctx);
      }
      return null;
    }

    function dispatchAbilities() {
      let blocked = false;
      if (phaseContext.attacker) {
        const r = dispatchAbilityPhase(phase, ctx, { ...safePctx, abilityOwner: phaseContext.attacker });
        if (r && r.blocked) blocked = true;
      }
      if (phaseContext.defender) {
        const r = dispatchAbilityPhase(phase, ctx, { ...safePctx, abilityOwner: phaseContext.defender });
        if (r && r.blocked) blocked = true;
      }
      return blocked ? { blocked: true } : null;
    }

    function dispatchStatuses() {
      const combatantsToCheck = [];
      if (pCtx.attacker) combatantsToCheck.push({ c: pCtx.attacker, tag: pCtx.attackerTag });
      if (pCtx.defender) combatantsToCheck.push({ c: pCtx.defender, tag: pCtx.defenderTag });
      if (pCtx.combatant) combatantsToCheck.push({ c: pCtx.combatant, tag: pCtx.targetTag });

      const ordered = computeCombatantOrder(combatantsToCheck);
      const seen = new Set();
      let blocked = false;
      for (const { c, tag } of ordered) {
        const uniqueId = c?.uuid;
        if (!uniqueId) {
          if (ctx.trace && typeof ctx.trace.warn === "function") ctx.trace.warn(`[dispatchPhasePipeline] Combatant missing uuid; falling back to name-based dedupe for tag=${tag}`);
        }
        const dedupeId = uniqueId || `${tag}:${c?.name}`;
        if (seen.has(dedupeId)) continue;
        seen.add(dedupeId);

        const statusCondition = c.status?.condition;
        if (statusCondition && STATUS_EFFECTS[statusCondition]?.[phase]) {
          const r = STATUS_EFFECTS[statusCondition][phase](ctx, { ...safePctx, combatant: c, subject: c, subjectTag: tag });
          if (r && r.blocked) blocked = true;
        }

        const volatileStatuses = c.volatileStatuses || [];
        for (const vStatus of volatileStatuses) {
          if (STATUS_EFFECTS[vStatus.condition]?.[phase]) {
            const r = STATUS_EFFECTS[vStatus.condition][phase](ctx, { ...safePctx, combatant: c, subject: c, subjectTag: tag });
            if (r && r.blocked) blocked = true;
          }
        }
      }
      return blocked ? { blocked: true } : null;
    }

    let result = null;
    try {
      // Coordinator: invoke registries in stable order (weather -> abilities -> statuses)
      // Each registry may return a PhaseResult; merge them using mergePhaseResults.
      const wRes = dispatchWeather();
      result = mergePhaseResults(result, wRes);

      const aRes = dispatchAbilities();
      result = mergePhaseResults(result, aRes);

      const sRes = dispatchStatuses();
      result = mergePhaseResults(result, sRes);
    } finally {
      // Always restore original modifiers to prevent corruption on thrown errors.
      if (phaseContext.modifierBuckets) {
        ctx.modifiers = originalModifiers;
      }
    }
    return result || { blocked: false };
  }, phaseContext);
}
