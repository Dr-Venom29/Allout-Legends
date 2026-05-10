import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import Map from "./Map";
import Battle from "../battle/Battle";
import MapEditor from "../MapEditor";
import Sidebar from "../Sidebar";
import { maps } from "../../data/maps";
import { TILESET_MAX_ID } from "../../data/tilesetMeta";
import { map1Scales } from "../../data/maps/map1Scales";
import { map2Scales } from "../../data/maps/map2Scales";
import { STORAGE_KEYS, saveJSON } from "./systems/storage";
import { handleMovement } from "./systems/movement";
import { handlePaint } from "./systems/paint";
import { setupKeyboard } from "./systems/keyboard";
import {
  applySavedOverridesToMaps,
  loadSavedPaintLog,
  useStorageHandlers,
} from "./systems/storageHandlers";
import {
  loadPlayerInventory,
  loadPlayerParty,
  loadPcStorage,
  savePlayerInventory,
  savePlayerParty,
  savePcStorage,
} from "./playerStorage";
import { loadPlayerMoney, savePlayerMoney } from "./playerStorage";
import PokeMartPanel from "../panels/PokeMartPanel";
import MoveLearningPanel from "./panels/MoveLearningPanel";
import {
  MAP_NAMES,
  buildCurrentPaintLines,
  getTerrainName,
} from "./systems/uiState";
import { loadPokedex } from "./pokedexStorage";
import {
  markPokemonCaught,
  markPokemonSeen,
} from "./pokedex";
import { loadActivePartyIndex } from "./partyStorage";
import { replaceMove } from "./moveLearning.js";

const TILE = 40;
const VIEWPORT_W = 900;
const VIEWPORT_H =
  typeof window !== "undefined"
    ? window.innerHeight - 68
    : 700;

const DEFAULT_TILE_SCALES = {
  map1: map1Scales,
  map2: map2Scales,
  map5: {},
  map6: {},
};


export default function Game() {
  const getInitialPlayerPos = () => {
    const saved = localStorage.getItem(STORAGE_KEYS.PLAYER_POS);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Failed to parse player position:", e);
        return { x: 5, y: 5 };
      }
    }
    return { x: 5, y: 5 };
  };

  const getInitialCurrentMap = () => {
    const saved = localStorage.getItem(STORAGE_KEYS.CURRENT_MAP);
    return saved && (saved === "map1" || saved === "map2" || saved === "map5" || saved === "map6")
      ? saved
      : "map1";
  };

  const [player, setPlayer] = useState(getInitialPlayerPos);

  const [gameState, setGameState] = useState("map");

  const [currentMap, setCurrentMap] = useState(getInitialCurrentMap);

  const [pressedKey, setPressedKey] = useState(null);

  const [transition, setTransition] = useState(false);
  const transitionLockRef = useRef(false);

  const [paintMode, setPaintMode] = useState(false);

  const [selectedTileId, setSelectedTileId] =
    useState(0);

  const [fillStart, setFillStart] = useState(null);

  const [exportStatus, setExportStatus] =
    useState("");

  const [battleSeed, setBattleSeed] =
    useState(0);

  const [activeSection, setActiveSection] =
    useState("profile");

  const [pendingScale, setPendingScale] =
    useState(1);

  const [hoveredTile, setHoveredTile] =
    useState(null);

  const [playerInventory, setPlayerInventory] =
    useState(() => loadPlayerInventory());

  const [playerMoney, setPlayerMoney] = useState(() => loadPlayerMoney());

  const [playerParty, setPlayerParty] = useState(
    () => loadPlayerParty()
  );

  const [activePartyIndex, setActivePartyIndex] = useState(
    () => loadActivePartyIndex()
  );

  const [pcStorage, setPcStorage] = useState(
    () => loadPcStorage()
  );

  const [pokedex, setPokedex] = useState(
    () => loadPokedex()
  );

  const [pendingMoveLearning, setPendingMoveLearning] = useState(null);

  const [paintLog, setPaintLog] = useState(() => {
    const savedLog = loadSavedPaintLog();
    applySavedOverridesToMaps(savedLog);
    return savedLog;
  });

  const [tileScales, setTileScalesState] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.TILE_SCALES);
      const fromStorage = saved ? JSON.parse(saved) : {};
      const merged = { ...DEFAULT_TILE_SCALES };
      Object.keys(fromStorage).forEach((mapName) => {
        merged[mapName] = {
          ...(DEFAULT_TILE_SCALES[mapName] || {}),
          ...fromStorage[mapName],
        };
      });
      return merged;
    } catch {
      return { ...DEFAULT_TILE_SCALES };
    }
  });

  const current = maps[currentMap];

  const camera = useMemo(() => {
    const mapW = current[0].length * TILE;
    const mapH = current.length * TILE;

    return {
      x: Math.max(
        0,
        Math.min(
          player.x * TILE - VIEWPORT_W / 2,
          mapW - VIEWPORT_W
        )
      ),
      y: Math.max(
        0,
        Math.min(
          player.y * TILE - VIEWPORT_H / 2,
          mapH - VIEWPORT_H
        )
      ),
    };
  }, [player, current]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.PLAYER_POS, JSON.stringify(player));
  }, [player]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CURRENT_MAP, currentMap);
  }, [currentMap]);

  useEffect(() => {
    savePlayerInventory(playerInventory);
  }, [playerInventory]);

  useEffect(() => {
    savePlayerParty(playerParty);
  }, [playerParty]);

  useEffect(() => {
    saveJSON(
      STORAGE_KEYS.ACTIVE_PARTY_INDEX,
      activePartyIndex
    );
  }, [activePartyIndex]);

  useEffect(() => {
    if (playerParty.length === 0) {
      setActivePartyIndex(0);
      return;
    }

    if (activePartyIndex >= playerParty.length) {
      setActivePartyIndex(0);
    }
  }, [playerParty, activePartyIndex]);

  useEffect(() => {
    savePcStorage(pcStorage);
  }, [pcStorage]);

  useEffect(() => {
    savePlayerMoney(playerMoney);
  }, [playerMoney]);

  useEffect(() => {
    saveJSON(STORAGE_KEYS.POKEDEX, pokedex);
  }, [pokedex]);

  const setPositionScale = useCallback(
    (mapName, x, y, scale) => {
      setTileScalesState((prev) => {
        const mapScales = {
          ...(prev[mapName] || {}),
        };

        const key = `${x},${y}`;

        if (scale === 1) {
          delete mapScales[key];
        } else {
          mapScales[key] = scale;
        }

        const next = {
          ...prev,
          [mapName]: mapScales,
        };

        localStorage.setItem(
          STORAGE_KEYS.TILE_SCALES,
          JSON.stringify(next)
        );

        return next;
      });
    },
    []
  );

  const handleMove = useCallback(
    (key) => {
      handleMovement({
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
      });
    },
    [player, current, currentMap, gameState, paintMode]
  );

  const handleTilePaint = useCallback(
    (x, y, options = { action: "paint", shiftKey: false }) => {
      handlePaint({
        x,
        y,
        options,
        paintMode,
        current,
        currentMap,
        selectedTileId,
        fillStart,
        pendingScale,
        setFillStart,
        setExportStatus,
        setPaintLog,
        setPositionScale,
      });
    },
    [paintMode, current, currentMap, selectedTileId, fillStart, pendingScale, setPositionScale]
  );

  const {
    handleSaveToLocalStorage,
    handleLoadFromLocalStorage,
    handleResetAllData,
    handleExportToFile,
    handleImportFromFile,
    handleExportOverrides,
    clearPaintLogForCurrentMap,
  } = useStorageHandlers({
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
  });

  useEffect(() => {
    return setupKeyboard({
      paintMode,
      setPaintMode,
      handleSave: handleSaveToLocalStorage,
      setSelectedTileId,
      handleMove,
      setPressedKey,
      TILESET_MAX_ID,
    });
  }, [paintMode, handleSaveToLocalStorage, handleMove]);

  const handleDpad = (dir) => {
    const keyMap = {
      up: "ArrowUp",
      down: "ArrowDown",
      left: "ArrowLeft",
      right: "ArrowRight",
    };

    setPressedKey(keyMap[dir]);

    handleMove(keyMap[dir]);

    setTimeout(() => {
      setPressedKey(null);
    }, 150);
  };

  const currentPaintLines = buildCurrentPaintLines(paintLog, currentMap);
  const tileType = current[player.y]?.[player.x];
  const terrainName = getTerrainName(tileType);
  const totalSavedEdits = Object.values(paintLog).reduce((sum, arr) => sum + arr.length, 0);

  const handleSectionChange = (section) => {
    setActiveSection(section);
    console.log(`Switched to: ${section}`);
  };

  const activePokemon = useMemo(
    () => playerParty[activePartyIndex] ?? playerParty[0] ?? null,
    [playerParty, activePartyIndex]
  );

  const handlePokemonSeen = useCallback((pokemonId) => {
    const numericId = Number(pokemonId);

    if (!Number.isFinite(numericId)) {
      return;
    }

    setPokedex((prev) =>
      markPokemonSeen(prev, numericId)
    );
  }, []);

  const handlePokemonCaught = useCallback((pokemonId) => {
    const numericId = Number(pokemonId);

    if (!Number.isFinite(numericId)) {
      return;
    }

    setPokedex((prev) =>
      markPokemonCaught(prev, numericId)
    );
  }, []);

  const handleOpenPC = useCallback(() => {
    setActiveSection("pokemon-pc");
  }, []);

  return (
    <div className="game-container">
      <Sidebar
        player={{
          x: player.x,
          y: player.y,
          mapId: currentMap,
        }}
        party={playerParty}
        pcStorage={pcStorage}
        inventory={playerInventory}
        pokedex={pokedex}
        activePartyIndex={activePartyIndex}
        setActivePartyIndex={setActivePartyIndex}
        onOpenPC={handleOpenPC}
        onSectionChange={handleSectionChange}
        activeSection={activeSection}
      />

      <div className="layout">
        {gameState === "map" && (
          <>
            <div className="world-main">
              <div className="realm-bar">
                <span className="realm-icon">🗺</span>
                <span className="realm-title">
                  The Legends Realm #{currentMap === "map1" ? 1 : currentMap === "map2" ? 2 : currentMap === "map5" ? 5 : 6}
                </span>
                <button className="realm-help" type="button">?</button>
              </div>
              <div className="map-stage">
                <Map
                  map={current}
                  camera={camera}
                  playerPos={player}
                  paintMode={paintMode}
                  onTileClick={handleTilePaint}
                  tileScales={
                    tileScales[currentMap] || {}
                  }
                  onTileHover={
                    paintMode
                      ? setHoveredTile
                      : null
                  }
                />

                {transition && (
                  <div className="map-transition" />
                )}
              </div>
            </div>

            <MapEditor
              paintMode={paintMode}
              setPaintMode={setPaintMode}
              selectedTileId={selectedTileId}
              setSelectedTileId={
                setSelectedTileId
              }
              handleSaveToLocalStorage={
                handleSaveToLocalStorage
              }
              handleLoadFromLocalStorage={
                handleLoadFromLocalStorage
              }
              handleResetAllData={handleResetAllData}
              handleExportToFile={handleExportToFile}
              handleImportFromFile={handleImportFromFile}
              handleExportOverrides={
                handleExportOverrides
              }
              clearPaintLogForCurrentMap={
                clearPaintLogForCurrentMap
              }
              currentMap={currentMap}
              mapNames={MAP_NAMES}
              player={player}
              pressedKey={pressedKey}
              handleDpad={handleDpad}
              exportStatus={exportStatus}
              fillStart={fillStart}
              currentPaintLines={currentPaintLines}
              terrainName={terrainName}
              totalSavedEdits={totalSavedEdits}
              pendingScale={pendingScale}
              setPendingScale={
                setPendingScale
              }
              tileScales={
                tileScales[currentMap] || {}
              }
              hoveredTile={hoveredTile}
            />
          </>
        )}

        {gameState === "battle" && (
          <Battle
            key={battleSeed}
            exitBattle={(battleResultData) => {
              if (battleResultData?.pendingMoveLearning) {
                setPendingMoveLearning(battleResultData.pendingMoveLearning);
                setGameState("move-learning");
              } else {
                setGameState("map");
              }
            }}
            mapId={currentMap}
            inventory={playerInventory}
            setInventory={setPlayerInventory}
            party={playerParty}
            setParty={setPlayerParty}
            pcStorage={pcStorage}
            setPcStorage={setPcStorage}
            playerPokemon={activePokemon}
            onPokemonSeen={handlePokemonSeen}
            onPokemonCaught={handlePokemonCaught}
          />
        )}

        {gameState === "move-learning" && pendingMoveLearning && (
          <MoveLearningPanel
            pokemon={pendingMoveLearning.pokemon}
            newMove={pendingMoveLearning.move}
            onReplaceMove={(moveIndex) => {
              const updatedPokemon = replaceMove(
                pendingMoveLearning.pokemon,
                moveIndex,
                pendingMoveLearning.move
              );
              
              // Update party using activePartyIndex
              if (activePartyIndex !== -1 && activePartyIndex < playerParty.length) {
                setPlayerParty((prev) => {
                  const next = [...prev];
                  next[activePartyIndex] = updatedPokemon;
                  return next;
                });
              } else {
                // Fallback: find by matching properties
                const partyIndex = playerParty.findIndex((p) => {
                  if (!p) return false;
                  if (p.number && updatedPokemon.number && p.number === updatedPokemon.number) return true;
                  if (p.id && updatedPokemon.id && p.id === updatedPokemon.id) return true;
                  if (p.name && updatedPokemon.name && p.name === updatedPokemon.name) return true;
                  return false;
                });
                if (partyIndex !== -1) {
                  setPlayerParty((prev) => {
                    const next = [...prev];
                    next[partyIndex] = updatedPokemon;
                    return next;
                  });
                }
              }
              
              setPendingMoveLearning(null);
              setGameState("map");
            }}
            onCancel={() => {
              setPendingMoveLearning(null);
              setGameState("map");
            }}
          />
        )}

        {gameState === "pokemart" && (
          <PokeMartPanel
            inventory={playerInventory}
            setInventory={setPlayerInventory}
            money={playerMoney}
            setMoney={setPlayerMoney}
            onClose={() => setGameState("map")}
          />
        )}
      </div>
    </div>
  );
}