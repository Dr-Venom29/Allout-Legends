// pokemon-frontend/src/components/MapEditor.jsx
import { useState } from "react";
import { clampTileId, TILESET_MAX_ID } from "../data/tilesetMeta";
import { getTileStyle } from "../data/masterTileset";
import TileViewer from "./TileViewer";

export default function MapEditor({
  paintMode,
  setPaintMode,
  selectedTileId,
  setSelectedTileId,
  handleSaveToLocalStorage,
  handleLoadFromLocalStorage,
  handleResetAllData,
  handleExportToFile,
  handleImportFromFile,
  handleExportOverrides,
  clearPaintLogForCurrentMap,
  exportStatus,
  fillStart,
  currentPaintLines,
  currentMap,
  mapNames,
  player,
  terrainName,
  totalSavedEdits,
  handleDpadDown,
  handleDpadUp,
  // per-position scale props
  pendingScale,
  setPendingScale,
  tileScales,
  hoveredTile,
}) {
  const [showTileViewer, setShowTileViewer] = useState(false);

  const handleTileSelect = (tileId) => {
    setSelectedTileId(tileId);
    setShowTileViewer(false);
  };

  const previewStyle = getTileStyle(selectedTileId, 48);

  // What position are we showing scale for?
  // If hovering a tile in paint mode, show that tile's current scale.
  // Otherwise show pendingScale (what the next painted tile will use).
  const displayScale = pendingScale;
  const hoveredKey = hoveredTile ? `${hoveredTile.x},${hoveredTile.y}` : null;
  const hoveredCurrentScale = hoveredKey ? (tileScales[hoveredKey] ?? 1) : null;

  return (
    <aside className="deluge-panel">
      <div className="search-panel">
        <p className="search-message">Couldn't find anything.</p>
        <p className="search-message">Try moving to another spot.</p>
      </div>

      <div className="panel-meta">
        <div className="meta-row">
          <span className="meta-label">Area</span>
          <span className="meta-value">{mapNames[currentMap]}</span>
        </div>
        <div className="meta-row">
          <span className="meta-label">Pos</span>
          <span className="meta-value">({player.x}, {player.y})</span>
        </div>
        <div className="meta-row">
          <span className="meta-label">Terrain</span>
          <span className="meta-value">{terrainName}</span>
        </div>
        <div className="meta-row">
          <span className="meta-label">Saved Edits</span>
          <span className="meta-value" style={{ color: totalSavedEdits > 0 ? "#43a047" : "#999" }}>
            {totalSavedEdits} tiles
          </span>
        </div>
      </div>

      <div className="controls-pad">
        <div className="pad-dpad">
          <button 
            className="pad-btn up" 
            onMouseDown={() => handleDpadDown("up")} 
            onMouseUp={() => handleDpadUp("up")}
            onTouchStart={(e) => { e.preventDefault(); handleDpadDown("up"); }}
            onTouchEnd={(e) => { e.preventDefault(); handleDpadUp("up"); }}
            aria-label="Move up" 
          />
          <button 
            className="pad-btn left" 
            onMouseDown={() => handleDpadDown("left")} 
            onMouseUp={() => handleDpadUp("left")}
            onTouchStart={(e) => { e.preventDefault(); handleDpadDown("left"); }}
            onTouchEnd={(e) => { e.preventDefault(); handleDpadUp("left"); }}
            aria-label="Move left" 
          />
          <div className="pad-center">
            <div className="pad-circle" />
          </div>
          <button 
            className="pad-btn right" 
            onMouseDown={() => handleDpadDown("right")} 
            onMouseUp={() => handleDpadUp("right")}
            onTouchStart={(e) => { e.preventDefault(); handleDpadDown("right"); }}
            onTouchEnd={(e) => { e.preventDefault(); handleDpadUp("right"); }}
            aria-label="Move right" 
          />
          <button 
            className="pad-btn down" 
            onMouseDown={() => handleDpadDown("down")} 
            onMouseUp={() => handleDpadUp("down")}
            onTouchStart={(e) => { e.preventDefault(); handleDpadDown("down"); }}
            onTouchEnd={(e) => { e.preventDefault(); handleDpadUp("down"); }}
            aria-label="Move down" 
          />
        </div>
      </div>

      <label className="keyboard-toggle">
        <input type="checkbox" checked readOnly />
        Enable Keyboard Navigation?
      </label>

      <div className="paint-tools">
        {/* Paint toggle */}
        <div className="paint-row">
          <span className="meta-label">Paint</span>
          <button type="button" className={`paint-toggle ${paintMode ? "on" : ""}`} onClick={() => setPaintMode(p => !p)}>
            {paintMode ? "ON" : "OFF"}
          </button>
        </div>

        {/* Tile ID */}
        <div className="paint-row">
          <span className="meta-label">Tile ID</span>
          <input
            className="paint-input"
            type="number"
            min={0}
            max={TILESET_MAX_ID}
            value={selectedTileId}
            onChange={(e) => {
              const next = Number(e.target.value);
              if (Number.isFinite(next)) setSelectedTileId(clampTileId(next));
            }}
          />
        </div>

        {/* ── Sprite Scale (per tile position) ── */}
        <div style={{ marginTop: "6px", borderTop: "1px solid #b0b4bf", paddingTop: "6px" }}>
          <div className="paint-row" style={{ marginBottom: "4px" }}>
            <span className="meta-label" style={{ fontSize: "7px" }}>
              🔍 Sprite Scale (per tile)
            </span>
            <div style={{ display: "flex", gap: "6px" }}>
              <button
                type="button"
                className="paint-action-btn"
                style={{ minWidth: "28px", height: "18px", fontSize: "7px" }}
                onClick={() => setPendingScale((s) => Math.max(0.1, +(s - 0.05).toFixed(2)))}
              >
                -
              </button>
              <button
                type="button"
                className="paint-action-btn"
                style={{ minWidth: "36px", height: "18px", fontSize: "7px" }}
                onClick={() => setPendingScale(1)}
              >
                Reset
              </button>
              <button
                type="button"
                className="paint-action-btn"
                style={{ minWidth: "28px", height: "18px", fontSize: "7px" }}
                onClick={() => setPendingScale((s) => Math.min(1.5, +(s + 0.05).toFixed(2)))}
              >
                +
              </button>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <input
              type="range"
              min={0.1}
              max={1.5}
              step={0.05}
              value={displayScale}
              onChange={(e) => setPendingScale(parseFloat(e.target.value))}
              style={{ flex: 1, cursor: "pointer", accentColor: "#8dd06f" }}
            />
            <span style={{ fontSize: "8px", minWidth: "30px", textAlign: "right", color: "#17181b" }}>
              {Math.round(displayScale * 100)}%
            </span>
          </div>

          {/* Live preview of selected tile at pending scale */}
          <div style={{ marginTop: "6px", display: "flex", alignItems: "center", gap: "8px" }}>
            <div style={{
              width: "48px", height: "48px",
              background: "#b6f09e",
              border: "2px solid #3a3a3f",
              borderRadius: "4px",
              position: "relative",
              overflow: "hidden",
              flexShrink: 0,
            }}>
              {previewStyle && Object.keys(previewStyle).length > 0 && (
                <div style={{
                  ...previewStyle,
                  position: "absolute",
                  top: "50%", left: "50%",
                  transform: `translate(-50%, -50%) scale(${displayScale})`,
                  transformOrigin: "center center",
                }} />
              )}
            </div>
            <div style={{ fontSize: "7px", color: "#383a3f", lineHeight: 1.7 }}>
              {paintMode ? (
                <>
                  <div style={{ color: "#1565c0", fontWeight: "bold" }}>Paint mode ON</div>
                  <div>Each tile you click</div>
                  <div>gets this scale.</div>
                  {hoveredTile && (
                    <div style={{ color: "#9c27b0", marginTop: "2px" }}>
                      Hover ({hoveredTile.x},{hoveredTile.y}): {Math.round((hoveredCurrentScale ?? 1) * 100)}%
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div>Enable Paint to</div>
                  <div>apply this scale.</div>
                </>
              )}
              <div style={{ color: displayScale < 1 ? "#e67e22" : "#43a047", marginTop: "2px" }}>
                {displayScale < 1 ? `↓ ${Math.round((1 - displayScale) * 100)}% smaller` : "Full size"}
              </div>
            </div>
          </div>

          <div className="paint-hint" style={{ marginTop: "4px" }}>
            Scale is per-tile. Each painted spot keeps its own size.
          </div>
        </div>

        {/* Browse Tiles */}
        <div className="paint-row" style={{ marginTop: "6px" }}>
          <button type="button" className="paint-action-btn" onClick={() => setShowTileViewer(true)}
            style={{ background: "#9c27b0", color: "white", width: "100%" }}>
            🖼️ Browse Tiles
          </button>
        </div>

        {/* Save / Load / Reset */}
        <div className="paint-row">
          <button type="button" className="paint-action-btn" onClick={handleSaveToLocalStorage}
            style={{ background: "#43a047", color: "white", fontWeight: "bold" }}>💾 SAVE</button>
          <button type="button" className="paint-action-btn" onClick={handleLoadFromLocalStorage}>📂 LOAD</button>
          <button type="button" className="paint-action-btn" onClick={handleResetAllData}
            style={{ background: "#d32f2f", color: "white" }}>🗑 RESET</button>
        </div>

        {/* Export / Import */}
        <div className="paint-row">
          <button type="button" className="paint-action-btn" onClick={handleExportToFile}
            style={{ background: "#2196f3", color: "white" }}>📁 Export File</button>
          <button type="button" className="paint-action-btn" onClick={handleImportFromFile}
            style={{ background: "#ff9800", color: "white" }}>📂 Import File</button>
        </div>

        <div className="paint-hint">Press P to toggle, [ / ] to change ID, click map to paint.</div>
        <div className="paint-hint">Shift+click = rectangle fill. Right-click = erase to id 0.</div>
        <div className="paint-hint">💾 Click SAVE to persist edits (Ctrl+S shortcut)</div>
        <div className="paint-hint">🖼️ Browse Tiles = see all tiles with IDs</div>
        {fillStart && <div className="paint-hint">Fill start: ({fillStart.x}, {fillStart.y})</div>}

        <div className="paint-actions">
          <button type="button" className="paint-action-btn" onClick={handleExportOverrides}>Export Code</button>
          <button type="button" className="paint-action-btn" onClick={clearPaintLogForCurrentMap}>Clear Log</button>
        </div>

        {exportStatus && (
          <div className="paint-hint" style={{
            color: exportStatus.includes("✅") ? "#43a047" :
                   exportStatus.includes("❌") ? "#d32f2f" :
                   exportStatus.includes("📁") ? "#2196f3" : "#ffa000"
          }}>{exportStatus}</div>
        )}

        <pre className="paint-output">{currentPaintLines || "// no edits yet"}</pre>
      </div>

      {showTileViewer && (
        <TileViewer onClose={() => setShowTileViewer(false)} onSelectTile={handleTileSelect} />
      )}
    </aside>
  );
}