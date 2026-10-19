import { useCallback, useEffect, useMemo, useState } from 'react';
import { applyChanges, countChanges, emptyChanges, prepBase } from '../lib/data';
import { getFile, putFile } from '../lib/github';
import type { Changes, Gh, RawData, RawRecipe } from '../types';

type Base = RawData & { recipes: RawRecipe[] };

export const SRC = new URLSearchParams(location.search).get('data') === 'demo' ? 'data.demo.json' : 'data.json';
const KEY = 'recipe-changes:' + SRC;

/** Data from the file plus local (not yet published) changes. */
export function useRecipes() {
  const [rawBase, setRawBase] = useState<Base | null>(null);
  const [changes, setChanges] = useState<Changes>(emptyChanges);
  const [loadFailed, setLoadFailed] = useState(false);

  // Load the file and the local changes
  useEffect(() => {
    let off = false;
    (async () => {
      let raw: RawData, failed = false;
      try {
        const res = await fetch(import.meta.env.BASE_URL + SRC, { cache: 'no-cache' });
        if (!res.ok) throw new Error('HTTP ' + res.status);
        raw = await res.json();
      } catch (err) {
        console.warn(SRC + ' failed to load:', err);
        raw = { recipes: [] }; failed = true;
      }
      if (off) return;
      const base = prepBase(raw);
      let ch: Changes = emptyChanges();
      try {
        const c = JSON.parse(localStorage.getItem(KEY) ?? 'null');
        if (c) ch = { upserts: c.upserts || {}, deleted: c.deleted || [], cats: c.cats || [], pub: c.pub };
      } catch { /* ignore */ }
      // If the published edits are already in the loaded file, the local diff is no longer needed
      if (countChanges(ch)
        && JSON.stringify(applyChanges(base, ch).mergedRaw) === JSON.stringify(base.recipes)
        && ch.cats.every(c => (base.categories || []).includes(c))) ch = emptyChanges();
      setRawBase(base); setChanges(ch); setLoadFailed(failed);
    })();
    return () => { off = true; };
  }, []);

  // Persist local changes
  useEffect(() => {
    if (!rawBase) return;
    try { localStorage.setItem(KEY, JSON.stringify(changes)); }
    catch { alert('Браузер не дозволив зберегти зміни локально. Завантажте дані, щоб нічого не втратити.'); }
  }, [changes, rawBase]);

  const merged = useMemo(() => (rawBase ? applyChanges(rawBase, changes) : null), [rawBase, changes]);
  const mergedJson = useMemo(() => (merged ? JSON.stringify(merged.mergedRaw) : ''), [merged]);

  const upsert = useCallback((raw: RawRecipe) => setChanges(c => ({
    ...c,
    deleted: c.deleted.filter(i => i !== raw.id),
    upserts: { ...c.upserts, [raw.id]: raw }
  })), []);

  const remove = useCallback((id: string) => setChanges(c => {
    const upserts = { ...c.upserts };
    delete upserts[id];
    const deleted = rawBase!.recipes.some(r => r.id === id) && !c.deleted.includes(id) ? [...c.deleted, id] : c.deleted;
    return { ...c, upserts, deleted };
  }), [rawBase]);

  const addCat = useCallback((name: string) => setChanges(c => ({ ...c, cats: [...c.cats, name] })), []);

  const resetChanges = useCallback(() => {
    if (!confirm(`Скинути всі локальні зміни? Дані повернуться до стану з ${SRC}.`)) return;
    setChanges(emptyChanges());
  }, []);

  const download = useCallback(() => {
    const { data, mergedRaw } = merged!;
    const out = { title: data.title, raters: data.raters, categories: data.categories, recipes: mergedRaw };
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([JSON.stringify(out, null, 2) + '\n'], { type: 'application/json' }));
    a.download = SRC;
    document.body.append(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }, [merged]);

  // Apply changes on top of the fresh GitHub version so other people's edits are not overwritten
  const publish = useCallback(async (gh: Gh) => {
    const path = gh.dir + SRC, cur = await getFile(gh, path, gh.branch);
    const base = cur ? prepBase(cur.json) : rawBase!;
    const m = applyChanges(base, changes);
    await putFile(gh, path, gh.branch, { title: m.data.title, raters: m.data.raters, categories: m.data.categories, recipes: m.mergedRaw }, cur?.sha, 'Оновлення рецептів');
    setRawBase(base);
    setChanges(c => ({ ...c, pub: JSON.stringify(m.mergedRaw) }));
  }, [rawBase, changes]);

  return {
    ready: !!merged, loadFailed,
    data: merged?.data, byId: merged?.byId,
    changes, mergedJson, nChanges: countChanges(changes),
    upsert, remove, addCat, resetChanges, download, publish
  };
}
