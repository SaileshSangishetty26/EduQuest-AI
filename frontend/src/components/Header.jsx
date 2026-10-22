import React, { useContext } from 'react';
import XPBar from './XPBar';
import { avatarForUser } from '../utils/gamify';
import { NavContext } from '../context/nav';

export default function Header({ user, onHome, onLessons, onChat, onSettings, onLogout, level, streak }) {
  const avatar = avatarForUser(user);
  // Shared app navigation wins over per-page callbacks, so every page's
  // header behaves the same way.
  const nav = useContext(NavContext) || {};
  const go = {
    home: nav.home || onHome,
    lessons: nav.lessons || onLessons,
    leaderboard: nav.leaderboard,
    chat: nav.chat || onChat,
    settings: nav.settings || onSettings,
    logout: nav.logout || onLogout
  };
  const active = nav.page;

  return (
    <header className="topbar">
      <div className="brand" onClick={go.home}>
        <span className="brand-mark">🎓</span>
        <span>EduQuest</span>
      </div>

      <nav className="topbar-nav">
        <button className={active === 'dashboard' ? 'nav-active' : ''} onClick={go.home}>Dashboard</button>
        <button className={['lessons', 'lesson', 'quiz'].includes(active) ? 'nav-active' : ''} onClick={go.lessons}>Quest Map</button>
        {go.leaderboard && (
          <button className={active === 'leaderboard' ? 'nav-active' : ''} onClick={go.leaderboard}>Leaderboard 🏆</button>
        )}
        {go.chat && (
          <button className={active === 'chat' ? 'nav-active' : ''} onClick={go.chat}>Ask AI 🤖</button>
        )}
      </nav>

      <div className="topbar-right">
        {streak > 0 && (
          <span className="streak-chip" title={`${streak}-day learning streak`}>
            🔥 <b>{streak}</b>
          </span>
        )}
        {level && (
          <div className="topbar-xp">
            <XPBar {...level} compact />
          </div>
        )}
        {go.settings && (
          <button
            className="settings-btn"
            onClick={go.settings}
            title="Change language or avatar"
          >
            ⚙️
          </button>
        )}
        <span className="avatar-chip">{avatar}</span>
        <button className="logout" onClick={go.logout}>Logout</button>
      </div>
    </header>
  );
}
