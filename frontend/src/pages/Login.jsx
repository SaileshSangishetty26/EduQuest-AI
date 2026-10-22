import React, { useState } from 'react';
import { api } from '../services/api';

export default function Login({ onRegister, onLoggedIn }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const r = await api.login({ username, password });
      onLoggedIn(r.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-page">
      <div className="auth-mascot">🦉</div>
      <form className="card auth-card" onSubmit={submit}>
        <div className="logo">🎓 EduQuest</div>
        <h1>Welcome back, adventurer</h1>
        <p>Continue your learning quest.</p>
        <label>
          Username
          <input value={username} onChange={e => setUsername(e.target.value)} required />
        </label>
        <label>
          Password
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} required />
        </label>
        {error && <div className="error">{error}</div>}
        <button className="primary" disabled={loading}>{loading ? 'Logging in…' : 'Log in →'}</button>
        <button type="button" className="link" onClick={onRegister}>New here? Create an account</button>
        <p className="auth-note">Teachers sign in here too, with the account set up for them.</p>
      </form>
    </main>
  );
}
