import type { Rater, Recipe } from '../types';
import { avg } from '../lib/data';
import { cap, fmt } from '../lib/utils';
import Stars from './Stars';
import Tile from './Tile';
import { IconChev } from './icons';

interface Props { r: Recipe; raters: Rater[]; onOpen: (id: string) => void }

export default function RecipeCard({ r, raters, onOpen }: Props) {
  const rate = r.status === 'cooked' ? avg(r, raters) : null;
  const names = r.ingredients.map(i => i.name);
  const meta = names.length
    ? cap(names.slice(0, 3).join(', ')) + (names.length > 3 ? ` та ще ${names.length - 3}` : '')
    : 'Без інгредієнтів';
  return (
    <li>
      <button className="card" type="button" onClick={() => onOpen(r.id)}>
        <Tile r={r} />
        <span className="card__body">
          <span className="card__title">{r.title}</span>
          {r.status === 'cooked' && (rate == null
            ? <span className="card__rating card__rating--empty">Без оцінки</span>
            : <span className="card__rating"><Stars v={rate} s={16} /><b className="card__rating-value">{fmt(rate)}</b></span>)}
          <span className="card__meta">{meta}</span>
        </span>
        <IconChev className="card__chevron" />
      </button>
    </li>
  );
}
