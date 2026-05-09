import { STORAGE_KEYS, loadJSON } from "./systems/storage";
import { createInitialPokedex } from "./pokedex";

export function loadPokedex() {
  return loadJSON(STORAGE_KEYS.POKEDEX, createInitialPokedex());
}
