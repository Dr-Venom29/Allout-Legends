// Centralized move metadata database
export const MOVE_DATA = {
  Tackle: { name: "Tackle", power: 40, type: "Normal", category: "physical" },
  Growl: { name: "Growl", power: 0, type: "Normal", category: "status" },
  "Tail Whip": { name: "Tail Whip", power: 0, type: "Normal", category: "status" },
  Ember: { name: "Ember", power: 40, type: "Fire", category: "special" },
  "Water Gun": { name: "Water Gun", power: 40, type: "Water", category: "special" },
  ThunderShock: { name: "ThunderShock", power: 40, type: "Electric", category: "special" },
  "Vine Whip": { name: "Vine Whip", power: 45, type: "Grass", category: "physical" },
  Scratch: { name: "Scratch", power: 40, type: "Normal", category: "physical" },
  Bite: { name: "Bite", power: 60, type: "Dark", category: "physical" },
  "Quick Attack": { name: "Quick Attack", power: 40, type: "Normal", category: "physical" },
  Flamethrower: { name: "Flamethrower", power: 90, type: "Fire", category: "special", effects: { chance: 10, status: "burn" } },
  Thunderbolt: { name: "Thunderbolt", power: 90, type: "Electric", category: "special", effects: { chance: 10, status: "paralysis" } },
  "Ice Beam": { name: "Ice Beam", power: 90, type: "Ice", category: "special", effects: { chance: 10, status: "freeze" } },
  Psychic: { name: "Psychic", power: 90, type: "Psychic", category: "special" },
  Earthquake: { name: "Earthquake", power: 100, type: "Ground", category: "physical" },
  Surf: { name: "Surf", power: 90, type: "Water", category: "special" },
  "Fire Blast": { name: "Fire Blast", power: 110, type: "Fire", category: "special" },
  "Hydro Pump": { name: "Hydro Pump", power: 110, type: "Water", category: "special" },
  Thunder: { name: "Thunder", power: 110, type: "Electric", category: "special" },
  "Razor Leaf": { name: "Razor Leaf", power: 55, type: "Grass", category: "physical" },
  PoisonPowder: { name: "Poison Powder", power: 0, type: "Poison", category: "status", effects: { chance: 100, status: "poison" } },
  "Sleep Powder": { name: "Sleep Powder", power: 0, type: "Grass", category: "status", effects: { chance: 100, status: "sleep" } },
  "Solar Beam": { name: "Solar Beam", power: 120, type: "Grass", category: "special" },
  Leer: { name: "Leer", power: 0, type: "Normal", category: "status" },
  Sing: { name: "Sing", power: 0, type: "Normal", category: "status" },
  Hypnosis: { name: "Hypnosis", power: 0, type: "Psychic", category: "status" },
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
    pp: data.pp ?? null,
    priority: data.priority ?? 0,
    description: data.description ?? null,
    effects: data.effects ?? null,
  };
}

export default { MOVE_DATA, getMoveData, buildMove };
