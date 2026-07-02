import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from './Icon';

const DOT = {
  severe: 'var(--red-50)',
  warn: 'var(--orange-50)',
  caution: 'var(--blue-50)',
  info: 'var(--cool-neutral-50, #8A8F99)',
};

const INITIAL_ITEMS = [
  { level: 'severe', title: '연동 민원 급증 — 최근 1시간 89건', time: '2026.05.31 14:21', unread: true },
  { level: 'warn', title: '노형동 주차 혼잡도 상승 (경고 단계)', time: '2026.05.31 13:48', unread: true },
  { level: 'caution', title: '이도2동 불법주차 신고 증가', time: '2026.05.31 11:05', unread: true },
  { level: 'info', title: '2026년 3월 월간 민원 리포트 생성 완료', time: '2026.05.30 09:00', unread: false },
  { level: 'info', title: '공영주차장 운영 관리 지침 업데이트', time: '2026.05.29 16:30', unread: false },
];

const BELL_ICON_SVG = (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" aria-hidden="true">
    <path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" stroke="var(--red-50)" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M13.7 21a2 2 0 0 1-3.4 0" stroke="var(--red-50)" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export default function NotificationBell() {
  const [items, setItems] = useState(INITIAL_ITEMS);
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const navigate = useNavigate();

  const unreadCount = items.filter((i) => i.unread).length;

  useEffect(() => {
    if (!open) return;
    const onDocClick = (e) => { if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false); };
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('click', onDocClick);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('click', onDocClick); document.removeEventListener('keydown', onKey); };
  }, [open]);

  const markRead = (idx) => setItems((prev) => prev.map((it, i) => (i === idx ? { ...it, unread: false } : it)));
  const markAllRead = () => setItems((prev) => prev.map((it) => ({ ...it, unread: false })));
  const viewAll = () => { setOpen(false); navigate('/alerts/inquiry'); };

  return (
    <div className="bell" ref={rootRef}>
      <button
        type="button"
        aria-label="알림"
        style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'flex', alignItems: 'center' }}
        onClick={(e) => { e.stopPropagation(); setOpen((o) => !o); }}
      >
        <Icon name="bell" size={22} />
        {unreadCount > 0 && <span className="bell__badge">{unreadCount}</span>}
      </button>

      {open && (
        <div className="notif-pop" onClick={(e) => e.stopPropagation()}>
          <div className="notif-head">
            <span className="notif-head__ic">{BELL_ICON_SVG}</span>
            <span className="notif-head__title">알림</span>
            <span className="notif-head__count">{unreadCount}</span>
            <button className="notif-head__x" type="button" aria-label="닫기" onClick={() => setOpen(false)}>
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
            </button>
          </div>

          <div className="notif-list">
            {items.map((it, i) => (
              <button
                key={i}
                className={`notif-row${it.unread ? '' : ' notif-row--read'}`}
                type="button"
                onClick={() => markRead(i)}
              >
                <span className="notif-row__dot" style={{ background: DOT[it.level] }} />
                <span className="notif-row__body"><span className="notif-row__title">{it.title}</span></span>
                <span className="notif-row__time">{it.time}</span>
              </button>
            ))}
          </div>

          <div className="notif-foot">
            <button className="notif-foot__btn" type="button" onClick={markAllRead}>모두 읽음</button>
            <button className="notif-foot__btn notif-foot__btn--primary" type="button" onClick={viewAll}>전체보기</button>
          </div>
        </div>
      )}
    </div>
  );
}
