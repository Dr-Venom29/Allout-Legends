export const MAP_NAMES = {
  map1: "Realm 1",
  map2: "Realm 2",
  map5: "Realm 5",
  map6: "Realm 6",
};

export function buildCurrentPaintLines(paintLog, currentMap) {
  return (paintLog[currentMap] || [])
    .slice()
    .sort((a, b) => a.y - b.y || a.x - b.x)
    .map((entry) => `[${entry.x}, ${entry.y}, ${entry.id}],`)
    .join("\n");
}

export const TERRAIN_NAMES = {
  2: "Tall Grass",
  1: "Rock Wall",
  0: "Route Path",
  4: "Flowers",
  5: "Boulder",
  6: "Tree",
  7: "Pine Tree",
  8: "Tree",
  9: "Big Bush",
  10: "Barricade",
  11: "Lamp",
  12: "Poke Center",
  13: "Mart",
  14: "Fence",
  15: "Water",
  16: "Sign",
  17: "Stairs",
  18: "Path",
  19: "Pond",
  20: "Rock",
  21: "Pebble",
  22: "Flower Bed",
  23: "Dense Grass",
  24: "Soil",
  25: "Cave",
  26: "Narrow Cave",
  27: "Giant Rock",
  28: "Light Path",
  29: "Pine",
  30: "Stump",
  31: "Reeds",
  32: "Wheat",
  33: "Mushrooms",
};

export function getTerrainName(tileTypeNum) {
  return TERRAIN_NAMES[tileTypeNum] || "Grass";
}
