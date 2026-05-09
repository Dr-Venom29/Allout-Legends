import { loadJSON, saveJSON, STORAGE_KEYS } from "./systems/storage";

const DEFAULT_INVENTORY = {
  pokeball: 10,
};

export function loadPlayerInventory() {
  return loadJSON(
    STORAGE_KEYS.PLAYER_INVENTORY,
    DEFAULT_INVENTORY
  );
}

export function savePlayerInventory(inventory) {
  return saveJSON(
    STORAGE_KEYS.PLAYER_INVENTORY,
    inventory
  );
}

export function loadPlayerParty() {
  return loadJSON(STORAGE_KEYS.PLAYER_PARTY, []);
}

export function savePlayerParty(party) {
  return saveJSON(STORAGE_KEYS.PLAYER_PARTY, party);
}

export function loadPcStorage() {
  return loadJSON(STORAGE_KEYS.PC_STORAGE, []);
}

export function savePcStorage(pcStorage) {
  return saveJSON(STORAGE_KEYS.PC_STORAGE, pcStorage);
}
