// pokemon-frontend/src/components/panels/ProfilePanel.jsx
import { useState } from 'react';
import './Panel.css';
import SkinPanel from './SkinPanel';

export default function ProfilePanel({ player, party }) {
  const [showSkinModal, setShowSkinModal] = useState(false);
  const [hideBackButton, setHideBackButton] = useState(false);
  const [selectedAvatar] = useState(() => {
    return localStorage.getItem('selected_avatar') || '/assets/heros/Alpha_Coder.png';
  });

  const getRealmNumber = () => {
    const map = { map1: 1, map2: 2, map5: 5, map6: 6 };
    return map[player?.mapId] ?? 1;
  };

  const menuItems = [
    { id: 'activity', label: 'Account Activity', icon: '📊' },
    { id: 'online', label: 'Online Trainers', icon: '🟢' },
    { id: 'leaderboards', label: 'Leaderboards', icon: '🏆' },
    { id: 'search', label: 'Search Users', icon: '🔍' },
    { id: 'friends', label: 'Friends & Blocklist', icon: '👥' },
    { id: 'messages', label: 'Messages', icon: '💬', badge: 3 },
    { id: 'pokemart', label: 'PokéMart', icon: '🏪' },
    { id: 'events', label: 'Events', icon: '🎪', badge: 1 },
  ];

  return (
    <div className="profile-panel">

      {/* ── HEADER ─────────────────────────────────────────── */}
      <div className="profile-header">
        <div className="profile-avatar-row">
          <div className="profile-avatar-large">
            <img
              src={selectedAvatar}
              alt="Trainer avatar"
              onError={(e) => { e.target.src = '/assets/heros/Alpha_Coder.png'; }}
            />
            <div className="avatar-status" title="Online" />
            <button
              className="avatar-change-btn"
              onClick={() => setShowSkinModal(true)}
            >
              Change
            </button>
          </div>

          <div className="profile-info-large">
            <p className="trainer-label">Trainer</p>
            <h3>Trainer</h3>

            <div className="profile-stats">
              <span className="stat-row">
                <span>⭐</span>
                <span className="stat-row-value">Level 1</span>
              </span>
              <span className="stat-row">
                <span>📍</span>
                <span className="stat-row-value">Realm {getRealmNumber()}</span>
              </span>
            </div>

            <div className="profile-progress">
              <div className="xp-bar">
                <div className="xp-fill" style={{ width: '15%' }} />
              </div>
              <div className="xp-text">
                <span>150 XP</span>
                <span>1000 XP</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── QUICK STATS ────────────────────────────────────── */}
      <div className="quick-stats">
        <div className="quick-stat">
          <span className="quick-stat-value">0</span>
          <span className="quick-stat-label">Wins</span>
        </div>
        <div className="quick-stat">
          <span className="quick-stat-value">{party?.length ?? 0}</span>
          <span className="quick-stat-label">Party</span>
        </div>
        <div className="quick-stat">
          <span className="quick-stat-value">0</span>
          <span className="quick-stat-label">Badges</span>
        </div>
      </div>

      {/* ── MENU ───────────────────────────────────────────── */}
      <p className="menu-section-label">Navigation</p>
      <div className="profile-dropdown-container">
        {menuItems.map((item) => (
          <button
            key={item.id}
            className="profile-dropdown-item"
            onClick={() => console.log(item.label)}
          >
            <span className="dropdown-icon">{item.icon}</span>
            <span className="dropdown-label">{item.label}</span>
            {item.badge && (
              <span className="dropdown-badge">{item.badge}</span>
            )}
          </button>
        ))}
      </div>

      {/* ── SKIN PANEL MODAL ───────────────────────────────── */}
      {showSkinModal && (
        <div
          className="avatar-modal-overlay"
          onClick={() => setShowSkinModal(false)}
        >
          <div className="avatar-modal skin-modal" onClick={(e) => e.stopPropagation()}>
            <button
              className={`skin-modal-back ${hideBackButton ? 'hidden' : ''}`}
              onClick={() => setShowSkinModal(false)}
              aria-label="Go Back"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
              BACK
            </button>

            <SkinPanel
              title="ALLOUT LEGENDS"
              quantity={8}
              onVaultReach={setHideBackButton}
            />
          </div>
        </div>
      )}
    </div>
  );
}