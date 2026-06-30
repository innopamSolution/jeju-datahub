import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import Icon from '../components/Icon';
import DsSelect from '../components/DsSelect';

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

const RANKINGS = [
  { rank: 1, name: '노형공영주차장', score: 91, priority: 'high' },
  { rank: 2, name: '연동공영주차장', score: 84, priority: 'high' },
  { rank: 3, name: '이도공영주차장', score: 78, priority: 'mid' },
  { rank: 4, name: '삼도1동공영주차장', score: 73, priority: 'mid' },
  { rank: 5, name: '한림공영주차장', score: 69, priority: 'mid' },
  { rank: 6, name: '중문공영주차장', score: 65, priority: 'mid' },
  { rank: 7, name: '성산공영주차장', score: 62, priority: 'mid' },
  { rank: 8, name: '효돈공영주차장', score: 58, priority: 'low' },
  { rank: 9, name: '구좌공영주차장', score: 54, priority: 'low' },
  { rank: 10, name: '애월공영주차장', score: 51, priority: 'low' },
  { rank: 11, name: '한경공영주차장', score: 47, priority: 'low' },
];

const PRIORITY = {
  high: { label: '높음', color: 'var(--red-40)', bg: 'var(--red-95)', dot: '#ef4444' },
  mid:  { label: '중간', color: 'var(--orange-39)', bg: 'var(--orange-95)', dot: '#f97316' },
  low:  { label: '낮음', color: 'var(--blue-45)', bg: 'var(--blue-95)', dot: '#3b82f6' },
};

function Map() {
  const ref = useRef(null);
  useEffect(() => {
    if (!ref.current) return;
    const map = L.map(ref.current, { zoomControl: true }).setView([33.489, 126.498], 12);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, opacity: 0.9 }).addTo(map);
    const pts = [
      { pos: [33.499, 126.489], name: '노형공영주차장', score: 91, p: 'high' },
      { pos: [33.500, 126.527], name: '연동공영주차장', score: 84, p: 'high' },
      { pos: [33.510, 126.520], name: '이도공영주차장', score: 78, p: 'mid' },
      { pos: [33.505, 126.519], name: '삼도1동공영주차장', score: 73, p: 'mid' },
      { pos: [33.414, 126.268], name: '한림공영주차장', score: 69, p: 'mid' },
    ];
    pts.forEach((p) => {
      const col = PRIORITY[p.p].dot;
      const icon = L.divIcon({ html: `<div style="width:36px;height:36px;border-radius:50%;background:${col};border:3px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;color:#fff;font-size:12px;font-weight:800;">${p.score}</div>`, iconSize: [36, 36], iconAnchor: [18, 18], className: '' });
      L.marker(p.pos, { icon }).addTo(map).bindPopup(`<b>${p.name}</b><br>종합점수: ${p.score}점`);
    });
    return () => map.remove();
  }, []);
  return <div ref={ref} style={{ width: '100%', height: '100%' }} />;
}

export default function InvestmentPriority() {
  const [priorityFilter, setPriorityFilter] = useState('all');

  const filtered = priorityFilter === 'all' ? RANKINGS : RANKINGS.filter((r) => r.priority === priorityFilter);

  return (
    <>
      <header className="topbar">
        <div>
          <h1 className="page-title">공영주차장 투자·보강 우선순위 보드</h1>
          <p className="page-sub">안전위험도 · 민원빈도 · 이용패턴 · 사고이력 종합 지표 자동 산정</p>
        </div>
        <div className="topbar__actions">
          <button className="btn btn--ai" type="button">{AI_ICON} AI 대화 시작하기</button>
          <button className="btn" type="button"><Icon name="download" size={20} /> 내보내기</button>
          <button className="bell" type="button" aria-label="알림"><Icon name="bell" size={22} /><span className="bell__badge">3</span></button>
        </div>
      </header>

      <div className="content" style={{ paddingTop: 24, gap: 20 }}>
        {/* 통계 카드 */}
        <section className="stat-row">
          <div className="card stat">
            <div className="stat__icon stat__icon--blue"><Icon name="location" size={32} /></div>
            <div>
              <div className="stat__label">분석대상 주차장</div>
              <div className="stat__value">28<span style={{ fontSize: 18, color: 'var(--text-alternative)', fontWeight: 600, marginLeft: 4 }}>개소</span></div>
              <div className="stat__delta">제주시·서귀포시 전역</div>
            </div>
          </div>
          <div className="card stat">
            <div className="stat__icon stat__icon--red"><Icon name="warning" size={32} /></div>
            <div>
              <div className="stat__label">높음 우선순위</div>
              <div className="stat__value">7<span style={{ fontSize: 18, color: 'var(--text-alternative)', fontWeight: 600, marginLeft: 4 }}>개소</span></div>
              <div className="stat__delta"><span className="delta-pos">↗ +2개</span> 전분기 대비</div>
            </div>
          </div>
          <div className="card stat">
            <div className="stat__icon stat__icon--green"><Icon name="document" size={32} /></div>
            <div>
              <div className="stat__label">최근 3개월 사고</div>
              <div className="stat__value">2<span style={{ fontSize: 18, color: 'var(--text-alternative)', fontWeight: 600, marginLeft: 4 }}>건</span></div>
              <div className="stat__delta">노형·연동 주차장</div>
            </div>
          </div>
        </section>

        {/* 지도 + 랭킹 */}
        <section style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 20, minHeight: 540 }}>
          {/* 지도 */}
          <div className="card" style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            {/* 컨트롤 바 */}
            <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--line-alternative)', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <select style={{ height: 36, padding: '0 12px', borderRadius: 8, border: '1px solid var(--line-normal)', background: 'var(--fill-normal)', fontSize: 13, fontFamily: 'inherit', cursor: 'pointer' }}>
                <option>제주 전체</option><option>제주시</option><option>서귀포시</option>
              </select>
              <select style={{ height: 36, padding: '0 12px', borderRadius: 8, border: '1px solid var(--line-normal)', background: 'var(--fill-normal)', fontSize: 13, fontFamily: 'inherit', cursor: 'pointer' }}>
                <option>종합점수 높은순</option><option>종합점수 낮은순</option>
              </select>
              <div className="segment">
                {[['all', '전체'], ['high', '높음'], ['mid', '중간'], ['low', '낮음']].map(([k, l]) => (
                  <button key={k} type="button" className={`segment__btn ${priorityFilter === k ? 'segment__btn--active' : ''}`} onClick={() => setPriorityFilter(k)}>{l}</button>
                ))}
              </div>
              <button type="button" style={{ height: 36, padding: '0 14px', borderRadius: 8, border: '1px solid var(--line-normal)', background: 'none', fontSize: 13, cursor: 'pointer', color: 'var(--text-alternative)' }}>초기화</button>
            </div>
            {/* 지도 */}
            <div style={{ flex: 1, minHeight: 420 }}>
              <Map />
            </div>
            {/* 범례 */}
            <div style={{ padding: '12px 20px', borderTop: '1px solid var(--line-alternative)', display: 'flex', gap: 20, flexWrap: 'wrap' }}>
              {[['high', '높음 (80점↑)'], ['mid', '중간 (60~79점)'], ['low', '낮음 (60점 미만)']].map(([k, l]) => (
                <span key={k} className="legend__item">
                  <span className="dot" style={{ background: PRIORITY[k].dot }} />{l}
                </span>
              ))}
            </div>
          </div>

          {/* 우선순위 랭킹 */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ padding: '20px 20px 12px' }}>
              <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: 'var(--text-strong)' }}>투자·보강 우선순위</h2>
              <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--text-assistive)' }}>
                종합점수 기준 : 안전위험도 35% / 민원빈도 25% / 이용패턴 20% / 사고이력 20%
              </p>
            </div>
            <div style={{ flex: 1, overflowY: 'auto' }}>
              {filtered.map((r) => {
                const p = PRIORITY[r.priority];
                return (
                  <div key={r.rank} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 20px', borderBottom: '1px solid var(--line-alternative)' }}>
                    <span style={{ width: 24, height: 24, borderRadius: '50%', background: p.dot, color: '#fff', fontSize: 11, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{r.rank}</span>
                    <span style={{ flex: 1, fontSize: 14, fontWeight: 600, color: 'var(--text-strong)' }}>{r.name}</span>
                    <span style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-strong)', fontFamily: 'var(--font-sans)', marginRight: 8 }}>{r.score}점</span>
                    <span className="badge" style={{ background: p.bg, color: p.color }}>{p.label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
