import { useCallback } from "react";
import { maps } from "../../../data/maps";
import { STORAGE_KEYS, exportMapFile } from "./storage";

export function loadSavedPaintLog() {
  const saved = localStorage.getItem(STORAGE_KEYS.PAINT_LOG);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {
      console.error("Failed to load paint log:", e);
      return { map1: [], map2: [], map5: [], map6: [] };
    }
  }
  return { map1: [], map2: [], map5: [], map6: [] };
}

export function applySavedOverridesToMaps(savedLog) {
  Object.keys(savedLog).forEach((mapName) => {
    const overrides = savedLog[mapName];
    if (overrides && maps[mapName]) {
      overrides.forEach(({ x, y, id }) => {
        if (maps[mapName][y] && maps[mapName][y][x] !== undefined) {
          maps[mapName][y][x] = id;
        }
      });
    }
  });
}

function countTotalEdits(log) {
  return Object.values(log).reduce((sum, arr) => sum + arr.length, 0);
}

export function useStorageHandlers({
  paintLog,
  currentMap,
  player,
  tileScales,
  setPaintLog,
  setTileScalesState,
  setCurrentMap,
  setPlayer,
  setExportStatus,
  setFillStart,
}) {
  const handleSaveToLocalStorage = useCallback(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.PAINT_LOG, JSON.stringify(paintLog));
      localStorage.setItem(STORAGE_KEYS.CURRENT_MAP, currentMap);
      localStorage.setItem(STORAGE_KEYS.PLAYER_POS, JSON.stringify(player));
      localStorage.setItem(STORAGE_KEYS.TILE_SCALES, JSON.stringify(tileScales));

      const totalEdits = countTotalEdits(paintLog);
      setExportStatus(`Saved ${totalEdits} tile edits to browser storage!`);

      setTimeout(() => {
        setExportStatus((prev) => (prev.includes("Saved") ? "" : prev));
      }, 3000);
    } catch (err) {
      console.error("Save failed:", err);
      setExportStatus("❌ Save failed!");
    }
  }, [paintLog, currentMap, player, tileScales, setExportStatus]);

  const handleLoadFromLocalStorage = useCallback(() => {
    try {
      const savedLog = loadSavedPaintLog();
      applySavedOverridesToMaps(savedLog);

      setPaintLog(savedLog);
      const totalEdits = countTotalEdits(savedLog);
      setExportStatus(`Loaded ${totalEdits} saved edits!`);

      setTimeout(() => {
        setExportStatus((prev) => (prev.includes("Loaded") ? "" : prev));
      }, 3000);
    } catch (err) {
      console.error("Load failed:", err);
      setExportStatus("❌ Load failed!");
    }
  }, [setPaintLog, setExportStatus]);

  const handleResetAllData = useCallback(() => {
    if (
      window.confirm(
        "⚠️ WARNING: This will delete ALL saved map edits and reset player position! This cannot be undone. Continue?"
      )
    ) {
      localStorage.removeItem(STORAGE_KEYS.PAINT_LOG);
      localStorage.removeItem(STORAGE_KEYS.CURRENT_MAP);
      localStorage.removeItem(STORAGE_KEYS.PLAYER_POS);
      setPaintLog({ map1: [], map2: [], map5: [], map6: [] });
      setCurrentMap("map1");
      setPlayer({ x: 5, y: 5 });
      window.location.reload();
    }
  }, [setPaintLog, setCurrentMap, setPlayer]);

  const handleExportToFile = useCallback(() => {
    const totalEdits = countTotalEdits(paintLog);
    if (totalEdits === 0) {
      setExportStatus("No edits to export.");
      return;
    }

    exportMapFile({
      paintLog,
      tileScales,
      currentMap,
      player,
    });

    setExportStatus(`Exported ${totalEdits} tile edits!`);
    setTimeout(() => {
      setExportStatus((prev) => (prev.includes("Exported") ? "" : prev));
    }, 4000);
  }, [paintLog, tileScales, currentMap, player, setExportStatus]);

  const handleImportFromFile = useCallback(() => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";

    input.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const imported = JSON.parse(event.target.result);
          let importedEdits;
          let importedScales = null;

          if (imported.version && imported.edits) {
            importedEdits = imported.edits;
            importedScales = imported.tileScales || null;
          } else if (imported.map1 || imported.map2 || imported.map5 || imported.map6) {
            importedEdits = imported;
          } else {
            setExportStatus("Invalid map file format");
            return;
          }

          applySavedOverridesToMaps(importedEdits);
          setPaintLog(importedEdits);
          localStorage.setItem(STORAGE_KEYS.PAINT_LOG, JSON.stringify(importedEdits));

          if (importedScales) {
            setTileScalesState(importedScales);
            localStorage.setItem(STORAGE_KEYS.TILE_SCALES, JSON.stringify(importedScales));
          }

          const totalEdits = countTotalEdits(importedEdits);
          setExportStatus(`Imported ${totalEdits} tile edits!`);

          setTimeout(() => {
            setExportStatus((prev) => (prev.includes("Imported") ? "" : prev));
          }, 4000);
        } catch (err) {
          console.error("Import failed:", err);
          setExportStatus("Failed to import file.");
        }
      };
      reader.readAsText(file);
    };

    input.click();
  }, [setPaintLog, setTileScalesState, setExportStatus]);

  const handleExportOverrides = useCallback(async () => {
    const entries = (paintLog[currentMap] || [])
      .slice()
      .sort((a, b) => a.y - b.y || a.x - b.x);

    if (entries.length === 0) {
      setExportStatus("No paint edits to export.");
      return;
    }

    const mapScales = tileScales[currentMap] || {};
    const block = `${currentMap}: [\n${entries
      .map((entry) => {
        const scale = mapScales[`${entry.x},${entry.y}`];
        const scalePart = scale && scale !== 1 ? `, scale: ${scale}` : "";
        return `  [${entry.x}, ${entry.y}, ${entry.id}${scalePart ? ` /*${scalePart} */` : ""}],`;
      })
      .join("\n")}\n],`;

    try {
      await navigator.clipboard.writeText(block);
      setExportStatus("Copied override block to clipboard.");
    } catch (err) {
      console.error("Clipboard failed:", err);
      console.log(block);
      setExportStatus("Clipboard blocked. Block printed to console.");
    }
  }, [paintLog, currentMap, tileScales, setExportStatus]);

  const clearPaintLogForCurrentMap = useCallback(() => {
    setPaintLog((prev) => ({ ...prev, [currentMap]: [] }));
    setExportStatus("Cleared paint log for this realm.");
    setFillStart(null);
  }, [currentMap, setPaintLog, setExportStatus, setFillStart]);

  return {
    handleSaveToLocalStorage,
    handleLoadFromLocalStorage,
    handleResetAllData,
    handleExportToFile,
    handleImportFromFile,
    handleExportOverrides,
    clearPaintLogForCurrentMap,
  };
}
