import { useEffect, useReducer, useRef } from 'react';
import { ensureBranch, getFile, putFile } from '../lib/github';
import type { Gh, SharedKind, SharedSets } from '../types';

interface Store { shared: SharedSets; touched: Record<string, boolean>; sync: string }
interface PantryFile { pantry?: string[]; shopRecipes?: string[]; checked?: string[] }

const KIND = { p: 'pantry', s: 'shop', c: 'checked' } as const;
const LS = 'recipe-shared';

function init(): Store {
  const s: Store = { shared: { pantry: new Set(), shop: new Set(), checked: new Set() }, touched: {}, sync: 'ok' };
  try {
    const c = JSON.parse(localStorage.getItem(LS) ?? 'null');
    if (c) { s.shared = { pantry: new Set(c.pantry), shop: new Set(c.shop), checked: new Set(c.checked) }; s.touched = c.touched || {}; }
  } catch { /* ignore */ }
  return s;
}

function make(s: Store, ghRef: { current: Gh }, force: () => void) {
  const persist = () => {
    try { localStorage.setItem(LS, JSON.stringify({ pantry: [...s.shared.pantry], shop: [...s.shared.shop], checked: [...s.shared.checked], touched: s.touched })); } catch { /* ignore */ }
  };
  // State from GitHub plus local changes that have not been pushed yet
  const mergeShared = (r: PantryFile = {}) => {
    s.shared = { pantry: new Set(r.pantry), shop: new Set(r.shopRecipes), checked: new Set(r.checked) };
    for (const [k, on] of Object.entries(s.touched)) s.shared[KIND[k[0] as SharedKind]][on ? 'add' : 'delete'](k.slice(2));
  };

  const setShared = (kind: SharedKind, key: string, on: boolean) => {
    s.shared[KIND[kind]][on ? 'add' : 'delete'](key);
    s.touched[kind + ':' + key] = on;
    persist(); force();
  };

  const pushShared = async () => {
    const gh = ghRef.current, sent = { ...s.touched };
    s.sync = 'busy'; force();
    try {
      const cur = await getFile<PantryFile>(gh, 'pantry.json', gh.dataBranch);
      mergeShared(cur?.json);
      const next = { pantry: [...s.shared.pantry].sort(), shopRecipes: [...s.shared.shop], checked: [...s.shared.checked] };
      if (Object.keys(sent).length && JSON.stringify(next) !== JSON.stringify(cur?.json)) { // Commit only when something actually changed
        if (!cur) await ensureBranch(gh, gh.dataBranch);
        await putFile(gh, 'pantry.json', gh.dataBranch, next, cur?.sha, 'Оновлення комори');
      }
      for (const k in sent) if (s.touched[k] === sent[k]) delete s.touched[k];
      s.sync = 'ok';
    } catch (err) { s.sync = 'err' + (err as Error).message; }
    persist(); force();
  };

  const pullShared = async () => {
    const gh = ghRef.current;
    if (!gh.repo) return force();
    try {
      const cur = await getFile<PantryFile>(gh, 'pantry.json', gh.dataBranch);
      if (cur) { mergeShared(cur.json); persist(); }
      s.sync = 'ok';
    } catch (err) { s.sync = 'err' + (err as Error).message; }
    force();
  };

  const syncText = () => {
    const gh = ghRef.current;
    return !gh.repo ? 'Зберігається лише на цьому пристрої'
      : !gh.token ? 'Лише читання з GitHub. Для збереження потрібен токен у налаштуваннях'
      : s.sync === 'busy' ? 'Синхронізуємо…'
      : s.sync.startsWith('err') ? 'Помилка синхронізації: ' + s.sync.slice(3)
      : Object.keys(s.touched).length ? `Не синхронізовано змін: ${Object.keys(s.touched).length}`
      : 'Синхронізовано';
  };

  return { setShared, pushShared, pullShared, syncText };
}

/** Shared state: pantry, selected recipes, "bought" marks. Synced through pantry.json on the data branch. */
export function useShared(gh: Gh) {
  const ref = useRef<{ s: Store; methods: ReturnType<typeof make> | null } | null>(null);
  if (!ref.current) ref.current = { s: init(), methods: null };
  const [, force] = useReducer((x: number) => x + 1, 0);
  const ghRef = useRef(gh);
  ghRef.current = gh;
  if (!ref.current.methods) ref.current.methods = make(ref.current.s, ghRef, force);

  useEffect(() => { ref.current!.methods!.pullShared(); }, [gh]);

  const { s, methods } = ref.current;
  return { shared: s.shared, sync: s.sync, ...methods! };
}

export type SharedApi = ReturnType<typeof useShared>;
