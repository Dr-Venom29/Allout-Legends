export function attemptCapture(enemy, enemyHp) {
  if (!enemy || !enemy.maxHp) {
    return false;
  }

  const hpFactor =
    (enemy.maxHp - enemyHp) / enemy.maxHp;

  const captureChance = 0.2 + hpFactor * 0.6;

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
