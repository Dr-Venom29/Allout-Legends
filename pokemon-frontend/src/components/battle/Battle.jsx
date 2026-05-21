import { useState, useMemo, useEffect, useRef } from "react";
import "./Battle.css";

import {
  ACTIONS,
  STATUS_MOVE_DELAY,
  PLAYER_ATTACK_DELAY,
  RUN_SUCCESS_DELAY,
  BATTLE_END_DELAY,
} from "./battleConstants";

import {
  getHpPercent,
  getHpClass,
} from "./battleUtils";

import {
  createWildBattle,
  tryRun,
  performEnemyAttack,
  performPlayerMove,
} from "./battleLogic";
import { determineTurnOrder } from "./battleTurnOrder";
import { buildMove } from "../../data/pokemon/moveData";
import { canAct, applyEndOfTurnStatus } from "../game/statusConditions";
import { calculateExpReward, addExperience } from "../game/experience";
import {
  attemptCapture,
  storeCapturedPokemon,
} from "./captureLogic";
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

  // eslint-disable-next-line no-unused-vars -- reserved for future battle effects
  const [enemy, setEnemy] = useState(initialWildPokemon);
  const [enemyHp, setEnemyHp] = useState(
    initialWildPokemon ? (initialWildPokemon.currentHp ?? initialWildPokemon.hp) : 0
  );
  const [playerHp, setPlayerHp] = useState(resolvedPlayerPokemon.currentHp ?? resolvedPlayerPokemon.hp);
  const playerHpRef = useRef(playerHp);
  const enemyHpRef = useRef(enemyHp);
  const [message, setMessage] = useState(
    initialWildPokemon
      ? `A wild ${initialWildPokemon.name} (Lv.${initialWildPokemon.level}) appeared!`
      : "Error loading Pokémon!"
  );
  const [selectedAction, setSelectedAction] = useState(0);
  const [selectedMove, setSelectedMove] = useState(0);
  const [phase, setPhase] = useState("action");
  const [isForcedSwitch, setIsForcedSwitch] = useState(false);

  const finishBattle = (opts) => {
    // Persist current battle HP back to the party slot (if applicable) before exiting
    if (party && battlePartyIndex >= 0 && battlePartyIndex < party.length) {
      setParty((prev) => {
        const next = Array.isArray(prev) ? [...prev] : [];
        const hpVal = playerHpRef.current ?? (resolvedPlayerPokemon.currentHp ?? resolvedPlayerPokemon.hp ?? 0);
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

  useEffect(() => {
    playerHpRef.current = playerHp;
  }, [playerHp]);

  useEffect(() => {
    enemyHpRef.current = enemyHp;
  }, [enemyHp]);

  // Pick a random move for the enemy (used before turn resolution)
  const pickEnemyMove = () => {
    if (!enemy) return buildMove("Tackle", "Normal");
    const moves = Array.isArray(enemy.moves) && enemy.moves.length > 0
      ? enemy.moves
      : [buildMove("Tackle", "Normal")];
    return moves[Math.floor(Math.random() * moves.length)];
  };

  // Execute one side's attack and return true if the defender fainted
  const executeAttack = (attacker, move, isPlayerAttacking, currentEnemyHp, currentPlayerHp) => {
    if (isPlayerAttacking) {
      const result = performPlayerMove({
        move,
        playerPokemon: resolvedPlayerPokemon,
        enemy,
        enemyHp: currentEnemyHp,
      });
      return { ...result, side: "player" };
    } else {
      const result = performEnemyAttack(enemy, currentPlayerHp, resolvedPlayerPokemon);
      return { ...result, side: "enemy" };
    }
  };

  // Handle player fainted
  const handlePlayerFainted = () => {
    if (hasUsablePokemon(party, battlePartyIndex)) {
      const currentPokemonName = resolvedPlayerPokemon.name;
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

  // Legacy wrapper — still used by RUN fail, BAG fail, and SWITCH
  const enemyAttack = () => {
    if (!enemy) return;
    const result = performEnemyAttack(enemy, playerHpRef.current, resolvedPlayerPokemon);
    setPlayerHp(result.newHp);
    setMessage(result.message);
    if (result.playerAfterStatus) {
      setParty((prev) => {
        const next = Array.isArray(prev) ? [...prev] : [];
        next[battlePartyIndex] = result.playerAfterStatus;
        return next;
      });
    }
    if (result.playerDefeated) {
      handlePlayerFainted();
    }
  };

  const processEndOfTurnStatuses = () => {
    // Apply end-of-turn statuses to player and enemy
    // Player
    const partyPokemon = party && party[battlePartyIndex];
    if (partyPokemon) {
      const currentHp = playerHpRef.current;
      const current = { ...partyPokemon, hp: currentHp, currentHp: currentHp };
      const playerEOT = applyEndOfTurnStatus(current);
      if (playerEOT.damage > 0) {
        setMessage((prev) => playerEOT.message || prev);
      }
      if (playerEOT.pokemon) {
        setParty((prev) => {
          const next = Array.isArray(prev) ? [...prev] : [];
          // Ensure we persist both hp and currentHp from the battle state
          next[battlePartyIndex] = {
            ...playerEOT.pokemon,
            hp: playerEOT.pokemon.hp ?? playerEOT.pokemon.currentHp ?? currentHp,
            currentHp: playerEOT.pokemon.currentHp ?? playerEOT.pokemon.hp ?? currentHp,
          };
          return next;
        });
        setPlayerHp(playerEOT.pokemon.currentHp ?? playerEOT.pokemon.hp ?? 0);
      }
      if (playerEOT.fainted) {
        if (hasUsablePokemon(party, battlePartyIndex)) {
          setTimeout(() => {
            setIsForcedSwitch(true);
            setPhase("party-select");
          }, 800);
        } else {
          setMessage("You have no Pokémon left!");
            setTimeout(() => finishBattle(), BATTLE_END_DELAY);
        }
      }
    }

    // Enemy
    if (enemy) {
      const currentEnemy = { ...enemy, hp: enemyHpRef.current, currentHp: enemyHpRef.current };
      const enemyEOT = applyEndOfTurnStatus(currentEnemy);
      if (enemyEOT.damage > 0) {
        setMessage((prev) => enemyEOT.message || prev);
      }
      if (enemyEOT.pokemon) {
        setEnemy(enemyEOT.pokemon);
        setEnemyHp(enemyEOT.pokemon.currentHp ?? enemyEOT.pokemon.hp ?? 0);
      }
      if (enemyEOT.fainted) {
        setMessage(`${enemy.name} fainted! You won!`);
        const expReward = calculateExpReward(enemy);
        const targetPokemon = (party && battlePartyIndex >= 0 && battlePartyIndex < party.length)
          ? party[battlePartyIndex]
          : playerPokemon;
        if (targetPokemon) {
          const resultExp = addExperience(targetPokemon, expReward);
          if (battlePartyIndex >= 0 && battlePartyIndex < party.length) {
            setParty((prev) => {
              const next = Array.isArray(prev) ? [...prev] : [];
              next[battlePartyIndex] = resultExp.pokemon;
              return next;
            });
          }
        }
          setTimeout(() => finishBattle(), BATTLE_END_DELAY);
      }
    }
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
        setMessage("Got away safely!");
        setTimeout(() => finishBattle(), RUN_SUCCESS_DELAY);
      } else {
        setMessage("Couldn't escape!");
        setPhase("action");
        enemyAttack();
      }
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

    // Friendly message
    setMessage(`You threw a ${item.name}!`);

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

      setMessage(`Gotcha! ${enemy.name} was caught!`);
      setTimeout(() => finishBattle(), BATTLE_END_DELAY);
      return;
    }

    // Not caught — enemy may attack
    setTimeout(() => {
      setMessage("Oh no! The Pokémon broke free!");
      enemyAttack();
      setPhase("action");
      setSelectedAction(0);
    }, PLAYER_ATTACK_DELAY);
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
    setMessage(`Go! ${selectedPokemon.name}!`);

    // Check if this is a forced switch (due to faint)
    if (isForcedSwitch) {
      // Forced switch: return to action menu without enemy attack
      setIsForcedSwitch(false);
      setTimeout(() => {
        setPhase("action");
        setSelectedAction(0);
      }, 1500);
    } else {
      // Manual switch: the enemy attacks (consumes player's turn)
      setTimeout(() => {
        setPhase("action");
        setSelectedAction(0);
        enemyAttack();
      }, 1500);
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

  // ── Victory sequence (EXP / evolution / move learning) ──
  const handleVictory = () => {
    setMessage(`${enemy.name} fainted! You won!`);

    const expReward = calculateExpReward(enemy);
    const targetPokemon = (party && battlePartyIndex >= 0 && battlePartyIndex < party.length)
      ? party[battlePartyIndex]
      : playerPokemon;

    if (!targetPokemon) {
      setTimeout(() => finishBattle(), BATTLE_END_DELAY);
      return;
    }

    const resultExp = addExperience(targetPokemon, expReward);

    if (battlePartyIndex >= 0 && battlePartyIndex < party.length) {
      setParty((prev) => {
        const next = Array.isArray(prev) ? [...prev] : [];
        next[battlePartyIndex] = resultExp.pokemon;
        return next;
      });
    }

    setTimeout(() => {
      setMessage(`${resultExp.pokemon.name} gained ${resultExp.expGained} EXP!`);

      if (resultExp.evolved) {
        setTimeout(() => {
          setMessage(`What? ${resultExp.previousName} is evolving!`);
          setTimeout(() => {
            setMessage(`Congratulations! Your ${resultExp.previousName} evolved into ${resultExp.evolvedName}!`);
            setTimeout(() => {
              if (resultExp.pendingMoveLearning) {
                finishBattle({ pendingMoveLearning: { ...resultExp.pendingMoveLearning, pokemon: resultExp.pokemon } });
              } else {
                finishBattle();
              }
            }, BATTLE_END_DELAY);
          }, 1200);
        }, 1000);
      } else if (resultExp.leveledUp) {
        setTimeout(() => {
          setMessage(`${resultExp.pokemon.name} grew to Level ${resultExp.newLevel}!`);
          setTimeout(() => {
            if (resultExp.pendingMoveLearning) {
              finishBattle({ pendingMoveLearning: { ...resultExp.pendingMoveLearning, pokemon: resultExp.pokemon } });
            } else {
              finishBattle();
            }
          }, BATTLE_END_DELAY);
        }, 900);
      } else if (resultExp.pendingMoveLearning) {
        setTimeout(() => {
          finishBattle({ pendingMoveLearning: { ...resultExp.pendingMoveLearning, pokemon: resultExp.pokemon } });
        }, BATTLE_END_DELAY);
      } else {
        setTimeout(() => finishBattle(), BATTLE_END_DELAY);
      }
    }, 800);
  };

  // ── Main move handler — sequential turn resolution ──
  const handleMove = (idxOrMove) => {
    if (!enemy) return;
    const isIndex = typeof idxOrMove === 'number';
    if (isIndex) setSelectedMove(idxOrMove);
    const playerMove = isIndex ? resolvedPlayerPokemon.moves[idxOrMove] : idxOrMove;
    const enemyMove = pickEnemyMove();

    // Determine turn order based on priority → speed → coin-flip
    const turnOrder = determineTurnOrder(
      resolvedPlayerPokemon,
      enemy,
      playerMove,
      enemyMove
    );

    // Lock out further input
    setPhase("message");

    // ── Execute first actor ──
    const executeFirstTurn = () => {
      if (turnOrder.first === "player") {
        return executePlayerTurn(playerMove, enemyMove);
      } else {
        return executeEnemyTurn(enemyMove, playerMove);
      }
    };

    // ── Player turn execution ──
    const executePlayerTurn = (pMove, eMove) => {
      // Check if player can act
      const actCheck = canAct(resolvedPlayerPokemon);
      if (!actCheck.canAct) {
        setParty((prev) => {
          const next = Array.isArray(prev) ? [...prev] : [];
          next[battlePartyIndex] = actCheck.pokemon;
          return next;
        });
        setMessage(actCheck.message || "");
        return { playerActed: false, playerSkipped: true };
      }

      if (actCheck.pokemon && actCheck.pokemon !== resolvedPlayerPokemon) {
        setParty((prev) => {
          const next = Array.isArray(prev) ? [...prev] : [];
          next[battlePartyIndex] = actCheck.pokemon;
          return next;
        });
      }

      const result = performPlayerMove({
        move: pMove,
        playerPokemon: actCheck.pokemon || resolvedPlayerPokemon,
        enemy,
        enemyHp: enemyHpRef.current,
      });

      // Update party with PP deduction from attackerAfterMove
      if (result.attackerAfterMove) {
        setParty((prev) => {
          const next = Array.isArray(prev) ? [...prev] : [];
          next[battlePartyIndex] = result.attackerAfterMove;
          return next;
        });
      }

      setMessage(result.message);
      if (result.enemyAfterStatus) setEnemy(result.enemyAfterStatus);

      if (!result.isStatusMove) {
        setEnemyHp(result.newHp);
        enemyHpRef.current = result.newHp;
      }

      return {
        playerActed: true,
        playerSkipped: false,
        enemyFainted: result.enemyDefeated || false,
      };
    };

    // ── Enemy turn execution ──
    const executeEnemyTurn = (eMove) => {
      if (!enemy) return { enemyActed: false };

      // Check if enemy can act
      const actCheck = canAct(enemy);
      if (!actCheck.canAct) {
        if (actCheck.pokemon) setEnemy(actCheck.pokemon);
        setMessage(actCheck.message || "");
        return { enemyActed: false, enemySkipped: true };
      }
      if (actCheck.pokemon && actCheck.pokemon !== enemy) {
        setEnemy(actCheck.pokemon);
      }

      const result = performEnemyAttack(enemy, playerHpRef.current, resolvedPlayerPokemon);
      setPlayerHp(result.newHp);
      playerHpRef.current = result.newHp;
      setMessage(result.message);

      if (result.playerAfterStatus) {
        setParty((prev) => {
          const next = Array.isArray(prev) ? [...prev] : [];
          next[battlePartyIndex] = result.playerAfterStatus;
          return next;
        });
      }

      return {
        enemyActed: true,
        enemySkipped: false,
        playerFainted: result.playerDefeated || false,
      };
    };

    // ── Sequenced turn resolution ──
    const firstResult = executeFirstTurn();

    // Check if first actor KO'd defender
    if (turnOrder.first === "player" && firstResult.enemyFainted) {
      handleVictory();
      return;
    }
    if (turnOrder.first === "enemy" && firstResult.playerFainted) {
      handlePlayerFainted();
      return;
    }

    // ── Execute second actor after delay ──
    setTimeout(() => {
      let secondResult;
      if (turnOrder.second === "player") {
        secondResult = executePlayerTurn(playerMove, enemyMove);
      } else {
        secondResult = executeEnemyTurn(enemyMove);
      }

      // Check if second actor KO'd defender
      if (turnOrder.second === "player" && secondResult.enemyFainted) {
        handleVictory();
        return;
      }
      if (turnOrder.second === "enemy" && secondResult.playerFainted) {
        handlePlayerFainted();
        return;
      }

      // ── End-of-turn statuses ──
      setTimeout(() => {
        processEndOfTurnStatuses();
        setPhase("action");
        setSelectedAction(0);
      }, 300);
    }, PLAYER_ATTACK_DELAY);
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
          </div>
        </div>
      )}
    </div>
  );
}