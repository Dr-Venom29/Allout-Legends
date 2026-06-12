import Tile from "./Tile";
import PlayerSprite from "./sprites/PlayerSprite";

const TILE_SIZE = 40;

export default function Map({
  map,
  paintMode = false,
  onTileClick,
  tileScales = {},
  onTileHover,
  mapRef,
  playerContainerRef,
  playerSpriteRef
}) {
  if (!map?.length || !map[0]?.length) return null;


  const createPaintHandler = (x, y) => (event) => {
    event.preventDefault();
    onTileClick?.(x, y, { action: "paint", shiftKey: event.shiftKey });
  };

  const createEraseHandler = (x, y) => (event) => {
    event.preventDefault();
    onTileClick?.(x, y, { action: "erase", shiftKey: false });
  };

  return (
    <div className={`viewport ${paintMode ? "paint-mode" : ""}`}>
      <div
        ref={mapRef}
        className="map"
        style={{
          gridTemplateColumns: `repeat(${map[0].length}, ${TILE_SIZE}px)`,
          willChange: "transform",
        }}
      >
        {map.map((row, y) =>
          row.map((cell, x) => (
            <Tile
              key={`${x}-${y}`}
              type={cell}
              onClick={paintMode ? createPaintHandler(x, y) : undefined}
              onContextMenu={paintMode ? createEraseHandler(x, y) : undefined}
              onMouseEnter={onTileHover ? () => onTileHover({ x, y }) : undefined}
              onMouseLeave={onTileHover ? () => onTileHover(null) : undefined}
              tileScale={tileScales[`${x},${y}`]}
              title={`x:${x} y:${y} id:${cell}`}
            />
          ))
        )}
      </div>

      <div
        ref={playerContainerRef}
        className="player"
      >
        <PlayerSprite ref={playerSpriteRef} />
      </div>
    </div>
  );
}