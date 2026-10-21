import { useEffect, useState } from 'react';
import type { Profile } from './api/types';
import { fetchProfile, isDemo } from './api/client';
import { platform } from './platform';
import { formatPhone, normalizePhone } from './format';
import { Actions, Cards, ClubStatus, Referral, Subscriptions, Upcoming, Visits } from './sections';

const STORAGE_KEY = 'club.phone';
const store = {
  get: () => { try { return localStorage.getItem(STORAGE_KEY); } catch { return null; } },
  set: (v: string) => { try { localStorage.setItem(STORAGE_KEY, v); } catch { /* noop */ } },
  clear: () => { try { localStorage.removeItem(STORAGE_KEY); } catch { /* noop */ } },
};

export default function App() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async (phone: string) => {
    setLoading(true);
    setError(null);
    try {
      const p = await fetchProfile(normalizePhone(phone), platform.initData);
      store.set(phone);
      setProfile(p);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не удалось загрузить данные');
      store.clear();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    platform.init();
    const saved = store.get();
    if (saved) load(saved);
  }, []);

  if (!profile) return <Login onSubmit={load} loading={loading} error={error} />;

  return (
    <main className="app">
      {isDemo && <div className="demo">Демо-режим · данные тестовые · {platform.name}</div>}
      <ClubStatus p={profile} />
      <Actions p={profile} />
      <Cards p={profile} />
      <Upcoming p={profile} />
      <Subscriptions p={profile} />
      <Visits p={profile} />
      <Referral p={profile} />
      <button className="logout" onClick={() => { store.clear(); setProfile(null); }}>Выйти</button>
    </main>
  );
}

function Login({ onSubmit, loading, error }: { onSubmit: (phone: string) => void; loading: boolean; error: string | null }) {
  const [phone, setPhone] = useState('+7');
  const digits = phone.replace(/\D/g, '');
  const valid = digits.length === 11;
  const canShare = platform.name !== 'browser';

  const share = async () => {
    const p = await platform.requestPhone();
    if (p) { setPhone(formatPhone(p)); onSubmit(p); }
  };

  return (
    <main className="app login">
      <div className="logo">
        <svg viewBox="0 0 48 48" width="56" height="56" aria-hidden>
          <circle cx="24" cy="24" r="22" fill="var(--accent)" />
          <path d="M15 27c3 5 15 5 18 0M17 19h.01M31 19h.01" stroke="var(--accent-text)" strokeWidth="3.2" strokeLinecap="round" fill="none" />
        </svg>
      </div>
      <h1>Личный кабинет клуба</h1>
      <p className="muted">Войдите по номеру телефона, на который оформлены записи. Пароль не нужен.</p>

      {canShare && (
        <button className="btn btn-primary" disabled={loading} onClick={share}>Поделиться номером</button>
      )}

      {/* Ручной ввод — только в демо/браузере. В проде номер берётся из мессенджера
          (подтверждён подписью initData), иначе любой сможет открыть чужой кабинет. */}
      {(!canShare || isDemo) && <form onSubmit={(e) => { e.preventDefault(); if (valid) onSubmit(phone); }}>
        <input
          className="input"
          inputMode="tel"
          autoComplete="tel"
          value={phone}
          onChange={(e) => setPhone(formatPhone(e.target.value))}
          placeholder="+7 (999) 123-45-67"
        />
        <button className={`btn ${canShare ? '' : 'btn-primary'}`} disabled={!valid || loading} type="submit">
          {loading ? 'Загружаем…' : 'Войти'}
        </button>
      </form>}
      {error && <div className="error">{error}</div>}
      {isDemo && <p className="hint">Демо: подойдёт любой номер</p>}
    </main>
  );
}
