// Centralized status conditions logic

export const STATUS = {
  POISON: "poison",
  BURN: "burn",
  PARALYSIS: "paralysis",
  SLEEP: "sleep",
  FREEZE: "freeze",
};

export function applyStatus(pokemon, condition) {
  if (!pokemon) return pokemon;
  if (!condition) return pokemon;

  // Do nothing if already has a status
  if (pokemon.status && pokemon.status.condition) return pokemon;

  // Type-based immunities
  const types = [pokemon.type1, pokemon.type2].filter(Boolean).map(t => t.toLowerCase());

  if (condition === STATUS.BURN && types.includes("fire")) return pokemon;
  if (condition === STATUS.PARALYSIS && types.includes("electric")) return pokemon;
  if (condition === STATUS.POISON && (types.includes("poison") || types.includes("steel"))) return pokemon;
  if (condition === STATUS.FREEZE && types.includes("ice")) return pokemon;

  let statusObj = { condition };

  if (condition === STATUS.SLEEP) {
    // Sleep for 2-5 turns
    statusObj.turnsRemaining = Math.floor(Math.random() * 4) + 2;
  }

  // Freeze doesn't have turn counter

  return {
    ...pokemon,
    status: statusObj,
  };
}

export function clearStatus(pokemon) {
  if (!pokemon) return pokemon;
  return {
    ...pokemon,
    status: null,
  };
}

export function hasStatus(pokemon, condition) {
  return pokemon?.status?.condition === condition;
}

export function canAct(pokemon) {
  if (!pokemon) return { canAct: true, pokemon, message: null };

  const status = pokemon.status?.condition ?? null;

  // Default: can act
  if (!status) return { canAct: true, pokemon, message: null };

  // Handle Paralysis: 25% chance to fail
  if (status === STATUS.PARALYSIS) {
    const roll = Math.random();
    if (roll < 0.25) {
      return { canAct: false, pokemon, message: `${pokemon.name} is fully paralyzed!` };
    }
    return { canAct: true, pokemon, message: null };
  }

  // Handle Sleep: decrement turnsRemaining
  if (status === STATUS.SLEEP) {
    const turns = pokemon.status?.turnsRemaining ?? 0;
    if (turns > 1) {
      // still asleep
      const next = {
        ...pokemon,
        status: {
          ...pokemon.status,
          turnsRemaining: turns - 1,
        },
      };
      return { canAct: false, pokemon: next, message: `${pokemon.name} is fast asleep!` };
    }

    if (turns === 1) {
      // wakes up
      const next = clearStatus(pokemon);
      return { canAct: true, pokemon: next, message: `${pokemon.name} woke up!` };
    }

    // No turnsRemaining field - treat as awake
    return { canAct: true, pokemon, message: null };
  }

  // Handle Freeze: 20% chance to thaw
  if (status === STATUS.FREEZE) {
    const roll = Math.random();
    if (roll < 0.2) {
      const next = clearStatus(pokemon);
      return { canAct: true, pokemon: next, message: `${pokemon.name} thawed out!` };
    }
    return { canAct: false, pokemon, message: `${pokemon.name} is frozen solid!` };
  }

  // Poison and Burn do not prevent acting
  return { canAct: true, pokemon, message: null };
}

export function getModifiedStats(pokemon) {
  if (!pokemon) return null;

  let attack = pokemon.attack ?? 0;
  let speed = pokemon.speed ?? 0;

  const status = pokemon.status?.condition ?? null;

  if (status === STATUS.BURN) {
    attack = Math.floor(attack * 0.5);
  }

  if (status === STATUS.PARALYSIS) {
    speed = Math.floor(speed * 0.25);
  }

  return {
    attack,
    speed,
  };
}

export function applyEndOfTurnStatus(pokemon) {
  if (!pokemon) return { pokemon, damage: 0, fainted: false, message: null };

  const status = pokemon.status?.condition ?? null;
  if (!status) return { pokemon, damage: 0, fainted: false, message: null };

  const maxHp = pokemon.maxHp ?? pokemon.hp ?? 1;
  let damage = 0;
  let message = null;
  let next = { ...pokemon };

  if (status === STATUS.POISON) {
    damage = Math.max(1, Math.floor(maxHp / 8));
    const nextHp = Math.max(0, (next.currentHp ?? next.hp ?? next.maxHp ?? 0) - damage);
    next = { ...next, hp: nextHp, currentHp: nextHp };
    message = `${pokemon.name} is hurt by poison!`;
  }

  if (status === STATUS.BURN) {
    damage = Math.max(1, Math.floor(maxHp / 16));
    const nextHp = Math.max(0, (next.currentHp ?? next.hp ?? next.maxHp ?? 0) - damage);
    next = { ...next, hp: nextHp, currentHp: nextHp };
    message = `${pokemon.name} is hurt by its burn!`;
  }

  const fainted = (next.hp ?? 0) <= 0;

  return {
    pokemon: next,
    damage,
    fainted,
    message,
  };
}

export function getCaptureStatusBonus(pokemon) {
  const status = pokemon?.status?.condition ?? null;
  if (!status) return 1.0;
  if (status === STATUS.SLEEP || status === STATUS.FREEZE) return 2.0;
  if (status === STATUS.PARALYSIS || status === STATUS.BURN || status === STATUS.POISON) return 1.5;
  return 1.0;
}

export function getStatusLabel(status) {
  switch (status) {
    case STATUS.POISON:
      return "PSN";
    case STATUS.BURN:
      return "BRN";
    case STATUS.PARALYSIS:
      return "PAR";
    case STATUS.SLEEP:
      return "SLP";
    case STATUS.FREEZE:
      return "FRZ";
    default:
      return null;
  }
}

export function getStatusColor(status) {
  switch (status) {
    case STATUS.POISON:
      return "#a040a0"; // purple
    case STATUS.BURN:
      return "#ff8a00"; // red/orange
    case STATUS.PARALYSIS:
      return "#ffd800"; // yellow
    case STATUS.SLEEP:
      return "#4da6ff"; // blue
    case STATUS.FREEZE:
      return "#66ffff"; // cyan
    default:
      return "#ffffff";
  }
}

export default {
  STATUS,
  applyStatus,
  clearStatus,
  hasStatus,
  canAct,
  getModifiedStats,
  applyEndOfTurnStatus,
  getCaptureStatusBonus,
  getStatusLabel,
  getStatusColor,
};
