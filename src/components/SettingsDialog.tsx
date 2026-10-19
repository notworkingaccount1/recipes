import { useState, type ChangeEvent, type FormEvent } from 'react';
import type { Gh } from '../types';
import Dialog from './Dialog';
import { IconX } from './icons';

interface BodyProps { gh: Gh; msg?: string; onSave: (gh: Gh) => void; onClose: () => void }

function Body({ gh, msg, onSave, onClose }: BodyProps) {
  const [f, setF] = useState({ repo: gh.repo, branch: gh.branch, dataBranch: gh.dataBranch, dir: gh.dir, token: gh.token });
  const [err, setErr] = useState(msg || '');
  const bind = (k: keyof Gh) => ({
    value: f[k],
    onChange: (e: ChangeEvent<HTMLInputElement>) => setF(p => ({ ...p, [k]: e.target.value }))
  });

  function submit(e: FormEvent) {
    e.preventDefault();
    const repo = f.repo.trim().replace(/^https?:\/\/github\.com\//, '').replace(/\/$/, '');
    if (repo && !/^[\w.-]+\/[\w.-]+$/.test(repo)) { setErr('Репозиторій має виглядати як власник/назва.'); return; }
    let dir = f.dir.trim().replace(/^\/+/, '');
    if (dir && !dir.endsWith('/')) dir += '/';
    onSave({ repo, dir, branch: f.branch.trim() || 'main', dataBranch: f.dataBranch.trim() || 'data', token: f.token.trim() });
  }

  return (
    <form className="sheet__form" onSubmit={submit}>
      <div className="sheet__head">
        <div className="sheet__heading"><h2 className="sheet__title" id="set-h">Налаштування GitHub</h2></div>
        <button className="icon-button" type="button" aria-label="Закрити" onClick={onClose}><IconX /></button>
      </div>
      <div className="sheet__body">
        <label className="field"><span className="field__label">Репозиторій (власник/назва)</span>
          <input className="input" placeholder="user/recipes" autoComplete="off" autoCapitalize="off" {...bind('repo')} /></label>
        <div className="form-grid">
          <label className="field"><span className="field__label">Гілка сайту</span>
            <input className="input" autoComplete="off" autoCapitalize="off" {...bind('branch')} /></label>
          <label className="field"><span className="field__label">Гілка даних</span>
            <input className="input" autoComplete="off" autoCapitalize="off" {...bind('dataBranch')} /></label>
        </div>
        <label className="field"><span className="field__label">Папка з data.json (порожньо = корінь)</span>
          <input className="input" placeholder="public/" autoComplete="off" autoCapitalize="off" {...bind('dir')} /></label>
        <label className="field"><span className="field__label">Токен</span>
          <input className="input" type="password" autoComplete="off" placeholder="github_pat_…" {...bind('token')} /></label>
        <p className="hint">
          Потрібен fine-grained токен лише на цей репозиторій з правом Contents: Read and write.
          Він зберігається тільки в цьому браузері й нікуди не комітиться. Не вставляйте його на чужих пристроях.
        </p>
        {err && <p className="form-error" role="alert">{err}</p>}
      </div>
      <div className="sheet__foot">
        <button className="button" type="button" onClick={onClose}>Скасувати</button>
        <button className="button button--primary" type="submit">Зберегти</button>
      </div>
    </form>
  );
}

interface Props { settings: { msg?: string } | null; gh: Gh; onSave: (gh: Gh) => void; onClose: () => void }

export default function SettingsDialog({ settings, gh, onSave, onClose }: Props) {
  return (
    <Dialog open={!!settings} onClose={onClose} label="set-h">
      {settings && <Body gh={gh} msg={settings.msg} onSave={onSave} onClose={onClose} />}
    </Dialog>
  );
}
