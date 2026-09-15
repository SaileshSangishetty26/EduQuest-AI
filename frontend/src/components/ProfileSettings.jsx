import React, { useState } from 'react';
import { api } from '../services/api';

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'te', label: 'తెలుగు' },
  { code: 'hi', label: 'हिंदी' }
];

const GRADES = [6, 7];

export default function ProfileSettings({ user, onUpdated, onClose }) {
  const [grade, setGrade] = useState(user.grade);
  const [language, setLanguage] = useState(user.language);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const changed = grade !== user.grade || language !== user.language;

  async function save() {
    if (!changed || saving) return;
    setSaving(true);
    setError('');
    try {
      const res = await api.updateProfile(user.id, { grade, language });
      onUpdated(res.user);
      onClose();
    } catch (err) {
      setError('Could not save. Check that the server is running.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="settings-backdrop" onClick={onClose}>
      <div className="card settings-panel" onClick={e => e.stopPropagation()}>
        <div className="settings-head">
          <div>
            <span className="eyebrow">YOUR SETTINGS</span>
            <h2>Grade and language</h2>
          </div>
          <button className="link" onClick={onClose}>Close</button>
        </div>

        <p className="settings-note">
          Signed in as <b>{user.username}</b>. Changing these updates which
          chapters and quizzes you see.
        </p>

        <div className="settings-group">
          <span className="settings-label">Grade</span>
          <div className="pill-filters">
            {GRADES.map(g => (
              <button
                key={g}
                className={`pill ${grade === g ? 'pill-active' : ''}`}
                onClick={() => setGrade(g)}
              >
                Grade {g}
              </button>
            ))}
          </div>
        </div>

        <div className="settings-group">
          <span className="settings-label">Preferred language</span>
          <div className="pill-filters">
            {LANGUAGES.map(l => (
              <button
                key={l.code}
                className={`pill ${language === l.code ? 'pill-active' : ''}`}
                onClick={() => setLanguage(l.code)}
              >
                {l.label}
              </button>
            ))}
          </div>
          {language !== 'en' && (
            <p className="settings-hint">
              🌐 Chapters are not available in this language yet, so you will
              see the English versions with a note.
            </p>
          )}
        </div>

        {error && <p className="settings-error">{error}</p>}

        <div className="settings-actions">
          <button className="primary" onClick={save} disabled={!changed || saving}>
            {saving ? 'Saving...' : 'Save changes'}
          </button>
          {!changed && <span className="settings-hint">Nothing changed yet.</span>}
        </div>
      </div>
    </div>
  );
}
