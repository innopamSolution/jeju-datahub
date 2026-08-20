import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from './Icon';

const DOT = {
  severe: 'var(--red-50)',
  warn: 'var(--orange-50)',
  caution: 'var(--blue-50)',
  info: 'var(--cool-neutral-50, #8A8F99)',
};

/* 알림은 실시간이 아니라 전날 발생분을 당일에 배치로 보여준다 */
const ITEMS = [
  { level: 'severe', title: '연동 민원 45% 증가 (심각 단계)', date: '2026.05.31' },
  { level: 'warn', title: '노형동 민원 28% 증가 (경고 단계)', date: '2026.05.31' },
  { level: 'caution', title: '이도2동 민원 12% 증가 (주의 단계)', date: '2026.05.31' },
];

const BELL_ICON_SVG = (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" aria-hidden="true">
    <path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" stroke="var(--red-50)" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M13.7 21a2 2 0 0 1-3.4 0" stroke="var(--red-50)" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const navigate = useNavigate();

  const alertCount = ITEMS.length;

  useEffect(() => {
    if (!open) return;
    const onDocClick = (e) => { if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false); };
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('click', onDocClick);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('click', onDocClick); document.removeEventListener('keydown', onKey); };
  }, [open]);

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
        {alertCount > 0 && <span className="bell__badge">{alertCount}</span>}
      </button>

      {open && (
        <div className="notif-pop" onClick={(e) => e.stopPropagation()}>
          <div className="notif-head">
            <span className="notif-head__ic">{BELL_ICON_SVG}</span>
            <span className="notif-head__title">알림</span>
            <span className="notif-head__hint">전일 기준 <b>{alertCount}</b>건</span>
            <button className="notif-head__x" type="button" aria-label="닫기" onClick={() => setOpen(false)}>
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
            </button>
          </div>

          <div className="notif-list">
            {ITEMS.map((it, i) => (
              <div key={i} className="notif-row">
                <span className="notif-row__dot" style={{ background: DOT[it.level] }} />
                <span className="notif-row__body"><span className="notif-row__title">{it.title}</span></span>
                <span className="notif-row__time">{it.date}</span>
              </div>
            ))}
          </div>

          <div className="notif-foot">
            <button className="notif-foot__btn notif-foot__btn--primary" type="button" onClick={viewAll}>전체보기</button>
          </div>
        </div>
      )}
    </div>
  );
}
