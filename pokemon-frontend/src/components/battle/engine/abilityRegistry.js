import { PHASES } from "./triggerPhases";

export const ABILITIES = {
  BLAZE: "BLAZE",
  TORRENT: "TORRENT",
  OVERGROW: "OVERGROW",
  SWARM: "SWARM",
};

function checkThresholdAndBoost(context, pCtx, requiredType, abilityName) {
  const { attacker, move } = pCtx;

  if (move.type !== requiredType) return;

  const threshold = attacker.maxHp / 3;
  if (attacker.currentHp <= threshold) {
    context.modifiers.power.push({ source: abilityName, multiplier: 1.5 });
    context.trace.modifier(abilityName, "power", 1.5);
  }
}

export const ABILITY_EFFECTS = {
  [ABILITIES.BLAZE]: {
    [PHASES.ON_DAMAGE]: (context, pCtx) => checkThresholdAndBoost(context, pCtx, "Fire", ABILITIES.BLAZE),
  },
  [ABILITIES.TORRENT]: {
    [PHASES.ON_DAMAGE]: (context, pCtx) => checkThresholdAndBoost(context, pCtx, "Water", ABILITIES.TORRENT),
  },
  [ABILITIES.OVERGROW]: {
    [PHASES.ON_DAMAGE]: (context, pCtx) => checkThresholdAndBoost(context, pCtx, "Grass", ABILITIES.OVERGROW),
  },
  [ABILITIES.SWARM]: {
    [PHASES.ON_DAMAGE]: (context, pCtx) => checkThresholdAndBoost(context, pCtx, "Bug", ABILITIES.SWARM),
  },
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
