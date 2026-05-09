export function attemptCapture(enemy, enemyHp, item) {
  if (!enemy || !enemy.maxHp) {
    return false;
  }

  // Master Ball or items marked as guaranteedCatch always succeed
  if (item?.guaranteedCatch) {
    return true;
  }

  const catchRate =
    enemy.rareness ??
    enemy.Rareness ??
    255;

  const ballMultiplier = item?.ballMultiplier ?? 1.0;
  const statusBonus = 1.0;

  const chance =
    ((3 * enemy.maxHp - 2 * enemyHp) /
      (3 * enemy.maxHp)) *
    (catchRate / 255) *
    ballMultiplier *
    statusBonus;

  const captureChance = Math.min(0.95, chance);

  return Math.random() < captureChance;
}

export function storeCapturedPokemon(
  enemy,
  party,
  pcStorage
) {
  const capturedAt = new Date().toISOString();

  const captured = {
    ...enemy,
    capturedAt,
    originalLevel: enemy.level,
  };

  const nextParty = Array.isArray(party)
    ? [...party]
    : [];

  const nextPcStorage = Array.isArray(pcStorage)
    ? [...pcStorage]
    : [];

  if (nextParty.length < 6) {
    nextParty.push(captured);
    return {
      party: nextParty,
      pcStorage: nextPcStorage,
      storedIn: "party",
    };
  }

  nextPcStorage.push(captured);

  return {
    party: nextParty,
    pcStorage: nextPcStorage,
    storedIn: "pc",
  };
}
