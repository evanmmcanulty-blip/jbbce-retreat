import React, { useRef, useEffect } from 'react';

// Text input with Google Maps Places Autocomplete.
// Degrades to a plain text input if the Maps JS API hasn't been loaded.
// To enable: add your restricted Maps API key to public/index.html (see comment there).
export default function PlaceInput({ value, onChange, placeholder, style, className }) {
  const inputRef = useRef(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    if (!inputRef.current) return;
    let ac = null;
    let timer = null;

    const init = () => {
      if (!inputRef.current || !window.google?.maps?.places) return;
      ac = new window.google.maps.places.Autocomplete(inputRef.current, {
        types: ['establishment', 'geocode'],
        fields: ['name', 'formatted_address'],
        componentRestrictions: { country: 'us' },
      });
      ac.addListener('place_changed', () => {
        const p = ac.getPlace();
        onChangeRef.current(p.name || p.formatted_address || inputRef.current.value);
      });
    };

    if (window.google?.maps?.places) {
      init();
    } else {
      timer = setInterval(() => {
        if (window.google?.maps?.places) { clearInterval(timer); timer = null; init(); }
      }, 300);
    }

    return () => {
      if (timer) clearInterval(timer);
      if (ac && window.google?.maps?.event) {
        window.google.maps.event.clearInstanceListeners(ac);
      }
    };
  }, []); // stable — onChangeRef keeps callback fresh without re-running

  return (
    <input
      ref={inputRef}
      value={value}
      onChange={e => onChangeRef.current(e.target.value)}
      placeholder={placeholder}
      style={style}
      className={className}
      autoComplete="off"
    />
  );
}
