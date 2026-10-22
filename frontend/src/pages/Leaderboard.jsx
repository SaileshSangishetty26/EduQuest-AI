import React, { useEffect, useState } from 'react';
import Header from '../components/Header';
import { api } from '../services/api';

const MEDALS = { 1: '🥇', 2: '🥈', 3: '🥉' };

function Row({ row }) {
  return (
    <li className={`lb-row ${row.is_you ? 'lb-you' : ''}`}>
      <span className="lb-rank">{MEDALS[row.rank] || row.rank}</span>
      <span className="lb-avatar">{row.avatar}</span>
      <span className="lb-name">
        <b>{row.username}{row.is_you ? ' (you)' : ''}</b>
        <span>Level {row.level} · {row.title}</span>
      </span>
      <span className="lb-meta" title="Current streak">{row.streak > 0 ? `🔥 ${row.streak}` : ''}</span>
      <span className="lb-meta" title="Badges earned">🏅 {row.badges}</span>
      <span className="lb-xp">{row.xp} XP</span>
    </li>
  );
}

export default function Leaderboard({ user, level, streak }) {
  const [board, setBoard] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.leaderboard({ grade: user.grade, user_id: user.id, limit: 10 })
      .then(setBoard)
      .catch(() => setError('Could not load the leaderboard. Check that the server is running.'));
  }, [user.id, user.grade]);

  const youInTop = board?.top?.some(r => r.is_you);

  return (
    <>
      <Header user={user} level={level} streak={streak} />
      <main className="container">
        <div className="page-head">
          <span className="eyebrow">GRADE {user.grade} LEADERBOARD</span>
          <h1>Top learners 🏆</h1>
          <p>Ranked by XP. Earn XP by reading chapters, answering quiz questions correctly and learning every day.</p>
        </div>

        {error && <div className="error">{error}</div>}

        {board && (
          <section className="card leaderboard">
            {board.top.length === 0 ? (
              <p className="empty-state">No students yet - be the first on the board!</p>
            ) : (
              <ol className="lb-list">
                {board.top.map(row => <Row row={row} key={row.user_id} />)}
              </ol>
            )}

            {board.you && !youInTop && (
              <>
                <div className="lb-gap">⋯</div>
                <ol className="lb-list">
                  <Row row={board.you} />
                </ol>
              </>
            )}
            <p className="lb-footnote">{board.students} {board.students === 1 ? 'student' : 'students'} in Grade {user.grade}. Students with the same XP share a rank.</p>
          </section>
        )}
      </main>
    </>
  );
}
