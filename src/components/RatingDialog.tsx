import { useState } from 'react';
import type { Ratings, Rater, Recipe } from '../types';
import { num } from '../lib/utils';
import Dialog from './Dialog';
import StarInput from './StarInput';
import { IconX } from './icons';

interface BodyProps { r: Recipe; raters: Rater[]; onSave: (v: Ratings) => void; onClose: () => void }

function Body({ r, raters, onSave, onClose }: BodyProps) {
  const [v, setV] = useState<Ratings>(() => {
    const o: Ratings = {};
    raters.forEach(p => { if (num(r.ratings[p.id])) o[p.id] = r.ratings[p.id]; });
    return o;
  });
  const ok = raters.every(p => num(v[p.id]));
  return (
    <>
      <div className="sheet__head">
        <div className="sheet__heading">
          <span className="status-chip status-chip--cooked">Оцінки для переносу</span>
          <h2 className="sheet__title" id="rate-title">{r.title}</h2>
        </div>
        <button className="icon-button" type="button" aria-label="Закрити" onClick={onClose}><IconX /></button>
      </div>
      <div className="sheet__body">
        {raters.map(p => (
          <div className="rate-row" key={p.id}>
            <span className="rate-row__name">{p.name}</span>
            <StarInput value={v[p.id]} label={'Оцінка: ' + p.name} onSet={n => setV(x => ({ ...x, [p.id]: n }))} />
          </div>
        ))}
      </div>
      <div className="sheet__foot">
        <button className="button" type="button" onClick={onClose}>Скасувати</button>
        <button className="button button--primary" type="button" disabled={!ok} onClick={() => onSave({ ...v })}>Перенести</button>
      </div>
    </>
  );
}

interface Props { recipe: Recipe | null; raters: Rater[]; onSave: (v: Ratings) => void; onClose: () => void }

export default function RatingDialog({ recipe, raters, onSave, onClose }: Props) {
  return (
    <Dialog open={!!recipe} onClose={onClose} label="rate-title" backdrop>
      {recipe && <Body r={recipe} raters={raters} onSave={onSave} onClose={onClose} />}
    </Dialog>
  );
}
