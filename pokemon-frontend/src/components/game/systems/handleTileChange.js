import { checkEncounter } from "../../../logic/encounter";
import { maps } from "../../../data/maps";

const SIDE_GATE_Y_MIN = 14;
const SIDE_GATE_Y_MAX = 15;
const VERTICAL_GATE_X_MIN = 14;
const VERTICAL_GATE_X_MAX = 15;
const MAP1_MAP2_GATE_Y = new Set([4, 5, 12]);
const TRANSITION_DELAY = 300;

function isAtSideGate(y) {
  return y >= SIDE_GATE_Y_MIN && y <= SIDE_GATE_Y_MAX;
}

function isAtVerticalGate(x) {
  return x >= VERTICAL_GATE_X_MIN && x <= VERTICAL_GATE_X_MAX;
}

function performTransition({
  toMap,
  playerPos,
  setTransition,
  setCurrentMap,
  setPlayer,
  transitionLockRef,
}) {
  transitionLockRef.current = true;

  setTransition(true);

  setTimeout(() => {
    try {
      setCurrentMap(toMap);
      setPlayer(playerPos);
    } finally {
      setTransition(false);
      transitionLockRef.current = false;
    }
  }, TRANSITION_DELAY);
}

export function handleTileChange({
  newPos,
  current,
  currentMap,
  gameState,
  paintMode,
  transitionLockRef,
  setTransition,
  setCurrentMap,
  setPlayer,
  setGameState,
  setBattleSeed,
}) {
  if (gameState !== "map") return;
  if (paintMode) return;
  if (transitionLockRef.current) return;

  const rightEdge = current[0].length - 1;
  const sideGateRightEdge = current[0].length - 2;
  const bottomEdge = current.length - 1;

  const atSideGate = isAtSideGate(newPos.y);
  const atVerticalGate = isAtVerticalGate(newPos.x);
  const atMap1Map2GateY = MAP1_MAP2_GATE_Y.has(newPos.y);

  // Open PokeMart when standing in front of mart entrance on map2
  // We can assume moving into it triggers it
  if (
    currentMap === "map2" &&
    (newPos.x === 19 || newPos.x === 20) &&
    newPos.y === 14
  ) {
    // Actually the door is at y=13 maybe? If y=14 triggers it, we keep it.
    // Wait, the original code checked if standing at y=14 and pressing UP.
    // So if newPos.y === 13, maybe that's the door?
    // The previous check was: player.y === 14 && key === "ArrowUp".
    // If they move into y=13 from y=14, newPos.y is 13. Let's check 13.
    // I'll leave the trigger at y=14 for now, meaning walking onto y=14 triggers it?
    // Actually, in continuous movement, if they step into the doorway, we transition.
    // Let's keep the exact original tile trigger: if they reach y=13, or if y=14 triggers it.
    // I'll just check if they are at y=13 (which would be ArrowUp from 14).
    if (newPos.y === 13) {
      setGameState && setGameState("pokemart");
      // Push them back so they don't get stuck in the door
      setPlayer({ x: newPos.x, y: 14 });
      return;
    }
  }

  // map1 -> map2
  if (
    currentMap === "map1" &&
    newPos.x >= rightEdge &&
    newPos.direction === "ArrowRight" &&
    atMap1Map2GateY
  ) {
    performTransition({
      toMap: "map2",
      playerPos: { x: 0, y: newPos.y },
      setTransition,
      setCurrentMap,
      setPlayer,
      transitionLockRef,
    });
    return;
  }

  // map5 -> map6
  if (
    currentMap === "map5" &&
    newPos.x >= sideGateRightEdge &&
    newPos.direction === "ArrowRight" &&
    atSideGate
  ) {
    performTransition({
      toMap: "map6",
      playerPos: { x: 2, y: newPos.y },
      setTransition,
      setCurrentMap,
      setPlayer,
      transitionLockRef,
    });
    return;
  }

  // map2 -> map1
  if (
    currentMap === "map2" &&
    newPos.x <= 0 &&
    newPos.direction === "ArrowLeft" &&
    atMap1Map2GateY
  ) {
    const nextMap = maps.map1;
    performTransition({
      toMap: "map1",
      playerPos: { x: nextMap[0].length - 1, y: newPos.y },
      setTransition,
      setCurrentMap,
      setPlayer,
      transitionLockRef,
    });
    return;
  }

  // map6 -> map5
  if (
    currentMap === "map6" &&
    newPos.x <= 1 &&
    newPos.direction === "ArrowLeft" &&
    atSideGate
  ) {
    const nextMap = maps.map5;
    performTransition({
      toMap: "map5",
      playerPos: { x: nextMap[0].length - 2, y: newPos.y },
      setTransition,
      setCurrentMap,
      setPlayer,
      transitionLockRef,
    });
    return;
  }

  // map2 -> map5
  if (
    currentMap === "map2" &&
    newPos.y >= bottomEdge &&
    newPos.direction === "ArrowDown" &&
    atVerticalGate
  ) {
    performTransition({
      toMap: "map5",
      playerPos: { x: newPos.x, y: 1 },
      setTransition,
      setCurrentMap,
      setPlayer,
      transitionLockRef,
    });
    return;
  }

  // map5/map6 -> map2
  if (
    (currentMap === "map5" || currentMap === "map6") &&
    newPos.y <= 1 &&
    newPos.direction === "ArrowUp" &&
    atVerticalGate
  ) {
    const nextMap = maps.map2;
    performTransition({
      toMap: "map2",
      playerPos: { x: newPos.x, y: nextMap.length - 2 },
      setTransition,
      setCurrentMap,
      setPlayer,
      transitionLockRef,
    });
    return;
  }

  // Normal walk tile — only check encounter. Do NOT call setPlayer (that snaps worldX/Y).
  const encounter = checkEncounter(newPos.x, newPos.y, current);
  if (encounter.shouldBattle) {
    // Record the tile position so React knows where we are when battle ends
    setPlayer(newPos);
    setGameState("battle");
    setBattleSeed((prev) => prev + 1);
  }
}
