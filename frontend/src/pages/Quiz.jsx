import React, { useState } from 'react';
import Header from '../components/Header';
import Confetti from '../components/Confetti';
import { api } from '../services/api';

export default function Quiz({ quiz, user, level, streak, onBack, onLogout, onSettings, onSubmitted }) {
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
      // One answer per question, in order; -1 marks a question left blank.
      const r = await api.submitQuiz({
        user_id: user.id,
        quiz_id: quiz.id,
        answers: quiz.questions.map((_, i) => (i in answers ? answers[i] : -1))
      });
      setResult(r);
      if (onSubmitted) onSubmitted();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  function retake() {
    setAnswers({});
    setResult(null);
    setError('');
    window.scrollTo(0, 0);
  }

  const celebrate = result && result.score >= 60;
  const xpGained = result ? Math.round(result.correct * 25 + result.score * 0.5) : 0;

  return (
    <>
      <Header user={user} onHome={onBack} onLessons={onBack} onSettings={onSettings} onLogout={onLogout} level={level} streak={streak} />

      <main className="container">
        {celebrate && <Confetti />}
        <button className="link" onClick={onBack}>← Lessons</button>

        <div className="page-head">
          <span className="eyebrow">CHAPTER QUIZ</span>
          <h1>{quiz.title}</h1>
          {!result && <p>{total} questions · answer them all to submit</p>}
        </div>

        {result ? (
          <>
            <section className="card result">
              <div className="result-badge">{result.score >= 80 ? '🏆' : result.score >= 60 ? '🎉' : '💪'}</div>
              <h2>Quiz complete!</h2>
              <div className="score">{result.score}%</div>
              <p>{result.correct} of {result.total} answers correct.</p>
              <div className="xp-gain-chip">+{xpGained} XP earned</div>
              <div className="result-actions">
                <button className="primary" onClick={onBack}>Back to learning</button>
                {result.score < 100 && (
                  <button className="secondary" onClick={retake}>Try again</button>
                )}
              </div>
            </section>

            {result.review && (
              <section className="review">
                <h2>Check your answers</h2>
                {result.review.map((item, i) => (
                  <article
                    className={`card review-item ${item.is_correct ? 'review-right' : 'review-wrong'}`}
                    key={i}
                  >
                    <div className="review-head">
                      <span className="q-number">{i + 1}</span>
                      <h3>{item.question}</h3>
                      <span className="review-status">
                        {item.is_correct ? '✓ Correct' : item.chosen < 0 ? 'Not answered' : '✗ Not quite'}
                      </span>
                    </div>
                    <ul className="review-options">
                      {item.options.map((option, j) => {
                        const isAnswer = j === item.correct;
                        const isWrongChoice = j === item.chosen && !item.is_correct;
                        return (
                          <li
                            key={j}
                            className={`review-option ${isAnswer ? 'is-answer' : ''} ${isWrongChoice ? 'is-wrong-choice' : ''}`}
                          >
                            <span>{option}</span>
                            {isAnswer && <span className="review-tag">Correct answer</span>}
                            {isWrongChoice && <span className="review-tag">Your answer</span>}
                          </li>
                        );
                      })}
                    </ul>
                    {item.explanation && <p className="review-explain">💡 {item.explanation}</p>}
                    {item.concept && <span className="review-concept">Topic: {item.concept}</span>}
                  </article>
                ))}
              </section>
            )}
          </>
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
