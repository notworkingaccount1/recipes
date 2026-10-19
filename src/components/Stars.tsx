import type { CSSProperties } from 'react';
import { MAX, fmt } from '../lib/utils';

export default function Stars({ v, s }: { v: number; s: number }) {
  return (
    <span
      className="stars"
      role="img"
      aria-label={`Оцінка ${fmt(v)} з ${MAX}`}
      style={{ '--pct': `${Math.min(1, Math.max(0, v / MAX)) * 100}%`, '--s': `${s}px` } as CSSProperties}
    />
  );
}
