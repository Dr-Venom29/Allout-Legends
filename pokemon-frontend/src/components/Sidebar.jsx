// pokemon-frontend/src/components/Sidebar.jsx
import { useState, useEffect } from 'react';
import ProfilePanel from './panels/ProfilePanel';
import PokedexPanel from './panels/PokedexPanel';
import PokemonPartyPanel from './panels/PokemonPartyPanel';
import PokemonPCPanel from './panels/PokemonPCPanel';
import './Sidebar.css';
import { getItemCount, ITEMS } from './game/inventory';

const Icon = {
  profile: <img src="/assets/icons/profile.svg" alt="Profile" width={18} height={18} className="sidebar-svg-icon" />,
  pokemon: <img src="/assets/icons/pokemon.svg" alt="Pokémon" width={18} height={18} className="sidebar-svg-icon" />,
  trade: <img src="/assets/icons/trade.svg" alt="Trade" width={18} height={18} className="sidebar-svg-icon" />,
  tasks: <img src="/assets/icons/tasks.svg" alt="Tasks" width={18} height={18} className="sidebar-svg-icon" />,
  settings: <img src="/assets/icons/settings.svg" alt="Settings" width={18} height={18} className="sidebar-svg-icon" />,
  inventory: <img src="/assets/icons/inventory.svg" alt="Inventory" width={18} height={18} className="sidebar-svg-icon" />,
  pokedex: <img src="/assets/icons/pokedex.svg" alt="Pokedex" width={18} height={18} className="sidebar-svg-icon" />,
};

export default function Sidebar({
  player,
  party,
  pcStorage,
  inventory,
  pokedex,
  activePartyIndex,
  setActivePartyIndex,
  onOpenPC,
  onSectionChange,
  activeSection,
}) {
  const [currentAvatar, setCurrentAvatar] = useState(() =>
    localStorage.getItem('selected_avatar') || '/assets/heros/Alpha_Coder.png'
  );

  useEffect(() => {
    const sync = () =>
      setCurrentAvatar(localStorage.getItem('selected_avatar') || '/assets/heros/Alpha_Coder.png');
    window.addEventListener('storage', sync);
    return () => window.removeEventListener('storage', sync);
  }, []);

  const getRealmNumber = () => {
    const map = { map1: 1, map2: 2, map5: 5, map6: 6 };
    return map[player?.mapId] ?? 1;
  };

  const handleSectionClick = (id) =>
    onSectionChange(activeSection === id ? null : id);

  /* ── Grouped nav sections ─────────────────────────────────── */
  const navGroups = [
    {
      label: 'Core',
      items: [
        { id: 'profile', label: 'Profile', icon: Icon.profile },
        { id: 'pokedex', label: 'Pokedex', icon: Icon.pokedex },
        { id: 'pokemons', label: 'Pokémons', icon: Icon.pokemon, badge: party?.length || 0 },
        { id: 'trade', label: 'Trade', icon: Icon.trade },
      ],
    },
    {
      label: 'System',
      items: [
        { id: 'tasks', label: 'Tasks', icon: Icon.tasks },
        { id: 'inventory', label: 'Inventory', icon: Icon.inventory },
        { id: 'misc', label: 'Settings', icon: Icon.settings },
      ],
    },
  ];

  const renderContent = () => {
    switch (activeSection) {
      case 'profile':
        return (
          <ProfilePanel player={player} party={party} />
        );
      case 'pokemons':
        return (
          <PokemonPartyPanel
            playerParty={party}
            activePartyIndex={activePartyIndex}
            setActivePartyIndex={setActivePartyIndex}
            onOpenPC={onOpenPC}
          />
        );
      case 'pokemon-pc':
        return (
          <PokemonPCPanel
            pcStorage={pcStorage}
            onClose={() => onSectionChange('pokemons')}
          />
        );
      case 'trade':
        return (
          <div className="section-panel">
            <h3>Trade Center</h3>
            <p style={{ color: 'var(--text-dim)', fontSize: 9 }}>Coming soon...</p>
          </div>
        );
      case 'tasks':
        return (
          <div className="section-panel">
            <h3>Daily Tasks</h3>
            <div className="task-list">
              <div className="task-item">Catch 5 Pokémon — 0/5</div>
              <div className="task-item">Win 3 battles — 0/3</div>
              <div className="task-item">Explore a new realm — 0/1</div>
            </div>
          </div>
        );
      case 'misc':
        return (
          <div className="section-panel">
            <h3>Settings</h3>
            <div className="settings-list">
              <label className="setting-item"><span>Sound Effects</span><input type="checkbox" defaultChecked /></label>
              <label className="setting-item"><span>Music</span><input type="checkbox" defaultChecked /></label>
              <label className="setting-item"><span>Fullscreen</span><input type="checkbox" /></label>
            </div>
          </div>
        );
      case 'inventory': {
        return (
          <div className="section-panel">
            <h3>Inventory</h3>
            <div className="inventory-list">
              {Object.entries(ITEMS).map(([id, item]) => {
                const count = getItemCount(inventory, id);
                if (!count) return null;
                return (
                  <p key={id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {item.icon && (
                      <img src={item.icon} alt={item.name} width={24} height={24} style={{ imageRendering: 'pixelated' }} />
                    )}
                    <span style={{ flex: '1 1 auto' }}>{item.name}</span>
                    <span>{count}</span>
                  </p>
                );
              })}
            </div>
          </div>
        );
      }
      case 'pokedex':
        return (
          <PokedexPanel pokedex={pokedex} />
        );
      default:
        return null;
    }
  };

  return (
    <>
      <nav className="game-sidebar" aria-label="Game Navigation">

        <span className="rail-corner-tl" aria-hidden="true" />

        <div
          className={`rail-avatar ${activeSection === 'profile' ? 'active' : ''}`}
          title={`Trainer — Realm ${getRealmNumber()}`}
          onClick={() => handleSectionClick('profile')}
          role="button"
          tabIndex={0}
          aria-label="Open Profile"
        >
          <img
            src={currentAvatar}
            alt="Player"
            onError={(e) => { e.target.src = '/assets/heros/Alpha_Coder.png'; }}
          />
          <span className="rail-avatar-status" aria-label="Online" />
        </div>

        <span className="rail-divider" aria-hidden="true" />

        <div className="sidebar-content">
          {navGroups.map((group) => (
            <div key={group.label} className="nav-group" aria-label={group.label}>
              {group.items.map((section) => (
                <button
                  key={section.id}
                  className={`sidebar-item ${activeSection === section.id ? 'active' : ''}`}
                  onClick={() => handleSectionClick(section.id)}
                  aria-label={section.label}
                  aria-pressed={activeSection === section.id}
                  title={section.label}
                >
                  <span className="sidebar-icon">{section.icon}</span>
                  {section.badge > 0 && (
                    <span className="sidebar-badge" aria-label={`${section.badge} items`}>
                      {section.badge}
                    </span>
                  )}
                  {/* Tooltip */}
                  <span className="sidebar-tooltip" aria-hidden="true">{section.label}</span>
                </button>
              ))}
              <span className="rail-divider rail-divider--slim" aria-hidden="true" />
            </div>
          ))}
        </div>

        {/* Version label */}
        <div className="rail-version" aria-hidden="true">v0.1</div>
      </nav>

      {/* ── Slide-out panel ───────────────────────────────────── */}
      <div
        className={`section-content-area ${activeSection === 'pokedex' ? 'section-content-area--pokedex' : ''} ${activeSection === 'pokemons' ? 'section-content-area--party' : ''} ${activeSection === 'pokemon-pc' ? 'section-content-area--pc' : ''}`.trim()}
      >
        {renderContent()}
      </div>
    </>
  );
}