import React from 'react';
import Avatar from './Avatar';

export default function AvatarRow({ users, rsvps, size = 26 }) {
  return (
    <div className="avatar-row">
      {users.map(u => (
        <Avatar key={u.uid} user={u} size={size} status={rsvps?.[u.uid] || 'out'} />
      ))}
    </div>
  );
}
