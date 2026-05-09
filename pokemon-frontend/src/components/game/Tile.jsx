// pokemon-frontend/src/components/game/Tile.jsx
import { memo } from "react";
import { getTileStyle } from "../../data/masterTileset";

const TILE_SIZE = 40;
const TILE_SIZE_PX = `${TILE_SIZE}px`;

function Tile({ type, onClick, onContextMenu, onMouseEnter, onMouseLeave, title, tileScale }) {
  const scale = tileScale ?? 1;
  const baseStyle = getTileStyle(type, TILE_SIZE);

  if (!baseStyle || Object.keys(baseStyle).length === 0) {
    return (
      <div
        className="tile"
        style={{ width: TILE_SIZE_PX, height: TILE_SIZE_PX, background: "#333", border: "1px solid #555" }}
        onClick={onClick}
        onContextMenu={onContextMenu}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        title={title || `Unknown tile: ${type}`}
      />
    );
  }

  // For exact default scale, render the base style directly for best pixel alignment.
  if (scale === 1) {
    return (
      <div
        className="tile"
        onClick={onClick}
        onContextMenu={onContextMenu}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        title={title || `Tile ID: ${type}`}
        style={baseStyle}
      />
    );
  }

  // For any non-default scale (smaller or larger), render inside a 40px box and
  // center a scaled inner tile so increases >100% are visible and persisted.
  return (
    <div
      className="tile"
      onClick={onClick}
      onContextMenu={onContextMenu}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      title={title || `Tile ID: ${type} (scale: ${Math.round(scale * 100)}%)`}
      style={{
        width: TILE_SIZE_PX,
        height: TILE_SIZE_PX,
        position: "relative",
        overflow: "hidden",
        background: "transparent",
      }}
    >
      <div
        style={{
          ...baseStyle,
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: `translate(-50%, -50%) scale(${scale})`,
          transformOrigin: "center center",
          pointerEvents: "none",
        }}
      />
    </div>
  );
}

export default memo(Tile);