import { useEffect, useState } from 'react';
import type { Rater, Recipe } from '../types';
import type { SharedApi } from '../hooks/useShared';
import { avg } from '../lib/data';
import { STATUS, cap, fmt, num } from '../lib/utils';
import Dialog from './Dialog';
import Stars from './Stars';
import Tile from './Tile';
import { IconX } from './icons';

/** Two-step delete: the first click arms the button, the second one confirms. */
function DeleteButton({ onConfirm }: { onConfirm: () => void }) {
  const [armed, setArmed] = useState(false);
  useEffect(() => {
    if (!armed) return;
    const t = setTimeout(() => setArmed(false), 3000);
    return () => clearTimeout(t);
  }, [armed]);
  return (
    <button
      className={'button button--danger' + (armed ? ' button--armed' : '')}
      type="button"
      onClick={() => (armed ? onConfirm() : setArmed(true))}
    >
      {armed ? 'Точно видалити?' : 'Видалити'}
    </button>
  );
}

export function ShopToggle({ id, sh }: { id: string; sh: SharedApi }) {
  const on = sh.shared.shop.has(id);
  return (
    <button
      type="button"
      className={'pill pill--small' + (on ? ' pill--active' : '')}
      aria-pressed={on}
      onClick={() => sh.setShared('s', id, !on)}
    >
      {on ? 'В покупках' : '+ У покупки'}
    </button>
  );
}

interface Props {
  r: Recipe | null | undefined;
  raters: Rater[];
  sh: SharedApi;
  onClose: () => void;
  onMove: (r: Recipe) => void;
  onEdit: (r: Recipe) => void;
  onDelete: (id: string) => void;
}

export default function RecipeDialog({ r, raters, sh, onClose, onMove, onEdit, onDelete }: Props) {
  const a = r && r.status === 'cooked' ? avg(r, raters) : null;
  return (
    <Dialog open={!!r} onClose={onClose} label="d-title" backdrop>
      {r && (
        <>
          <div className="sheet__head">
            <Tile r={r} />
            <div className="sheet__heading">
              <span className={'status-chip' + (r.status === 'cooked' ? ' status-chip--cooked' : '')}>{STATUS[r.status]}</span>
              <span className="tag">{r.category}</span>
              <h2 className="sheet__title" id="d-title">{r.title}</h2>
            </div>
            <button className="icon-button" type="button" aria-label="Закрити" onClick={onClose}><IconX size={20} /></button>
          </div>

          <div className="sheet__body">
            {r.status === 'cooked' && (
              <section className="section">
                <div className="rating">
                  <span className="rating__num">{a == null ? '—' : fmt(a)}</span>
                  <div className="rating__summary">{a != null && <Stars v={a} s={26} />}<span>Загальна оцінка</span></div>
                </div>
                <div className="rating__list">
                  {raters.map(p => {
                    const v = r.ratings[p.id];
                    return (
                      <div className="rating__item" key={p.id}>
                        <span className="rating__name">{p.name}</span>
                        {num(v)
                          ? <span className="rating__value"><Stars v={v} s={16} /><b>{fmt(v)}</b></span>
                          : <span className="rating__value rating__value--empty">Без оцінки</span>}
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {r.ingredients.length > 0 && (
              <section className="section">
                <div className="section__head">
                  <h3 className="section__title">Інгредієнти<span className="section__count">{r.ingredients.length}</span></h3>
                  {r.status === 'planned' && <ShopToggle id={r.id} sh={sh} />}
                </div>
                <ul className="ingredients">
                  {r.ingredients.map((i, idx) => (
                    <li className="ingredients__item" key={idx}>
                      <span>{cap(i.name)}</span>
                      <span className="ingredients__qty">
                        {typeof i.amount === 'number' ? fmt(i.amount) : String(i.amount ?? '')}
                        {i.unit && <span className="ingredients__unit">{' ' + i.unit}</span>}
                      </span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {r.notes && (
              <section className="section">
                <h3 className="section__title">Нотатки</h3>
                <p className="notes">{r.notes}</p>
              </section>
            )}
          </div>

          <div className="sheet__foot">
            <button className="button button--primary button--wide" type="button" onClick={() => onMove(r)}>
              {r.status === 'cooked' ? 'Повернути в «У планах»' : 'Перенести в «Вже готували»'}
            </button>
            <button className="button" type="button" onClick={() => onEdit(r)}>Редагувати</button>
            <DeleteButton onConfirm={() => onDelete(r.id)} />
          </div>
        </>
      )}
    </Dialog>
  );
}
