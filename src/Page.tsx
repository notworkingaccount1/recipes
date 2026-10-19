import { useEffect, useRef, useState } from 'react';
import type { Gh, Ratings, RawRecipe, Recipe, Status } from './types';
import { score, toRaw } from './lib/data';
import { loadGh, saveGh } from './lib/github';
import { useShared } from './hooks/useShared';
import { SRC, type useRecipes } from './hooks/useRecipes';
import RecipeCard from './components/RecipeCard';
import RecipeDialog from './components/RecipeDialog';
import RecipeForm from './components/RecipeForm';
import RatingDialog from './components/RatingDialog';
import CategoryDialog from './components/CategoryDialog';
import PantryDialog from './components/PantryDialog';
import ShopDialog from './components/ShopDialog';
import SettingsDialog from './components/SettingsDialog';
import { IconDownload, IconPlus, IconSearch, IconSettings, IconX } from './components/icons';

const cls = (...parts: (string | false | null | undefined)[]) => parts.filter(Boolean).join(' ');

export default function Page({ R }: { R: ReturnType<typeof useRecipes> }) {
  const data = R.data!, byId = R.byId!;
  const [gh, setGh] = useState<Gh>(loadGh);
  const sh = useShared(gh);

  const [tab, setTab] = useState<Status>(() => (data.recipes.some(r => r.status === 'cooked') ? 'cooked' : 'planned'));
  const [catSel, setCat] = useState('all');
  const [q, setQ] = useState('');
  const [who, setWho] = useState('avg');
  const [min, setMin] = useState(0);

  const [selId, setSelId] = useState<string | null>(null);                        // recipe shown in the details sheet
  const [form, setForm] = useState<{ recipe: Recipe | null } | null>(null);       // add/edit form
  const [rateFor, setRateFor] = useState<Recipe | null>(null);                    // recipe being moved to "cooked"
  const [catAsk, setCatAsk] = useState<{ done: (c: string) => void } | null>(null); // "new category" dialog
  const [panOpen, setPanOpen] = useState(false);
  const [shopOpen, setShopOpen] = useState(false);
  const [settings, setSettings] = useState<{ msg?: string } | null>(null);
  const [publishing, setPublishing] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => { document.title = data.title; }, [data.title]);

  // The selected category may disappear after a reset or a delete
  const cat = catSel !== 'all' && !data.categories.includes(catSel) ? 'all' : catSel;

  /* ---------- filtering ---------- */
  const ql = q.trim().toLocaleLowerCase('uk');
  const matches = (r: Recipe) => !ql || r.title.toLocaleLowerCase('uk').includes(ql);
  const passes = (r: Recipe) => r.status !== 'cooked' || !min || (score(r, who, data.raters) ?? -1) >= min;
  const visible = (t: Status) => data.recipes.filter(r => r.status === t && (cat === 'all' || r.category === cat) && matches(r) && passes(r));
  const cooked = visible('cooked'), planned = visible('planned');
  const items = tab === 'cooked' ? cooked : planned;
  const total = data.recipes.filter(r => r.status === tab).length;
  const filtered = ql || cat !== 'all' || (tab === 'cooked' && min);
  const resetFilters = () => { setQ(''); setCat('all'); setWho('avg'); setMin(0); };

  /* ---------- actions ---------- */
  const askCategory = (done: (c: string) => void) => setCatAsk({ done });
  const onCatSubmit = (name: string) => {
    const found = data.categories.find(c => c.toLocaleLowerCase('uk') === name.toLocaleLowerCase('uk'));
    const { done } = catAsk!;
    setCatAsk(null);
    if (!found) R.addCat(name);
    done(found || name);
  };

  const moveTo = (r: Recipe) => {
    if (r.status === 'cooked') { R.upsert({ ...toRaw(r), status: 'planned' }); setSelId(null); }
    else setRateFor(r);
  };
  const onRated = (ratings: Ratings) => {
    R.upsert({ ...toRaw(rateFor!), status: 'cooked', ratings });
    setRateFor(null); setSelId(null);
  };

  const onSaveForm = (raw: RawRecipe) => {
    R.upsert(raw);
    setTab(raw.status);
    if (cat !== 'all') setCat(raw.category);
    setForm(null);
    setSelId(raw.id);
  };

  const onDelete = (id: string) => { setSelId(null); R.remove(id); };

  const openSettings = (msg?: string) => setSettings({ msg });
  const onSaveSettings = (next: Gh) => { saveGh(next); setGh(next); setSettings(null); };

  async function publish() {
    if (!gh.repo || !gh.token) return openSettings('Для публікації вкажіть репозиторій і токен.');
    setPublishing(true);
    try { await R.publish(gh); }
    catch (err) { alert('Не вдалося опублікувати: ' + (err as Error).message); }
    finally { setPublishing(false); }
  }
  const syncNow = () => {
    if (!gh.repo || !gh.token) return openSettings('Для синхронізації вкажіть репозиторій і токен.');
    sh.pushShared();
  };

  const n = R.nChanges;
  const waiting = n && R.changes.pub === R.mergedJson;
  const shopN = [...sh.shared.shop].filter(id => byId.get(id)?.status === 'planned').length;

  const emptyText = !total
    ? (tab === 'cooked' ? 'Приготованих страв поки немає.' : 'У планах поки порожньо.')
    : 'Нічого не знайдено. Спробуйте іншу назву або послабте фільтри.';

  return (
    <>
      <header className="container header">
        <h1 className="header__title">{data.title}</h1>
        <div className="header__actions">
          <button className="header__button" type="button" aria-label="Налаштування GitHub" title="Налаштування GitHub" onClick={() => openSettings()}>
            <IconSettings />
          </button>
          <button
            className={cls('header__button', !!n && !waiting && 'header__button--dirty')}
            type="button"
            aria-label="Завантажити дані"
            onClick={R.download}
          >
            <IconDownload /><span className="header__button-text">Завантажити дані</span>
          </button>
        </div>
      </header>

      <div className="toolbar">
        <div className="container toolbar__inner">
          <label className="search">
            <IconSearch className="search__icon" />
            <input
              ref={searchRef}
              className="search__input"
              type="search"
              placeholder="Пошук за назвою"
              aria-label="Пошук за назвою"
              autoComplete="off"
              enterKeyHint="search"
              value={q}
              onChange={e => setQ(e.target.value)}
            />
            {q && (
              <button className="search__clear" type="button" aria-label="Очистити пошук" onClick={() => { setQ(''); searchRef.current?.focus(); }}>
                <IconX />
              </button>
            )}
          </label>
          <div className={cls('segmented', tab === 'planned' && 'segmented--second')} role="tablist" aria-label="Списки рецептів">
            <span className="segmented__thumb" />
            <button className={cls('segmented__tab', tab === 'cooked' && 'segmented__tab--active')} role="tab" id="tab-cooked" aria-selected={tab === 'cooked'} onClick={() => setTab('cooked')}>
              Вже готували <span className={cls('badge', tab === 'cooked' && 'badge--accent')}>{cooked.length}</span>
            </button>
            <button className={cls('segmented__tab', tab === 'planned' && 'segmented__tab--active')} role="tab" id="tab-planned" aria-selected={tab === 'planned'} onClick={() => setTab('planned')}>
              У планах <span className={cls('badge', tab === 'planned' && 'badge--accent')}>{planned.length}</span>
            </button>
          </div>
        </div>
      </div>

      <main className="container content">
        <div className="tools">
          <button className="pill tools__item" type="button" onClick={() => { setShopOpen(true); sh.pullShared(); }}>
            Покупки{shopN > 0 && <span className="badge">{shopN}</span>}
          </button>
          <button className="pill tools__item" type="button" onClick={() => { setPanOpen(true); sh.pullShared(); }}>Комора</button>
        </div>

        <div className="categories" role="tablist" aria-label="Категорії">
          {['all', ...data.categories].map(c => (
            <button key={c} type="button" role="tab" className={cls('categories__tab', c === cat && 'categories__tab--active')} aria-selected={c === cat} onClick={() => setCat(c)}>
              {c === 'all' ? 'Усі' : c}
            </button>
          ))}
          <button type="button" className="categories__tab categories__tab--add" onClick={() => askCategory(c => setCat(c))}>+ Категорія</button>
        </div>

        <section className="filters" aria-label="Фільтри за оцінкою" hidden={tab !== 'cooked'}>
          <div className="filters__row">
            <span className="filters__label" id="l-who">Чия оцінка</span>
            <div className="pills" role="group" aria-labelledby="l-who">
              {[{ id: 'avg', name: 'Загальна' }, ...data.raters].map(p => (
                <button key={p.id} className={cls('pill', who === p.id && 'pill--active')} type="button" aria-pressed={who === p.id} onClick={() => setWho(p.id)}>{p.name}</button>
              ))}
            </div>
          </div>
          <div className="filters__row">
            <span className="filters__label" id="l-min">Не менше</span>
            <div className="pills" role="group" aria-labelledby="l-min">
              {([['Усі', 0, false], ['3+', 3, true], ['4+', 4, true], ['5', 5, true]] as const).map(([label, v, star]) => (
                <button key={v} className={cls('pill', min === v && 'pill--active')} type="button" aria-pressed={min === v} onClick={() => setMin(v)}>
                  {star && <i className="pill__star">★ </i>}{label}
                </button>
              ))}
            </div>
          </div>
        </section>

        {R.loadFailed && <p className="notice" role="status">{SRC} не завантажився (потрібен сервер або GitHub Pages).</p>}

        {n > 0 && (
          <p className="notice notice--changes">
            {waiting ? 'Опубліковано. Сайт оновиться за 1–2 хвилини, а поки що ви бачите свою версію.' : `Локальних змін: ${n}.`}
            {!waiting && (
              <span className="notice__actions">
                <button className="link-button" type="button" disabled={publishing} onClick={publish}>{publishing ? 'Публікуємо…' : 'Опублікувати'}</button>
                <button className="link-button" type="button" onClick={R.resetChanges}>Скинути</button>
              </span>
            )}
          </p>
        )}

        <ul className="recipe-grid" role="tabpanel" aria-labelledby={'tab-' + tab}>
          {items.map(r => <RecipeCard key={r.id} r={r} raters={data.raters} onOpen={setSelId} />)}
        </ul>

        {!items.length && (
          <div className="empty-state">
            <p className="empty-state__text">{emptyText}</p>
            {total > 0 && filtered && <button className="pill" type="button" onClick={resetFilters}>Скинути пошук і фільтри</button>}
          </div>
        )}
      </main>

      <button className="fab" type="button" onClick={() => setForm({ recipe: null })}>
        <IconPlus />Додати
      </button>

      <RecipeDialog
        r={selId ? byId.get(selId) : null}
        raters={data.raters}
        sh={sh}
        onClose={() => setSelId(null)}
        onMove={moveTo}
        onEdit={(r: Recipe) => { setSelId(null); setForm({ recipe: r }); }}
        onDelete={onDelete}
      />
      <RecipeForm
        form={form}
        data={data}
        defaultStatus={tab}
        defaultCat={cat !== 'all' ? cat : data.categories[0] || ''}
        onSave={onSaveForm}
        onClose={() => setForm(null)}
        onNewCat={askCategory}
      />
      <RatingDialog recipe={rateFor} raters={data.raters} onSave={onRated} onClose={() => setRateFor(null)} />
      <CategoryDialog open={!!catAsk} onSubmit={onCatSubmit} onClose={() => setCatAsk(null)} />
      <PantryDialog open={panOpen} onClose={() => setPanOpen(false)} data={data} sh={sh} onOpenRecipe={setSelId} onSync={syncNow} />
      <ShopDialog open={shopOpen} onClose={() => setShopOpen(false)} byId={byId} sh={sh} onSync={syncNow} />
      <SettingsDialog settings={settings} gh={gh} onSave={onSaveSettings} onClose={() => setSettings(null)} />
    </>
  );
}
