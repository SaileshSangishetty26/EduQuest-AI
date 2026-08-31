import React, { useEffect, useState } from 'react';
import Header from '../components/Header';
import { api } from '../services/api';

const SUBJECT_ICONS = {
  English: '📖',
  Mathematics: '📐',
  Science: '🧪',
  Telugu: '📝'
};

const LANGUAGE_NAMES = {
  en: 'English',
  te: 'Telugu',
  hi: 'Hindi'
};

export default function Lessons({ user, level, streak, onBack, onOpenLesson, onOpenQuiz, onLogout }) {
  const [lessons, setLessons] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [subject, setSubject] = useState('');
  const [usingFallback, setUsingFallback] = useState(false);

  const subjects = ['English', 'Mathematics', 'Science', 'Telugu'];

  const load = () => {
    api.lessons({ grade: user.grade, language: user.language, subject })
      .then(data => {
        if (data.length === 0 && user.language !== 'en') {
          return api.lessons({ grade: user.grade, language: 'en', subject })
            .then(englishData => {
              setUsingFallback(englishData.length > 0);
              setLessons(englishData);
            });
        }
        setUsingFallback(false);
        setLessons(data);
      })
      .catch(() => {
        setUsingFallback(false);
        setLessons([]);
      });

    api.quizzes({ grade: user.grade, subject })
      .then(setQuizzes).catch(() => setQuizzes([]));
  };

  useEffect(() => { load(); }, [user.grade, user.language, subject]);

  const languageName = LANGUAGE_NAMES[user.language] || user.language;

  return (
    <>
      <Header user={user} onHome={onBack} onLessons={() => {}} onLogout={onLogout} level={level} streak={streak} />

      <main className="container">
        <button className="link" onClick={onBack}>← Dashboard</button>

        <div className="page-head">
          <span className="eyebrow">QUEST MAP</span>
          <h1>Explore Your Lessons 📚</h1>
          <p>Choose a subject, explore a chapter and test what you have learned with its chapter quiz.</p>
        </div>

        <div className="filters pill-filters">
          <button className={`pill ${subject === '' ? 'pill-active' : ''}`} onClick={() => setSubject('')}>
            🗺️ All subjects
          </button>
          {subjects.map(s => (
            <button
              key={s}
              className={`pill ${subject === s ? 'pill-active' : ''}`}
              onClick={() => setSubject(s)}
            >
              {SUBJECT_ICONS[s]} {s}
            </button>
          ))}
        </div>

        {usingFallback && (
          <div className="card language-notice">
            <p>
              🌐 These chapters are not available in {languageName} yet, so we are
              showing the English versions.
            </p>
          </div>
        )}

        <div className="section-heading">
          <div>
            <span className="eyebrow">GRADE {user.grade}</span>
            <h2>{subject || 'All Subjects'}</h2>
          </div>
          <span className="lesson-count">
            {lessons.length} {lessons.length === 1 ? 'chapter' : 'chapters'}
          </span>
        </div>

        {lessons.length === 0 ? (
          <div className="card empty-state">
            <h3>No chapters available yet 📖</h3>
            <p>Try another subject or check your language selection.</p>
          </div>
        ) : (
          <div className="grid cards">
            {lessons.map((lesson, index) => (
              <article className="card lesson quest-card" key={lesson.id}>
                <div className="lesson-top">
                  <span className="tag">{SUBJECT_ICONS[lesson.subject] || '📘'} {lesson.subject}</span>
                  <span className="chapter-number">Chapter {index + 1}</span>
                </div>
                <h3>{lesson.title}</h3>
                <p>{lesson.summary}</p>
                <button className="primary" onClick={() => onOpenLesson(lesson)}>
                  Explore Chapter →
                </button>
              </article>
            ))}
          </div>
        )}

        <div className="section-heading quiz-heading">
          <div>
            <span className="eyebrow">TEST YOURSELF</span>
            <h2>Chapter Quizzes 🎯</h2>
          </div>
          <span className="lesson-count">{quizzes.length} quizzes</span>
        </div>

        {quizzes.length === 0 ? (
          <div className="card empty-state">
            <h3>No quizzes available yet 🎯</h3>
            <p>Chapter quizzes will appear here when available.</p>
          </div>
        ) : (
          <div className="grid cards">
            {quizzes.map(quiz => (
              <article className="card lesson quiz-card" key={quiz.id}>
                <div className="lesson-top">
                  <span className="tag quiztag">🎯 Quiz</span>
                  <span className="chapter-number">{quiz.questions?.length || 0} questions</span>
                </div>
                <h3>{quiz.title}</h3>
                <p>Ready to see how much you remember from this chapter?</p>
                <button className="secondary" onClick={() => onOpenQuiz(quiz)}>
                  Start Chapter Quiz →
                </button>
              </article>
            ))}
          </div>
        )}
      </main>
    </>
  );
}
