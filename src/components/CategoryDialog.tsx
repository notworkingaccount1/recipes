import { useState } from 'react';
import Dialog from './Dialog';
import { IconX } from './icons';

function Body({ onSubmit, onClose }: { onSubmit: (name: string) => void; onClose: () => void }) {
  const [name, setName] = useState('');
  return (
    <form className="sheet__form" onSubmit={e => { e.preventDefault(); if (name.trim()) onSubmit(name.trim()); }}>
      <div className="sheet__head">
        <div className="sheet__heading"><h2 className="sheet__title" id="cat-h">Нова категорія</h2></div>
        <button className="icon-button" type="button" aria-label="Закрити" onClick={onClose}><IconX /></button>
      </div>
      <div className="sheet__body">
        <label className="field">
          <span className="field__label">Назва категорії</span>
          {/* The autofocus attribute must exist before showModal() runs, so it is set on the node directly */}
          <input
            className="input"
            ref={el => { el?.setAttribute('autofocus', ''); }}
            required maxLength={40} autoComplete="off" placeholder="Наприклад, Салати"
            value={name} onChange={e => setName(e.target.value)}
          />
        </label>
      </div>
      <div className="sheet__foot">
        <button className="button" type="button" onClick={onClose}>Скасувати</button>
        <button className="button button--primary" type="submit">Додати</button>
      </div>
    </form>
  );
}

interface Props { open: boolean; onSubmit: (name: string) => void; onClose: () => void }

export default function CategoryDialog({ open, onSubmit, onClose }: Props) {
  return (
    <Dialog open={open} onClose={onClose} label="cat-h">
      {open && <Body onSubmit={onSubmit} onClose={onClose} />}
    </Dialog>
  );
}
