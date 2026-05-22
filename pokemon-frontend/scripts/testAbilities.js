import { buildTurnEvents } from "../src/components/battle/engine/buildTurnEvents.js";
import { PHASES } from "../src/components/battle/engine/triggerPhases.js";

// Mock minimal dependencies
const mockPokemon = (ability, type, hp, maxHp) => ({
  name: "TestPokemon",
  ability,
  type1: type,
  currentHp: hp,
  maxHp,
  stats: { attack: 50, defense: 50, spAttack: 50, spDefense: 50, speed: 50 }
});

const mockMove = (type) => ({
  name: "TestMove",
  type,
  power: 40,
  category: "Physical",
  currentPP: 10
});

const state = {
  playerPokemon: mockPokemon("BLAZE", "Fire", 10, 100),
  enemy: mockPokemon("NONE", "Normal", 100, 100),
  playerMove: mockMove("Fire"),
  enemyMove: mockMove("Normal"),
  weather: { type: "NONE", turnsRemaining: 0 }
};

const result1 = buildTurnEvents(state);
console.log("BLAZE (HP 10/100) -> FIRE Move Events:");
console.log(result1.events.filter(e => e.type === "TEXT").map(e => e.payload.text));

const state2 = {
  playerPokemon: mockPokemon("BLAZE", "Fire", 40, 100),
  enemy: mockPokemon("NONE", "Normal", 100, 100),
  playerMove: mockMove("Fire"),
  enemyMove: mockMove("Normal"),
  weather: { type: "NONE", turnsRemaining: 0 }
};

const result2 = buildTurnEvents(state2);
console.log("\nBLAZE (HP 40/100) -> FIRE Move Events (Should not boost):");
console.log(result2.events.filter(e => e.type === "TEXT").map(e => e.payload.text));

const state3 = {
  playerPokemon: mockPokemon("TORRENT", "Water", 10, 100),
  enemy: mockPokemon("NONE", "Normal", 100, 100),
  playerMove: mockMove("Water"),
  enemyMove: mockMove("Normal"),
  weather: { type: "RAIN", turnsRemaining: 5 }
};

const result3 = buildTurnEvents(state3);
console.log("\nTORRENT + RAIN -> WATER Move Events:");
console.log(result3.events.filter(e => e.type === "TEXT").map(e => e.payload.text));
