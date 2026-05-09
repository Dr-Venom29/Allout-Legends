// pokemon-frontend/src/logic/encounter.js
import { isTileWalkable } from "../data/tileWalkability";

// Road/path tiles are safe zones with no wild Pokemon encounters.
const NO_ENCOUNTER_TILE_IDS = new Set([43, 44, 45, 46, 47, 48,326,327,328,329,330,331,336,337,332,325]);
const ENCOUNTER_RATE = 0.12;

export function checkEncounter(x, y, map) {
  const tileId = map[y]?.[x];
  if (tileId === undefined) {
    return { shouldBattle: false, area: null };
  }

  // Non-walkable tiles never trigger encounters.
  if (!isTileWalkable(tileId)) {
    return { shouldBattle: false, area: null };
  }

  // Road/path tiles are safe zones with no wild Pokemon encounters.
  if (NO_ENCOUNTER_TILE_IDS.has(tileId)) {
    return { shouldBattle: false, area: null };
  }

  // All other walkable tiles are valid encounter terrain.
  return {
    shouldBattle: Math.random() < ENCOUNTER_RATE,
    area: "grass",
  };
}