// Client-side gamification layer.
// Turns the plain progress numbers the API already returns (lessons_completed,
// quiz_attempts, average_score) into XP, levels, titles and badges — no
// backend or schema changes required.

const XP_PER_LEVEL = 150;

export const LEVEL_TITLES = [
  'Wayfarer', 'Explorer', 'Trailblazer', 'Scholar', 'Strategist',
  'Champion', 'Luminary', 'Vanguard', 'Master', 'Legend'
];

export function computeXP(progress) {
  if (!progress) return 0;
  const lessons = progress.lessons_completed ?? 0;
  const attempts = progress.quiz_attempts ?? 0;
  const avg = progress.average_score ?? 0;
  return Math.round(lessons * 60 + attempts * 25 + avg * 1.5);
}

export function levelFromXP(xp) {
  const level = Math.floor(xp / XP_PER_LEVEL) + 1;
  const into = xp % XP_PER_LEVEL;
  const title = LEVEL_TITLES[Math.min(level - 1, LEVEL_TITLES.length - 1)];
  return {
    level,
    title,
    xpIntoLevel: into,
    xpForNextLevel: XP_PER_LEVEL,
    pct: Math.round((into / XP_PER_LEVEL) * 100)
  };
}

export function badgesFromProgress(progress) {
  const lessons = progress?.lessons_completed ?? 0;
  const attempts = progress?.quiz_attempts ?? 0;
  const avg = progress?.average_score ?? 0;
  const badges = [];
  if (lessons >= 1) badges.push({ id: 'first-chapter', icon: '📖', label: 'First Chapter' });
  if (lessons >= 5) badges.push({ id: 'bookworm', icon: '🐛', label: 'Bookworm' });
  if (attempts >= 1) badges.push({ id: 'first-quiz', icon: '🎯', label: 'First Quiz' });
  if (attempts >= 5) badges.push({ id: 'quiz-whiz', icon: '🧠', label: 'Quiz Whiz' });
  if (avg >= 80) badges.push({ id: 'sharp-shooter', icon: '🏹', label: 'Sharp Shooter' });
  if (avg >= 95) badges.push({ id: 'perfectionist', icon: '💎', label: 'Perfectionist' });
  return badges;
}

// Simple daily-streak counter kept in localStorage per user, since the
// backend doesn't track visit dates. Purely additive/cosmetic.
export function touchStreak(userId) {
  const key = `eduquest_streak_${userId}`;
  const today = new Date().toISOString().slice(0, 10);
  let data;
  try {
    data = JSON.parse(localStorage.getItem(key) || 'null');
  } catch {
    data = null;
  }

  if (!data) {
    data = { count: 1, last: today };
  } else if (data.last === today) {
    // already counted today
  } else {
    const prev = new Date(data.last);
    const now = new Date(today);
    const diffDays = Math.round((now - prev) / 86400000);
    data = diffDays === 1
      ? { count: data.count + 1, last: today }
      : { count: 1, last: today };
  }

  localStorage.setItem(key, JSON.stringify(data));
  return data.count;
}

export const AVATARS = ['🦊', '🐼', '🐯', '🦁', '🐨', '🦉', '🐸', '🐧', '🦄', '🐙'];

export function avatarForUser(user) {
  if (!user) return AVATARS[0];
  const stored = localStorage.getItem(`eduquest_avatar_${user.id}`);
  if (stored) return stored;
  const idx = Math.abs(hash(user.username || 'x')) % AVATARS.length;
  return AVATARS[idx];
}

export function setAvatarForUser(user, avatar) {
  localStorage.setItem(`eduquest_avatar_${user.id}`, avatar);
}

function hash(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h << 5) - h + str.charCodeAt(i);
    h |= 0;
  }
  return h;
}
