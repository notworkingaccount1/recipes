import { useState } from 'react';
import type { Data } from '../types';
import type { SharedApi } from '../hooks/useShared';
import { ingredientNames } from '../lib/data';
import { cap, nkey, num } from '../lib/utils';
import Dialog from './Dialog';
import { IconX } from './icons';

interface Props {
  open: boolean;
  onClose: () => void;
  data: Data;
  sh: SharedApi;
  onOpenRecipe: (id: string) => void;
  onSync: () => void;
}

type Tab = 'stock' | 'cook';

export default function PantryDialog({ open, onClose, data, sh, onOpenRecipe, onSync }: Props) {
  const [tab, setTab] = useState<Tab>('stock');
  const [q, setQ] = useState('');
  const busy = sh.sync === 'busy';

  let body = null;
  if (open) {
    const tabs = (
      <div className="pills">
        {([['stock', 'Що є вдома'], ['cook', 'Що приготувати']] as const).map(([k, t]) => (
          <button key={k} type="button" className={'pill' + (tab === k ? ' pill--active' : '')} aria-pressed={tab === k} onClick={() => setTab(k)}>{t}</button>
        ))}
      </div>
    );
    if (tab === 'stock') {
      const nq = nkey(q);
      body = (
        <>
          {tabs}
          <p className="hint">Відмічайте, що є вдома. Щоб зміни побачили інші, натисніть «Синхронізувати».</p>
          <input type="search" className="input input--search" placeholder="Знайти продукт" aria-label="Знайти продукт" autoComplete="off"
            value={q} onChange={e => setQ(e.target.value)} />
          <div className="chips">
            {[...ingredientNames(data)].filter(([k]) => k.includes(nq)).map(([k, n]) => {
              const on = sh.shared.pantry.has(k);
              return (
                <button key={k} type="button" className={'pill' + (on ? ' pill--active' : '')} aria-pressed={on}
                  onClick={() => sh.setShared('p', k, !on)}>{n}</button>
              );
            })}
          </div>
        </>
      );
    } else {
      // Planned recipes ordered by how few ingredients are missing; "to taste" items are not counted
      const rows = data.recipes.filter(r => r.status === 'planned')
        .map(r => ({ r, need: r.ingredients.filter(i => num(i.amount) && !sh.shared.pantry.has(nkey(i.name))) }))
        .sort((a, b) => a.need.length - b.need.length || a.r.title.localeCompare(b.r.title, 'uk'));
      body = (
        <>
          {tabs}
          <p className="hint">Рецепти з «У планах», яким бракує найменше. Інгредієнти «за смаком» не рахуються.</p>
          {rows.length ? (
            <div>
              {rows.map(({ r, need }) => {
                const inShop = sh.shared.shop.has(r.id);
                return (
                  <div className="cook-row" key={r.id}>
                    <button className="cook-row__main" type="button" onClick={() => onOpenRecipe(r.id)}>
                      <strong className="cook-row__title">{r.title}</strong>
                      {need.length
                        ? <span className="hint">{`Бракує ${need.length}: ` + cap(need.slice(0, 4).map(i => i.name).join(', ')) + (need.length > 4 ? '…' : '')}</span>
                        : <span className="hint hint--ok">Все є вдома</span>}
                    </button>
                    <button type="button" className={'pill pill--small' + (inShop ? ' pill--active' : '')} aria-pressed={inShop} onClick={() => sh.setShared('s', r.id, !inShop)}>
                      {inShop ? 'В покупках' : '+ У покупки'}
                    </button>
                  </div>
                );
              })}
            </div>
          ) : <p className="hint">У планах поки порожньо.</p>}
        </>
      );
    }
  }

  return (
    <Dialog open={open} onClose={onClose} label="pan-h" backdrop>
      <div className="sheet__head">
        <div className="sheet__heading">
          <h2 className="sheet__title" id="pan-h">Комора</h2>
          <span className="hint">{sh.syncText()}</span>
        </div>
        <button className="icon-button" type="button" aria-label="Закрити" onClick={onClose}><IconX /></button>
      </div>
      <div className="sheet__body">{body}</div>
      <div className="sheet__foot">
        <button className="button button--primary button--wide" type="button" disabled={busy} onClick={onSync}>
          {busy ? 'Синхронізуємо…' : 'Синхронізувати'}
        </button>
      </div>
    </Dialog>
  );
}
