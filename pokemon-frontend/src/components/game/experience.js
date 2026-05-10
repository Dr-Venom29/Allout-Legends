import { POKEMON_DATA } from "../../data/pokemon/pokemonData.js";
import { calculateHP, calculateStat } from "../../data/pokemon/battleHelpers.js";
import { canEvolve, evolvePokemon } from "./evolution.js";

const MAX_LEVEL = 100;

export function getExpForLevel(level) {
  return Math.pow(level, 3);
}

export function calculateExpReward(enemy) {
  if (!enemy || typeof enemy.level !== "number") return 0;
  return enemy.level * 20;
}

function lookupBaseStats(pokemon) {
  if (!pokemon) return null;

  // Try numeric number first
  const num = pokemon.number ?? pokemon.id ?? null;

  if (num) {
    const key = String(num).padStart(3, "0");
    const entry = POKEMON_DATA[key];
    if (entry && entry.BaseStats) return entry.BaseStats;
  }

  // Try name / internal id
  if (pokemon.id) {
    const entry = Object.values(POKEMON_DATA).find(
      (e) => e.InternalName === pokemon.id || e.Name === pokemon.id
    );
    if (entry && entry.BaseStats) return entry.BaseStats;
  }

  if (pokemon.name) {
    const entry = Object.values(POKEMON_DATA).find(
      (e) => e.Name === pokemon.name || e.InternalName === pokemon.name
    );
    if (entry && entry.BaseStats) return entry.BaseStats;
  }

  return null;
}

export function normalizePokemon(pokemon) {
  if (!pokemon) return pokemon;
  const level = Number.isFinite(pokemon.level) ? pokemon.level : 5;
  const exp = Number.isFinite(pokemon.exp) ? pokemon.exp : (Number.isFinite(pokemon.xp) ? pokemon.xp : 0);
  const nextLevelExp = Number.isFinite(pokemon.nextLevelExp)
    ? pokemon.nextLevelExp
    : (Number.isFinite(pokemon.xpToNext) ? pokemon.xpToNext : getExpForLevel(level));

  return {
    ...pokemon,
    level,
    exp,
    nextLevelExp,
  };
}

export function addExperience(pokemonIn, amount) {
  if (!pokemonIn || amount <= 0) {
    return {
      pokemon: pokemonIn,
      expGained: 0,
      leveledUp: false,
      levelsGained: 0,
      newLevel: pokemonIn?.level ?? null,
    };
  }

  const pokemon = { ...normalizePokemon(pokemonIn) };

  if (pokemon.level >= MAX_LEVEL) {
    // At max level, do not accumulate exp
    return {
      pokemon: { ...pokemon, exp: getExpForLevel(MAX_LEVEL), nextLevelExp: getExpForLevel(MAX_LEVEL) },
      expGained: 0,
      leveledUp: false,
      levelsGained: 0,
      newLevel: pokemon.level,
    };
  }

  let remainingExp = amount;
  pokemon.exp = (pokemon.exp || 0) + remainingExp;

  let leveledUp = false;
  let levelsGained = 0;

  // Lookup base stats for accurate recalculation
  const baseStats = lookupBaseStats(pokemonIn);

  // Keep original maxHp for hp gain calculation
  let oldMaxHp = pokemon.maxHp ?? (baseStats ? calculateHP(baseStats.hp, pokemon.level) : pokemon.maxHp ?? 10);

  while (pokemon.exp >= (pokemon.nextLevelExp || getExpForLevel(pokemon.level)) && pokemon.level < MAX_LEVEL) {
    const target = pokemon.nextLevelExp || getExpForLevel(pokemon.level);
    if (pokemon.exp < target) break;

    // Level up
    pokemon.exp = pokemon.exp - target;
    pokemon.level = Math.min(MAX_LEVEL, pokemon.level + 1);
    levelsGained += 1;
    leveledUp = true;

    // Recalculate stats if we have base stats
    if (baseStats) {
      const newMaxHp = calculateHP(baseStats.hp, pokemon.level);
      const newAttack = calculateStat(baseStats.attack, pokemon.level);
      const newDefense = calculateStat(baseStats.defense, pokemon.level);
      const newSpAttack = calculateStat(baseStats.spAttack, pokemon.level);
      const newSpDefense = calculateStat(baseStats.spDefense, pokemon.level);
      const newSpeed = calculateStat(baseStats.speed, pokemon.level);

      const hpGain = newMaxHp - (pokemon.maxHp ?? oldMaxHp);
      pokemon.maxHp = newMaxHp;
      pokemon.attack = newAttack;
      pokemon.defense = newDefense;
      pokemon.spAttack = newSpAttack;
      pokemon.spDefense = newSpDefense;
      pokemon.speed = newSpeed;

      // Increase current HP by hpGain while preserving remaining HP proportionally
      pokemon.hp = Math.min(pokemon.maxHp, (Number.isFinite(pokemon.hp) ? pokemon.hp : newMaxHp) + Math.max(0, hpGain));
      oldMaxHp = newMaxHp;
    }

    // Set next level threshold
    pokemon.nextLevelExp = getExpForLevel(pokemon.level);

    // If reached max level, cap exp
    if (pokemon.level >= MAX_LEVEL) {
      pokemon.level = MAX_LEVEL;
      pokemon.exp = getExpForLevel(MAX_LEVEL);
      pokemon.nextLevelExp = getExpForLevel(MAX_LEVEL);
      break;
    }
  }

  // If we didn't have base stats but levels changed, at least update nextLevelExp
  if (!baseStats && leveledUp) {
    pokemon.nextLevelExp = getExpForLevel(pokemon.level);
  }

  // Check for evolution after level-ups
  const previousName = pokemon.name;
  let evolved = false;
  let evolvedName = null;

  if (canEvolve(pokemon)) {
    pokemon = evolvePokemon(pokemon);
    evolved = true;
    evolvedName = pokemon.name;
  }

  return {
    pokemon,
    expGained: amount,
    leveledUp,
    levelsGained,
    newLevel: pokemon.level,
    evolved,
    previousName: evolved ? previousName : null,
    evolvedName: evolved ? evolvedName : null,
  };
}
