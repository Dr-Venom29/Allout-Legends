import {
  generateWildPokemon,
  calculateDamage,
  getEffectivenessText,
} from "../../data/pokemon/battleHelpers";
import { buildMove } from "../../data/pokemon/moveData";

import { applyStatus } from "../game/statusConditions";
import { checkMoveHit } from "./battleAccuracy";

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

export function applyMoveEffects(move, attacker, defender) {
  let defenderAfterStatus = defender;
  let statusMessage = null;

  if (move.effects && move.effects.status) {
    const chance = move.effects.chance ?? 100;
    const roll = Math.random() * 100;
    if (roll <= chance && (!defender.status || !defender.status.condition)) {
      defenderAfterStatus = applyStatus(defenderAfterStatus, move.effects.status);
      statusMessage = `${defenderAfterStatus.name} was ${move.effects.status}!`;
    }
  }

  // Placeholder for stat debuffs / accuracy checks later

  return {
    defenderAfterStatus,
    statusMessage,
  };
}

export function performEnemyAttack(enemy, playerHp, playerPokemon) {
  // Check if enemy can act (paralysis/sleep/freeze) - assume this is checked before calling, or we check it here
  // Actually, Battle.jsx currently just calls performEnemyAttack unconditionally, we should fix that later.
  
  // Get available moves or fallback
  const availableMoves = Array.isArray(enemy.moves) && enemy.moves.length > 0
    ? enemy.moves
    : [buildMove("Tackle", "Normal")];

  const moveIndex = Math.floor(Math.random() * availableMoves.length);
  const move = availableMoves[moveIndex];

  if (!move) {
    return {
      damage: 0,
      newHp: playerHp,
      message: `${enemy.name} is loafing around!`,
      playerDefeated: false,
    };
  }

  // Decrement PP if not Struggle (which has null PP)
  if (move.currentPP !== null && move.currentPP > 0) {
    move.currentPP -= 1;
  }

  if (move.power === 0) {
    // Status move — accuracy check first
    const hitCheck = checkMoveHit(move, enemy, playerPokemon);
    if (!hitCheck.hit) {
      return {
        damage: 0,
        newHp: playerHp,
        message: `${enemy.name} used ${move.name}! ${hitCheck.message}`,
        playerDefeated: false,
        playerAfterStatus: playerPokemon,
        attackerAfterMove: enemy,
      };
    }
    const effectsResult = applyMoveEffects(move, enemy, playerPokemon);
    const message = `${enemy.name} used ${move.name}!` + (effectsResult.statusMessage ? ` ${effectsResult.statusMessage}` : " But it failed!");
    return {
      damage: 0,
      newHp: playerHp,
      message,
      playerDefeated: false,
      playerAfterStatus: effectsResult.defenderAfterStatus,
      attackerAfterMove: enemy,
    };
  }

  // Damaging move — accuracy check
  const hitCheck = checkMoveHit(move, enemy, playerPokemon);
  if (!hitCheck.hit) {
    return {
      damage: 0,
      newHp: playerHp,
      message: `${enemy.name} used ${move.name}! ${hitCheck.message}`,
      playerDefeated: false,
      playerAfterStatus: playerPokemon,
      attackerAfterMove: enemy,
    };
  }

  const { damage, effectiveness, critical } = calculateDamage(move, enemy, playerPokemon);
  const newHp = Math.max(0, playerHp - damage);

  const effectivenessText = getEffectivenessText(effectiveness);
  const criticalText = critical ? " A critical hit!" : "";
  const effectsResult = applyMoveEffects(move, enemy, playerPokemon);

  return {
    damage,
    newHp,
    message: `${enemy.name} used ${move.name}! It dealt ${damage} damage!${criticalText}${effectivenessText}` + (effectsResult.statusMessage ? ` ${effectsResult.statusMessage}` : ""),
    playerDefeated: newHp <= 0,
    playerAfterStatus: effectsResult.defenderAfterStatus,
    attackerAfterMove: enemy,
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

  // Decrement PP if not Struggle (which has null PP)
  if (move.currentPP !== null && move.currentPP > 0) {
    move.currentPP -= 1;
  }

  if (move.power === 0) {
    // Status move — accuracy check first
    const hitCheck = checkMoveHit(move, playerPokemon, enemy);
    if (!hitCheck.hit) {
      return {
        isStatusMove: true,
        damage: 0,
        newHp: enemyHp,
        enemyDefeated: false,
        message: `${playerPokemon.name} used ${move.name}! ${hitCheck.message}`,
        enemyAfterStatus: enemy,
        attackerAfterMove: playerPokemon,
      };
    }
    const effectsResult = applyMoveEffects(move, playerPokemon, enemy);
    const message = `${playerPokemon.name} used ${move.name}!` + (effectsResult.statusMessage ? ` ${effectsResult.statusMessage}` : " But it failed!");
    return {
      isStatusMove: true,
      damage: 0,
      newHp: enemyHp,
      enemyDefeated: false,
      message,
      enemyAfterStatus: effectsResult.defenderAfterStatus,
      attackerAfterMove: playerPokemon,
    };
  }

  // Damaging move — accuracy check
  const hitCheck = checkMoveHit(move, playerPokemon, enemy);
  if (!hitCheck.hit) {
    return {
      isStatusMove: false,
      damage: 0,
      newHp: enemyHp,
      enemyDefeated: false,
      message: `${playerPokemon.name} used ${move.name}! ${hitCheck.message}`,
      enemyAfterStatus: enemy,
      attackerAfterMove: playerPokemon,
    };
  }

  const { damage, effectiveness, critical } = calculateDamage(
    move,
    playerPokemon,
    enemy
  );

  const newHp = Math.max(0, enemyHp - damage);

  const effectivenessText = getEffectivenessText(effectiveness);
  const criticalText = critical ? " A critical hit!" : "";
  const effectsResult = applyMoveEffects(move, playerPokemon, enemy);

  return {
    isStatusMove: false,
    damage,
    newHp,
    enemyDefeated: newHp <= 0,
    message: `${playerPokemon.name} used ${move.name}! It dealt ${damage} damage!${criticalText}${effectivenessText}` + (effectsResult.statusMessage ? ` ${effectsResult.statusMessage}` : ""),
    enemyAfterStatus: effectsResult.defenderAfterStatus,
    attackerAfterMove: playerPokemon,
  };
}