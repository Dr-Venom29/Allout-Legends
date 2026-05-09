export const STORAGE_KEYS = {
  PAINT_LOG: "allout_legends_paint_log",
  CURRENT_MAP: "allout_legends_current_map",
  PLAYER_POS: "allout_legends_player_pos",
  TILE_SCALES: "allout_legends_tile_scales",
  PLAYER_INVENTORY: "allout_legends_inventory",
  PLAYER_PARTY: "allout_legends_party",
  PC_STORAGE: "allout_legends_pc_storage",
  POKEDEX: "allout_legends_pokedex",
  ACTIVE_PARTY_INDEX: "allout_legends_active_party_index",
  PLAYER_MONEY: "allout_legends_player_money",
};

export function loadJSON(key, fallback) {
  try {
    const saved = localStorage.getItem(key);

    return saved ? JSON.parse(saved) : fallback;
  } catch {
    return fallback;
  }
}

export function saveJSON(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (err) {
    console.error(`Failed to save ${key}:`, err);
    return false;
  }
}

export function exportMapFile({
  paintLog,
  tileScales,
  currentMap,
  player,
}) {
  const totalEdits = Object.values(paintLog).reduce(
    (sum, arr) => sum + arr.length,
    0
  );

  const timestamp = new Date();
  const exportData = {
    version: "1.1",
    createdAt: timestamp.toISOString(),
    edits: paintLog,
    tileScales,
    metadata: {
      currentMap,
      playerPos: player,
      totalEdits,
    },
  };

  const dataStr = JSON.stringify(exportData, null, 2);

  const dataBlob = new Blob([dataStr], {
    type: "application/json",
  });

  const url = URL.createObjectURL(dataBlob);

  const link = document.createElement("a");

  link.href = url;

  link.download = `allout_map_${timestamp
    .toISOString()
    .slice(0, 19)
    .replace(/:/g, "-")}.json`;

  link.click();

  setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 0);
}