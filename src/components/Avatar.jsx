import React, { useState } from 'react';
import { initials } from '../constants';

export default function Avatar({ user, size = 28, status, onClick }) {
  const [showTip, setShowTip] = useState(false);
  const style = {
    width: size, height: size, fontSize: size * 0.55,
    background: user?.color || '#888',
    color: '#fff',
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
      {user?.avatar && user.avatar !== '⭐' ? user.avatar : initials(name)}
      {showTip && <div className="avatar-tooltip">{name}</div>}
    </div>
  );
}
