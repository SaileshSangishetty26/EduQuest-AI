import React, { useEffect, useState } from 'react';
import Header from '../components/Header';
import XPBar from '../components/XPBar';
import { avatarForUser, badgesFromProgress } from '../utils/gamify';
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
  next_chapter: '✨',
  revision: '🔎'
};

export default function Dashboard({ user, progress, level, streak, onLessons, onChat, onLogout, onOpenLesson }) {
  const [recs, setRecs] = useState([]);

  useEffect(() => {
    api.recommendations(user.id, { grade: user.grade, limit: 4 })
      .then(r => setRecs(r.recommendations || []))
      .catch(() => setRecs([]));
  }, [user.id, user.grade, progress]);

  const avatar = avatarForUser(user);
  const badges = badgesFromProgress(progress);
  const langLabel = user.language === 'te' ? 'Telugu' : user.language === 'hi' ? 'Hindi' : 'English';

  return (
    <>
      <Header user={user} onHome={() => {}} onLessons={onLessons} onChat={onChat} onLogout={onLogout} level={level} streak={streak} />

      <main className="container">
        <section className="hero">
          <div className="hero-copy">
            <span className="eyebrow">Student Dashboard</span>
            <h1>Welcome back, {user.username} {avatar}</h1>
            <p>Grade {user.grade} · Learning in {langLabel} · {streak > 0 ? `${streak}-day streak 🔥` : 'Start a streak today!'}</p>
            <div className="hero-xp"><XPBar {...level} /></div>
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

        <section className="grid three stat-grid">
          <div className="card stat">
            <span className="stat-icon">📚</span>
            <b>{progress?.lessons_completed ?? 0}</b>
            <span>Chapters completed</span>
          </div>
          <div className="card stat">
            <span className="stat-icon">🎯</span>
            <b>{progress?.quiz_attempts ?? 0}</b>
            <span>Quizzes attempted</span>
          </div>
          <div className="card stat">
            <span className="stat-icon">⭐</span>
            <b>{progress?.average_score ?? 0}%</b>
            <span>Average score</span>
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
            <span className="lesson-count">{badges.length} earned</span>
          </div>
          {badges.length === 0 ? (
            <p>Complete a chapter or quiz to earn your first badge!</p>
          ) : (
            <div className="badge-row">
              {badges.map(b => (
                <div className="badge-pill" key={b.id} title={b.label}>
                  <span>{b.icon}</span>{b.label}
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </>
  );
}
