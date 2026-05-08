import { maps } from "../../../data/maps";
import { clampTileId } from "../../../data/tilesetMeta";

export function handlePaint({
  x,
  y,
  options = { action: "paint", shiftKey: false },
  paintMode,
  current,
  currentMap,
  selectedTileId,
  fillStart,
  pendingScale = 1,
  setFillStart,
  setExportStatus,
  setPaintLog,
  setPositionScale,
}) {
  if (!paintMode) return;
  if (current[y]?.[x] === undefined) return;

  const mapData = maps[currentMap];

  const upsertEntries = (entries) => {
    setPaintLog((prev) => {
      const list = [...(prev[currentMap] || [])];

      entries.forEach((nextEntry) => {
        const existingIndex = list.findIndex(
          (entry) =>
            entry.x === nextEntry.x &&
            entry.y === nextEntry.y
        );

        if (existingIndex >= 0) {
          list[existingIndex] = nextEntry;
        } else {
          list.push(nextEntry);
        }
      });

      return {
        ...prev,
        [currentMap]: list,
      };
    });
  };

  // erase
  if (options.action === "erase") {
    mapData[y][x] = 0;

    upsertEntries([{ x, y, id: 0 }]);

    setPositionScale(currentMap, x, y, 1);
    setFillStart(null);

    return;
  }

  const clampedTileId = clampTileId(selectedTileId);

  // fill mode
  if (options.shiftKey) {
    if (!fillStart) {
      setFillStart({ x, y });
      setExportStatus(`Fill start set at (${x}, ${y})`);
      return;
    }

    const minX = Math.min(fillStart.x, x);
    const maxX = Math.max(fillStart.x, x);

    const minY = Math.min(fillStart.y, y);
    const maxY = Math.max(fillStart.y, y);

    const entries = [];

    for (let yy = minY; yy <= maxY; yy++) {
      for (let xx = minX; xx <= maxX; xx++) {
        if (
          mapData[yy] &&
          mapData[yy][xx] !== undefined
        ) {
          mapData[yy][xx] = clampedTileId;

          entries.push({
            x: xx,
            y: yy,
            id: clampedTileId,
          });

          setPositionScale(
            currentMap,
            xx,
            yy,
            pendingScale
          );
        }
      }
    }

    upsertEntries(entries);

    setFillStart(null);

    setExportStatus(
      `Filled ${entries.length} tiles with id ${clampedTileId}`
    );

    return;
  }

  // single tile paint
  mapData[y][x] = clampedTileId;

  upsertEntries([
    {
      x,
      y,
      id: clampedTileId,
    },
  ]);

  setPositionScale(currentMap, x, y, pendingScale);

  setFillStart(null);
}