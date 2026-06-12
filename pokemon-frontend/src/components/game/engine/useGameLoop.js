import { useEffect, useRef } from "react";
import { InputManager } from "./InputManager";
import { MovementController } from "./MovementController";

export function useGameLoop({
  map,
  initialPlayerPos,
  onTileChange,
  onAction,
  TILE = 40,
  VIEWPORT_W = 900,
  VIEWPORT_H = 600,
}) {
  const mapRef = useRef(null);
  const playerContainerRef = useRef(null);
  const playerSpriteRef = useRef(null);

  const inputManagerRef = useRef(null);
  const movementControllerRef = useRef(null);
  const requestRef = useRef(null);
  const lastTimeRef = useRef(null);

  // Keep the LATEST versions of all callbacks/data in refs
  // so the RAF loop always has fresh values without re-mounting
  const mapDataRef = useRef(map);
  const onTileChangeRef = useRef(onTileChange);
  const TILE_REF = useRef(TILE);
  const VW_REF = useRef(VIEWPORT_W);
  const VH_REF = useRef(VIEWPORT_H);

  // Sync all changing values into refs every render
  useEffect(() => { mapDataRef.current = map; }, [map]);
  useEffect(() => { onTileChangeRef.current = onTileChange; }, [onTileChange]);
  useEffect(() => { TILE_REF.current = TILE; }, [TILE]);
  useEffect(() => { VW_REF.current = VIEWPORT_W; }, [VIEWPORT_W]);
  useEffect(() => { VH_REF.current = VIEWPORT_H; }, [VIEWPORT_H]);

  // Sync map into controller whenever it changes
  useEffect(() => {
    if (movementControllerRef.current) {
      movementControllerRef.current.setMap(map);
    }
  }, [map]);

  // Teleport player only on large jumps (map transitions / spawns)
  useEffect(() => {
    if (!movementControllerRef.current) return;
    const dx = Math.abs(movementControllerRef.current.worldX - initialPlayerPos.x);
    const dy = Math.abs(movementControllerRef.current.worldY - initialPlayerPos.y);
    if (dx > 1.5 || dy > 1.5) {
      movementControllerRef.current.worldX = initialPlayerPos.x;
      movementControllerRef.current.worldY = initialPlayerPos.y;
      movementControllerRef.current.currentTileX = initialPlayerPos.x;
      movementControllerRef.current.currentTileY = initialPlayerPos.y;
    }
  }, [initialPlayerPos.x, initialPlayerPos.y]);

  // Mount once — create InputManager, MovementController, start RAF loop
  useEffect(() => {
    inputManagerRef.current = new InputManager();
    inputManagerRef.current.attach((e) => {
      if (onAction) onAction(e);
    });

    lastTimeRef.current = performance.now();
    movementControllerRef.current = new MovementController(
      initialPlayerPos.x,
      initialPlayerPos.y,
      (newTile) => {
        if (onTileChangeRef.current) onTileChangeRef.current(newTile);
      }
    );
    movementControllerRef.current.setMap(mapDataRef.current);

    const update = (time) => {
      const dt = Math.min(time - lastTimeRef.current, 100); // cap at 100ms to avoid huge jumps
      lastTimeRef.current = time;

      const input = inputManagerRef.current;
      const controller = movementControllerRef.current;
      const TILE = TILE_REF.current;
      const VIEWPORT_W = VW_REF.current;
      const VIEWPORT_H = VH_REF.current;

      controller.update(dt, input);

      const { x: worldX, y: worldY } = controller.getPosition();
      const { isMoving, facing } = input.getMovementVector();

      // Camera — clamp to map bounds
      const currentMap = mapDataRef.current;
      if (currentMap && currentMap.length > 0) {
        const mapW = currentMap[0].length * TILE;
        const mapH = currentMap.length * TILE;

        const cameraX = Math.max(0, Math.min(worldX * TILE - VIEWPORT_W / 2, mapW - VIEWPORT_W));
        const cameraY = Math.max(0, Math.min(worldY * TILE - VIEWPORT_H / 2, mapH - VIEWPORT_H));

        // Move the map (world scroll)
        if (mapRef.current) {
          mapRef.current.style.transform = `translate(${-cameraX}px, ${-cameraY}px)`;
        }

        // Player stays on screen, offset from camera
        if (playerContainerRef.current) {
          const screenX = worldX * TILE - cameraX;
          const screenY = worldY * TILE - cameraY;
          playerContainerRef.current.style.left = `${screenX}px`;
          playerContainerRef.current.style.top = `${screenY}px`;
        }
      }

      // Drive animation via imperative handle
      if (playerSpriteRef.current && playerSpriteRef.current.updateAnimation) {
        playerSpriteRef.current.updateAnimation(dt, isMoving, facing);
      }

      requestRef.current = requestAnimationFrame(update);
    };

    requestRef.current = requestAnimationFrame(update);

    return () => {
      cancelAnimationFrame(requestRef.current);
      if (inputManagerRef.current) {
        inputManagerRef.current.detach();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const simulateKey = (key, isDown) => {
    if (!inputManagerRef.current) return;
    if (isDown) {
      inputManagerRef.current.handleKeyDown({
        key,
        repeat: false,
        preventDefault: () => {},
        target: { tagName: "BUTTON", isContentEditable: false },
      });
    } else {
      inputManagerRef.current.handleKeyUp({
        key,
        preventDefault: () => {},
        target: { tagName: "BUTTON", isContentEditable: false },
      });
    }
  };

  return { mapRef, playerContainerRef, playerSpriteRef, simulateKey };
}
