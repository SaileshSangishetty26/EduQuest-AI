import React, { useState } from 'react';
import { api } from '../services/api';
import { AVATARS, setAvatarForUser } from '../utils/gamify';

export default function Register({ onLogin, onRegistered }) {
  const [form, setForm] = useState({ username: '', password: '', grade: 6, language: 'en' });
  const [avatar, setAvatar] = useState(AVATARS[0]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const change = (k, v) => setForm({ ...form, [k]: v });

  async function submit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const r = await api.register({ ...form, grade: Number(form.grade) });
      setAvatarForUser(r.user, avatar);
      onRegistered(r.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-page">
      <div className="auth-mascot">🧭</div>
      <form className="card auth-card" onSubmit={submit}>
        <div className="logo">🎓 EduQuest</div>
        <h1>Start your quest</h1>
        <p>Pick an avatar, choose your grade and preferred language.</p>

        <label>Pick your avatar</label>
        <div className="avatar-picker">
          {AVATARS.map(a => (
            <button
              type="button"
              key={a}
              className={`avatar-option ${avatar === a ? 'avatar-option-selected' : ''}`}
              onClick={() => setAvatar(a)}
            >
              {a}
            </button>
          ))}
        </div>

        <label>Username
          <input value={form.username} onChange={e => change('username', e.target.value)} minLength="3" required />
        </label>
        <label>Password
          <input type="password" value={form.password} onChange={e => change('password', e.target.value)} minLength="6" required />
        </label>
        <label>Grade
          <select value={form.grade} onChange={e => change('grade', e.target.value)}>
            <option value="6">Grade 6</option>
            <option value="7">Grade 7</option>
          </select>
        </label>
        <label>Preferred language
          <select value={form.language} onChange={e => change('language', e.target.value)}>
            <option value="en">English</option>
            <option value="te">Telugu</option>
            <option value="hi">Hindi</option>
          </select>
        </label>
        {error && <div className="error">{error}</div>}
        <button className="primary" disabled={loading}>{loading ? 'Creating…' : 'Begin quest →'}</button>
        <button type="button" className="link" onClick={onLogin}>Already have an account? Login</button>
      </form>
    </main>
  );
}
