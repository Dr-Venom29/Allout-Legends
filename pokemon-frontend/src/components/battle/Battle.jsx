import { useState, useMemo, useEffect } from "react";
import "./Battle.css";

import {
  ACTIONS,
  PLAYER_ATTACK_DELAY,
  RUN_SUCCESS_DELAY,
  BATTLE_END_DELAY,
} from "./battleConstants";

import {
  getHpPercent,
  getHpClass,
} from "./battleUtils";

import { createWildBattle, tryRun } from "./battleLogic";
import { buildMove } from "../../data/pokemon/moveData";
import { buildTurnEvents } from "./engine/buildTurnEvents";
import { BATTLE_ACTIONS } from "./engine/battleActions";
import { useBattleQueue } from "./hooks/useBattleQueue";
import { processProgression } from "./engine/processProgression";
import { replaceMove } from "../game/moveLearning";
import {
  attemptCapture,
  storeCapturedPokemon,
} from "./captureLogic";
import { createEndBattleEvent, createTextEvent, createWaitEvent } from "./events/createEvent";
import {
  hasItem,
  consumeItem,
  getItemCount,
  ITEMS,
} from "../game/inventory";
import PokemonPartyPanel from "../panels/PokemonPartyPanel";
import { hasUsablePokemon } from "../game/partyUtils";

const PLAYER_POKEMON = {
  name: "PIKACHU",
  level: 10,
  hp: 50,
  maxHp: 50,
  attack: 35,
  defense: 30,
  spAttack: 40,
  spDefense: 35,
  speed: 55,
  type1: "Electric",
  type2: null,
  moves: [
    {
      name: "ThunderShock",
      power: 40,
      type: "Electric",
      category: "special",
    },
    {
      name: "Quick Attack",
      power: 40,
      type: "Normal",
      category: "physical",
    },
    {
      name: "Tail Whip",
      power: 0,
      type: "Normal",
      category: "status",
    },
    {
      name: "Growl",
      power: 0,
      type: "Normal",
      category: "status",
    },
  ],
  sprite: "/assets/pokemons/025.png",
};

const DEFAULT_ENEMY_SPRITE = "/assets/pokemons/000.png";
const DEFAULT_PLAYER_SPRITE = "/assets/pokemons/025.png";

export default function Battle({
  exitBattle,
  mapId = "map1",
  inventory,
  setInventory,
  party,
  setParty,
  pcStorage,
  setPcStorage,
  playerPokemon,
  onPokemonSeen,
  onPokemonCaught,
  activePartyIndex = 0,
  setActivePartyIndex = () => {},
}) {
  const [battlePartyIndex, setBattlePartyIndex] = useState(activePartyIndex);

  const resolvedPlayerPokemon = useMemo(() => {
    // Use the battlePartyIndex to get the current pokemon from the party
    const currentPokemon = party && battlePartyIndex >= 0 && battlePartyIndex < party.length
      ? party[battlePartyIndex]
      : playerPokemon;

    if (!currentPokemon) {
      return PLAYER_POKEMON;
    }

    const fallbackMaxHp =
      currentPokemon.maxHp ??
      currentPokemon.hp ??
      PLAYER_POKEMON.maxHp;

    const fallbackHp =
      currentPokemon.hp ??
      fallbackMaxHp;

    const moves =
      Array.isArray(currentPokemon.moves) && currentPokemon.moves.length > 0
        ? currentPokemon.moves
        : PLAYER_POKEMON.moves;

    return {
      ...PLAYER_POKEMON,
      ...currentPokemon,
      moves,
      maxHp: fallbackMaxHp,
      hp: fallbackHp,
      sprite: currentPokemon.sprite || PLAYER_POKEMON.sprite,
    };
  }, [playerPokemon, party, battlePartyIndex]);

  const initialWildPokemon = useMemo(
    () => createWildBattle(mapId),
    [mapId]
  );
  const [enemy, setEnemy] = useState(initialWildPokemon);
  const [enemyHp, setEnemyHp] = useState(
    initialWildPokemon ? (initialWildPokemon.currentHp ?? initialWildPokemon.hp) : 0
  );
  const [playerHp, setPlayerHp] = useState(resolvedPlayerPokemon.currentHp ?? resolvedPlayerPokemon.hp);
  
  const [message, setMessage] = useState(
    initialWildPokemon
      ? `A wild ${initialWildPokemon.name} (Lv.${initialWildPokemon.level}) appeared!`
      : "Error loading Pokémon!"
  );
  const [selectedAction, setSelectedAction] = useState(0);
  const [selectedMove, setSelectedMove] = useState(0);
  const [phase, setPhase] = useState("action");
  const [isForcedSwitch, setIsForcedSwitch] = useState(false);

  // Queue Orchestrator Hook
  const {
    startQueue,
    resumeQueue,
    queuePaused,
    pauseReason,
    pauseData: pendingMoveData,
    mutateProgressionUpdates,
  } = useBattleQueue({
    setMessage,
    setPlayerHp,
    setEnemyHp,
    onFaint: () => {},
    onEndBattle: () => {},
    onQueueComplete: (events, progressionUpdates) => {
      // 1. Commit Persistent Save Data NOW that animation is entirely finished
      if (progressionUpdates && progressionUpdates.playerPokemon) {
        setParty((prev) => {
          const next = Array.isArray(prev) ? [...prev] : [];
          next[battlePartyIndex] = progressionUpdates.playerPokemon;
          return next;
        });
      }

      // 2. Determine next phase
      const didWin = events.some(e => e.type === "END_BATTLE" && e.payload?.reason === "win");
      const didLose = events.some(e => e.type === "END_BATTLE" && e.payload?.reason === "lose");
      const didRun = events.some(e => e.type === "END_BATTLE" && e.payload?.reason === "run");
      const didCatch = events.some(e => e.type === "END_BATTLE" && e.payload?.reason === "catch");

      if (didWin) {
        setTimeout(() => finishBattle(), BATTLE_END_DELAY);
      } else if (didLose) {
        handlePlayerFainted();
      } else if (didRun || didCatch) {
        setTimeout(() => finishBattle({ reason: didRun ? "run" : "catch" }), BATTLE_END_DELAY);
      } else {
        // Revert to action phase
        setPhase("action");
        setSelectedAction(0);
      }
    }
  });

  const finishBattle = (opts) => {
    // Persist current battle HP back to the party slot (if applicable) before exiting
    if (party && battlePartyIndex >= 0 && battlePartyIndex < party.length) {
      setParty((prev) => {
        const next = Array.isArray(prev) ? [...prev] : [];
        const hpVal = playerHp ?? (resolvedPlayerPokemon.currentHp ?? resolvedPlayerPokemon.hp ?? 0);
        next[battlePartyIndex] = {
          ...next[battlePartyIndex],
          hp: hpVal,
          currentHp: hpVal,
        };
        return next;
      });
    }

    // Call exit after scheduling party update
    setTimeout(() => exitBattle(opts), 0);
  };

  useEffect(() => {
    const numericId = Number(enemy?.number);

    if (Number.isFinite(numericId)) {
      onPokemonSeen?.(numericId);
    }
  }, [enemy, onPokemonSeen]);

  // Enemy move selection must be render-pure; use a deterministic picker.
  // This intentionally avoids Math.random() to keep results stable across re-renders.
  const pickEnemyMove = () => {
    if (!enemy) return buildMove("Tackle", "Normal");
    const moves = Array.isArray(enemy.moves) && enemy.moves.length > 0
      ? enemy.moves
      : [buildMove("Tackle", "Normal")];

    // Deterministic-by-default: always pick the first available move.
    // This avoids render-time impurity warnings and keeps sequencing stable.
    return moves[0];
  };

  // Execute one side's attack and return true if the defender fainted
  const handlePlayerFainted = (opts = {}) => {
    const {
      partySnapshot = party,
      partyIndexSnapshot = battlePartyIndex,
      pokemonNameSnapshot = resolvedPlayerPokemon.name,
    } = opts;

    if (hasUsablePokemon(partySnapshot, partyIndexSnapshot)) {
      const currentPokemonName = pokemonNameSnapshot;
      setMessage(`${currentPokemonName} fainted!`);
      setTimeout(() => {
        setIsForcedSwitch(true);
        setPhase("party-select");
      }, 1000);
    } else {
      setMessage("You have no Pokémon left!");
      setTimeout(() => finishBattle(), BATTLE_END_DELAY);
    }
  };

  const startEnemyOnlyQueue = async (opts = {}) => {
    const {
      introEvents = [],
      playerPokemonSnapshot = resolvedPlayerPokemon,
      enemySnapshot = enemy,
      enemyMoveSnapshot = pickEnemyMove(),
      partyIndexSnapshot = battlePartyIndex,
    } = opts;

    if (!enemySnapshot) return;

    const stateSnapshot = {
      playerPokemon: playerPokemonSnapshot,
      enemy: enemySnapshot,
      weather: weatherSnapshot,
      playerAction: { type: BATTLE_ACTIONS.NONE },
      enemyAction: { type: BATTLE_ACTIONS.MOVE, move: enemyMoveSnapshot },
    };

    const turnSeed = Date.now() ^ (Math.random() * 0x100000000 >>> 0);
    const { events, updatedState } = buildTurnEvents(stateSnapshot, turnSeed);

    // Keep React-side objects aligned for subsequent turns (statuses/PP/currentHp)
    if (updatedState.playerPokemon) {
      setParty((prev) => {
        const next = Array.isArray(prev) ? [...prev] : [];
        next[partyIndexSnapshot] = updatedState.playerPokemon;
        return next;
      });
    }
    if (updatedState.enemy) {
      setEnemy(updatedState.enemy);
    }

    await startQueue([...(introEvents || []), ...events], null);
  };

  const handleAction = (idx) => {
    setSelectedAction(idx);
    const action = ACTIONS[idx];

    if (action === "FIGHT") {
      const hasPP = resolvedPlayerPokemon.moves.some(m => m.currentPP > 0 || m.currentPP === null);
      if (!hasPP) {
        setMessage(`${resolvedPlayerPokemon.name} has no moves left!`);
        setPhase("message");
        setTimeout(() => handleMove(buildMove("Struggle")), 1200);
        return;
      }
      setPhase("fight");
      setMessage("Choose a move!");
      return;
    }

    if (action === "BAG") {
      setPhase("bag");
      setMessage("Choose an item!");
      return;
    }

    if (action === "POKEMON") {
      setPhase("party-select");
      setMessage("Choose a Pokemon!");
      return;
    }

    if (action === "RUN") {
      if (tryRun()) {
        setPhase("message");
        startQueue([
          createTextEvent("Got away safely!"),
          createWaitEvent(RUN_SUCCESS_DELAY),
          createEndBattleEvent("run"),
        ], null);
        return;
      }

      setPhase("message");
      startEnemyOnlyQueue({
        introEvents: [createTextEvent("Couldn't escape!"), createWaitEvent(500)],
      }).then(() => {
        // After enemy-only resolution, the queue completion handler will put us back into action.
      });
      return;
    }
  };

  const handleBallItem = (itemId) => {
    if (!enemy) return;

    const item = ITEMS[itemId];

    if (!item) {
      setMessage("Unknown ball.");
      setTimeout(() => {
        setPhase("action");
        setSelectedAction(0);
      }, 800);
      return;
    }

    if (!hasItem(inventory, itemId)) {
      setMessage(`You have no ${item.name}s left!`);
      setTimeout(() => {
        setPhase("action");
        setSelectedAction(0);
      }, 800);
      return;
    }

    // Consume one
    setInventory((prev) => consumeItem(prev, itemId));

    setPhase("message");

    // Friendly message (queue-driven)
    const throwEvents = [
      createTextEvent(`You threw a ${item.name}!`),
      createWaitEvent(700),
    ];

    // Attempt capture using item metadata
    const success = attemptCapture(enemy, enemyHp, item);

    if (success) {
      const stored = storeCapturedPokemon(enemy, party, pcStorage);
      setParty(stored.party);
      setPcStorage(stored.pcStorage);
      const numericId = Number(enemy.number);

      if (Number.isFinite(numericId)) {
        onPokemonCaught?.(numericId);
      }

      startQueue([
        ...throwEvents,
        createTextEvent(`Gotcha! ${enemy.name} was caught!`),
        createWaitEvent(1200),
        createEndBattleEvent("catch"),
      ], null);
      return;
    }

    // Not caught — enemy retaliates as an engine-owned enemy-only turn
    startEnemyOnlyQueue({
      introEvents: [...throwEvents, createTextEvent("Oh no! The Pokémon broke free!"), createWaitEvent(PLAYER_ATTACK_DELAY)],
    }).then(() => {
      // queue completion handler will return to action
    });
  };

  const handleSwitchPokemon = (newIndex) => {
    const selectedPokemon = party[newIndex];

    if (!selectedPokemon) return;

    if (newIndex === battlePartyIndex) {
      setMessage("This Pokémon is already in battle!");
      setPhase("party-select");
      return;
    }

    if ((selectedPokemon.currentHp ?? selectedPokemon.hp ?? 0) <= 0) {
      setMessage("This Pokémon has fainted!");
      setPhase("party-select");
      return;
    }

    // Valid switch: update both local and global party index
    setBattlePartyIndex(newIndex);
    setActivePartyIndex(newIndex);

    // Update player HP to the new Pokémon's HP (prefer currentHp)
    setPlayerHp(selectedPokemon.currentHp ?? selectedPokemon.hp ?? selectedPokemon.maxHp ?? 0);

    // Show switch message
    setPhase("message");

    // Check if this is a forced switch (due to faint)
    if (isForcedSwitch) {
      // Forced switch: return to action menu without enemy attack
      setIsForcedSwitch(false);
      startQueue([
        createTextEvent(`Go! ${selectedPokemon.name}!`),
        createWaitEvent(1200),
      ], null);
    } else {
      // Manual switch: the enemy attacks (consumes player's turn)
      const startingHpSnapshot = selectedPokemon.currentHp ?? selectedPokemon.hp ?? selectedPokemon.maxHp ?? 0;
      const playerPokemonSnapshot = {
        ...selectedPokemon,
        currentHp: startingHpSnapshot,
      };

      startEnemyOnlyQueue({
        introEvents: [createTextEvent(`Go! ${selectedPokemon.name}!`), createWaitEvent(1200)],
        playerPokemonSnapshot,
        enemySnapshot: enemy,
        partyIndexSnapshot: newIndex,
      }).then(() => {
        // queue completion handler will return to action
      });
    }
  };

  const handleHealingItem = () => {
    setMessage("Healing items are not implemented yet.");

    setTimeout(() => {
      setPhase("action");
      setSelectedAction(0);
    }, 800);
  };

  const handleReviveItem = () => {
    setMessage("Revives are not implemented yet.");

    setTimeout(() => {
      setPhase("action");
      setSelectedAction(0);
    }, 800);
  };

  const handleUseItem = (itemId) => {
    const item = ITEMS[itemId];

    if (!item) {
      setMessage("Unknown item.");
      return;
    }

    switch (item.category) {
      case "ball":
        handleBallItem(itemId);
        return;
      case "healing":
        handleHealingItem(itemId);
        return;
      case "revive":
        handleReviveItem(itemId);
        return;
      default:
        setMessage("This item cannot be used.");
    }
  };

  // ── Victory sequence removed - Engine handles it now ──

  const handleMoveReplacement = (replaceIndex) => {
    if (!pendingMoveData) return;

    if (replaceIndex >= 0) {
      // Actually replace it in the progressionUpdates
      mutateProgressionUpdates((currentProg) => {
        const updated = replaceMove(currentProg.playerPokemon, replaceIndex, pendingMoveData.newMove);
        return { ...currentProg, playerPokemon: updated };
      });
    }
    
    // Resume queue!
    resumeQueue();
  };

  // ── Main move handler — sequential turn resolution ──
  const handleMove = async (idxOrMove) => {
    if (!enemy) return;
    const isIndex = typeof idxOrMove === 'number';
    if (isIndex) setSelectedMove(idxOrMove);
    const playerMove = isIndex ? resolvedPlayerPokemon.moves[idxOrMove] : idxOrMove;
    const enemyMove = pickEnemyMove();

    setPhase("message");

    const stateSnapshot = {
      playerPokemon: resolvedPlayerPokemon,
      enemy,
      weather,
      playerAction: { type: BATTLE_ACTIONS.MOVE, move: playerMove },
      enemyAction: { type: BATTLE_ACTIONS.MOVE, move: enemyMove },
    };

    // 1. Engine creates deterministic queue instantly
    // Generate a determinism seed at the React layer, maintaining true reproducible capabilities
    const turnSeed = Date.now() ^ (Math.random() * 0x100000000 >>> 0);
    const { events, updatedState } = buildTurnEvents(stateSnapshot, turnSeed);
    let finalEvents = [...events];
    let finalProgressionUpdates = null;

    // 2. If won, compute ALL progression instantly too!
    const didWin = events.some(e => e.type === "END_BATTLE" && e.payload?.reason === "win");
    if (didWin) {
      // Remove END_BATTLE event since progression queue will take over the ending sequence
      finalEvents = finalEvents.filter(e => e.type !== "END_BATTLE");
      
      const { progressionQueue, progressionUpdates } = processProgression(
        updatedState.playerPokemon,
        updatedState.enemy
      );
      finalEvents = [...finalEvents, ...progressionQueue, createEndBattleEvent("win")];
      finalProgressionUpdates = progressionUpdates;
    }

    // 3. Update battle-local temporary states immediately (like PP drops)
    if (updatedState.playerPokemon && !didWin) {
      setParty((prev) => {
        const next = Array.isArray(prev) ? [...prev] : [];
        next[battlePartyIndex] = updatedState.playerPokemon;
        return next;
      });
    }
    if (updatedState.enemy) {
      setEnemy(updatedState.enemy);
    }

    // 4. Start Queue via Orchestrator Hook!
    await startQueue(finalEvents, finalProgressionUpdates);
  };

  if (!enemy) {
    return (
      <div className="battle-container">
        <div className="battle-error">{message}</div>
      </div>
    );
  }

  const enemyHpPercent = getHpPercent(enemyHp, enemy.maxHp);
  const enemyHpClass = getHpClass(enemyHpPercent);
  const playerHpPercent = getHpPercent(playerHp, resolvedPlayerPokemon.maxHp);
  const playerHpClass = getHpClass(playerHpPercent);

  const bagItems = Object.entries(ITEMS).filter(
    ([itemId, item]) =>
      item.usableInBattle && getItemCount(inventory, itemId) > 0
  );

  return (
    <div className="battle-container">
      <div className="battle-scene">

        {/* Enemy */}
        <div className="enemy-area">
          <div className="enemy-card">
            <div className="enemy-name">{enemy.name}</div>
            <div className="enemy-level">Lv.{enemy.level}</div>
            <div className="battle-hp-bar">
              <div
                className={`battle-hp-fill ${enemyHpClass}`}
                style={{ width: `${enemyHpPercent}%` }}
              />
            </div>
            <div className="battle-hp-text">
              {enemyHp}/{enemy.maxHp} HP
            </div>
          </div>
          <div className="enemy-sprite">
            <img
              src={enemy.sprite}
              alt={enemy.name}
              className="sprite-enemy"
              onError={(e) => { e.target.src = DEFAULT_ENEMY_SPRITE; }}
            />
          </div>
        </div>

        {/* Player */}
        <div className="player-battle-area">
          <div className="player-battle-sprite">
            <img
              src={resolvedPlayerPokemon.sprite}
              alt={resolvedPlayerPokemon.name}
              className="sprite-player"
              onError={(e) => { e.target.src = DEFAULT_PLAYER_SPRITE; }}
            />
          </div>
          <div className="player-card-battle">
            <div className="enemy-name">{resolvedPlayerPokemon.name}</div>
            <div className="enemy-level">Lv.{resolvedPlayerPokemon.level}</div>
            <div className="battle-hp-bar">
              <div
                className={`battle-hp-fill ${playerHpClass}`}
                style={{ width: `${playerHpPercent}%` }}
              />
            </div>
            <div className="battle-hp-text">
              {playerHp}/{resolvedPlayerPokemon.maxHp} HP
            </div>
          </div>
        </div>

      </div>

      {/* Battle UI or Party Select */}
      {phase === "party-select" ? (
        <PokemonPartyPanel
          playerParty={party}
          activePartyIndex={battlePartyIndex}
          isBattleMode={true}
          currentBattlePokemonIndex={battlePartyIndex}
          forceSelection={isForcedSwitch}
          onSelectPokemon={handleSwitchPokemon}
          onInvalidSelection={(text) => setMessage(text)}
          onCancel={
            isForcedSwitch
              ? null
              : () => {
                  setPhase("action");
                  setSelectedAction(0);
                }
          }
        />
      ) : (
        <div className="battle-ui">
          <div className="battle-message">
            <div className="battle-text">{message}</div>
          </div>

          <div className="battle-actions">
            {phase === "action" &&
              ACTIONS.map((action, i) => (
                <button
                  key={action}
                  className={`battle-btn${selectedAction === i ? " selected" : ""}`}
                  onClick={() => handleAction(i)}
                >
                  {action}
                </button>
              ))}

            {phase === "fight" &&
              resolvedPlayerPokemon.moves.map((move, i) => (
                <button
                  key={`${move.name}-${i}`}
                  className={`battle-btn${selectedMove === i ? " selected" : ""}`}
                  onClick={() => move.currentPP !== 0 && handleMove(i)}
                  disabled={move.currentPP === 0}
                  style={{ display: 'flex', justifyContent: 'space-between' }}
                >
                  <span>{move.name}</span>
                  {move.currentPP !== null && <span>{move.currentPP}/{move.maxPP}</span>}
                </button>
              ))}

            {phase === "bag" && (
              <>
                {bagItems.length === 0 ? (
                  <button className="battle-btn" disabled>
                    No usable items.
                  </button>
                ) : (
                  bagItems.map(([itemId, item]) => (
                    <button
                      key={itemId}
                      className="battle-btn"
                      onClick={() => handleUseItem(itemId)}
                    >
                      {item.icon && (
                        <img
                          src={item.icon}
                          alt={item.name}
                          style={{ width: 24, height: 24, imageRendering: 'pixelated', marginRight: 8 }}
                        />
                      )}
                      {item.name} × {getItemCount(inventory, itemId)}
                    </button>
                  ))
                )}
                <button
                  className="battle-btn"
                  onClick={() => {
                    setPhase("action");
                    setSelectedAction(0);
                  }}
                >
                  Back
                </button>
              </>
            )}

            {queuePaused && pauseReason === "MOVE_LEARN" && pendingMoveData && (
              <div className="move-replacement-modal">
                <div style={{ padding: 8, fontSize: '0.9rem', color: '#ffd800' }}>
                  Select a move to forget, or cancel.
                </div>
                {pendingMoveData.currentMoves.map((m, idx) => (
                  <button
                    key={`${m.name}-${idx}`}
                    className="battle-btn"
                    onClick={() => handleMoveReplacement(idx)}
                    style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}
                  >
                    <span>{m.name}</span>
                    <span>{m.type}</span>
                  </button>
                ))}
                <button
                  className="battle-btn"
                  onClick={() => handleMoveReplacement(-1)}
                  style={{ color: '#ff6b6b' }}
                >
                  Cancel Learning {pendingMoveData.newMove.name}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}