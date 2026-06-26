import React from 'react';

// Quiet placeholder rows shown while a collection is still loading, so a returning
// user never sees a false "nothing here yet" flash before their data hydrates.
export default function Skeleton({ rows = 3 }) {
  return (
    <div aria-hidden="true" style={{ padding: '6px 0' }}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="skeleton-row" style={{ width: `${[88, 72, 80][i % 3]}%` }} />
      ))}
    </div>
  );
}
