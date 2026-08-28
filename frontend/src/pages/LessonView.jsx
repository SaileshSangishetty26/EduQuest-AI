import React, { useEffect, useState } from 'react';
import Header from '../components/Header';
import { api } from '../services/api';

export default function LessonView({ lesson, user, level, streak, onBack, onQuiz, onLogout }) {
  const [quiz, setQuiz] = useState(null);

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
      <Header user={user} onHome={onBack} onLessons={onBack} onLogout={onLogout} level={level} streak={streak} />

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

          {quiz ? (
            <div className="quiz-section">
              <h2>🎯 Chapter Quiz</h2>
              <p>{quiz.questions.length} questions based on this chapter. Answer them to earn XP!</p>
              <button className="primary" onClick={() => onQuiz(quiz)}>
                Take Chapter Quiz →
              </button>
            </div>
          ) : (
            <div className="quiz-section complete-banner">
              <h2>✅ Chapter read</h2>
              <p>Great work making it through this chapter.</p>
            </div>
          )}
        </article>
      </main>
    </>
  );
}
