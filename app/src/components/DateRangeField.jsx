import { useEffect, useRef, useState } from 'react';
import Icon from './Icon';

/* 기간 선택 필드.
   - type="month": 커스텀 월 피커(연도 ‹ › 이동 + 12개월 그리드)로 YYYY-MM 선택
   - type="date"(기본): 네이티브 날짜 피커, 박스 어디를 눌러도 달력이 열림 */
export default function DateRangeField({ defaultFrom, defaultTo, type = 'date' }) {
  const [from, setFrom] = useState(defaultFrom);
  const [to, setTo] = useState(defaultTo);
  const fromRef = useRef(null);
  const toRef = useRef(null);
  const wrapRef = useRef(null);
  const isMonth = type === 'month';

  /* 커스텀 월 피커 상태 */
  const [open, setOpen] = useState(null); // 'from' | 'to' | null
  const [viewYear, setViewYear] = useState(() => Number((defaultFrom || '2026').slice(0, 4)));

  useEffect(() => {
    if (!open) return;
    const onDoc = (e) => { if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(null); };
    const onKey = (e) => { if (e.key === 'Escape') setOpen(null); };
    document.addEventListener('click', onDoc);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('click', onDoc); document.removeEventListener('keydown', onKey); };
  }, [open]);

  const openPicker = (which) => {
    if (isMonth) {
      const cur = which === 'from' ? from : to;
      setViewYear(Number((cur || '2026').slice(0, 4)));
      setOpen((o) => (o === which ? null : which));
      return;
    }
    const ref = which === 'from' ? fromRef : toRef;
    try { ref.current?.showPicker(); } catch { ref.current?.focus(); }
  };

  const pickMonth = (m) => {
    const val = `${viewYear}-${String(m).padStart(2, '0')}`;
    if (open === 'from') setFrom(val);
    else setTo(val);
    setOpen(null);
  };

  const selected = open === 'from' ? from : to;
  const selYear = Number((selected || '').slice(0, 4));
  const selMonth = Number((selected || '').slice(5, 7));

  return (
    <div className="field__dates" ref={wrapRef} style={{ position: 'relative' }}>
      <span className="field__date" onClick={() => openPicker('from')}>
        {from}
        <Icon name="calendar" size={16} />
        {!isMonth && (
          <input ref={fromRef} type={type} className="field__date-input" value={from} max={to}
            aria-label="시작일" onClick={() => openPicker('from')} onChange={(e) => setFrom(e.target.value)} />
        )}
      </span>
      <span className="field__tilde">~</span>
      <span className="field__date" onClick={() => openPicker('to')}>
        {to}
        <Icon name="calendar" size={16} />
        {!isMonth && (
          <input ref={toRef} type={type} className="field__date-input" value={to} min={from}
            aria-label="종료일" onClick={() => openPicker('to')} onChange={(e) => setTo(e.target.value)} />
        )}
      </span>

      {isMonth && open && (
        <div className="month-pop" role="dialog" aria-label={open === 'from' ? '시작월 선택' : '종료월 선택'}>
          <div className="month-pop__head">
            <button type="button" className="month-pop__nav" aria-label="이전 연도" onClick={() => setViewYear((y) => y - 1)}>
              <Icon name="chevron-left" size={16} />
            </button>
            <span className="month-pop__year">{viewYear}년</span>
            <button type="button" className="month-pop__nav" aria-label="다음 연도" onClick={() => setViewYear((y) => y + 1)}>
              <Icon name="chevron-right" size={16} />
            </button>
          </div>
          <div className="month-pop__grid">
            {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => {
              const isSel = viewYear === selYear && m === selMonth;
              return (
                <button key={m} type="button"
                  className={`month-pop__cell${isSel ? ' is-active' : ''}`}
                  onClick={() => pickMonth(m)}>
                  {m}월
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
