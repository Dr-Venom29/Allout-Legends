import { calculateExpReward, addExperience } from "../../game/experience";
import { 
  createExpGainEvent, 
  createLevelUpEvent, 
  createStatUpdateEvent, 
  createMoveLearnRequestEvent,
  createEvolutionStartEvent,
  createEvolutionCompleteEvent,
  createTextEvent,
  createWaitEvent
} from "../events/createEvent";

/**
 * PURE FUNCTION
 * Resolves all progression math instantly (EXP, Level Ups, Evolution, Move Learning)
 * and generates a deterministic dramatization queue.
 * 
 * @param {Object} playerPokemon - The current persistent player pokemon
 * @param {Object} enemyPokemon - The defeated enemy pokemon
 * @returns {Object} { progressionQueue: Array, progressionUpdates: Object }
 */
export function processProgression(playerPokemon, enemyPokemon) {
  const queue = [];

  // 1. Resolve Math Instantly
  const expReward = calculateExpReward(enemyPokemon);
  const result = addExperience(playerPokemon, expReward);

  // 2. Generate Dramatization Queue
  // EXP GAIN
  queue.push(createExpGainEvent(playerPokemon.uuid, expReward));
  queue.push(createTextEvent(`${playerPokemon.name} gained ${expReward} EXP!`));
  queue.push(createWaitEvent(1000));

  // MULTIPLE LEVEL UPS
  if (result.leveledUp) {
    const finalLevel = result.newLevel;

    // We can dramatize each level up visually if we want, or just jump to the final level
    // For authenticity, let's just announce the final level reach
    queue.push(createLevelUpEvent(playerPokemon.uuid, finalLevel));
    queue.push(createTextEvent(`${playerPokemon.name} grew to level ${finalLevel}!`));
    queue.push(createWaitEvent(1000));

    // Stats update
    queue.push(createStatUpdateEvent(playerPokemon.uuid, {
      maxHp: result.pokemon.maxHp,
      attack: result.pokemon.attack,
      defense: result.pokemon.defense,
      spAttack: result.pokemon.spAttack,
      spDefense: result.pokemon.spDefense,
      speed: result.pokemon.speed,
    }));
    queue.push(createWaitEvent(1000));
  }

  // PASSIVE MOVES LEARNED
  for (const moveName of result.learnedMoves) {
    queue.push(createTextEvent(`${playerPokemon.name} learned ${moveName}!`));
    queue.push(createWaitEvent(1000));
  }

  // INTERACTIVE MOVES TO LEARN
  for (const pendingMove of result.pendingMoves) {
    queue.push(createTextEvent(`${playerPokemon.name} is trying to learn ${pendingMove.name}...`));
    queue.push(createWaitEvent(800));
    queue.push(createTextEvent(`But ${playerPokemon.name} already knows 4 moves!`));
    queue.push(createWaitEvent(1500));
    // Emit the interactive pause event
    queue.push(createMoveLearnRequestEvent(playerPokemon.uuid, pendingMove, result.pokemon.moves));
  }

  // EVOLUTION
  if (result.evolved) {
    queue.push(createTextEvent(`What? ${result.previousName} is evolving!`));
    queue.push(createWaitEvent(1000));
    
    // EVOLUTION_START triggers the special evolution scene in the UI
    queue.push(createEvolutionStartEvent(playerPokemon.uuid, result.previousName, result.evolvedName));
    queue.push(createWaitEvent(3000)); // Length of evolution animation
    
    queue.push(createEvolutionCompleteEvent(playerPokemon.uuid, result.evolvedName));
    queue.push(createTextEvent(`Congratulations! Your ${result.previousName} evolved into ${result.evolvedName}!`));
    queue.push(createWaitEvent(1500));
  }

  return {
    progressionQueue: queue,
    progressionUpdates: {
      playerPokemon: result.pokemon,
    }
  };
}
