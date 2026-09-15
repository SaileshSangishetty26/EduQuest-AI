import React, { useEffect, useRef, useState } from 'react';
import Header from '../components/Header';
import { api } from '../services/api';

const SUGGESTIONS = [
  'Explain lines and angles',
  'How do camels survive in the desert?',
  'What is an acid?',
  'Give me a quiz',
  'What is my score?'
];

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
  out_of_scope: 'Off topic'
};

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
          lesson: res.lesson
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
          <p>I can explain chapters, find examples, set you a quiz, or tell you how you are doing.</p>
        </div>

        <section className="card chat-panel">
          <div className="chat-log">
            {messages.map((m, i) => (
              <div key={i} className={`chat-row ${m.from}`}>
                <div className={`chat-bubble ${m.from}${m.error ? ' chat-error' : ''}`}>
                  <p>{m.text}</p>

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
                      <span className="chat-conf">{Math.round(m.confidence * 100)}% sure</span>
                    </div>
                  )}
                </div>
              </div>
            ))}

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
