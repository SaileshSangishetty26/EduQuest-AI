import React, { useEffect, useState } from 'react';
import Header from '../components/Header';
import XPBar from '../components/XPBar';
import { avatarForUser } from '../utils/gamify';
import { api } from '../services/api';

const SUBJECTS = [
  { name: 'English', icon: '📖', color: 'var(--gold)' },
  { name: 'Mathematics', icon: '📐', color: 'var(--teal)' },
  { name: 'Science', icon: '🧪', color: 'var(--coral)' },
  { name: 'Telugu', icon: '📝', color: 'var(--violet)' }
];

const KIND_ICONS = {
  retry: '🔁',
  weak_subject: '📉',
  asked_about: '💬',
  take_quiz: '📝',
  next_chapter: '✨',
  revision: '🔎'
};

export default function Dashboard({ user, game, progress, level, streak, onLessons, onLeaderboard, onChat, onLogout, onSettings, onOpenLesson }) {
  const [recs, setRecs] = useState([]);

  useEffect(() => {
    api.recommendations(user.id, { grade: user.grade, limit: 4 })
      .then(r => setRecs(r.recommendations || []))
      .catch(() => setRecs([]));
  }, [user.id, user.grade, progress]);

  const avatar = avatarForUser(user);
  const badges = game?.badges || [];
  const earned = badges.filter(b => b.earned);
  const rewards = game?.rewards || [];
  const nextReward = game?.next_reward;
  const recent = game?.recent_xp || [];
  const langLabel = user.language === 'te' ? 'Telugu' : user.language === 'hi' ? 'Hindi' : 'English';
  const activeToday = game?.streak?.active_today;

  return (
    <>
      <Header user={user} onHome={() => {}} onLessons={onLessons} onChat={onChat} onSettings={onSettings} onLogout={onLogout} level={level} streak={streak} />

      <main className="container">
        <section className="hero">
          <div className="hero-copy">
            <span className="eyebrow">Student Dashboard</span>
            <h1>Welcome back, {user.username} {avatar}</h1>
            <p>
              Grade {user.grade} · Learning in {langLabel} ·{' '}
              {streak > 0
                ? `${streak}-day streak 🔥${activeToday ? '' : ' - learn something today to keep it!'}`
                : 'Read a chapter or take a quiz to start a streak!'}
            </p>
            <div className="hero-xp"><XPBar {...level} /></div>
            <p className="hero-xp-total">{game?.xp ?? 0} XP in total</p>
            <div className="hero-actions">
              <button className="primary quest-cta" onClick={onLessons}>Continue Your Quest →</button>
              <button className="secondary" onClick={onChat}>Ask the Study Buddy 🤖</button>
            </div>
          </div>
          <div className="hero-badge">
            <div className="level-ring">
              <span className="level-ring-num">{level.level}</span>
              <span className="level-ring-label">Level</span>
            </div>
          </div>
        </section>

        <section className="grid four stat-grid">
          <div className="card stat">
            <span className="stat-icon">📚</span>
            <b>{progress?.lessons_completed ?? 0}</b>
            <span>Chapters read</span>
          </div>
          <div className="card stat">
            <span className="stat-icon">🎯</span>
            <b>{progress?.quizzes_passed ?? 0}</b>
            <span>Quizzes passed</span>
          </div>
          <div className="card stat">
            <span className="stat-icon">⭐</span>
            <b>{progress?.average_score ?? 0}%</b>
            <span>Average score</span>
          </div>
          <div className="card stat">
            <span className="stat-icon">🔥</span>
            <b>{game?.streak?.best ?? 0}</b>
            <span>Best streak (days)</span>
          </div>
        </section>

        {recs.length > 0 && (
          <section className="card recs-card">
            <div className="section-heading">
              <div>
                <span className="eyebrow">RECOMMENDED FOR YOU</span>
                <h2>What to study next</h2>
              </div>
            </div>
            <div className="recs-list">
              {recs.map(r => (
                <button className="rec-item" key={r.lesson_id} onClick={() => onOpenLesson(r)}>
                  <span className="rec-icon">{KIND_ICONS[r.kind] || '📘'}</span>
                  <span className="rec-body">
                    <b>{r.title}</b>
                    <span className="rec-reason">{r.reason}</span>
                  </span>
                  <span className="rec-subject">{r.subject}</span>
                </button>
              ))}
            </div>
          </section>
        )}

        <section className="quest-path card">
          <div className="section-heading">
            <div>
              <span className="eyebrow">QUEST MAP</span>
              <h2>Pick your path</h2>
            </div>
          </div>
          <div className="path-track">
            {SUBJECTS.map((s, i) => (
              <button key={s.name} className="path-node" style={{ '--node-color': s.color }} onClick={onLessons}>
                <span className="path-node-icon">{s.icon}</span>
                <span className="path-node-label">{s.name}</span>
                {i < SUBJECTS.length - 1 && <span className="path-connector" />}
              </button>
            ))}
          </div>
        </section>

        <section className="card info badges-card">
          <div className="section-heading">
            <div>
              <span className="eyebrow">TROPHY CASE</span>
              <h2>Your badges</h2>
            </div>
            <span className="lesson-count">{earned.length} of {badges.length} earned</span>
          </div>
          <div className="badge-grid">
            {badges.map(b => (
              <div className={`badge-tile ${b.earned ? 'badge-earned' : 'badge-locked'}`} key={b.id} title={b.description}>
                <span className="badge-icon">{b.icon}</span>
                <b>{b.label}</b>
                <span className="badge-desc">{b.description}</span>
                {!b.earned && (
                  <span className="badge-progress">
                    <span className="badge-progress-track">
                      <span className="badge-progress-fill" style={{ width: `${Math.round((b.progress / b.target) * 100)}%` }} />
                    </span>
                    {b.progress}/{b.target}
                  </span>
                )}
              </div>
            ))}
          </div>
        </section>

        <section className="grid two game-row">
          <div className="card rewards-card">
            <div className="section-heading">
              <div>
                <span className="eyebrow">REWARDS</span>
                <h2>Avatars to unlock</h2>
              </div>
            </div>
            <div className="reward-row">
              {rewards.map(r => (
                <div className={`reward ${r.unlocked ? 'reward-unlocked' : ''}`} key={r.avatar} title={r.name}>
                  <span className="reward-avatar">{r.unlocked ? r.avatar : '🔒'}</span>
                  <span className="reward-level">Lv {r.level}</span>
                </div>
              ))}
            </div>
            <p className="reward-note">
              {nextReward
                ? `Reach level ${nextReward.level} to unlock the ${nextReward.name} ${nextReward.avatar}.`
                : 'You have unlocked every avatar!'}
              {' '}Change your avatar with the ⚙️ button.
            </p>
          </div>

          <div className="card xp-log">
            <div className="section-heading">
              <div>
                <span className="eyebrow">HOW YOU EARNED XP</span>
                <h2>Recent XP</h2>
              </div>
              <button className="link" onClick={onLeaderboard}>Leaderboard →</button>
            </div>
            {recent.length === 0 ? (
              <p className="reward-note">Read a chapter (+20 XP) or answer quiz questions (+10 XP each) to start earning.</p>
            ) : (
              <ul className="xp-log-list">
                {recent.map((entry, i) => (
                  <li key={i}>
                    <span>{entry.reason}</span>
                    <b>+{entry.xp}</b>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </main>
    </>
  );
}
