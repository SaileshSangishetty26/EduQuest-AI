import React, { useState } from 'react';
import { api } from '../services/api';
import { AVATARS, avatarForUser, setAvatarForUser } from '../utils/gamify';

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'te', label: 'తెలుగు' },
  { code: 'hi', label: 'हिंदी' }
];

export default function ProfileSettings({ user, game, onUpdated, onClose }) {
  const currentAvatar = avatarForUser(user);
  const [language, setLanguage] = useState(user.language);
  const [avatar, setAvatar] = useState(currentAvatar);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Base avatars plus reward avatars; locked rewards show the level needed.
  const unlocked = new Set(game?.avatars || AVATARS);
  const rewards = game?.rewards || [];

  const changed = language !== user.language || avatar !== currentAvatar;

  async function save() {
    if (!changed || saving) return;
    setSaving(true);
    setError('');
    try {
      const payload = {};
      if (language !== user.language) payload.language = language;
      if (avatar !== currentAvatar) payload.avatar = avatar;
      const res = await api.updateProfile(user.id, payload);
      if (payload.avatar) setAvatarForUser(res.user, payload.avatar);
      onUpdated(res.user);
      onClose();
    } catch (err) {
      setError(err.message && err.message !== 'Request failed'
        ? err.message
        : 'Could not save. Check that the server is running.');
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
            <h2>Avatar and language</h2>
          </div>
          <button className="link" onClick={onClose}>Close</button>
        </div>

        <p className="settings-note">
          Signed in as <b>{user.username}</b>, Grade {user.grade}.
        </p>

        <div className="settings-group">
          <span className="settings-label">Avatar</span>
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
            {rewards.map(r => {
              const open = unlocked.has(r.avatar);
              return (
                <button
                  type="button"
                  key={r.avatar}
                  className={`avatar-option ${avatar === r.avatar ? 'avatar-option-selected' : ''} ${open ? '' : 'avatar-option-locked'}`}
                  onClick={() => open && setAvatar(r.avatar)}
                  disabled={!open}
                  title={open ? r.name : `Reach level ${r.level} to unlock`}
                >
                  {open ? r.avatar : '🔒'}
                </button>
              );
            })}
          </div>
          {rewards.length > 0 && (
            <p className="settings-hint">🔒 Reward avatars unlock as you level up.</p>
          )}
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
