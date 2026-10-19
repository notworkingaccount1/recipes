import { useState, type FormEvent } from 'react';
import type { Data, Ingredient, Ratings, RawRecipe, Recipe, Status } from '../types';
import { ingredientNames, ingredientUnits } from '../lib/data';
import { STATUS, nkey, num, ukey, uid } from '../lib/utils';
import Dialog from './Dialog';
import StarInput from './StarInput';
import { IconX } from './icons';

interface Row { k: number; focus: boolean; name: string; amount: string; unit: string }

let rowKey = 0;
const mkRow = (i: Partial<Ingredient> = {}, focus = false): Row => ({
  k: ++rowKey, focus,
  name: i.name || '', amount: i.amount == null ? '' : String(i.amount), unit: i.unit || ''
});

interface BodyProps {
  r: Recipe | null;
  data: Data;
  defaultStatus: Status;
  defaultCat: string;
  onSave: (raw: RawRecipe) => void;
  onClose: () => void;
  onNewCat: (done: (c: string) => void) => void;
}

function FormBody({ r, data, defaultStatus, defaultCat, onSave, onClose, onNewCat }: BodyProps) {
  const [title, setTitle] = useState(r?.title || '');
  const [status, setStatus] = useState<Status>(r?.status || defaultStatus);
  const [category, setCategory] = useState(r?.category || defaultCat);
  const [ratings, setRatings] = useState<Ratings>({ ...(r?.ratings || {}) });
  const [notes, setNotes] = useState(r?.notes || '');
  const [rows, setRows] = useState(() => (r?.ingredients.length ? r.ingredients : [{}]).map((i: Partial<Ingredient>) => mkRow(i)));
  const [err, setErr] = useState('');

  const setRow = (k: number, field: 'name' | 'amount' | 'unit', value: string) =>
    setRows(rs => rs.map(x => (x.k === k ? { ...x, [field]: value } : x)));

  function submit(e: FormEvent) {
    e.preventDefault();
    const t = title.trim(), cat = category.trim();
    if (!t || !cat) return;
    if (status === 'cooked' && !data.raters.every(p => num(ratings[p.id]))) {
      setErr('Для приготованого рецепта виставте оцінки від усіх.');
      return;
    }
    // Merge duplicate ingredients (same name and unit family) into one line
    const ingredients: Record<string, string | number> = {}, seen: Record<string, string> = {};
    rows.forEach(row => {
      const name = row.name.trim();
      if (!name) return;
      const a = row.amount.trim().replace(',', '.'), unit = row.unit.trim();
      const val = a !== '' && isFinite(+a) ? +a : a, k = nkey(name) + '|' + ukey(unit);
      if (seen[k]) {
        const key0 = seen[k];
        if (num(ingredients[key0]) && num(val)) ingredients[key0] = Math.round((ingredients[key0] + val) * 1000) / 1000;
        else if (val !== '') ingredients[key0] = val;
        return;
      }
      seen[k] = unit ? `${name}, ${unit}` : name;
      ingredients[seen[k]] = val;
    });
    onSave({ id: r?.id || uid(), title: t, status, category: cat, ratings, ingredients, notes: notes.trim() });
  }

  return (
    <form className="sheet__form" onSubmit={submit}>
      <div className="sheet__head">
        <div className="sheet__heading"><h2 className="sheet__title" id="f-head">{r ? 'Редагування' : 'Новий рецепт'}</h2></div>
        <button className="icon-button" type="button" aria-label="Закрити" onClick={onClose}><IconX /></button>
      </div>

      <div className="sheet__body">
        <label className="field">
          <span className="field__label">Назва</span>
          <input className="input" required maxLength={80} autoComplete="off" value={title} onChange={e => setTitle(e.target.value)} />
        </label>

        <div className="field">
          <span className="field__label">Список</span>
          <div className="pills">
            {Object.entries(STATUS).map(([k, label]) => (
              <button
                key={k}
                type="button"
                className={'pill' + (status === k ? ' pill--active' : '')}
                aria-pressed={status === k}
                onClick={() => setStatus(k as Status)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="field">
          <span className="field__label" id="l-cat">Категорія</span>
          <div className="field__row">
            <select className="input" required aria-labelledby="l-cat" value={category} onChange={e => setCategory(e.target.value)}>
              {!data.categories.length && <option value="">Оберіть категорію</option>}
              {data.categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <button className="button" type="button" onClick={() => onNewCat(c => setCategory(c))}>+ Нова</button>
          </div>
        </div>

        <div className="field" hidden={status !== 'cooked'}>
          <span className="field__label">Оцінки</span>
          <div>
            {data.raters.map(p => (
              <div className="rate-row" key={p.id}>
                <span className="rate-row__name">{p.name}</span>
                <StarInput value={ratings[p.id]} label={'Оцінка: ' + p.name} onSet={n => { setRatings(x => ({ ...x, [p.id]: n })); setErr(''); }} />
              </div>
            ))}
          </div>
        </div>

        <div className="field">
          <span className="field__label">Інгредієнти</span>
          <div>
            {rows.map(row => (
              <div className="ingredient-row" key={row.k}>
                <input className="input input--compact" list="dl-names" placeholder="Назва" aria-label="Назва інгредієнта" maxLength={60} autoFocus={row.focus}
                  value={row.name} onChange={e => setRow(row.k, 'name', e.target.value)} />
                <input className="input input--compact" placeholder="К-сть" aria-label="Кількість" inputMode="decimal"
                  value={row.amount} onChange={e => setRow(row.k, 'amount', e.target.value)} />
                <input className="input input--compact" list="dl-units" placeholder="Од." aria-label="Одиниця" maxLength={20}
                  value={row.unit} onChange={e => setRow(row.k, 'unit', e.target.value)} />
                <button type="button" className="icon-button icon-button--small" aria-label="Прибрати інгредієнт" onClick={() => setRows(rs => rs.filter(x => x.k !== row.k))}>
                  <IconX />
                </button>
              </div>
            ))}
          </div>
          <div>
            <button className="pill" type="button" onClick={() => setRows(rs => [...rs, mkRow({}, true)])}>+ Інгредієнт</button>
          </div>
          <datalist id="dl-names">{[...ingredientNames(data)].map(([k, n]) => <option key={k} value={n} />)}</datalist>
          <datalist id="dl-units">{ingredientUnits(data).map(u => <option key={u} value={u} />)}</datalist>
        </div>

        <label className="field">
          <span className="field__label">Нотатки</span>
          <textarea className="input input--textarea" rows={4} value={notes} onChange={e => setNotes(e.target.value)} />
        </label>

        {err && <p className="form-error" role="alert">{err}</p>}
      </div>

      <div className="sheet__foot">
        <button className="button" type="button" onClick={onClose}>Скасувати</button>
        <button className="button button--primary" type="submit">Зберегти</button>
      </div>
    </form>
  );
}

interface Props extends Omit<BodyProps, 'r'> { form: { recipe: Recipe | null } | null }

export default function RecipeForm({ form, data, defaultStatus, defaultCat, onSave, onClose, onNewCat }: Props) {
  return (
    <Dialog open={!!form} onClose={onClose} label="f-head">
      {form && <FormBody r={form.recipe} {...{ data, defaultStatus, defaultCat, onSave, onClose, onNewCat }} />}
    </Dialog>
  );
}
