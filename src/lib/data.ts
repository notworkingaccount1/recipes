import type { AggItem, Changes, Data, RawData, RawRecipe, Rater, Recipe } from '../types';
import { num, nkey, ukey, cap, slug, FAM } from './utils';

export const emptyChanges = (): Changes => ({ upserts: {}, deleted: [], cats: [] });
export const countChanges = (c: Changes) => Object.keys(c.upserts).length + c.deleted.length + c.cats.length;

export function normalize(raw: RawData): Data {
  const raters = raw.raters?.length ? raw.raters : [{ id: 'sasha', name: 'Саша' }, { id: 'nazar', name: 'Назар' }];
  const recipes: Recipe[] = (raw.recipes || []).map(r => ({
    id: r.id,
    title: String(r.title || 'Без назви'),
    status: r.status === 'cooked' ? 'cooked' : 'planned',
    category: String(r.category || 'Інше'),
    ratings: r.ratings || {},
    notes: String(r.notes || '').trim(),
    ingredients: Object.entries(r.ingredients || {}).map(([key, amount]) => {
      const i = key.lastIndexOf(',');
      return { name: (i < 0 ? key : key.slice(0, i)).trim(), unit: i < 0 ? '' : key.slice(i + 1).trim(), amount };
    })
  }));
  const categories = [...new Set([...(raw.categories || []), ...recipes.map(r => r.category)])];
  return { title: raw.title || 'Наші рецепти', raters, categories, recipes };
}

export const toRaw = (r: Recipe): RawRecipe => ({
  id: r.id, title: r.title, status: r.status, category: r.category, ratings: r.ratings,
  ingredients: Object.fromEntries(r.ingredients.map(i => [i.unit ? `${i.name}, ${i.unit}` : i.name, i.amount])),
  notes: r.notes
});

/** Makes sure every recipe has an id. */
export const prepBase = (raw: RawData): RawData & { recipes: RawRecipe[] } => ({
  ...raw,
  recipes: (raw.recipes || []).map((r, i) => ({ ...r, id: String(r.id || slug(r.title) || 'r' + i) }))
});

/** File + local changes -> final state. */
export function applyChanges(rawBase: RawData & { recipes: RawRecipe[] }, changes: Changes) {
  const del = new Set(changes.deleted), up = changes.upserts, seen = new Set<string>();
  const list = rawBase.recipes.filter(r => !del.has(r.id)).map(r => (seen.add(r.id), up[r.id] || r));
  Object.entries(up).forEach(([id, r]) => seen.has(id) || list.push(r));
  const data = normalize({ ...rawBase, categories: [...(rawBase.categories || []), ...changes.cats], recipes: list });
  return { mergedRaw: list, data, byId: new Map(data.recipes.map(r => [r.id, r] as const)) };
}

export const avg = (r: Recipe, raters: Rater[]) => {
  const v = raters.map(p => r.ratings[p.id]).filter(num);
  return v.length ? v.reduce((a, b) => a + b, 0) / v.length : null;
};
export const score = (r: Recipe, who: string, raters: Rater[]) =>
  who === 'avg' ? avg(r, raters) : (num(r.ratings[who]) ? r.ratings[who] : null);

export function ingredientNames(data: Data) {
  const m = new Map<string, string>();
  data.recipes.forEach(r => r.ingredients.forEach(i => { const k = nkey(i.name); if (k && !m.has(k)) m.set(k, cap(i.name)); }));
  return new Map([...m].sort((a, b) => a[1].localeCompare(b[1], 'uk')));
}
export function ingredientUnits(data: Data) {
  const us = new Map<string, string>();
  data.recipes.forEach(x => x.ingredients.forEach(i => i.unit && !us.has(ukey(i.unit)) && us.set(ukey(i.unit), i.unit)));
  return [...us.values()];
}

/** Aggregated shopping list built from the selected recipes. */
export function aggregate(byId: Map<string, Recipe>, shop: Set<string>): AggItem[] {
  const map = new Map<string, AggItem>();
  for (const id of shop) {
    const r = byId.get(id);
    if (!r || r.status !== 'planned') continue;
    for (const i of r.ingredients) {
      const f = FAM[ukey(i.unit)], k = nkey(i.name) + '|' + (f ? f[0] : ukey(i.unit));
      let e = map.get(k);
      if (!e) map.set(k, e = { k, pk: nkey(i.name), name: cap(i.name), unit: i.unit, fam: f?.[0], sum: 0, hasNum: false });
      if (num(i.amount)) { e.sum += i.amount * (f ? f[1] : 1); e.hasNum = true; }
    }
  }
  return [...map.values()];
}
