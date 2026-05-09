import { movePlayer } from "../../../logic/movement";
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

export function handleMovement({
  key,
  player,
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

  // Open PokeMart when standing in front of mart entrance on map2
  if (
    currentMap === "map2" &&
    (player.x === 19 || player.x === 20) &&
    player.y === 14 &&
    key === "ArrowUp"
  ) {
    setGameState && setGameState("pokemart");
    return;
  }

  const rightEdge = current[0].length - 1;
  const sideGateRightEdge = current[0].length - 2;
  const bottomEdge = current.length - 1;

  const atSideGate = isAtSideGate(player.y);
  const atVerticalGate = isAtVerticalGate(player.x);
  const atMap1Map2GateY = MAP1_MAP2_GATE_Y.has(player.y);

  // map1 -> map2
  if (
    currentMap === "map1" &&
    player.x === rightEdge &&
    key === "ArrowRight" &&
    atMap1Map2GateY
  ) {
    performTransition({
      toMap: "map2",
      playerPos: { x: 0, y: player.y },
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
    player.x === sideGateRightEdge &&
    key === "ArrowRight" &&
    atSideGate
  ) {
    performTransition({
      toMap: "map6",
      playerPos: { x: 2, y: player.y },
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
    player.x === 0 &&
    key === "ArrowLeft" &&
    atMap1Map2GateY
  ) {
    const nextMap = maps.map1;

    performTransition({
      toMap: "map1",
      playerPos: { x: nextMap[0].length - 1, y: player.y },
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
    player.x === 1 &&
    key === "ArrowLeft" &&
    atSideGate
  ) {
    const nextMap = maps.map5;

    performTransition({
      toMap: "map5",
      playerPos: { x: nextMap[0].length - 2, y: player.y },
      setTransition,
      setCurrentMap,
      setPlayer,
      transitionLockRef,
    });

    return;
  }

  // map2 -> map5
  if (
    player.y === bottomEdge &&
    key === "ArrowDown" &&
    atVerticalGate
  ) {
    if (currentMap === "map2") {
      performTransition({
        toMap: "map5",
        playerPos: { x: player.x, y: 1 },
        setTransition,
        setCurrentMap,
        setPlayer,
        transitionLockRef,
      });
    }

    return;
  }

  // map5/map6 -> map2
  if (
    player.y === 1 &&
    key === "ArrowUp" &&
    atVerticalGate
  ) {
    if (currentMap === "map5" || currentMap === "map6") {
      const nextMap = maps.map2;

      performTransition({
        toMap: "map2",
        playerPos: { x: player.x, y: nextMap.length - 2 },
        setTransition,
        setCurrentMap,
        setPlayer,
        transitionLockRef,
      });
    }

    return;
  }

  // normal movement
  const newPos = movePlayer(player, key, current);

  if (newPos.x !== player.x || newPos.y !== player.y) {
    setPlayer(newPos);

    const encounter = checkEncounter(newPos.x, newPos.y, current);

    if (encounter.shouldBattle) {
      setGameState("battle");
      setBattleSeed((prev) => prev + 1);
    }
  }
}