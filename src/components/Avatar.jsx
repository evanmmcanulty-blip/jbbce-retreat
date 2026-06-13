import React, { useState } from 'react';
import { initials } from '../constants';

export default function Avatar({ user, size = 28, status, onClick }) {
  const [showTip, setShowTip] = useState(false);
  // The avatar field should hold a single emoji. Strip any stray ASCII (letters/
  // digits/space) that crept in — e.g. "EM👾" → "👾" — so initials and an emoji
  // never render stacked-and-clipped in the circle. Empty / ⭐ → color + initials
  // (instead of nine identical 👤 silhouettes).
  const rawAvatar = user?.avatar && user.avatar !== '⭐' ? user.avatar : '';
  const emojiAvatar = rawAvatar.replace(/[A-Za-z0-9\s]/g, '').trim();
  const hasEmoji = !!emojiAvatar;
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
      {hasEmoji ? emojiAvatar : initials(name)}
      {showTip && <div className="avatar-tooltip">{name}</div>}
    </div>
  );
}
