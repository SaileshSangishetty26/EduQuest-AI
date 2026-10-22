import React, { useState } from 'react';
import { api } from '../services/api';

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'te', label: 'తెలుగు' },
  { code: 'hi', label: 'हिंदी' }
];

export default function ProfileSettings({ user, onUpdated, onClose }) {
  const [language, setLanguage] = useState(user.language);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const changed = language !== user.language;

  async function save() {
    if (!changed || saving) return;
    setSaving(true);
    setError('');
    try {
      const res = await api.updateProfile(user.id, { language });
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
            <h2>Language</h2>
          </div>
          <button className="link" onClick={onClose}>Close</button>
        </div>

        <p className="settings-note">
          Signed in as <b>{user.username}</b>, Grade {user.grade}. Choose the
          language you would like to learn in.
        </p>

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
