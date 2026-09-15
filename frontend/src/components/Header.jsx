import React from 'react';
import XPBar from './XPBar';
import { avatarForUser } from '../utils/gamify';

export default function Header({ user, onHome, onLessons, onChat, onSettings, onLogout, level, streak }) {
  const avatar = avatarForUser(user);
  return (
    <header className="topbar">
      <div className="brand" onClick={onHome}>
        <span className="brand-mark">🎓</span>
        <span>EduQuest</span>
      </div>

      <nav className="topbar-nav">
        <button onClick={onHome}>Dashboard</button>
        <button onClick={onLessons}>Quest Map</button>
        {onChat && <button onClick={onChat}>Ask AI 🤖</button>}
      </nav>

      <div className="topbar-right">
        {streak > 0 && (
          <span className="streak-chip" title={`${streak} day streak`}>
            🔥 <b>{streak}</b>
          </span>
        )}
        {level && (
          <div className="topbar-xp">
            <XPBar {...level} compact />
          </div>
        )}
        {onSettings && (
          <button
            className="settings-btn"
            onClick={onSettings}
            title="Change grade or language"
          >
            ⚙️
          </button>
        )}
        <span className="avatar-chip">{avatar}</span>
        <button className="logout" onClick={onLogout}>Logout</button>
      </div>
    </header>
  );
}
