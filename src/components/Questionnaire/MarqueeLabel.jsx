import { useEffect, useRef, useState } from 'react';

/** Single-line label that scrolls when the text is wider than its slot. */
export function MarqueeLabel({ text, className = '' }) {
  const shellRef = useRef(null);
  const trackRef = useRef(null);
  const [shift, setShift] = useState(0);

  useEffect(() => {
    const shell = shellRef.current;
    const track = trackRef.current;
    if (!shell || !track) return undefined;

    function measure() {
      const next = Math.max(0, track.scrollWidth - shell.clientWidth);
      setShift(next);
    }

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(shell);
    observer.observe(track);
    return () => observer.disconnect();
  }, [text]);

  return (
    <span
      ref={shellRef}
      className={[className, shift > 0 ? 'is-marquee' : ''].filter(Boolean).join(' ')}
    >
      <span
        ref={trackRef}
        className="marquee-track"
        style={shift > 0 ? { '--marquee-shift': `${shift}px` } : undefined}
      >
        {text}
      </span>
    </span>
  );
}
