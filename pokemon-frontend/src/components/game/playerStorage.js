import { loadJSON, saveJSON, STORAGE_KEYS } from "./systems/storage";
import { normalizePokemon } from "./experience";

const DEFAULT_INVENTORY = {
  pokeball: 10,
  potion: 5,
  greatBall: 3,
  ultraBall: 1,
  masterBall: 1,
};

export function loadPlayerInventory() {
  return loadJSON(
    STORAGE_KEYS.PLAYER_INVENTORY,
    DEFAULT_INVENTORY
  );
}

export function loadPlayerMoney() {
  return loadJSON(
    STORAGE_KEYS.PLAYER_MONEY,
    5000
  );
}

export function savePlayerMoney(money) {
  return saveJSON(STORAGE_KEYS.PLAYER_MONEY, money);
}

export function savePlayerInventory(inventory) {
  return saveJSON(
    STORAGE_KEYS.PLAYER_INVENTORY,
    inventory
  );
}

export function loadPlayerParty() {
  const party = loadJSON(STORAGE_KEYS.PLAYER_PARTY, []);
  return Array.isArray(party) ? party.map(normalizePokemon) : [];
}

export function savePlayerParty(party) {
  return saveJSON(STORAGE_KEYS.PLAYER_PARTY, party);
}

export function loadPcStorage() {
  const storage = loadJSON(STORAGE_KEYS.PC_STORAGE, []);
  return Array.isArray(storage) ? storage.map(normalizePokemon) : [];
}

export function savePcStorage(pcStorage) {
  return saveJSON(STORAGE_KEYS.PC_STORAGE, pcStorage);
}
