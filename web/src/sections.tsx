import { useMemo, useState } from 'react';
import type { Profile, VisitRecord } from './api/types';
import { isDemo, rateVisit } from './api/client';
import { platform } from './platform';
import { date, dateTime, formatPhone, num, plural, rub, weekday } from './format';

/* 1. Статус клуба */
export function ClubStatus({ p }: { p: Profile }) {
  const { client } = p;
  const next = client.nextLevel;
  const progress = next
    ? Math.min(1, (client.totalSpent - client.level.threshold) / (next.threshold - client.level.threshold))
    : 1;
  return (
    <section className="status card-hero">
      <div className="status-top">
        <div>
          <div className="status-hello">Здравствуйте, {client.name}</div>
          <div className="status-phone">{formatPhone(client.phone)}</div>
        </div>
        <div className="status-badge">
          <span>{client.level.name}</span>
          <b>−{client.level.discount}%</b>
        </div>
      </div>
      {next ? (
        <>
          <div className="progress progress-hero"><i style={{ width: `${Math.max(4, progress * 100)}%` }} /></div>
          <div className="status-next">
            До статуса <b>{next.name}</b> (−{next.discount}%) осталось{' '}
            <b>{rub(Math.max(0, next.threshold - client.totalSpent))}</b>
          </div>
        </>
      ) : (
        <div className="status-next">У вас максимальный статус клуба</div>
      )}
    </section>
  );
}

/* 2. Бонусные карты */
export function Cards({ p }: { p: Profile }) {
  return (
    <section>
      <h2>Бонусные карты</h2>
      <div className="cards-row">
        {p.cards.map((c, i) => (
          <div key={c.id} className={`bonus-card v${i % 3}`}>
            <div className="bonus-title">{c.title}</div>
            <div className="bonus-balance">{num(c.balance)}</div>
            <div className="bonus-sub">{c.expiresAt ? `до ${date(c.expiresAt)}` : 'бонусов'}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* 3. Кнопки действий */
export function Actions({ p }: { p: Profile }) {
  const name = p.client.name;
  const [bookingInfo, setBookingInfo] = useState(false);
  const openBooking = () => {
    platform.haptic();
    // В демо ссылки салона ещё нет — объясняем, что откроется, вместо перехода на чужой сайт.
    if (isDemo) setBookingInfo(true);
    else platform.openLink(p.links.onlineBooking);
  };
  return (
    <section className="actions">
      {bookingInfo && (
        <div className="sheet-backdrop" onClick={() => setBookingInfo(false)}>
          <div className="sheet" role="dialog" aria-modal="true" aria-labelledby="booking-title" onClick={(e) => e.stopPropagation()}>
            <div className="sheet-handle" />
            <h2 id="booking-title">Онлайн-запись</h2>
            <p>Здесь откроется онлайн-запись вашего салона в yclients: клиент сам выберет филиал, услугу, мастера и удобное время.</p>
            <p className="muted">Подключается по ссылке на онлайн-запись из вашего кабинета yclients — без доработки приложения.</p>
            <button className="btn btn-primary" onClick={() => setBookingInfo(false)}>Понятно</button>
          </div>
        </div>
      )}
      <button className="btn btn-primary" onClick={() => {
        platform.haptic();
        platform.openChat(p.links.managerChat, `Здравствуйте! Меня зовут ${name}, хочу записаться на процедуру.`);
      }}>Записаться на процедуру</button>
      <div className="actions-row">
        <button className="btn" onClick={openBooking}>Онлайн-запись</button>
        <button className="btn" onClick={() => {
          platform.haptic();
          platform.openChat(p.links.managerChat, `Здравствуйте! Это ${name}, у меня вопрос.`);
        }}>Отдел заботы</button>
      </div>
    </section>
  );
}

/* 4. Активные записи */
export function Upcoming({ p }: { p: Profile }) {
  const list = p.records
    .filter((r) => r.status === 'upcoming')
    .sort((a, b) => a.datetime.localeCompare(b.datetime));
  return (
    <section>
      <h2>Ближайшие записи</h2>
      {list.length === 0 && <div className="empty">Активных записей нет</div>}
      <div className="list">
        {list.map((r) => (
          <div key={r.id} className="row">
            <div className="row-date">
              <b>{new Date(r.datetime).getDate()}</b>
              <span>{weekday(r.datetime)}</span>
            </div>
            <div className="row-main">
              <div className="row-title">{r.service}</div>
              <div className="row-sub">{dateTime(r.datetime)} · {r.category}</div>
              <div className="row-sub">{r.branchName} · мастер {r.master}</div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* 5. Абонементы */
export function Subscriptions({ p }: { p: Profile }) {
  if (!p.subscriptions.length) return null;
  return (
    <section>
      <h2>Абонементы</h2>
      <div className="list">
        {p.subscriptions.map((s) => {
          const total = s.items.reduce((a, i) => a + i.total, 0);
          const left = s.items.reduce((a, i) => a + i.left, 0);
          const due = Math.max(0, s.priceWithDiscount - s.paid);
          return (
            <div key={s.id} className={`sub ${s.frozen ? 'is-frozen' : ''}`}>
              <div className="sub-head">
                <div className="row-title">{s.title}</div>
                {s.frozen && <span className="tag">Заморожен</span>}
              </div>
              <div className="sub-price">
                <s>{rub(s.price)}</s> <b>{rub(s.priceWithDiscount)}</b>
              </div>
              <div className="sub-pay">
                <span>Оплачено {rub(s.paid)}</span>
                <span className={due ? 'due' : 'ok'}>{due ? `К оплате ${rub(due)}` : 'Оплачен полностью'}</span>
              </div>
              <div className="progress"><i style={{ width: `${((total - left) / total) * 100}%` }} /></div>
              <div className="row-sub">Использовано {total - left} из {total}</div>
              <ul className="sub-items">
                {s.items.map((i) => (
                  <li key={i.name}><span>{i.name}</span><span>осталось {i.left} из {i.total}</span></li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </section>
  );
}

/* 6–7. Последние визиты + оценка */
const PAGE = 5;
export function Visits({ p }: { p: Profile }) {
  const past = useMemo(
    () => p.records.filter((r) => r.status === 'done').sort((a, b) => b.datetime.localeCompare(a.datetime)),
    [p.records],
  );
  const [page, setPage] = useState(0);
  const pages = Math.max(1, Math.ceil(past.length / PAGE));
  const slice = past.slice(page * PAGE, page * PAGE + PAGE);
  return (
    <section>
      <h2>Последние визиты</h2>
      <div className="list">
        {slice.map((r) => <Visit key={r.id} r={r} p={p} />)}
      </div>
      {pages > 1 && (
        <div className="pager">
          <button className="btn btn-sm" disabled={page === 0} onClick={() => setPage(page - 1)}>Назад</button>
          <span>{page + 1} / {pages}</span>
          <button className="btn btn-sm" disabled={page >= pages - 1} onClick={() => setPage(page + 1)}>Ещё</button>
        </div>
      )}
    </section>
  );
}

function Visit({ r, p }: { r: VisitRecord; p: Profile }) {
  const [rating, setRating] = useState(r.rating ?? 0);
  const [justRated, setJustRated] = useState(false);
  const branch = p.branches.find((b) => b.id === r.branchId);
  const rate = (n: number) => {
    if (r.rating) return;
    setRating(n);
    setJustRated(true);
    platform.haptic('success');
    rateVisit(r.id, n);
  };
  return (
    <div className="visit">
      <div className="row-main">
        <div className="row-title">{r.service}</div>
        <div className="row-sub">{dateTime(r.datetime)} · {r.branchName} · {r.master}</div>
      </div>
      <div className="stars" aria-label="Оценка визита">
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} className={n <= rating ? 'on' : ''} disabled={!!r.rating} onClick={() => rate(n)} aria-label={`${n} из 5`}>★</button>
        ))}
      </div>
      {justRated && rating === 5 && branch && (
        <div className="review">
          Спасибо! Поделитесь впечатлением на картах — это очень поможет филиалу.
          <button className="btn btn-sm btn-primary" onClick={() => platform.openLink(branch.reviewUrl)}>Оставить отзыв</button>
        </div>
      )}
      {justRated && rating < 5 && <div className="review muted">Спасибо за оценку! Мы передадим её управляющему.</div>}
    </div>
  );
}

/* 8. Реферальная программа */
export function Referral({ p }: { p: Profile }) {
  const r = p.referral;
  return (
    <section className="ref">
      <h2>Приглашайте друзей</h2>
      <p>{r.text}</p>
      <div className="ref-stats">
        <div><b>{r.invited}</b><span>{plural(r.invited, 'друг приглашён', 'друга приглашено', 'друзей приглашено')}</span></div>
        <div><b>{num(r.bonuses)}</b><span>бонусов получено</span></div>
      </div>
      <button className="btn btn-primary" onClick={() => platform.share(r.link, 'Записывайся в наш клуб — дарю 1 000 бонусов на первый визит')}>Пригласить</button>
    </section>
  );
}
