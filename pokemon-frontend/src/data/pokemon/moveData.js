// Centralized move metadata database
export const MOVE_DATA = {
  Tackle: { name: "Tackle", power: 40, type: "Normal", category: "physical", accuracy: 100, pp: 35 },
  Growl: { name: "Growl", power: 0, type: "Normal", category: "status", accuracy: 100, pp: 40 },
  "Tail Whip": { name: "Tail Whip", power: 0, type: "Normal", category: "status", accuracy: 100, pp: 30 },
  Ember: { name: "Ember", power: 40, type: "Fire", category: "special", accuracy: 100, pp: 25 },
  "Water Gun": { name: "Water Gun", power: 40, type: "Water", category: "special", accuracy: 100, pp: 25 },
  ThunderShock: { name: "ThunderShock", power: 40, type: "Electric", category: "special", accuracy: 100, pp: 30 },
  "Vine Whip": { name: "Vine Whip", power: 45, type: "Grass", category: "physical", accuracy: 100, pp: 25 },
  Scratch: { name: "Scratch", power: 40, type: "Normal", category: "physical", accuracy: 100, pp: 35 },
  Bite: { name: "Bite", power: 60, type: "Dark", category: "physical", accuracy: 100, pp: 25 },
  "Quick Attack": { name: "Quick Attack", power: 40, type: "Normal", category: "physical", accuracy: 100, priority: 1, pp: 30 },
  Flamethrower: { name: "Flamethrower", power: 90, type: "Fire", category: "special", accuracy: 100, pp: 15, effects: { chance: 10, status: "burn" } },
  Thunderbolt: { name: "Thunderbolt", power: 90, type: "Electric", category: "special", accuracy: 100, pp: 15, effects: { chance: 10, status: "paralysis" } },
  "Ice Beam": { name: "Ice Beam", power: 90, type: "Ice", category: "special", accuracy: 100, pp: 10, effects: { chance: 10, status: "freeze" } },
  Psychic: { name: "Psychic", power: 90, type: "Psychic", category: "special", accuracy: 100, pp: 10 },
  Earthquake: { name: "Earthquake", power: 100, type: "Ground", category: "physical", accuracy: 100, pp: 10 },
  Surf: { name: "Surf", power: 90, type: "Water", category: "special", accuracy: 100, pp: 15 },
  "Fire Blast": { name: "Fire Blast", power: 110, type: "Fire", category: "special", accuracy: 85, pp: 5, effects: { chance: 10, status: "burn" } },
  "Hydro Pump": { name: "Hydro Pump", power: 110, type: "Water", category: "special", accuracy: 80, pp: 5 },
  Thunder: { name: "Thunder", power: 110, type: "Electric", category: "special", accuracy: 70, pp: 10, effects: { chance: 30, status: "paralysis" } },
  "Razor Leaf": { name: "Razor Leaf", power: 55, type: "Grass", category: "physical", accuracy: 95, pp: 25 },
  PoisonPowder: { name: "Poison Powder", power: 0, type: "Poison", category: "status", accuracy: 75, pp: 35, effects: { chance: 100, status: "poison" } },
  "Sleep Powder": { name: "Sleep Powder", power: 0, type: "Grass", category: "status", accuracy: 75, pp: 15, effects: { chance: 100, status: "sleep" } },
  "Solar Beam": { name: "Solar Beam", power: 120, type: "Grass", category: "special", accuracy: 100, pp: 10 },
  Leer: { name: "Leer", power: 0, type: "Normal", category: "status", accuracy: 100, pp: 30 },
  Sing: { name: "Sing", power: 0, type: "Normal", category: "status", accuracy: 55, pp: 15, effects: { chance: 100, status: "sleep" } },
  Hypnosis: { name: "Hypnosis", power: 0, type: "Psychic", category: "status", accuracy: 60, pp: 20, effects: { chance: 100, status: "sleep" } },
  Swift: { name: "Swift", power: 60, type: "Normal", category: "special", accuracy: null, pp: 20 },
  Struggle: { name: "Struggle", power: 50, type: "Normal", category: "physical", accuracy: null, pp: null },
};

export function getMoveData(moveName) {
  if (!moveName) return null;
  const entry = MOVE_DATA[moveName];
  if (entry) return entry;
  // Fallback default
  return {
    name: moveName,
    power: 40,
    type: "Normal",
    category: "physical",
  };
}

export function buildMove(moveName, fallbackType = "Normal") {
  const data = getMoveData(moveName) || {};
  const type = data.type || fallbackType || "Normal";
  return {
    name: data.name || moveName,
    power: Number.isFinite(data.power) ? data.power : 40,
    type,
    category: data.category || "physical",
    // future extensible fields
    accuracy: data.accuracy ?? null,
    maxPP: data.pp ?? 35,
    currentPP: data.pp ?? 35,
    priority: data.priority ?? 0,
    description: data.description ?? null,
    effects: data.effects ?? null,
  };
}

export default { MOVE_DATA, getMoveData, buildMove };
