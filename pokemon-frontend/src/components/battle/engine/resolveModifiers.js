import { roundBattleValue } from "./roundBattleValue";

export const MODIFIER_OPERATIONS = {
  MULTIPLY: "MULTIPLY",
  ADD: "ADD",
  OVERRIDE: "OVERRIDE"
};

/**
 * Modifier resolution order.
 * Ensures flat additions occur before multipliers, and overrides occur last.
 */
export const MODIFIER_STAGES = {
  BASE: 10,
  ADDITIVE: 20,
  MULTIPLICATIVE: 30,
  FINAL: 40,
};

/**
 * Centralized Modifier Resolution
 * 
 * Resolves an array of structured modifier entries into a single scalar value.
 * This is the ONLY authority for computing final modifier output.
 * 
 * Expects modifiers of shape:
 * { source: string, category: string, operation: string, value: number, priority: number, stage: number }
 * 
 * @param {Array<Object>} modifiers
 * @param {number} baseValue - The starting value before modification (defaults to 1.0 for multipliers)
 * @param {boolean} roundOutput - Whether the final output should be rounded to an integer
 * @returns {number} The resolved scalar value
 */
export function resolveModifiers(modifiers, baseValue = 1.0, roundOutput = false) {
  if (!modifiers || modifiers.length === 0) return roundOutput ? roundBattleValue(baseValue) : baseValue;

  // 1. Sort modifiers by stage (lowest first), then by priority (highest first)
  const sorted = [...modifiers].sort((a, b) => {
    const stageA = a.stage ?? MODIFIER_STAGES.MULTIPLICATIVE;
    const stageB = b.stage ?? MODIFIER_STAGES.MULTIPLICATIVE;
    
    if (stageA !== stageB) return stageA - stageB;
    return (b.priority ?? 0) - (a.priority ?? 0);
  });

  // 2. Reduce operations sequentially
  let currentValue = baseValue;

  for (const mod of sorted) {
    switch (mod.operation) {
      case MODIFIER_OPERATIONS.ADD:
        currentValue += mod.value;
        break;
      case MODIFIER_OPERATIONS.MULTIPLY:
        currentValue *= mod.value;
        break;
      case MODIFIER_OPERATIONS.OVERRIDE:
        currentValue = mod.value;
        break;
    }
  }

  return roundOutput ? roundBattleValue(currentValue) : currentValue;
}
