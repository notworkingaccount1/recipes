import type { Gh, RawData } from '../types';

const KEY = 'recipe-gh';

export function loadGh(): Gh {
  const gh: Gh = { repo: '', branch: 'main', dataBranch: 'data', dir: 'public/', token: '' };
  if (location.hostname.endsWith('.github.io')) gh.repo = location.hostname.split('.')[0] + '/' + (location.pathname.split('/')[1] || location.hostname);
  try { Object.assign(gh, JSON.parse(localStorage.getItem(KEY) || '{}')); } catch { /* ignore */ }
  return gh;
}
export const saveGh = (gh: Gh) => { try { localStorage.setItem(KEY, JSON.stringify(gh)); } catch { /* ignore */ } };

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function api(gh: Gh, path: string, method = 'GET', body?: unknown): Promise<any> {
  const res = await fetch(`https://api.github.com/repos/${gh.repo}${path}`, {
    method, cache: 'no-store', body: body ? JSON.stringify(body) : undefined,
    headers: { Accept: 'application/vnd.github+json', ...(gh.token ? { Authorization: 'Bearer ' + gh.token } : {}), ...(body ? { 'Content-Type': 'application/json' } : {}) }
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(res.status + ' ' + ((await res.json().catch(() => ({}))).message || ''));
  return res.json();
}

const b64e = (s: string) => btoa(unescape(encodeURIComponent(s)));
const b64d = (s: string) => new TextDecoder().decode(Uint8Array.from(atob(s.replace(/\n/g, '')), c => c.charCodeAt(0)));

export async function getFile<T = RawData>(gh: Gh, path: string, branch: string): Promise<{ sha: string; json: T } | null> {
  const f = await api(gh, `/contents/${path}?ref=${encodeURIComponent(branch)}`);
  return f && f.content != null ? { sha: f.sha, json: JSON.parse(b64d(f.content)) as T } : null;
}
export const putFile = (gh: Gh, path: string, branch: string, obj: unknown, sha: string | undefined, message: string) =>
  api(gh, '/contents/' + path, 'PUT', { message, branch, sha, content: b64e(JSON.stringify(obj, null, 2) + '\n') });

export async function ensureBranch(gh: Gh, branch: string) {
  if (await api(gh, '/branches/' + encodeURIComponent(branch))) return;
  const head = await api(gh, '/git/ref/heads/' + gh.branch);
  if (!head) throw new Error('не знайдено гілку ' + gh.branch);
  await api(gh, '/git/refs', 'POST', { ref: 'refs/heads/' + branch, sha: head.object.sha });
}
