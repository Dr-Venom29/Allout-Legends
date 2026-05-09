import {
  generateWildPokemon,
  calculateDamage,
} from "../../data/pokemon/battleHelpers";

import { getRandomPokemonByType } from "../../data/pokemon/pokemonData";

import { RUN_SUCCESS_CHANCE } from "./battleConstants";
import { MAP_ENCOUNTERS } from "./encounterTables";

function selectWeightedType(table) {
  const totalWeight = table.reduce(
    (sum, entry) => sum + entry.weight,
    0
  );

  let roll = Math.random() * totalWeight;

  for (const entry of table) {
    roll -= entry.weight;
    if (roll < 0) {
      return entry.type;
    }
  }

  return table[0].type;
}

export function createWildBattle(mapId = "map1") {
  const table = MAP_ENCOUNTERS[mapId] ?? MAP_ENCOUNTERS.map1;

  if (!table || table.length === 0) {
    return null;
  }

  const selectedType = selectWeightedType(table);
  const randomPokemon = getRandomPokemonByType(selectedType);

  if (!randomPokemon) {
    return null;
  }

  return generateWildPokemon(
    randomPokemon,
    Math.floor(Math.random() * 5) + 2
  );
}

export function tryRun() {
  return Math.random() < RUN_SUCCESS_CHANCE;
}

export function performEnemyAttack(enemy, playerHp) {
  const damage = Math.floor(Math.random() * 15) + 5;
  const newHp = Math.max(0, playerHp - damage);

  return {
    damage,
    newHp,
    message: `${enemy.name} attacked! It dealt ${damage} damage!`,
    playerDefeated: newHp <= 0,
  };
}

export function performPlayerMove({
  move,
  playerPokemon,
  enemy,
  enemyHp,
}) {
  // Status moves
  if (!move) {
    return {
      isStatusMove: true,
      message: `${playerPokemon.name} has no move!`,
    };
  }

  if (move.power === 0) {
    return {
      isStatusMove: true,
      message: `${playerPokemon.name} used ${move.name}! But it had no effect!`,
    };
  }

  const damage = calculateDamage(
    move,
    playerPokemon,
    enemy
  );

  const newHp = Math.max(0, enemyHp - damage);

  let effectivenessText = "";

  if (damage > enemyHp * 0.5) {
    effectivenessText = " It's super effective!";
  } else if (damage < enemyHp * 0.1) {
    effectivenessText = " It's not very effective...";
  }

  return {
    isStatusMove: false,
    damage,
    newHp,
    enemyDefeated: newHp <= 0,
    message: `${playerPokemon.name} used ${move.name}! It dealt ${damage} damage!${effectivenessText}`,
  };
}