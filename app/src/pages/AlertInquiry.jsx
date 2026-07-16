import { useMemo, useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../components/Icon';
import NotificationBell from '../components/NotificationBell';

const AI_ICON = (
  <svg viewBox="0 0 36 36" fill="none" width="22" height="22" aria-hidden="true" style={{ flexShrink: 0 }}>
    <path d="M18.4 8.6c.2-2.5 2.4-4.4 4.9-4.1-.2 2.5-2.4 4.3-4.9 4.1Z" fill="#3DA35D" />
    <path d="M18.4 8.6c-.2-2-2-3.5-4-3.3.2 2 2 3.5 4 3.3Z" fill="#4FB96A" />
    <circle cx="18" cy="21" r="12.5" fill="#F79009" />
    <path d="M9 18.6a9 9 0 0 1 18 0Z" fill="#FBB454" opacity="0.5" />
    <circle cx="11.8" cy="23.2" r="2" fill="#FF8A5B" opacity="0.5" />
    <circle cx="24.2" cy="23.2" r="2" fill="#FF8A5B" opacity="0.5" />
    <circle cx="13.8" cy="20" r="1.7" fill="#4A3415" />
    <circle cx="22.2" cy="20" r="1.7" fill="#4A3415" />
    <circle cx="14.4" cy="19.4" r="0.55" fill="#fff" />
    <circle cx="22.8" cy="19.4" r="0.55" fill="#fff" />
    <path d="M14 24.6a4.4 4.4 0 0 0 8 0" stroke="#4A3415" strokeWidth="1.6" strokeLinecap="round" fill="none" />
  </svg>
);

const DATA = [
  { level: 'severe',  city: '제주시',   region: '연동',   name: '연동 민원 급증',      date: '2026-05-01 14:21', count: 89 },
  { level: 'warn',    city: '제주시',   region: '노형동', name: '노형동 주간 증가',    date: '2026-05-05 13:05', count: 62 },
  { level: 'warn',    city: '제주시',   region: '전체',   name: '불법주차 주간 29건',  date: '2026-05-28 11:47', count: 29 },
  { level: 'caution', city: '제주시',   region: '이도동', name: '이도동 주의 알림',    date: '2026-04-18 09:30', count: 34 },
  { level: 'severe',  city: '제주시',   region: '노형동', name: '노형 사거리 급증',    date: '2026-03-22 16:10', count: 95 },
  { level: 'warn',    city: '제주시',   region: '연동',   name: '연동 상권 혼잡',      date: '2026-02-14 11:00', count: 58 },
  { level: 'caution', city: '제주시',   region: '애월읍', name: '애월 해안 주차 주의', date: '2026-01-09 10:20', count: 31 },
  { level: 'severe',  city: '서귀포시', region: '성산읍', name: '성산 관광지 급증',    date: '2025-12-28 15:45', count: 91 },
];

const DONGS = {
  제주시: ['연동', '노형동', '이도동', '애월읍'],
  서귀포시: ['성산읍', '중문동', '효돈동'],
};

const META = {
  severe:  { label: '심각', badge: 'badge--severe' },
  warn:    { label: '경고', badge: 'badge--warn' },
  caution: { label: '주의', badge: 'badge--caution' },
};

const TODAY = new Date('2026-05-31T23:59:59');

const LEVELS = [['all', '전체'], ['severe', '심각'], ['warn', '경고'], ['caution', '주의']];
const PERIODS = [['yesterday', '어제'], ['week', '최근 1주일'], ['1', '최근 1개월'], ['3', '최근 3개월']];

function fmtDate(s) { return s.replace(/-/g, '.'); }

export default function AlertInquiry() {
  const navigate = useNavigate();
  const [level, setLevel] = useState('all');
  const [period, setPeriod] = useState('3');
  const [city, setCity] = useState('all');
  const [dong, setDong] = useState('all');
  const [customRange, setCustomRange] = useState(null);
  const [popOpen, setPopOpen] = useState(false);
  const [dateFrom, setDateFrom] = useState('2026-01-01');
  const [dateTo, setDateTo] = useState('2026-05-31');
  const pickRef = useRef(null);

  useEffect(() => {
    if (!popOpen) return;
    const onDoc = (e) => { if (pickRef.current && !pickRef.current.contains(e.target)) setPopOpen(false); };
    const onKey = (e) => { if (e.key === 'Escape') setPopOpen(false); };
    document.addEventListener('click', onDoc);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('click', onDoc); document.removeEventListener('keydown', onKey); };
  }, [popOpen]);

  const rangeBounds = () => {
    if (customRange) return customRange;
    const from = new Date(TODAY);
    if (period === 'yesterday') { from.setDate(from.getDate() - 1); from.setHours(0, 0, 0, 0); const to = new Date(from); to.setHours(23, 59, 59, 0); return { from, to }; }
    if (period === 'week') { from.setDate(from.getDate() - 7); return { from, to: TODAY }; }
    from.setMonth(from.getMonth() - parseInt(period, 10));
    return { from, to: TODAY };
  };

  const rows = useMemo(() => {
    const b = rangeBounds();
    return DATA.filter((r) => {
      if (level !== 'all' && r.level !== level) return false;
      if (city !== 'all' && r.city !== city) return false;
      if (dong !== 'all' && r.region !== dong) return false;
      const d = new Date(r.date.replace(' ', 'T') + ':00');
      return d >= b.from && d <= b.to;
    }).sort((a, c) => new Date(c.date.replace(' ', 'T')) - new Date(a.date.replace(' ', 'T')));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [level, period, city, dong, customRange]);

  const nSevere = rows.filter((r) => r.level === 'severe').length;
  const nWarn = rows.filter((r) => r.level === 'warn').length;
  const nCaution = rows.filter((r) => r.level === 'caution').length;
  const sum = rows.reduce((a, r) => a + r.count, 0);

  const dongList = city !== 'all' && DONGS[city] ? DONGS[city] : [];

  const applyDate = () => {
    if (dateFrom && dateTo) {
      setCustomRange({ from: new Date(dateFrom + 'T00:00:00'), to: new Date(dateTo + 'T23:59:59') });
      setPeriod('');
    }
    setPopOpen(false);
  };

  return (
    <>
      <header className="topbar">
        <div>
          <h1 className="page-title">위험단계 알림 조회</h1>
          <p className="page-sub">민원 급증·위험 단계별 알림 이력 조회</p>
        </div>
        <div className="topbar__actions">
          <button className="btn btn--ai" type="button" onClick={() => navigate('/ai-assistant', { state: { focus: true } })}>{AI_ICON} AI 대화 시작하기</button>
          <NotificationBell />
        </div>
      </header>

      {/* 필터 바 */}
      <div className="filterbar">
        <span className="filterbar__label">단계</span>
        <div className="segment">
          {LEVELS.map(([k, l]) => (
            <button key={k} className={`segment__btn${level === k ? ' segment__btn--active' : ''}`} type="button" onClick={() => setLevel(k)}>{l}</button>
          ))}
        </div>
        <span className="filter-sep" />
        <span className="filterbar__label">시/도</span>
        <div className="ds-select alert-select">
          <select aria-label="시/도" value={city} onChange={(e) => { setCity(e.target.value); setDong('all'); }}>
            <option value="all">전체</option>
            <option value="제주시">제주시</option>
            <option value="서귀포시">서귀포시</option>
          </select>
          <span className="ds-select__ic"><Icon name="chevron-down" size={18} /></span>
        </div>
        <div className="ds-select alert-select">
          <select aria-label="읍면동" value={dong} disabled={dongList.length === 0} onChange={(e) => setDong(e.target.value)}>
            <option value="all">읍면동 전체</option>
            {dongList.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
          <span className="ds-select__ic"><Icon name="chevron-down" size={18} /></span>
        </div>
        <span className="filter-sep" />
        <span className="filterbar__label">기간</span>
        <div className="segment">
          {PERIODS.map(([k, l]) => (
            <button key={k} className={`segment__btn${period === k ? ' segment__btn--active' : ''}`} type="button" onClick={() => { setPeriod(k); setCustomRange(null); }}>{l}</button>
          ))}
        </div>
        <div className="date-pick" ref={pickRef}>
          <button className={`btn${customRange ? ' btn--apply' : ''}`} type="button" style={{ height: 40 }} aria-haspopup="true" aria-expanded={popOpen}
            onClick={(e) => { e.stopPropagation(); setPopOpen((o) => !o); }}>
            <Icon name="calendar" size={18} /> 기간 선택
          </button>
          {popOpen && (
            <div className="date-pop">
              <div className="date-pop__row">
                <label className="date-pop__field">
                  <span>시작일</span>
                  <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
                </label>
                <label className="date-pop__field">
                  <span>종료일</span>
                  <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
                </label>
              </div>
              <div className="date-pop__foot">
                <button className="btn" type="button" style={{ height: 38 }} onClick={() => setPopOpen(false)}>취소</button>
                <button className="btn btn--apply" type="button" style={{ height: 38 }} onClick={applyDate}>적용</button>
              </div>
            </div>
          )}
        </div>
        <span className="filterbar__right">조회 결과 <strong>{rows.length}건</strong></span>
      </div>

      {/* 콘텐츠 */}
      <div className="content content--alert">
        {/* 통계 카드 */}
        <section className="stat-row">
          <div className="card stat">
            <div className="stat__icon stat__icon--blue"><Icon name="bell" size={28} /></div>
            <div>
              <div className="stat__label">조회 알림 건수</div>
              <div className="stat__value">{rows.length}<span className="stat__unit">건</span></div>
              <div className="stat__delta">선택 조건 기준</div>
            </div>
          </div>
          <div className="card stat">
            <div className="stat__icon stat__icon--red"><Icon name="warning" size={28} /></div>
            <div>
              <div className="stat__label">심각 단계</div>
              <div className="stat__value">{nSevere}<span className="stat__unit">건</span></div>
              <div className="stat__delta">경고 {nWarn} · 주의 {nCaution}</div>
            </div>
          </div>
          <div className="card stat">
            <div className="stat__icon stat__icon--orange"><Icon name="chart" size={28} /></div>
            <div>
              <div className="stat__label">누적 민원 수</div>
              <div className="stat__value">{sum.toLocaleString()}<span className="stat__unit">건</span></div>
              <div className="stat__delta">선택 기간 합계</div>
            </div>
          </div>
        </section>

        {/* 알림 이력 */}
        <div className="card alert-card">
          <div className="alert-card__head">
            <h2 className="card-head__title">알림 이력</h2>
            <span className="alert-card__hint">상단 필터 조건에 따라 자동 갱신</span>
          </div>
          <div className="rt-wrap">
            <table className="rt">
              <thead>
                <tr>
                  <th className="col-center">단계</th>
                  <th className="col-center">지역</th>
                  <th>내용</th>
                  <th className="col-center">일시</th>
                  <th className="col-center">민원 수</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => {
                  const m = META[r.level];
                  return (
                    <tr key={i}>
                      <td className="col-center"><span className={`badge ${m.badge}`}>{m.label}</span></td>
                      <td className="col-center">{r.region === '전체' ? r.city : r.region}</td>
                      <td><span className="rt-name">{r.name}</span></td>
                      <td className="col-center rt-date">{fmtDate(r.date)}</td>
                      <td className="col-center">{r.count}건</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {rows.length === 0 && <div className="alert-empty">조건에 해당하는 알림이 없습니다.</div>}
          </div>
        </div>
      </div>
    </>
  );
}
