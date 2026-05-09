import { useState, useMemo } from "react";

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
import {
  attemptCapture,
  storeCapturedPokemon,
} from "./captureLogic";

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

const DEFAULT_ENEMY_SPRITE =
  "/assets/pokemons/000.png";

const DEFAULT_PLAYER_SPRITE =
  "/assets/pokemons/025.png";

export default function Battle({
  exitBattle,
  mapId = "map1",
  inventory,
  setInventory,
  party,
  setParty,
  pcStorage,
  setPcStorage,
}) {
  const initialWildPokemon = useMemo(
    () => createWildBattle(mapId),
    [mapId]
  );

  // eslint-disable-next-line no-unused-vars -- reserved for future battle effects
  const [enemy, setEnemy] = useState(
    initialWildPokemon
  );
  const [enemyHp, setEnemyHp] = useState(
    initialWildPokemon ? initialWildPokemon.hp : 0
  );

  const [playerHp, setPlayerHp] = useState(
    PLAYER_POKEMON.hp
  );

  const [message, setMessage] = useState(
    initialWildPokemon
      ? `A wild ${initialWildPokemon.name} (Lv.${initialWildPokemon.level}) appeared!`
      : "Error loading Pokémon!"
  );

  const [selectedAction, setSelectedAction] =
    useState(0);

  const [selectedMove, setSelectedMove] =
    useState(0);

  const [phase, setPhase] = useState("action");

  const enemyAttack = () => {
    if (!enemy) return;

    const result = performEnemyAttack(
      enemy,
      playerHp
    );

    setPlayerHp(result.newHp);
    setMessage(result.message);

    if (result.playerDefeated) {
      setMessage(
        `${enemy.name} defeated your Pokémon! You blacked out!`
      );

      setTimeout(() => {
        exitBattle();
      }, BATTLE_END_DELAY);
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

        setTimeout(() => {
          exitBattle();
        }, RUN_SUCCESS_DELAY);
      } else {
        setMessage("Couldn't escape!");
        setPhase("action");
        enemyAttack();
      }
    }
  };

  const handleUsePokeball = () => {
    if (!enemy) return;

    const currentCount = inventory?.pokeball ?? 0;

    if (currentCount <= 0) {
      setMessage("You have no Poké Balls left!");
      setTimeout(() => {
        setPhase("action");
        setSelectedAction(0);
      }, 800);
      return;
    }

    setInventory((prev) => ({
      ...prev,
      pokeball: Math.max(
        0,
        (prev?.pokeball ?? 0) - 1
      ),
    }));

    const success = attemptCapture(
      enemy,
      enemyHp
    );

    if (success) {
      const stored = storeCapturedPokemon(
        enemy,
        party,
        pcStorage
      );

      setParty(stored.party);
      setPcStorage(stored.pcStorage);

      setMessage(
        `Gotcha! ${enemy.name} was caught!`
      );

      setTimeout(() => {
        exitBattle();
      }, BATTLE_END_DELAY);

      return;
    }

    setMessage("Oh no! The Pokémon broke free!");

    setTimeout(() => {
      enemyAttack();
      setPhase("action");
      setSelectedAction(0);
    }, PLAYER_ATTACK_DELAY);
  };

  const handleMove = (idx) => {
    if (!enemy) return;

    setSelectedMove(idx);

    const move = PLAYER_POKEMON.moves[idx];

    const result = performPlayerMove({
      move,
      playerPokemon: PLAYER_POKEMON,
      enemy,
      enemyHp,
    });

    setMessage(result.message);

    // Status move
    if (result.isStatusMove) {
      setTimeout(() => {
        setPhase("action");
        setSelectedAction(0);
        enemyAttack();
      }, STATUS_MOVE_DELAY);

      return;
    }

    // Damage move
    setEnemyHp(result.newHp);

    if (result.enemyDefeated) {
      setMessage(
        `${enemy.name} fainted! You won!`
      );

      setTimeout(() => {
        exitBattle();
      }, BATTLE_END_DELAY);

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
        <div
          style={{
            textAlign: "center",
            padding: "200px",
          }}
        >
          {message}
        </div>
      </div>
    );
  }

  const enemyHpPercent = getHpPercent(
    enemyHp,
    enemy.maxHp
  );

  const enemyHpClass =
    getHpClass(enemyHpPercent);

  const playerHpPercent = getHpPercent(
    playerHp,
    PLAYER_POKEMON.maxHp
  );

  return (
    <div className="battle-container">
      <div className="battle-scene">
        {/* Enemy */}
        <div className="enemy-area">
          <div className="enemy-card">
            <div className="enemy-name">
              {enemy.name}
            </div>

            <div className="enemy-level">
              Lv.{enemy.level}
            </div>

            <div className="battle-hp-bar">
              <div
                className={`battle-hp-fill ${enemyHpClass}`}
                style={{
                  width: `${enemyHpPercent}%`,
                }}
              />
            </div>

            <div
              style={{
                fontSize: "5px",
                color: "#555",
                marginTop: "3px",
                fontFamily: "inherit",
              }}
            >
              {enemyHp}/{enemy.maxHp} HP
            </div>
          </div>

          <div className="enemy-sprite">
            <img
              src={enemy.sprite}
              alt={enemy.name}
              style={{
                width: "80px",
                height: "80px",
                imageRendering: "pixelated",
              }}
              onError={(e) => {
                e.target.src =
                  DEFAULT_ENEMY_SPRITE;
              }}
            />
          </div>
        </div>

        {/* Player */}
        <div className="player-battle-area">
          <div className="player-battle-sprite">
            <img
              src={PLAYER_POKEMON.sprite}
              alt={PLAYER_POKEMON.name}
              style={{
                width: "64px",
                height: "64px",
                imageRendering: "pixelated",
              }}
              onError={(e) => {
                e.target.src =
                  DEFAULT_PLAYER_SPRITE;
              }}
            />
          </div>

          <div className="player-card-battle">
            <div className="enemy-name">
              {PLAYER_POKEMON.name}
            </div>

            <div className="enemy-level">
              Lv.{PLAYER_POKEMON.level}
            </div>

            <div className="battle-hp-bar">
              <div
                className="battle-hp-fill"
                style={{
                  width: `${playerHpPercent}%`,
                }}
              />
            </div>

            <div
              style={{
                fontSize: "5px",
                color: "#555",
                marginTop: "3px",
                fontFamily: "inherit",
              }}
            >
              {playerHp}/
              {PLAYER_POKEMON.maxHp} HP
            </div>
          </div>
        </div>
      </div>

      {/* Battle UI */}
      <div className="battle-ui">
        <div className="battle-message">
          <div className="battle-text">
            {message}
          </div>
        </div>

        <div className="battle-actions">
          {phase === "action" &&
            ACTIONS.map((action, i) => (
              <button
                key={action}
                className={`battle-btn ${
                  selectedAction === i
                    ? "selected"
                    : ""
                }`}
                onClick={() => handleAction(i)}
              >
                {action}
              </button>
            ))}

          {phase === "fight" &&
            PLAYER_POKEMON.moves.map((move, i) => (
              <button
                key={move.name}
                className={`battle-btn ${
                  selectedMove === i
                    ? "selected"
                    : ""
                }`}
                onClick={() => handleMove(i)}
              >
                {move.name}
              </button>
            ))}

          {phase === "bag" && (
            <button
              className="battle-btn selected"
              onClick={handleUsePokeball}
            >
              Poké Ball × {inventory?.pokeball ?? 0}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}