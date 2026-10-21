import type { Profile } from './types';
import { mockProfile } from './mock';

// Если VITE_API_URL не задан — работаем на демо-данных.
// Когда заказчик выдаст доступ, достаточно указать URL в .env
// и при необходимости поправить mapProfile() под реальный ответ.
const API_URL = import.meta.env.VITE_API_URL as string | undefined;

export const isDemo = !API_URL;

export async function fetchProfile(phone: string, initData?: string): Promise<Profile> {
  if (!API_URL) {
    await new Promise((r) => setTimeout(r, 450)); // имитация сети
    return mockProfile(phone);
  }
  const res = await fetch(`${API_URL.replace(/\/$/, '')}/api/client/profile`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      // подпись Telegram/MAX — бэкенд может проверить, что запрос из мини-приложения
      ...(initData ? { 'X-Init-Data': initData } : {}),
    },
    body: JSON.stringify({ phone }),
  });
  if (res.status === 404) throw new Error('Клиент с таким номером не найден');
  if (!res.ok) throw new Error(`Ошибка сервера (${res.status})`);
  return mapProfile(await res.json());
}

// Точка адаптации под реальный контракт API.
function mapProfile(raw: unknown): Profile {
  return raw as Profile;
}

export async function rateVisit(recordId: string, rating: number): Promise<void> {
  if (!API_URL) return;
  await fetch(`${API_URL.replace(/\/$/, '')}/api/client/rate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ recordId, rating }),
  }).catch(() => undefined);
}
