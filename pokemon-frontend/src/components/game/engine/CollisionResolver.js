import { isTileWalkable } from "../../../data/tileWalkability";

export class CollisionResolver {
  constructor() {
    // Collision bounding box relative to top-left of worldX, worldY
    // A tile is 1.0 x 1.0
    // We shrink the horizontal bounding box to 0.2 -> 0.8 so we don't get stuck on corners easily
    // We use the bottom half of the tile (0.4 -> 0.9) for feet collision
    this.boundingBox = {
      left: 0.2,
      right: 0.8,
      top: 0.5,
      bottom: 0.95
    };
  }

  isWalkable(map, tileX, tileY) {
    if (tileY < 0 || tileY >= map.length) return false;
    if (tileX < 0 || tileX >= map[0].length) return false;
    
    const tileId = map[tileY][tileX];
    return isTileWalkable(tileId);
  }

  resolve(map, currentX, currentY, velocityX, velocityY, dt) {
    let nextX = currentX + velocityX * dt;
    let nextY = currentY + velocityY * dt;

    // Check X axis
    if (velocityX !== 0) {
      const topEdge = Math.floor(currentY + this.boundingBox.top);
      const bottomEdge = Math.floor(currentY + this.boundingBox.bottom);
      
      const checkEdgeX = velocityX > 0 
        ? Math.floor(nextX + this.boundingBox.right) 
        : Math.floor(nextX + this.boundingBox.left);

      // If either the top or bottom of the bounding box hits a wall, stop X movement
      if (!this.isWalkable(map, checkEdgeX, topEdge) || !this.isWalkable(map, checkEdgeX, bottomEdge)) {
        nextX = currentX; // Snap back
      }
    }

    // Check Y axis
    if (velocityY !== 0) {
      const leftEdge = Math.floor(nextX + this.boundingBox.left);
      const rightEdge = Math.floor(nextX + this.boundingBox.right);
      
      const checkEdgeY = velocityY > 0 
        ? Math.floor(nextY + this.boundingBox.bottom) 
        : Math.floor(nextY + this.boundingBox.top);

      // If either the left or right of the bounding box hits a wall, stop Y movement
      if (!this.isWalkable(map, leftEdge, checkEdgeY) || !this.isWalkable(map, rightEdge, checkEdgeY)) {
        nextY = currentY; // Snap back
      }
    }

    return { x: nextX, y: nextY };
  }
}
