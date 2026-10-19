import type { AggItem } from '../types';

export const MAX = 5;
export const STATUS = { cooked: 'Вже готували', planned: 'У планах' } as const;

export const fmt = (n: number) => n.toLocaleString('uk-UA', { maximumFractionDigits: 2 });
export const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
export const hash = (s: string) => [...s].reduce((h, c) => (h * 31 + c.codePointAt(0)!) >>> 0, 7);
export const slug = (s: unknown) => String(s || '').toLowerCase().trim().replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-|-$/g, '');
export const uid = () => 'r' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
export const num = (v: unknown): v is number => typeof v === 'number' && isFinite(v);

const ALIAS: Record<string, string> = { 'яйця': 'яйце', 'яйца': 'яйце', 'чеснок': 'часник', 'помидори': 'помідори', 'помидорами': 'помідори', 'помидор': 'помідори', 'томати': 'помідори', 'соль': 'сіль', 'яблоки': 'яблука', 'ваніліний цукор': 'ванільний цукор', 'сухарі паніровачні': 'паніровальні сухарі', 'перець': 'чорний перець' };
export const nkey = (s: string) => {
  const k = String(s).toLowerCase().replace(/ё/g, 'е').replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
  return ALIAS[k] || k;
};

const UNIT: Record<string, string> = { пкт: 'пачка', пчк: 'пачка', зуб: 'зубчик' };
export const ukey = (u: string) => {
  const k = String(u).toLowerCase().replace(/[^\p{L}\p{N}]+/gu, '');
  return UNIT[k] || k;
};

export const FAM: Record<string, [string, number]> = { г: ['m', 1], гр: ['m', 1], кг: ['m', 1000], мл: ['v', 1], л: ['v', 1000] };
export const qty = (e: AggItem) => {
  if (!e.hasNum) return e.unit;
  if (!e.fam) return `${fmt(e.sum)} ${e.unit}`.trim();
  const big = e.sum >= 1000;
  return `${fmt(big ? e.sum / 1000 : e.sum)} ${e.fam === 'm' ? (big ? 'кг' : 'г') : (big ? 'л' : 'мл')}`;
};
