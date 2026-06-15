import React from 'react';

// Boot loader — the app's monument-over-the-bay icon coming alive while auth resolves.
// Echoes the home-screen icon + the Today hero's sky. CSS handles the motion (reduced-motion safe).
export default function Loader() {
  return (
    <div className="app-loader">
      <div className="app-loader-icon" aria-hidden="true">
        <svg viewBox="0 0 120 120" width="96" height="96">
          <defs>
            <linearGradient id="lsky" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#f6d27a" />
              <stop offset="0.5" stopColor="#e89b6c" />
              <stop offset="1" stopColor="#1a6b8a" />
            </linearGradient>
            <clipPath id="lclip"><rect width="120" height="120" rx="26" /></clipPath>
          </defs>
          <g clipPath="url(#lclip)">
            <rect width="120" height="120" fill="url(#lsky)" />
            <circle className="loader-sun" cx="82" cy="40" r="15" fill="#f8e7b2" opacity="0.9" />
            <rect y="88" width="120" height="32" fill="#13577a" />
            <path d="M50 120 L52 52 Q52 46 57 43 Q61 40 65 43 Q70 46 70 52 L72 120 Z" fill="#0e2d3a" />
            <rect x="53" y="58" width="16" height="3" rx="1" fill="#c8a84b" />
            <rect className="loader-shimmer" x="-60" y="0" width="40" height="120" fill="#ffffff" opacity="0.22" transform="skewX(-18)" />
          </g>
        </svg>
      </div>
      <div className="app-loader-msg">Loading your trip…</div>
    </div>
  );
}
