import { THRESHOLD_ABILITIES, THRESHOLD_ABILITY_EFFECTS } from "./registries/abilities/thresholdAbilities";
import { REACTIVE_ABILITIES, REACTIVE_ABILITY_EFFECTS } from "./registries/abilities/reactiveAbilities";

export const ABILITIES = {
  ...THRESHOLD_ABILITIES,
  ...REACTIVE_ABILITIES,
};

export const ABILITY_EFFECTS = {
  ...THRESHOLD_ABILITY_EFFECTS,
  ...REACTIVE_ABILITY_EFFECTS,
};

/**
 * Cleanly dispatches the requested phase against the attacker's ability,
 * protecting orchestration logic from complex ability branching.
 */
export function dispatchAbilityPhase(phase, context, pCtx) {
  const attackerAbility = pCtx.attacker?.ability;
  if (attackerAbility && ABILITY_EFFECTS[attackerAbility]?.[phase]) {
    ABILITY_EFFECTS[attackerAbility][phase](context, pCtx);
  }
}

