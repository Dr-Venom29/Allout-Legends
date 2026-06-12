import { CollisionResolver } from "./CollisionResolver";

export class MovementController {
  constructor(initialX, initialY, onTileChange) {
    this.worldX = initialX;
    this.worldY = initialY;
    this.onTileChange = onTileChange; // Callback to trigger React state updates when changing tiles
    
    // We base the tile we are standing on off our center/feet
    this.currentTileX = Math.floor(this.worldX + 0.5);
    this.currentTileY = Math.floor(this.worldY + 0.5);

    this.speed = 3.5; // Tiles per second
    this.collisionResolver = new CollisionResolver();
  }

  setMap(map) {
    this.currentMap = map;
  }

  update(dtMs, inputManager) {
    if (!this.currentMap) return;

    // Convert dt to seconds
    const dt = dtMs / 1000;

    const { dx, dy } = inputManager.getMovementVector();

    // Calculate requested velocity
    const velocityX = dx * this.speed;
    const velocityY = dy * this.speed;

    // Resolve collision and get next valid position
    const { x: nextX, y: nextY } = this.collisionResolver.resolve(
      this.currentMap,
      this.worldX,
      this.worldY,
      velocityX,
      velocityY,
      dt
    );

    this.worldX = nextX;
    this.worldY = nextY;

    // Check if we crossed a tile boundary (using center of character footprint)
    const newTileX = Math.floor(this.worldX + 0.5);
    const newTileY = Math.floor(this.worldY + 0.8); // Bias towards feet

    if (newTileX !== this.currentTileX || newTileY !== this.currentTileY || this.checkEdgeBump(newTileX, newTileY, inputManager)) {
      this.currentTileX = newTileX;
      this.currentTileY = newTileY;
      
      if (this.onTileChange) {
        this.onTileChange({ x: newTileX, y: newTileY, direction: inputManager.getPrimaryDirection() });
      }
    }
  }

  checkEdgeBump(tileX, tileY, inputManager) {
    // If the player is pushing against the edge of the map, we want to re-trigger onTileChange 
    // to allow map transitions to fire. We can throttle this to avoid spamming.
    if (!inputManager.getPrimaryDirection()) return false;
    
    const dir = inputManager.getPrimaryDirection();
    const isAtEdge = 
      (dir === "ArrowLeft" && tileX <= 0) ||
      (dir === "ArrowRight" && tileX >= this.currentMap[0].length - 1) ||
      (dir === "ArrowUp" && tileY <= 1) || // some gates are at y=1
      (dir === "ArrowDown" && tileY >= this.currentMap.length - 1);

    if (isAtEdge) {
      const now = performance.now();
      if (!this.lastBumpTime || now - this.lastBumpTime > 300) {
        this.lastBumpTime = now;
        return true;
      }
    }
    return false;
  }

  getPosition() {
    return { x: this.worldX, y: this.worldY };
  }
}
