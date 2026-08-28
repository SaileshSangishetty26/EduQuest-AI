import React from 'react';

export default function XPBar({ level, title, pct, xpIntoLevel, xpForNextLevel, compact }) {
  return (
    <div className={`xpbar ${compact ? 'xpbar-compact' : ''}`}>
      <div className="xpbar-top">
        <span className="xpbar-level">Lv {level}</span>
        {!compact && <span className="xpbar-title">{title}</span>}
        <span className="xpbar-nums">{xpIntoLevel}/{xpForNextLevel} XP</span>
      </div>
      <div className="xpbar-track">
        <div className="xpbar-fill" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
