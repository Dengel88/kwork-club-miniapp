// Единый адаптер для Telegram Mini App и мини-приложения MAX.
// Один фронтенд: платформа определяется по наличию bridge-объекта.
//  - Telegram: https://telegram.org/js/telegram-web-app.js → window.Telegram.WebApp
//  - MAX:      https://st.max.ru/js/max-web-app.js        → window.WebApp
// Вызовы обёрнуты в try/catch и проверки типов: API MAX моложе и
// отличается в деталях, а в обычном браузере bridge нет вовсе (демо-режим).

/* eslint-disable @typescript-eslint/no-explicit-any */
type Bridge = any;

export type PlatformName = 'telegram' | 'max' | 'browser';

declare global {
  interface Window {
    Telegram?: { WebApp?: Bridge };
    WebApp?: Bridge;
  }
}

function detect(): { name: PlatformName; app: Bridge | null } {
  const tg = window.Telegram?.WebApp;
  if (tg && tg.initData) return { name: 'telegram', app: tg };
  const max = window.WebApp;
  if (max && (max.initData || max.initDataUnsafe)) return { name: 'max', app: max };
  return { name: 'browser', app: null };
}

const { name, app } = detect();

export const platform = {
  name,
  initData: (app?.initData as string | undefined) ?? undefined,

  init() {
    try {
      app?.ready?.();
      app?.expand?.();
    } catch { /* noop */ }
    applyTheme();
  },

  // Номер из профиля мессенджера (если пользователь разрешит).
  // Возвращает null, если платформа не поддерживает запрос или пользователь отказал.
  async requestPhone(): Promise<string | null> {
    if (!app?.requestContact) return null;
    try {
      return await new Promise<string | null>((resolve) => {
        const pick = (data: any): string | null =>
          data?.responseUnsafe?.contact?.phone_number ??
          data?.contact?.phone_number ??
          data?.phone ??
          (typeof data === 'string' ? data : null);

        const maybe = app.requestContact((ok: boolean, data: any) => resolve(ok ? pick(data) : null));
        if (maybe && typeof maybe.then === 'function') {
          maybe.then((d: any) => resolve(pick(d))).catch(() => resolve(null));
        }
        setTimeout(() => resolve(null), 30000);
      });
    } catch {
      return null;
    }
  },

  // Открыть чат с менеджером с заготовленным текстом.
  openChat(chatUrl: string, text: string) {
    const url = withText(chatUrl, text);
    try {
      if (name === 'telegram' && /t\.me\//.test(url)) return app.openTelegramLink(url);
      if (name === 'max' && app.openMaxLink && /max\.ru\//.test(url)) return app.openMaxLink(url);
      if (app?.openLink) return app.openLink(url);
    } catch { /* fallthrough */ }
    window.open(url, '_blank');
  },

  openLink(url: string) {
    try {
      if (app?.openLink) return app.openLink(url);
    } catch { /* fallthrough */ }
    window.open(url, '_blank');
  },

  haptic(kind: 'light' | 'success' = 'light') {
    try {
      const h = app?.HapticFeedback;
      if (!h) return;
      if (kind === 'success') h.notificationOccurred?.('success');
      else h.impactOccurred?.('light');
    } catch { /* noop */ }
  },

  share(url: string, text: string) {
    const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`;
    try {
      if (name === 'telegram') return app.openTelegramLink(shareUrl);
      if (app?.shareContent) return app.shareContent({ text, link: url });
    } catch { /* fallthrough */ }
    if (navigator.share) navigator.share({ url, text }).catch(() => undefined);
    else navigator.clipboard?.writeText(url).catch(() => undefined);
  },
};

function withText(url: string, text: string) {
  // t.me/username?text=… поддерживается Telegram для личных чатов
  const sep = url.includes('?') ? '&' : '?';
  return `${url}${sep}text=${encodeURIComponent(text)}`;
}

// Цвета берутся из темы мессенджера, чтобы приложение выглядело «родным».
function applyTheme() {
  const tp = app?.themeParams;
  if (!tp) return;
  const root = document.documentElement.style;
  const map: Record<string, string> = {
    bg_color: '--tg-bg',
    secondary_bg_color: '--tg-bg-2',
    text_color: '--tg-text',
    hint_color: '--tg-hint',
    button_color: '--tg-accent',
    button_text_color: '--tg-accent-text',
  };
  for (const [k, v] of Object.entries(map)) if (tp[k]) root.setProperty(v, tp[k]);
  if (app?.colorScheme) document.documentElement.dataset.scheme = app.colorScheme;
}
