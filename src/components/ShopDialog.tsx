import { useState } from 'react';
import type { AggItem, Recipe } from '../types';
import type { SharedApi } from '../hooks/useShared';
import { aggregate } from '../lib/data';
import { qty } from '../lib/utils';
import Dialog from './Dialog';
import { IconX } from './icons';

interface Props {
  open: boolean;
  onClose: () => void;
  byId: Map<string, Recipe>;
  sh: SharedApi;
  onSync: () => void;
}

export default function ShopDialog({ open, onClose, byId, sh, onSync }: Props) {
  const [copied, setCopied] = useState(false);
  const busy = sh.sync === 'busy';
  const { shared } = sh;

  const items = open ? aggregate(byId, shared.shop) : [];
  const have = items.filter(e => shared.pantry.has(e.pk));
  // Unchecked items first, then alphabetical
  const buy = items.filter(e => !shared.pantry.has(e.pk))
    .sort((a, b) => Number(shared.checked.has(a.k)) - Number(shared.checked.has(b.k)) || a.name.localeCompare(b.name, 'uk'));
  const sel = [...shared.shop].map(id => byId.get(id)).filter((r): r is Recipe => r?.status === 'planned');

  const row = (e: AggItem, box: boolean) => (
    <label key={e.k} className={'shop-row' + (box && shared.checked.has(e.k) ? ' shop-row--done' : '')}>
      {box && <input className="shop-row__checkbox" type="checkbox" checked={shared.checked.has(e.k)} onChange={ev => sh.setShared('c', e.k, ev.target.checked)} />}
      <span className="shop-row__name">{e.name}</span>
      <span className="shop-row__qty">{qty(e)}</span>
    </label>
  );

  async function copy() {
    const lines = items.filter(x => !shared.pantry.has(x.pk) && !shared.checked.has(x.k)).map(x => '- ' + `${x.name} ${qty(x)}`.trim());
    try {
      await navigator.clipboard.writeText(lines.join('\n'));
      setCopied(true); setTimeout(() => setCopied(false), 1500);
    } catch { alert(lines.join('\n')); }
  }
  const bought = () => items.filter(e => !shared.pantry.has(e.pk) && shared.checked.has(e.k))
    .forEach(e => { sh.setShared('p', e.pk, true); sh.setShared('c', e.k, false); });
  const clearAll = () => {
    [...shared.shop].forEach(id => sh.setShared('s', id, false));
    [...shared.checked].forEach(k => sh.setShared('c', k, false));
  };

  return (
    <Dialog open={open} onClose={onClose} label="shop-h" backdrop>
      <div className="sheet__head">
        <div className="sheet__heading">
          <h2 className="sheet__title" id="shop-h">Покупки</h2>
          <span className="hint">{sh.syncText()}</span>
        </div>
        <button className="icon-button" type="button" aria-label="Закрити" onClick={onClose}><IconX /></button>
      </div>

      <div className="sheet__body">
        {sel.length ? (
          <section className="section">
            <h3 className="section__title">Рецепти</h3>
            <div className="chips">
              {sel.map(r => (
                <button key={r.id} type="button" className="pill pill--small" aria-label={'Прибрати ' + r.title} onClick={() => sh.setShared('s', r.id, false)}>
                  {r.title + ' ×'}
                </button>
              ))}
            </div>
          </section>
        ) : (
          <p className="hint">Список порожній. Додайте рецепти кнопкою «+ У покупки» в картці рецепта або в Коморі, вкладка «Що приготувати».</p>
        )}
        {buy.length > 0 && <section className="section"><h3 className="section__title">Купити</h3>{buy.map(e => row(e, true))}</section>}
        {sel.length > 0 && !buy.length && <p className="hint hint--ok">Усе вже є вдома.</p>}
        {have.length > 0 && (
          <details className="collapse">
            <summary className="collapse__summary">{`Вже є вдома (${have.length})`}</summary>
            {have.map(e => row(e, false))}
          </details>
        )}
        {sel.length > 0 && <button className="link-button" type="button" onClick={clearAll}>Очистити список</button>}
      </div>

      <div className="sheet__foot">
        <button className="button" type="button" disabled={!buy.length} onClick={copy}>{copied ? 'Скопійовано' : 'Копіювати'}</button>
        <button className="button button--primary" type="button" disabled={!buy.some(e => shared.checked.has(e.k))} onClick={bought}>Відмічене в комору</button>
        <button className="button button--wide" type="button" disabled={busy} onClick={onSync}>{busy ? 'Синхронізуємо…' : 'Синхронізувати'}</button>
      </div>
    </Dialog>
  );
}
