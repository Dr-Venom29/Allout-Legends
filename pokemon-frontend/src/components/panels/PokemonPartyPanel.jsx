import { useMemo } from "react";
import "./PokemonPartyPanel.css";

const DEFAULT_SPRITE = "/assets/pokemons/000.png";

const formatDexNumber = (value) => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return "???";
  }
  return String(numeric).padStart(3, "0");
};

const TypeBadge = ({ type }) => {
  if (!type) return null;
  return (
    <span className={`party-type party-type--${type.toLowerCase()}`}>
      {type.toUpperCase()}
    </span>
  );
};

const StatRow = ({ label, value, max = 200 }) => {
  const safeValue = Number.isFinite(value) ? value : 0;
  const width = Math.min(100, Math.max(4, (safeValue / max) * 100));

  return (
    <div className="party-stat-row">
      <span className="party-stat-label">{label}</span>
      <div className="party-stat-bar">
        <div className="party-stat-fill" style={{ width: `${width}%` }} />
      </div>
      <span className="party-stat-value">{safeValue}</span>
    </div>
  );
};

const MoveCard = ({ move }) => {
  if (!move) return null;

  return (
    <div className="party-move-card">
      <div className="party-move-title">
        <span>{move.name}</span>
        {move.type && <TypeBadge type={move.type} />}
      </div>
      <div className="party-move-meta">
        <span>{move.category?.toUpperCase() ?? "MOVE"}</span>
        <span>POW {move.power ?? "--"}</span>
      </div>
    </div>
  );
};

export default function PokemonPartyPanel({
  playerParty = [],
  activePartyIndex = 0,
  setActivePartyIndex,
  onOpenPC,
  isBattleMode = false,
  onSelectPokemon = null,
  onCancel = null,
  onInvalidSelection = null,
  currentBattlePokemonIndex = 0,
  forceSelection = false,
}) {
  const selectedPokemon = useMemo(() =>
    playerParty[activePartyIndex] ?? playerParty[0] ?? null,
  [playerParty, activePartyIndex]);

  const partyCount = playerParty.length;

  if (!partyCount) {
    return (
      <section className="party-screen" aria-label="Pokemon Party">
        <header className="party-header">
          <span className="party-indicator" aria-hidden="true" />
          <div>
            <h2>POKEMON PARTY</h2>
            <p>Select your battle leader</p>
          </div>
        </header>
        <div className="party-empty">
          <p>No Pokemon in your party.</p>
          <p>Catch wild Pokemon to build your team.</p>
        </div>
      </section>
    );
  }

  const hpPercent = selectedPokemon
    ? Math.min(100, Math.max(0, (selectedPokemon.hp / Math.max(1, selectedPokemon.maxHp)) * 100))
    : 0;

  const expValue = selectedPokemon?.exp ?? 0;
  const expNext = selectedPokemon?.nextLevelExp ?? 100;
  const expPercent = expNext > 0 ? Math.min(100, Math.max(0, (expValue / expNext) * 100)) : 100;

  const stats = selectedPokemon
    ? [
        { label: "HP", value: selectedPokemon.maxHp },
        { label: "ATK", value: selectedPokemon.attack },
        { label: "DEF", value: selectedPokemon.defense },
        { label: "SP.ATK", value: selectedPokemon.spAttack },
        { label: "SP.DEF", value: selectedPokemon.spDefense },
        { label: "SPD", value: selectedPokemon.speed },
      ]
    : [];

  return (
    <section className="party-screen" aria-label="Pokemon Party">
      <header className="party-header">
        <span className="party-indicator" aria-hidden="true" />
        <div>
          <h2>{isBattleMode ? "SWITCH POKEMON" : "POKEMON PARTY"}</h2>
          <p>
            {forceSelection
              ? "Choose a Pokémon to continue the battle"
              : isBattleMode
                ? "Choose a Pokemon to switch in"
                : "Select your battle leader"}
          </p>
        </div>
      </header>

      <div className="party-layout">
        <aside className="party-list" aria-label="Party list">
          {playerParty.map((pokemon, index) => {
            const isActive = index === activePartyIndex;
            const isCurrentBattler = isBattleMode && index === currentBattlePokemonIndex;
            const isFainted = (pokemon.currentHp ?? pokemon.hp ?? 0) <= 0;
            const isUnavailable = isBattleMode && (isCurrentBattler || isFainted);
            const entryHpPercent = Math.min(
              100,
              Math.max(0, (pokemon.hp / Math.max(1, pokemon.maxHp)) * 100)
            );

            return (
              <button
                key={`${pokemon.name}-${index}`}
                type="button"
                className={`party-card ${isActive ? "active" : ""}${isCurrentBattler ? " in-battle" : ""}${isFainted ? " fainted" : ""}`.trim()}
                onClick={() => {
                  if (isBattleMode) {
                    if (isCurrentBattler) {
                      onInvalidSelection?.("This Pokémon is already in battle!");
                      return;
                    }
                    if (isFainted) {
                      onInvalidSelection?.("This Pokémon has fainted!");
                      return;
                    }
                    onSelectPokemon?.(index);
                  } else {
                    setActivePartyIndex?.(index);
                  }
                }}
                aria-pressed={isActive}
                aria-disabled={isUnavailable}
              >
                <span className="party-ball" aria-hidden="true" />
                <img
                  className="party-sprite"
                  src={pokemon.sprite || DEFAULT_SPRITE}
                  alt={pokemon.name}
                  onError={(event) => { event.currentTarget.src = DEFAULT_SPRITE; }}
                />
                <div className="party-card-main">
                  <div className="party-card-row">
                    <span className="party-card-name">{pokemon.name}</span>
                    <span className="party-card-level">LV {pokemon.level}</span>
                  </div>
                  <div className="party-card-row">
                    <div className="party-hp-bar">
                      <div className="party-hp-fill" style={{ width: `${entryHpPercent}%` }} />
                    </div>
                    <span className="party-hp-text">
                      {pokemon.hp}/{pokemon.maxHp}
                    </span>
                  </div>
                  <div className="party-card-row party-card-types">
                    <TypeBadge type={pokemon.type1} />
                    <TypeBadge type={pokemon.type2} />
                  </div>
                </div>
                {isActive && <span className="party-active-badge">ACTIVE</span>}
                {isCurrentBattler && <span className="party-battle-badge">IN BATTLE</span>}
                {isFainted && <span className="party-fainted-badge">FAINTED</span>}
              </button>
            );
          })}
        </aside>

        <div className="party-details" aria-live="polite">
          <div className="party-hero">
            <img
              src={selectedPokemon?.sprite || DEFAULT_SPRITE}
              alt={selectedPokemon?.name ?? "Pokemon"}
              onError={(event) => { event.currentTarget.src = DEFAULT_SPRITE; }}
            />
          </div>
          <div className="party-summary">
            <div>
              <h3>{selectedPokemon?.name ?? "Unknown"}</h3>
              <p>No. {formatDexNumber(selectedPokemon?.number ?? selectedPokemon?.id)}</p>
            </div>
            <div className="party-level-chip">
              LV {selectedPokemon?.level ?? "--"}
            </div>
          </div>

          <div className="party-type-row">
            <TypeBadge type={selectedPokemon?.type1} />
            <TypeBadge type={selectedPokemon?.type2} />
          </div>

          <div className="party-bars">
            <div className="party-bar-row">
              <span>HP</span>
              <div className="party-meter">
                <div className="party-meter-fill party-meter-fill--hp" style={{ width: `${hpPercent}%` }} />
              </div>
              <span>
                {selectedPokemon?.hp}/{selectedPokemon?.maxHp}
              </span>
            </div>
            <div className="party-bar-row">
              <span>EXP</span>
              <div className="party-meter">
                <div className="party-meter-fill party-meter-fill--exp" style={{ width: `${expPercent}%` }} />
              </div>
              <span>{expValue} / {expNext}</span>
            </div>
          </div>

          <div className="party-stats">
            {stats.map((stat) => (
              <StatRow key={stat.label} label={stat.label} value={stat.value} />
            ))}
          </div>

          <div className="party-moves">
            <h4>Moves</h4>
            <div className="party-move-grid">
              {(selectedPokemon?.moves || []).slice(0, 4).map((move) => (
                <MoveCard key={move.name} move={move} />
              ))}
            </div>
          </div>
        </div>
      </div>

      <footer className="party-footer">
        <span>{partyCount} / 6 Pokemon</span>
        <span>Leader: {selectedPokemon?.name ?? "None"}</span>
        {isBattleMode ? (
          !forceSelection && (
            <button
              className="party-open-pc-button"
              onClick={() => onCancel?.()}
              type="button"
            >
              CANCEL
            </button>
          )
        ) : (
          <button
            className="party-open-pc-button"
            onClick={onOpenPC}
            type="button"
          >
            OPEN PC
          </button>
        )}
      </footer>
    </section>
  );
}
