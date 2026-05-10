import {useMemo, useState } from "react";
import "./PokemonPCPanel.css";

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

  return <span className={`pc-type-badge pc-type-badge--${String(type).toLowerCase()}`}>{String(type).toUpperCase()}</span>;
};

const StatRow = ({ label, value, max = 255 }) => {
  const safeValue = Number.isFinite(value) ? value : 0;
  const width = Math.min(100, Math.max(4, (safeValue / max) * 100));

  return (
    <div className="pc-stat-row">
      <span className="pc-stat-label">{label}</span>
      <div className="pc-stat-bar">
        <div className="pc-stat-fill" style={{ width: `${width}%` }} />
      </div>
      <span className="pc-stat-value">{safeValue}</span>
    </div>
  );
};

const MoveCard = ({ move }) => {
  if (!move) return null;

  return (
    <div className="pc-move-card">
      <div className="pc-move-title">
        <span>{move.name}</span>
        <span className="pc-move-meta-type">{move.type ? String(move.type).toUpperCase() : "MOVE"}</span>
      </div>
      <div className="pc-move-meta">
        <span>{move.category?.toUpperCase() ?? "STATUS"}</span>
        <span>POW {move.power ?? "--"}</span>
        <span>PP {move.pp ?? "--"}</span>
      </div>
    </div>
  );
};

export default function PokemonPCPanel({ pcStorage = [], onClose }) {
  const [selectedIndex, setSelectedIndex] = useState(0);

  const clampedIndex = useMemo(() => {
    return pcStorage.length === 0 ? 0 : Math.min(selectedIndex, pcStorage.length - 1);
  }, [selectedIndex, pcStorage.length]);

  const selectedPokemon = useMemo(
    () => pcStorage[clampedIndex] ?? pcStorage[0] ?? null,
    [pcStorage, clampedIndex]
  );

  const storageCount = pcStorage.length;
  const hpPercent = selectedPokemon
    ? Math.min(100, Math.max(0, (selectedPokemon.hp / Math.max(1, selectedPokemon.maxHp)) * 100))
    : 0;

  const expPercent = selectedPokemon
    ? Math.min(100, Math.max(0, (selectedPokemon.xp ?? 0) / Math.max(1, selectedPokemon.xpToNext ?? 100) * 100))
    : 0;

  const statSource = selectedPokemon?.stats || {};
  const stats = selectedPokemon
    ? [
        { label: "HP", value: selectedPokemon.maxHp ?? statSource.hp },
        { label: "ATK", value: selectedPokemon.attack ?? statSource.attack },
        { label: "DEF", value: selectedPokemon.defense ?? statSource.defense },
        { label: "SP.ATK", value: selectedPokemon.spAttack ?? statSource.spAttack },
        { label: "SP.DEF", value: selectedPokemon.spDefense ?? statSource.spDefense },
        { label: "SPD", value: selectedPokemon.speed ?? statSource.speed },
      ]
    : [];

  const types = selectedPokemon
    ? [selectedPokemon.type1, selectedPokemon.type2, ...(Array.isArray(selectedPokemon.types) ? selectedPokemon.types : [])]
        .filter(Boolean)
        .slice(0, 2)
    : [];

  return (
    <section className="pc-screen" aria-label="Pokemon Storage System">
      <header className="pc-header">
        <span className="pc-indicator" aria-hidden="true" />
        <div className="pc-header-copy">
          <h2>POKEMON STORAGE SYSTEM</h2>
          <p>Manage stored Pokémon</p>
        </div>
        <div className="pc-header-count">{storageCount} Stored</div>
      </header>

      <div className="pc-layout">
        <aside className="pc-list-panel" aria-label="Stored Pokémon list">
          {storageCount === 0 ? (
            <div className="pc-empty-state">
              <p>No Pokémon in storage.</p>
              <p>Captured Pokémon beyond six will be stored here.</p>
            </div>
          ) : (
            <div className="pc-grid">
              {pcStorage.map((pokemon, index) => {
                const isSelected = index === clampedIndex;
                const sprite = pokemon.sprite || DEFAULT_SPRITE;
                const entryHpPercent = Math.min(100, Math.max(0, (pokemon.hp / Math.max(1, pokemon.maxHp)) * 100));

                return (
                  <button
                    key={`${pokemon.id ?? pokemon.name ?? index}-${index}`}
                    type="button"
                    className={`pc-card ${isSelected ? "active" : ""}`.trim()}
                    onClick={() => setSelectedIndex(index)}
                    aria-pressed={isSelected}
                  >
                    <img
                      className="pc-card-sprite"
                      src={sprite}
                      alt={pokemon.name ?? "Pokemon"}
                      onError={(event) => { event.currentTarget.src = DEFAULT_SPRITE; }}
                    />
                    <div className="pc-card-main">
                      <div className="pc-card-top">
                        <span className="pc-card-name">{pokemon.name ?? "Unknown"}</span>
                        <span className="pc-card-level">LV {pokemon.level ?? "--"}</span>
                      </div>
                      <div className="pc-card-dex">No. {formatDexNumber(pokemon.number ?? pokemon.id)}</div>
                      <div className="pc-card-bar">
                        <div className="pc-card-bar-fill" style={{ width: `${entryHpPercent}%` }} />
                      </div>
                      <div className="pc-card-types">
                        {[pokemon.type1, pokemon.type2].filter(Boolean).map((type) => (
                          <TypeBadge key={`${pokemon.name}-${type}`} type={type} />
                        ))}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </aside>

        <section className="pc-details" aria-live="polite">
          {selectedPokemon ? (
            <>
              <div className="pc-hero">
                <img
                  src={selectedPokemon.sprite || DEFAULT_SPRITE}
                  alt={selectedPokemon.name ?? "Pokemon"}
                  onError={(event) => { event.currentTarget.src = DEFAULT_SPRITE; }}
                />
              </div>

              <div className="pc-summary">
                <div>
                  <h3>{selectedPokemon.name ?? "Unknown"}</h3>
                  <p>No. {formatDexNumber(selectedPokemon.number ?? selectedPokemon.id)}</p>
                </div>
                <div className="pc-level-chip">LV {selectedPokemon.level ?? "--"}</div>
              </div>

              <div className="pc-type-row">
                {types.map((type) => (
                  <TypeBadge key={type} type={type} />
                ))}
              </div>

              <div className="pc-bars">
                <div className="pc-bar-row">
                  <span>HP</span>
                  <div className="pc-meter">
                    <div className="pc-meter-fill pc-meter-fill--hp" style={{ width: `${hpPercent}%` }} />
                  </div>
                  <span>{selectedPokemon.hp}/{selectedPokemon.maxHp}</span>
                </div>
                <div className="pc-bar-row">
                  <span>EXP</span>
                  <div className="pc-meter">
                    <div className="pc-meter-fill pc-meter-fill--exp" style={{ width: `${expPercent}%` }} />
                  </div>
                  <span>{Math.round(expPercent)}%</span>
                </div>
              </div>

              <div className="pc-stats">
                {stats.map((stat) => (
                  <StatRow key={stat.label} label={stat.label} value={stat.value} />
                ))}
              </div>

              <div className="pc-moves">
                <h4>Moves</h4>
                <div className="pc-move-grid">
                  {(selectedPokemon.moves || []).slice(0, 4).map((move) => (
                    <MoveCard key={move.name} move={move} />
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="pc-empty-state pc-empty-state--detail">
              <p>No Pokémon in storage.</p>
              <p>Captured Pokémon beyond six will be stored here.</p>
            </div>
          )}
        </section>
      </div>

      <footer className="pc-footer">
        <span>Stored Pokémon: {storageCount}</span>
        <span>Selected: {selectedPokemon?.name ?? "None"}</span>
        <button className="pc-close-button" type="button" onClick={onClose}>CLOSE</button>
      </footer>
    </section>
  );
}
