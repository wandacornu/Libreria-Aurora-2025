export const $ = (sel, ctx = document) => ctx.querySelector(sel);
export const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

export const fmtCurrency = (n) => n.toLocaleString('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 });

export const debounce = (fn, wait = 200) => {
    let t; return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), wait); };
};

export const readJSON = async (url) => {
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) throw new Error('No se pudo leer: ' + url);
    return res.json();
};

export const save = (k, v) => localStorage.setItem(k, JSON.stringify(v));
export const load = (k, fallback = []) => {
    try { return JSON.parse(localStorage.getItem(k)) ?? fallback; } catch { return fallback; }
};
