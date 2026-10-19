import { useState } from 'react';
import { MAX } from '../lib/utils';
import { IconStar } from './icons';

interface Props { value?: number; onSet: (n: number) => void; label: string }

export default function StarInput({ value, onSet, label }: Props) {
  const [v, setV] = useState(value || 0);
  return (
    <div className="star-input" role="radiogroup" aria-label={label}>
      {[1, 2, 3, 4, 5].map(n => (
        <button
          key={n}
          type="button"
          className={'star-input__star' + (n <= v ? ' star-input__star--on' : '')}
          role="radio"
          aria-checked={n === v}
          aria-label={`${n} з ${MAX}`}
          onClick={() => { onSet(n); setV(n); }}
        >
          <IconStar />
        </button>
      ))}
    </div>
  );
}
