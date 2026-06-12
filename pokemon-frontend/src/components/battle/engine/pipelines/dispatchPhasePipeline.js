
import { STATUS_EFFECTS } from "../statusRegistry";
import { WEATHER_EFFECTS } from "../weatherRegistry";
import { dispatchAbilityPhase } from "../abilityRegistry";
import { getEffectiveSpeed } from "../../battleTurnOrder";
import { computeCombatantOrder as computeCombatantOrderPolicy } from "../runtimePolicies/ordering";
import { deepFreeze } from "../runtimePolicies/deepFreeze";

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

    // Create a snapshot of pCtx. Support optional deep freeze via context.options.deepFreezePctx.
    const safePctx = context.options?.deepFreezePctx ? deepFreeze(structuredClone(pCtx)) : Object.freeze({ ...pCtx });

    // Internal dispatch helpers keep separation of concerns inside this file.
    // Merge two phase results conservatively for now (OR blocked). Future: expand schema.
    function mergePhaseResults(a, b) {
      if (!a) return b || null;
      if (!b) return a || null;
      return { blocked: Boolean(a.blocked) || Boolean(b.blocked) };
    }

    // Compute combatant order using an external policy implementation. We augment entries
    // with effectiveSpeed so policy implementations can rely on precomputed values.
    function computeCombatantOrder(combatantEntries = []) {
      const entries = (combatantEntries || []).map(e => ({ ...e, effectiveSpeed: getEffectiveSpeed(e.c || {}) }));
      return computeCombatantOrderPolicy(entries, phaseContext);
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
      // Dispatch abilities with explicit source/target semantics to avoid attacker/defender overload.
      if (phaseContext.attacker) {
        const r = dispatchAbilityPhase(phase, ctx, { ...safePctx, abilityOwner: phaseContext.attacker, source: phaseContext.attacker, target: phaseContext.defender });
        if (r && r.blocked) blocked = true;
      }
      if (phaseContext.defender) {
        const r = dispatchAbilityPhase(phase, ctx, { ...safePctx, abilityOwner: phaseContext.defender, source: phaseContext.defender, target: phaseContext.attacker });
        if (r && r.blocked) blocked = true;
      }
      if (phaseContext.faintedCombatant) {
        const r = dispatchAbilityPhase(phase, ctx, { ...safePctx, abilityOwner: phaseContext.faintedCombatant, source: phaseContext.faintedCombatant, target: phaseContext.attacker });
        if (r && r.blocked) blocked = true;
      }
      return blocked ? { blocked: true } : null;
    }

    function collectCombatants() {
      const combatantsToCheck = [];
      if (pCtx.attacker) combatantsToCheck.push({ c: pCtx.attacker, tag: pCtx.attackerTag });
      if (pCtx.defender) combatantsToCheck.push({ c: pCtx.defender, tag: pCtx.defenderTag });
      if (pCtx.combatant) combatantsToCheck.push({ c: pCtx.combatant, tag: pCtx.targetTag });
      if (pCtx.faintedCombatant) combatantsToCheck.push({ c: pCtx.faintedCombatant, tag: pCtx.faintedTag });
      return computeCombatantOrder(combatantsToCheck);
    }

    function dispatchPersistentStatuses() {
      const ordered = collectCombatants();
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
      }
      return blocked ? { blocked: true } : null;
    }

    function dispatchVolatileStatuses() {
      const ordered = collectCombatants();
      let blocked = false;
      for (const { c, tag } of ordered) {
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

    // Determine registry dispatch order (configurable)
    const DEFAULT_REGISTRY_ORDER = ["weather", "abilities", "persistentStatuses", "volatileStatuses"];
    const registryOrder = Array.isArray(phaseContext.registryOrder) ? phaseContext.registryOrder : DEFAULT_REGISTRY_ORDER;

    let result = null;
    try {
      const dispatchTable = {
        weather: dispatchWeather,
        abilities: dispatchAbilities,
        persistentStatuses: dispatchPersistentStatuses,
        volatileStatuses: dispatchVolatileStatuses,
      };

      for (const registryName of registryOrder) {
        const fn = dispatchTable[registryName];
        if (!fn) {
          if (ctx.trace && typeof ctx.trace.warn === "function") ctx.trace.warn(`[dispatchPhasePipeline] Unknown registry in order: ${registryName}`);
          continue;
        }
        const r = fn();
        result = mergePhaseResults(result, r);
      }
    } finally {
      // Always restore original modifiers to prevent corruption on thrown errors.
      if (phaseContext.modifierBuckets) {
        ctx.modifiers = originalModifiers;
      }
    }
    return result || { blocked: false };
  }, phaseContext);
}
