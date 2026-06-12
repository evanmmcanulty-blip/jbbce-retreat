import React, { useState } from 'react';

export default function Card({ title, subtitle, children, defaultOpen = false, rightContent }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="card">
      <div className="card-head" onClick={() => setOpen(!open)}>
        <div style={{ flex: 1 }}>
          <div className="card-title">{title}</div>
          {subtitle && <div className="card-sub">{subtitle}</div>}
        </div>
        {rightContent}
        <span className={`chev ${open ? 'open' : ''}`}>▼</span>
      </div>
      {open && <div className="card-body" style={{ paddingTop: 12 }}>{children}</div>}
    </div>
  );
}
