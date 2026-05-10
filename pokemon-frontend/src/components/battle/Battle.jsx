import { useState, useMemo, useEffect } from "react";
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
}) {
  const resolvedPlayerPokemon = useMemo(() => {
    if (!playerPokemon) {
      return PLAYER_POKEMON;
    }

    const fallbackMaxHp =
      playerPokemon.maxHp ??
      playerPokemon.hp ??
      PLAYER_POKEMON.maxHp;

    const fallbackHp =
      playerPokemon.hp ??
      fallbackMaxHp;

    const moves =
      Array.isArray(playerPokemon.moves) && playerPokemon.moves.length > 0
        ? playerPokemon.moves
        : PLAYER_POKEMON.moves;

    return {
      ...PLAYER_POKEMON,
      ...playerPokemon,
      moves,
      maxHp: fallbackMaxHp,
      hp: fallbackHp,
      sprite: playerPokemon.sprite || PLAYER_POKEMON.sprite,
    };
  }, [playerPokemon]);

  const initialWildPokemon = useMemo(
    () => createWildBattle(mapId),
    [mapId]
  );

  // eslint-disable-next-line no-unused-vars -- reserved for future battle effects
  const [enemy, setEnemy] = useState(initialWildPokemon);
  const [enemyHp, setEnemyHp] = useState(
    initialWildPokemon ? initialWildPokemon.hp : 0
  );
  const [playerHp, setPlayerHp] = useState(resolvedPlayerPokemon.hp);
  const [message, setMessage] = useState(
    initialWildPokemon
      ? `A wild ${initialWildPokemon.name} (Lv.${initialWildPokemon.level}) appeared!`
      : "Error loading Pokémon!"
  );
  const [selectedAction, setSelectedAction] = useState(0);
  const [selectedMove, setSelectedMove] = useState(0);
  const [phase, setPhase] = useState("action");

  useEffect(() => {
    const numericId = Number(enemy?.number);

    if (Number.isFinite(numericId)) {
      onPokemonSeen?.(numericId);
    }
  }, [enemy, onPokemonSeen]);

  const enemyAttack = () => {
    if (!enemy) return;
    const result = performEnemyAttack(enemy, playerHp);
    setPlayerHp(result.newHp);
    setMessage(result.message);
    if (result.playerDefeated) {
      setMessage(`${enemy.name} defeated your Pokémon! You blacked out!`);
      setTimeout(() => exitBattle(), BATTLE_END_DELAY);
    }
  };

  const handleAction = (idx) => {
    setSelectedAction(idx);
    const action = ACTIONS[idx];

    if (action === "FIGHT") {
      setPhase("fight");
      setMessage("Choose a move!");
      return;
    }

    if (action === "BAG") {
      setPhase("bag");
      setMessage("Choose an item!");
      return;
    }

    if (action === "RUN") {
      if (tryRun()) {
        setMessage("Got away safely!");
        setTimeout(() => exitBattle(), RUN_SUCCESS_DELAY);
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
      setTimeout(() => exitBattle(), BATTLE_END_DELAY);
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

  const handleMove = (idx) => {
    if (!enemy) return;
    setSelectedMove(idx);
    const move = resolvedPlayerPokemon.moves[idx];
    const result = performPlayerMove({
      move,
      playerPokemon: resolvedPlayerPokemon,
      enemy,
      enemyHp,
    });

    setMessage(result.message);

    if (result.isStatusMove) {
      setTimeout(() => {
        setPhase("action");
        setSelectedAction(0);
        enemyAttack();
      }, STATUS_MOVE_DELAY);
      return;
    }

    setEnemyHp(result.newHp);

    if (result.enemyDefeated) {
      setMessage(`${enemy.name} fainted! You won!`);

      // Award EXP to active Pokémon and update party
      const expReward = calculateExpReward(enemy);

      // Find active index in party (try reference first, then by identity)
      const findActiveIndex = () => {
        if (!party || party.length === 0) return -1;
        let idx = party.indexOf(playerPokemon);
        if (idx !== -1) return idx;
        idx = party.findIndex((p) => {
          if (!p || !playerPokemon) return false;
          if (p.number && playerPokemon.number && p.number === playerPokemon.number) return true;
          if (p.id && playerPokemon.id && p.id === playerPokemon.id) return true;
          if (p.name && playerPokemon.name && p.name === playerPokemon.name) return true;
          return false;
        });
        return idx;
      };

      const activeIdx = findActiveIndex();
      const targetPokemon = (activeIdx !== -1 && party[activeIdx]) ? party[activeIdx] : playerPokemon;

      const resultExp = addExperience(targetPokemon, expReward);

      if (activeIdx !== -1) {
        setParty((prev) => {
          const next = Array.isArray(prev) ? [...prev] : [];
          next[activeIdx] = resultExp.pokemon;
          return next;
        });
      }

      // Show messages in sequence: EXP → Evolution (if any) → Level-up (if no evolution) → Move learning (if any) → Exit
      setTimeout(() => {
        setMessage(`${resultExp.pokemon.name} gained ${resultExp.expGained} EXP!`);

        if (resultExp.evolved) {
          // Evolution sequence
          setTimeout(() => {
            setMessage(`What? ${resultExp.previousName} is evolving!`);
            setTimeout(() => {
              setMessage(`Congratulations! Your ${resultExp.previousName} evolved into ${resultExp.evolvedName}!`);
              setTimeout(() => {
                if (resultExp.pendingMoveLearning) {
                  exitBattle({
                    pendingMoveLearning: {
                      ...resultExp.pendingMoveLearning,
                      pokemon: resultExp.pokemon,
                    },
                  });
                } else {
                  exitBattle();
                }
              }, BATTLE_END_DELAY);
            }, 1200);
          }, 1000);
        } else if (resultExp.leveledUp) {
          // Level-up message (only if not evolving)
          setTimeout(() => {
            setMessage(`${resultExp.pokemon.name} grew to Level ${resultExp.newLevel}!`);
            setTimeout(() => {
              if (resultExp.pendingMoveLearning) {
                exitBattle({
                  pendingMoveLearning: {
                    ...resultExp.pendingMoveLearning,
                    pokemon: resultExp.pokemon,
                  },
                });
              } else {
                exitBattle();
              }
            }, BATTLE_END_DELAY);
          }, 900);
        } else if (resultExp.pendingMoveLearning) {
          // Move learning without level-up
          setTimeout(() => {
            exitBattle({
              pendingMoveLearning: {
                ...resultExp.pendingMoveLearning,
                pokemon: resultExp.pokemon,
              },
            });
          }, BATTLE_END_DELAY);
        } else {
          // Just exit
          setTimeout(() => exitBattle(), BATTLE_END_DELAY);
        }
      }, 800);

      return;
    }

    setTimeout(() => {
      enemyAttack();
      setPhase("action");
      setSelectedAction(0);
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

      {/* Battle UI */}
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
                key={move.name}
                className={`battle-btn${selectedMove === i ? " selected" : ""}`}
                onClick={() => handleMove(i)}
              >
                {move.name}
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
    </div>
  );
}