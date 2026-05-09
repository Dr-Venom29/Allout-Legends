import { useMemo, useState } from 'react';
import { POKEMON_DATA } from '../../data/pokemon/pokemonData';
import './PokedexPanel.css';

const StatusIcon = ({ type }) => {
  if (type === 'caught') {
    return (
      <svg className="pokedex-status-icon" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M6 12.5l4 4L18 8" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  if (type === 'seen') {
    return (
      <svg className="pokedex-status-icon" viewBox="0 0 24 24" aria-hidden="true">
        <path
          d="M2 12s4-6 10-6 10 6 10 6-4 6-10 6S2 12 2 12z"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        />
        <circle cx="12" cy="12" r="3" fill="currentColor" />
      </svg>
    );
  }

  return (
    <svg className="pokedex-status-icon" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 2.2-3 4"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <circle cx="12" cy="18" r="1" fill="currentColor" />
    </svg>
  );
};

const POKEDEX_EMPTY = {
  seen: [],
  caught: [],
};

const getDataBarPercent = (pokemon) => {
  const baseHp = pokemon?.BaseStats?.hp ?? 0;
  const scaled = Math.round((baseHp / 255) * 100);

  return Math.min(100, Math.max(8, scaled));
};

const getDisplayLevel = (pokemon) => {
  const baseHp = pokemon?.BaseStats?.hp ?? 0;
  const scaled = Math.round(baseHp / 2);

  return Math.min(99, Math.max(1, scaled));
};

export default function PokedexPanel({ pokedex = POKEDEX_EMPTY }) {
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const seenCount = pokedex.seen.length;
  const caughtCount = pokedex.caught.length;
  const completion = seenCount === 0
    ? 0
    : ((caughtCount / seenCount) * 100).toFixed(1);

  const entries = useMemo(() => {
    const seenSet = new Set(pokedex.seen);
    const caughtSet = new Set(pokedex.caught);

    return Object.entries(POKEMON_DATA)
      .map(([id, data]) => {
        const numericId = Number(id);
        const isCaught = caughtSet.has(numericId);
        const isSeen = seenSet.has(numericId);
        const status = isCaught
          ? 'caught'
          : isSeen
            ? 'seen'
            : 'unknown';

        return {
          id: numericId,
          name: status === 'unknown' ? '?????' : data.Name,
          level: status === 'unknown'
            ? 0
            : getDisplayLevel(data),
          status,
          hp: status === 'unknown'
            ? 0
            : getDataBarPercent(data),
        };
      })
      .sort((a, b) => a.id - b.id);
  }, [pokedex.caught, pokedex.seen]);

  const filteredEntries = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return entries.filter((entry) => {
      if (statusFilter !== 'all' && entry.status !== statusFilter) {
        return false;
      }

      if (!normalizedQuery) {
        return true;
      }

      const idMatch = String(entry.id).padStart(3, '0').includes(normalizedQuery);
      const nameMatch = entry.name.toLowerCase().includes(normalizedQuery);

      return idMatch || nameMatch;
    });
  }, [entries, query, statusFilter]);

  const isNoMatches = entries.length > 0 && filteredEntries.length === 0;

  return (
    <section className="pokedex-panel" aria-label="Pokedex">
      <div className="pokedex-header">
        <div className="pokedex-title-row">
          <span className="pokedex-ball" aria-hidden="true" />
          <div>
            <h2 className="pokedex-title">POKEDEX</h2>
            <p className="pokedex-subtitle">Digital Monster Encyclopedia</p>
          </div>
        </div>
      </div>

      <div className="pokedex-stats">
        <div className="pokedex-stat-card">
          <span className="pokedex-stat-label">Seen</span>
          <span className="pokedex-stat-value">{seenCount}</span>
        </div>
        <div className="pokedex-stat-card">
          <span className="pokedex-stat-label">Caught</span>
          <span className="pokedex-stat-value">{caughtCount}</span>
        </div>
        <div className="pokedex-stat-card">
          <span className="pokedex-stat-label">Completion</span>
          <span className="pokedex-stat-value">{completion}%</span>
        </div>
      </div>

      <div className="pokedex-controls">
        <input
          className="pokedex-search"
          type="text"
          placeholder="Search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          aria-label="Search Pokedex"
        />
        <select
          className="pokedex-filter"
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
          aria-label="Filter Pokedex"
        >
          <option value="all">All</option>
          <option value="seen">Seen</option>
          <option value="caught">Caught</option>
          <option value="unknown">Missing</option>
        </select>
      </div>

      <div className="pokedex-list" role="list">
        {filteredEntries.length === 0 ? (
          <div className="pokedex-empty">
            {isNoMatches ? (
              <>
                <p>No matches found.</p>
                <p>Try a different name, number, or filter.</p>
              </>
            ) : (
              <>
                <p>No Pokemon data recorded yet.</p>
                <p>Explore the world to discover new species.</p>
              </>
            )}
          </div>
        ) : (
          filteredEntries.map((entry) => (
            <div
              key={entry.id}
              className={`pokedex-entry ${entry.status}`}
              role="listitem"
            >
              <span className="pokedex-entry-ball" aria-hidden="true" />
              <div className="pokedex-entry-main">
                <div className="pokedex-entry-title">
                  <span className="pokedex-entry-number">#{String(entry.id).padStart(3, '0')}</span>
                  <span className="pokedex-entry-name">{entry.name}</span>
                </div>
                <span className="pokedex-entry-level">
                  {entry.status === 'unknown' ? 'LV??' : `LV${entry.level}`}
                </span>
              </div>
              <div className="pokedex-entry-status">
                <StatusIcon type={entry.status} />
                <span className="pokedex-entry-status-text">
                  {entry.status === 'caught' && 'Caught'}
                  {entry.status === 'seen' && 'Seen'}
                  {entry.status === 'unknown' && 'Unknown'}
                </span>
                <div className="pokedex-entry-bar">
                  <div
                    className="pokedex-entry-bar-fill"
                    style={{ width: `${entry.hp}%` }}
                  />
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
