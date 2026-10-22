import React, { useEffect, useState } from 'react';
import Header from '../components/Header';
import { api } from '../services/api';
import Reward from '../components/Reward';

export default function LessonView({ lesson, user, level, streak, completedLessons = [], onBack, onQuiz, onLogout, onSettings, onCompleted }) {
  const [quiz, setQuiz] = useState(null);
  const [marking, setMarking] = useState(false);
  const [reward, setReward] = useState(null);
  const [error, setError] = useState('');

  const isRead = lesson ? completedLessons.includes(lesson.id) || reward !== null : false;

  async function markAsRead() {
    if (marking || !lesson) return;
    setMarking(true);
    setError('');
    try {
      const result = await api.completeLesson(lesson.id, user.id);
      setReward(result);
      if (onCompleted) onCompleted();
    } catch (err) {
      setError('Could not save. Check that the server is running.');
    } finally {
      setMarking(false);
    }
  }

  useEffect(() => {
    if (!lesson) return;
    api.quizzes({ grade: user.grade, subject: lesson.subject })
      .then(quizzes => {
        const chapterQuiz = quizzes.find(q => q.lesson_id === lesson.id);
        setQuiz(chapterQuiz || null);
      })
      .catch(() => setQuiz(null));
  }, [lesson, user.grade]);

  if (!lesson) {
    return (
      <main className="container">
        <button onClick={onBack}>Back</button>
      </main>
    );
  }

  const sections = String(lesson.content || '')
    .split('\n')
    .map(x => x.trim())
    .filter(Boolean);

  return (
    <>
      <Header user={user} onHome={onBack} onLessons={onBack} onSettings={onSettings} onLogout={onLogout} level={level} streak={streak} />

      <main className="container">
        <button className="link" onClick={onBack}>← Lessons</button>

        <article className="card lesson-view">
          <span className="tag">{lesson.subject}</span>
          <h1>{lesson.title}</h1>
          <p className="summary">{lesson.summary}</p>

          <div className="content-text">
            {sections.map((line, index) => {
              const isHeading = /^[🌟🔎🌱💡🧠🎯📐🔢🧪🌍🐾❤️🏠📚🪖🤝🧐❓⚙️]/u.test(line);
              return isHeading ? <h3 key={index}>{line}</h3> : <p key={index}>{line}</p>;
            })}
          </div>

          <div className={`quiz-section read-section ${isRead ? 'complete-banner' : ''}`}>
            {isRead ? (
              <>
                <h2>✅ Chapter read</h2>
                {reward && !reward.already_completed ? (
                  <Reward result={reward} />
                ) : (
                  <p>You have finished this chapter. Try its quiz to test yourself!</p>
                )}
              </>
            ) : (
              <>
                <h2>📖 Finished reading?</h2>
                <p>Mark this chapter as read to earn <b>+20 XP</b> and keep your streak going.</p>
                <button className="primary" onClick={markAsRead} disabled={marking}>
                  {marking ? 'Saving…' : 'Mark chapter as read ✓'}
                </button>
                {error && <div className="error">{error}</div>}
              </>
            )}
          </div>

          {quiz && (
            <div className="quiz-section">
              <h2>🎯 Chapter Quiz</h2>
              <p>{quiz.questions.length} questions based on this chapter. Earn 10 XP for each correct answer!</p>
              <button className="primary" onClick={() => onQuiz(quiz)}>
                Take Chapter Quiz →
              </button>
            </div>
          )}
        </article>
      </main>
    </>
  );
}
