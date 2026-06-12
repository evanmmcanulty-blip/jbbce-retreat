import React, { useState } from 'react';
import { initials } from '../constants';

export default function Avatar({ user, size = 28, status, onClick }) {
  const [showTip, setShowTip] = useState(false);
  const hasEmoji = user?.avatar && user.avatar !== '⭐';
  // Emoji avatars render as themselves; everyone else gets their color + initials
  // (instead of nine identical 👤 silhouettes)
  const style = {
    width: size, height: size,
    fontSize: hasEmoji ? size * 0.72 : size * 0.42,
    background: hasEmoji ? 'transparent' : (user?.color || '#888'),
    color: '#fff', fontWeight: 'bold',
  };
  const name = user?.displayName || user?.email || '?';
  return (
    <div
      className={`avatar ${status || ''}`}
      style={style}
      onClick={onClick}
      onMouseEnter={() => setShowTip(true)}
      onMouseLeave={() => setShowTip(false)}
      title={name}
    >
      {hasEmoji ? user.avatar : initials(name)}
      {showTip && <div className="avatar-tooltip">{name}</div>}
    </div>
  );
}
