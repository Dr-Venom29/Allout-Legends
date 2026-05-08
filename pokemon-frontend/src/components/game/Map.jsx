import Tile from "./Tile";

const TILE_SIZE = 40;

export default function Map({ map, camera, playerPos, paintMode = false, onTileClick, tileScales = {}, onTileHover }) {
  const playerScreenX = playerPos.x * TILE_SIZE - camera.x + TILE_SIZE / 2;
  const playerScreenY = playerPos.y * TILE_SIZE - camera.y + TILE_SIZE / 2;

  return (
    <div className={`viewport ${paintMode ? "paint-mode" : ""}`}>
      <div
        className="map"
        style={{
          gridTemplateColumns: `repeat(${map[0].length}, ${TILE_SIZE}px)`,
          transform: `translate(${-camera.x}px, ${-camera.y}px)`,
          transition: "transform 0.14s cubic-bezier(0.22, 0.61, 0.36, 1)",
          willChange: "transform",
        }}
      >
        {map.map((row, y) =>
          row.map((cell, x) => (
            <Tile
              key={`${x}-${y}`}
              type={cell}
              onClick={paintMode ? (event) => {
                event.preventDefault();
                onTileClick?.(x, y, { action: "paint", shiftKey: event.shiftKey });
              } : undefined}
              onContextMenu={paintMode ? (event) => {
                event.preventDefault();
                onTileClick?.(x, y, { action: "erase", shiftKey: false });
              } : undefined}
              onMouseEnter={onTileHover ? () => onTileHover({ x, y }) : undefined}
              onMouseLeave={onTileHover ? () => onTileHover(null) : undefined}
              tileScale={tileScales[`${x},${y}`]}
              title={`x:${x} y:${y} id:${cell}`}
            />
          ))
        )}
      </div>

      <div
        className="player"
        style={{
          left: `${playerScreenX}px`,
          top: `${playerScreenY}px`
        }}
      >
        <img
          className="player-avatar"
          src="/assets/heros/Alpha_Coder.png"
          alt="Player avatar"
        />
      </div>
    </div>
  );
}