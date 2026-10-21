// Модель ответа POST /api/client/profile.
// Точный контракт заказчик выдаст вместе с документацией — здесь
// предположение по ТЗ. Все маппинги собраны в одном месте (client.ts),
// чтобы подогнать под реальный ответ за час.

export interface ClubLevel {
  name: string;          // «Silver», «Gold»…
  discount: number;      // скидка, %
  threshold: number;     // сумма визитов для получения уровня, ₽
}

export interface Client {
  id: string;
  name: string;
  phone: string;
  totalSpent: number;    // сумма визитов, ₽ — для прогресса до следующего статуса
  level: ClubLevel;
  nextLevel: ClubLevel | null;
}

export interface BonusCard {
  id: string;
  title: string;
  balance: number;
  expiresAt?: string;
}

export type RecordStatus = 'upcoming' | 'done' | 'cancelled';

export interface VisitRecord {
  id: string;
  datetime: string;      // ISO
  category: string;
  service: string;
  branchId: string;
  branchName: string;
  master: string;
  price: number;
  status: RecordStatus;
  rating?: number;       // 1–5, если клиент уже оценил
}

export interface Subscription {
  id: string;
  title: string;
  price: number;
  priceWithDiscount: number;
  paid: number;
  frozen: boolean;
  items: { name: string; total: number; left: number }[];
}

export interface Branch {
  id: string;
  name: string;
  reviewUrl: string;     // ссылка на отзыв в Яндекс/2ГИС картах
}

export interface Referral {
  text: string;
  link: string;
  invited: number;
  bonuses: number;
}

export interface Profile {
  client: Client;
  cards: BonusCard[];
  records: VisitRecord[];   // 20 последних записей
  subscriptions: Subscription[];
  branches: Branch[];
  referral: Referral;
  links: {
    managerChat: string;    // чат отдела заботы (t.me/… или max.ru/…)
    onlineBooking: string;  // онлайн-запись yclients
  };
}
