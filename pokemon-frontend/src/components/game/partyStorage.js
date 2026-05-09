import { STORAGE_KEYS, loadJSON } from "./systems/storage";

export function loadActivePartyIndex() {
  const index = loadJSON(
    STORAGE_KEYS.ACTIVE_PARTY_INDEX,
    0
  );

  return Number.isInteger(index) && index >= 0
    ? index
    : 0;
}
