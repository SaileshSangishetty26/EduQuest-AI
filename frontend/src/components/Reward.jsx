import React from 'react';

// What an action earned: XP, a level-up, new badges and newly unlocked
// avatars. `result` is the `gamification` object the server returns after a
// quiz is submitted or a chapter is marked as read.
export default function Reward({ result }) {
  if (!result) return null;
  const { xp_gained: gained, level_up: levelUp, level, new_badges: badges = [], new_rewards: rewards = [], streak } = result;

  return (
    <div className="reward-box">
      <div className="xp-gain-chip">{gained > 0 ? `+${gained} XP earned` : 'No new XP this time'}</div>
      {gained === 0 && (
        <p className="reward-hint">You earn 10 XP for each question you get right that you had not got right before. Read the explanations below and try again!</p>
      )}
      {levelUp && <p className="reward-levelup">⬆️ Level up! You are now level {level}.</p>}
      {streak > 1 && <p className="reward-streak">🔥 {streak}-day learning streak</p>}
      {badges.length > 0 && (
        <div className="reward-badges">
          <span className="reward-label">New badge{badges.length > 1 ? 's' : ''} unlocked</span>
          <div className="badge-row">
            {badges.map(b => (
              <div className="badge-pill" key={b.id} title={b.description}>
                <span>{b.icon}</span>{b.label}
              </div>
            ))}
          </div>
        </div>
      )}
      {rewards.length > 0 && (
        <p className="reward-unlock">
          🎁 New avatar unlocked: {rewards.map(r => `${r.avatar} ${r.name}`).join(', ')}. Pick it with the ⚙️ button.
        </p>
      )}
    </div>
  );
}
