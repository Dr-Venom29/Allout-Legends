import { PHASES, PRIORITY } from "../../triggerPhases";
import { MODIFIER_OPERATIONS, MODIFIER_STAGES } from "../../resolveModifiers";

export const THRESHOLD_ABILITIES = {
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
    context.addModifier("power", {
      source: abilityName,
      category: "ABILITY",
      operation: MODIFIER_OPERATIONS.MULTIPLY,
      value: 1.5,
      priority: PRIORITY.ABILITY,
      stage: MODIFIER_STAGES.MULTIPLICATIVE
    });
  }
}

export const THRESHOLD_ABILITY_EFFECTS = {
  [THRESHOLD_ABILITIES.BLAZE]: {
    [PHASES.ON_DAMAGE]: (context, pCtx) => checkThresholdAndBoost(context, pCtx, "Fire", THRESHOLD_ABILITIES.BLAZE),
  },
  [THRESHOLD_ABILITIES.TORRENT]: {
    [PHASES.ON_DAMAGE]: (context, pCtx) => checkThresholdAndBoost(context, pCtx, "Water", THRESHOLD_ABILITIES.TORRENT),
  },
  [THRESHOLD_ABILITIES.OVERGROW]: {
    [PHASES.ON_DAMAGE]: (context, pCtx) => checkThresholdAndBoost(context, pCtx, "Grass", THRESHOLD_ABILITIES.OVERGROW),
  },
  [THRESHOLD_ABILITIES.SWARM]: {
    [PHASES.ON_DAMAGE]: (context, pCtx) => checkThresholdAndBoost(context, pCtx, "Bug", THRESHOLD_ABILITIES.SWARM),
  },
};
