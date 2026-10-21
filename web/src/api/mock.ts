import type { Profile, VisitRecord } from './types';

// Демо-данные. Даты считаются от «сейчас», чтобы активные записи
// всегда были в будущем, а история — в прошлом.

const day = 24 * 60 * 60 * 1000;
const at = (offsetDays: number, hour: number, min = 0) => {
  const d = new Date(Date.now() + offsetDays * day);
  d.setHours(hour, min, 0, 0);
  return d.toISOString();
};

const branches = [
  { id: 'b1', name: 'Патриаршие', reviewUrl: 'https://yandex.ru/maps/' },
  { id: 'b2', name: 'Сити', reviewUrl: 'https://yandex.ru/maps/' },
];

const masters = ['Анна К.', 'Мария Л.', 'Ольга С.', 'Дарья В.'];
const services: [string, string, number][] = [
  ['Косметология', 'Чистка лица', 4500],
  ['Массаж', 'Массаж спины', 3200],
  ['Ногтевой сервис', 'Маникюр с покрытием', 2600],
  ['Косметология', 'Пилинг', 3900],
  ['Массаж', 'Лимфодренажный массаж', 4100],
];

const past: VisitRecord[] = Array.from({ length: 17 }, (_, i) => {
  const [category, service, price] = services[i % services.length];
  const b = branches[i % 2];
  return {
    id: `p${i + 1}`,
    datetime: at(-(i * 6 + 3), 11 + (i % 7)),
    category,
    service,
    branchId: b.id,
    branchName: b.name,
    master: masters[i % masters.length],
    price,
    status: 'done',
    rating: i > 2 ? 5 - (i % 2) : undefined,
  };
});

const upcoming: VisitRecord[] = [
  { id: 'u1', datetime: at(2, 12, 30), category: 'Косметология', service: 'Чистка лица', branchId: 'b1', branchName: 'Патриаршие', master: 'Анна К.', price: 4500, status: 'upcoming' },
  { id: 'u2', datetime: at(5, 18), category: 'Массаж', service: 'Массаж спины', branchId: 'b2', branchName: 'Сити', master: 'Мария Л.', price: 3200, status: 'upcoming' },
  { id: 'u3', datetime: at(9, 10), category: 'Ногтевой сервис', service: 'Маникюр с покрытием', branchId: 'b1', branchName: 'Патриаршие', master: 'Ольга С.', price: 2600, status: 'upcoming' },
];

export function mockProfile(phone: string): Profile {
  return {
    client: {
      id: 'c-1024',
      name: 'Екатерина',
      phone,
      totalSpent: 68400,
      level: { name: 'Gold', discount: 10, threshold: 50000 },
      nextLevel: { name: 'Platinum', discount: 15, threshold: 100000 },
    },
    cards: [
      { id: 'k1', title: 'Бонусная карта клуба', balance: 2350 },
      { id: 'k2', title: 'Подарочный сертификат', balance: 5000, expiresAt: at(60, 23) },
      { id: 'k3', title: 'Кэшбэк за отзывы', balance: 400 },
    ],
    records: [...upcoming, ...past],
    subscriptions: [
      {
        id: 's1', title: 'Абонемент «Сияние кожи»', price: 36000, priceWithDiscount: 32400, paid: 20000, frozen: false,
        items: [
          { name: 'Чистка лица', total: 4, left: 2 },
          { name: 'Пилинг', total: 4, left: 3 },
          { name: 'Маска альгинатная', total: 4, left: 4 },
        ],
      },
      {
        id: 's2', title: 'Массаж 10 сеансов', price: 30000, priceWithDiscount: 27000, paid: 27000, frozen: true,
        items: [{ name: 'Массаж спины', total: 10, left: 6 }],
      },
    ],
    branches,
    referral: {
      text: 'Пригласите подругу — она получит 1 000 бонусов на первый визит, а вы 1 000 бонусов после её посещения.',
      link: 'https://t.me/miniapptest7_bot?start=ref_c1024',
      invited: 4,
      bonuses: 3000,
    },
    links: {
      // В демо чат «отдела заботы» — демо-аккаунт менеджера; в проде — аккаунт менеджера клуба.
      managerChat: 'https://t.me/SynndicateDemo',
      // В демо — общая страница yclients; в проде — ссылка на онлайн-запись филиала.
      onlineBooking: 'https://yclients.com/',
    },
  };
}
