import React, { useState } from 'react';
import Header from '../components/Header';
import Confetti from '../components/Confetti';
import { api } from '../services/api';

export default function Quiz({ quiz, user, level, streak, onBack, onLogout, onSubmitted }) {
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!quiz) {
    return (
      <main className="container">
        <button onClick={onBack}>Back</button>
      </main>
    );
  }

  const answeredCount = Object.keys(answers).length;
  const total = quiz.questions.length;
  const progressPct = Math.round((answeredCount / total) * 100);

  async function submit(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const r = await api.submitQuiz({
        user_id: user.id,
        quiz_id: quiz.id,
        answers: Object.values(answers)
      });
      setResult(r);
      if (onSubmitted) onSubmitted();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  const celebrate = result && result.score >= 60;
  const xpGained = result ? Math.round(result.correct * 25 + result.score * 0.5) : 0;

  return (
    <>
      <Header user={user} onHome={onBack} onLessons={onBack} onLogout={onLogout} level={level} streak={streak} />

      <main className="container">
        {celebrate && <Confetti />}
        <button className="link" onClick={onBack}>← Lessons</button>

        <div className="page-head">
          <span className="eyebrow">CHAPTER QUIZ</span>
          <h1>{quiz.title}</h1>
          {!result && <p>{total} questions · answer them all to submit</p>}
        </div>

        {result ? (
          <section className="card result">
            <div className="result-badge">{result.score >= 80 ? '🏆' : result.score >= 60 ? '🎉' : '💪'}</div>
            <h2>Quiz complete!</h2>
            <div className="score">{result.score}%</div>
            <p>{result.correct} of {result.total} answers correct.</p>
            <div className="xp-gain-chip">+{xpGained} XP earned</div>
            <button className="primary" onClick={onBack}>Back to learning</button>
          </section>
        ) : (
          <>
            <div className="quiz-progress-track">
              <div className="quiz-progress-fill" style={{ width: `${progressPct}%` }} />
            </div>
            <form onSubmit={submit}>
              {quiz.questions.map((q, i) => (
                <section className="card question" key={i}>
                  <h3><span className="q-number">{i + 1}</span> {q.text}</h3>
                  {q.options.map((o, j) => (
                    <label className={`option ${answers[i] === j ? 'option-selected' : ''}`} key={j}>
                      <input
                        type="radio"
                        name={`q${i}`}
                        onChange={() => setAnswers({ ...answers, [i]: j })}
                        checked={answers[i] === j}
                        required
                      />
                      {o}
                    </label>
                  ))}
                </section>
              ))}
              {error && <div className="error">{error}</div>}
              <button className="primary" disabled={submitting}>
                {submitting ? 'Submitting…' : 'Submit quiz'}
              </button>
            </form>
          </>
        )}
      </main>
    </>
  );
}
