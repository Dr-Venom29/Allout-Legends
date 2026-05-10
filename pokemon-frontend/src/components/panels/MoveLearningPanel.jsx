import { useState } from "react";
import "./MoveLearningPanel.css";

const DEFAULT_SPRITE = "/assets/pokemons/000.png";

const TypeBadge = ({ type }) => {
  if (!type) return null;
  return (
    <span className={`move-type-badge move-type-badge--${type.toLowerCase()}`}>
      {type.toUpperCase()}
    </span>
  );
};

export default function MoveLearningPanel({
  pokemon,
  newMove,
  onReplaceMove,
  onCancel,
}) {
  const [selectedMoveIndex, setSelectedMoveIndex] = useState(null);

  if (!pokemon || !newMove) {
    return null;
  }

  const handleReplaceMove = (index) => {
    if (selectedMoveIndex === index) {
      onReplaceMove(index);
    } else {
      setSelectedMoveIndex(index);
    }
  };

  return (
    <div className="move-learning-overlay">
      <section className="move-learning-panel" aria-label="Learn New Move">
        <header className="move-learning-header">
          <span className="move-ball-icon" aria-hidden="true" />
          <div>
            <h2>LEARN NEW MOVE</h2>
            <p>Choose a move to forget</p>
          </div>
        </header>

        <div className="move-learning-content">
          {/* Left side: current moves */}
          <aside className="move-learning-current">
            <h3>Current Moves</h3>
            <div className="move-learning-list">
              {pokemon.moves && pokemon.moves.length > 0 ? (
                pokemon.moves.map((move, idx) => {
                  const isSelected = selectedMoveIndex === idx;
                  const isConfirmed = isSelected;

                  return (
                    <button
                      key={`move-${idx}-${move.name}`}
                      className={`move-learning-card ${isConfirmed ? "confirmed" : ""} ${isSelected ? "selected" : ""}`}
                      onClick={() => handleReplaceMove(idx)}
                      type="button"
                    >
                      <div className="move-learning-card-title">
                        <span>{move.name}</span>
                        <TypeBadge type={move.type} />
                      </div>
                      <div className="move-learning-card-meta">
                        <span>{move.category?.toUpperCase() ?? "MOVE"}</span>
                        <span>POW {move.power ?? "--"}</span>
                      </div>
                      {isConfirmed && (
                        <div className="move-learning-confirm">
                          <span className="move-learning-checkmark">✓</span>
                        </div>
                      )}
                    </button>
                  );
                })
              ) : (
                <div className="move-learning-empty">
                  <p>No moves learned yet.</p>
                </div>
              )}
            </div>
          </aside>

          {/* Right side: new move details */}
          <aside className="move-learning-new">
            <h3>New Move</h3>
            <div className="move-learning-new-card">
              <div className="move-learning-new-hero">
                <img
                  src={pokemon.sprite || DEFAULT_SPRITE}
                  alt={pokemon.name}
                  onError={(e) => {
                    e.target.src = DEFAULT_SPRITE;
                  }}
                />
              </div>
              <div className="move-learning-new-name">
                <h4>{newMove.name}</h4>
              </div>
              <div className="move-learning-new-types">
                <TypeBadge type={newMove.type} />
              </div>
              <div className="move-learning-new-details">
                <div className="move-learning-detail-row">
                  <span className="label">Category:</span>
                  <span className="value">{newMove.category?.toUpperCase() ?? "STATUS"}</span>
                </div>
                <div className="move-learning-detail-row">
                  <span className="label">Power:</span>
                  <span className="value">{newMove.power ?? "--"}</span>
                </div>
              </div>
              <div className="move-learning-new-message">
                <p>{pokemon.name} wants to learn {newMove.name}!</p>
                <p>But {pokemon.name} already knows four moves.</p>
                <p>Delete a move to make room?</p>
              </div>
            </div>
          </aside>
        </div>

        <footer className="move-learning-footer">
          {selectedMoveIndex !== null && (
            <div className="move-learning-action-message">
              <p>{pokemon.name} will forget {pokemon.moves[selectedMoveIndex]?.name} and learn {newMove.name}!</p>
            </div>
          )}
          <div className="move-learning-buttons">
            {selectedMoveIndex !== null && (
              <button
                className="move-learning-confirm-btn"
                onClick={() => onReplaceMove(selectedMoveIndex)}
                type="button"
              >
                CONFIRM
              </button>
            )}
            <button
              className="move-learning-cancel-btn"
              onClick={onCancel}
              type="button"
            >
              CANCEL
            </button>
          </div>
        </footer>
      </section>
    </div>
  );
}
