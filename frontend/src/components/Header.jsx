import React from 'react';
import XPBar from './XPBar';
import { avatarForUser } from '../utils/gamify';

export default function Header({ user, onHome, onLessons, onChat, onLogout, level, streak }) {
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
        <span className="avatar-chip">{avatar}</span>
        <button className="logout" onClick={onLogout}>Logout</button>
      </div>
    </header>
  );
}
