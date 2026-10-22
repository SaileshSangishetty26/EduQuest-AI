import React, { useEffect, useRef, useState } from 'react';
import Header from '../components/Header';
import { api } from '../services/api';

const SUGGESTIONS = [
  'What is the SI unit of length?',
  'Who gave the neem tree its name?',
  'What is 1/3 + 1/6?',
  'Is 91 a prime number?',
  'రైతు ఏమి చేస్తాడు?',
  'Explain lines and angles',
  'Give me a quiz',
  'What is my score?'
];

const ANSWER_LABELS = {
  textbook: '✅ Answer',
  math: '🧮 Answer'
};

const INTENT_LABELS = {
  greeting: 'Greeting',
  definition: 'Definition',
  concept_explanation: 'Explanation',
  example_request: 'Example',
  formula_help: 'Method',
  homework_help: 'Homework',
  clarification: 'Clarification',
  quiz_help: 'Quiz',
  progress_help: 'Progress',
  out_of_scope: 'Off topic',
  browse_content: 'Chapters',
  study_advice: 'Study plan',
  calculation: 'Calculation',
  telugu_question: 'తెలుగు'
};

// When the bot found an exact answer, the reply starts with it; it is shown in
// the highlighted box instead, so the bubble does not say it twice.
function splitAnswer(m) {
  if (!m.answer || !ANSWER_LABELS[m.answer.source]) return { box: null, body: m.text };
  const parts = m.text.split('\n\n');
  return { box: m.answer, body: parts.slice(1).join('\n\n') };
}

export default function Chat({ user, level, streak, onBack, onLessons, onLogout, onSettings, onOpenLesson }) {
  const [messages, setMessages] = useState([
    {
      from: 'bot',
      text: `Hi ${user.username}! Ask me about any chapter, request a quiz, or check your progress.`
    }
  ]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, sending]);

  async function send(text) {
    const message = (text ?? input).trim();
    if (!message || sending) return;

    setMessages(m => [...m, { from: 'student', text: message }]);
    setInput('');
    setSending(true);

    try {
      const res = await api.chat({
        message,
        user_id: user.id,
        grade: user.grade,
        language: user.language
      });

      setMessages(m => [
        ...m,
        {
          from: 'bot',
          text: res.reply,
          intent: res.intent,
          confidence: res.confidence,
          understood: res.understood,
          lesson: res.lesson,
          answer: res.answer
        }
      ]);
    } catch (err) {
      setMessages(m => [
        ...m,
        {
          from: 'bot',
          text: 'I could not reach the server. Check that the backend is running, then try again.',
          error: true
        }
      ]);
    } finally {
      setSending(false);
    }
  }

  return (
    <>
      <Header user={user} onHome={onBack} onLessons={onLessons} onSettings={onSettings} onLogout={onLogout} level={level} streak={streak} />

      <main className="container">
        <button className="link" onClick={onBack}>← Dashboard</button>

        <div className="page-head">
          <span className="eyebrow">STUDY BUDDY</span>
          <h1>Ask me anything 🤖</h1>
          <p>Ask a question about any chapter and I will find the answer in your textbook. I can also work out maths, answer in Telugu, set you a quiz, or tell you how you are doing.</p>
        </div>

        <section className="card chat-panel">
          <div className="chat-log">
            {messages.map((m, i) => {
              const { box, body } = splitAnswer(m);
              return (
              <div key={i} className={`chat-row ${m.from}`}>
                <div className={`chat-bubble ${m.from}${m.error ? ' chat-error' : ''}`}>
                  {box && (
                    <div className="chat-answer">
                      <span>{ANSWER_LABELS[box.source]}</span>
                      <b>{box.text}</b>
                    </div>
                  )}
                  {body && <p>{body}</p>}

                  {m.lesson && (
                    <button className="chat-lesson" onClick={() => onOpenLesson(m.lesson)}>
                      📘 Open “{m.lesson.title}”
                    </button>
                  )}

                  {m.from === 'bot' && m.intent && (
                    <div className="chat-meta">
                      <span className={`chat-tag ${m.understood ? '' : 'chat-tag-unsure'}`}>
                        {INTENT_LABELS[m.intent] || m.intent}
                      </span>
                      {box?.source === 'textbook' ? (
                        <span className="chat-conf">answer {Math.round(box.score * 100)}% sure · from the textbook</span>
                      ) : m.intent !== 'calculation' && (
                        <span className="chat-conf">{Math.round(m.confidence * 100)}% sure</span>
                      )}
                    </div>
                  )}
                </div>
              </div>
              );
            })}

            {sending && (
              <div className="chat-row bot">
                <div className="chat-bubble bot">
                  <span className="chat-typing"><i /><i /><i /></span>
                </div>
              </div>
            )}

            <div ref={endRef} />
          </div>

          <div className="chat-suggestions">
            {SUGGESTIONS.map(s => (
              <button key={s} className="pill" onClick={() => send(s)} disabled={sending}>
                {s}
              </button>
            ))}
          </div>

          <div className="chat-input">
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && send()}
              placeholder="Type your question..."
              disabled={sending}
            />
            <button className="primary" onClick={() => send()} disabled={sending || !input.trim()}>
              Send
            </button>
          </div>
        </section>

        <p className="chat-note">
          The first question may take a few seconds while the language models load.
        </p>
      </main>
    </>
  );
}
