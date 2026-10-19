import type { Recipe } from '../types';
import { hash } from '../lib/utils';

export default function Tile({ r }: { r: Recipe }) {
  return (
    <span className={`tile tile--${hash(r.id) % 6}`} aria-hidden="true">
      {[...r.title][0].toUpperCase()}
    </span>
  );
}
