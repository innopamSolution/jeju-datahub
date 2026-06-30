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
  { rank: 1, name: '노형사거리', score: 90, level: 'high' },
  { rank: 2, name: '연동 대로변', score: 87, level: 'high' },
  { rank: 3, name: '이도2동 상업지구', score: 85, level: 'high' },
  { rank: 4, name: '삼도1동 문화거리', score: 75, level: 'mid' },
  { rank: 5, name: '용담 해안도로', score: 72, level: 'mid' },
  { rank: 6, name: '아라동 주택가', score: 70, level: 'mid' },
  { rank: 7, name: '도남동 공원 인근', score: 68, level: 'mid' },
  { rank: 8, name: '한림해수욕장', score: 65, level: 'mid' },
  { rank: 9, name: '화북동 전통시장', score: 60, level: 'low-blue' },
  { rank: 10, name: '일도2동 학교 주변', score: 55, level: 'low-blue' },
  { rank: 11, name: '삼양동 농산물시장', score: 35, level: 'low-green' },
  { rank: 12, name: '외도동 항구 일대', score: 32, level: 'low-green' },
  { rank: 13, name: '노형동 카페 거리', score: 28, level: 'low-green' },
];

const DOT_COLOR = { high: '#ef4444', mid: '#f97316', 'low-blue': '#3b82f6', 'low-green': '#22c55e' };
const LEGEND = [
  { label: '심각 (80점↑)', color: '#ef4444' },
  { label: '경고 (60~79점)', color: '#f97316' },
  { label: '주의 (40~59점)', color: '#3b82f6' },
  { label: '양호 (40점 미만)', color: '#22c55e' },
];

const MAP_PTS = [
  { pos: [33.499, 126.489], name: '노형사거리', score: 90, level: 'high' },
  { pos: [33.500, 126.527], name: '연동 대로변', score: 87, level: 'high' },
  { pos: [33.510, 126.522], name: '이도2동 상업지구', score: 85, level: 'high' },
  { pos: [33.505, 126.519], name: '삼도1동 문화거리', score: 75, level: 'mid' },
  { pos: [33.514, 126.498], name: '용담 해안도로', score: 72, level: 'mid' },
  { pos: [33.450, 126.570], name: '아라동 주택가', score: 70, level: 'mid' },
  { pos: [33.480, 126.540], name: '도남동 공원 인근', score: 68, level: 'mid' },
  { pos: [33.414, 126.268], name: '한림해수욕장', score: 65, level: 'mid' },
];

function Map({ selectedRank }) {
  const ref = useRef(null);
  useEffect(() => {
    if (!ref.current) return;
    const map = L.map(ref.current, { zoomControl: true }).setView([33.489, 126.498], 12);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, opacity: 0.9 }).addTo(map);
    MAP_PTS.forEach((p) => {
      const col = DOT_COLOR[p.level];
      const isSelected = p.score === (RANKINGS[selectedRank - 1]?.score);
      const size = isSelected ? 42 : 34;
      const icon = L.divIcon({
        html: `<div style="width:${size}px;height:${size}px;border-radius:50%;background:${col};border:${isSelected ? 4 : 3}px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;color:#fff;font-size:12px;font-weight:800;">${RANKINGS.find((r) => r.score === p.score)?.rank ?? ''}</div>`,
        iconSize: [size, size], iconAnchor: [size / 2, size / 2], className: '',
      });
      L.marker(p.pos, { icon }).addTo(map).bindPopup(`<b>${p.name}</b><br>종합점수: ${p.score}점`);
    });
    return () => map.remove();
  }, [selectedRank]);
  return <div ref={ref} style={{ width: '100%', height: '100%' }} />;
}

export default function HotspotAnalysis() {
  const [period, setPeriod] = useState('custom');
  const [selectedRank, setSelectedRank] = useState(1);

  return (
    <>
      <header className="topbar">
        <div>
          <h1 className="page-title">집중 구역 분석</h1>
          <p className="page-sub">불법 주차 집중 구역 자동 도출</p>
        </div>
        <div className="topbar__actions">
          <button className="btn btn--ai" type="button">{AI_ICON} AI 대화 시작하기</button>
          <button className="btn" type="button"><Icon name="download" size={20} /> 내보내기</button>
          <button className="bell" type="button" aria-label="알림"><Icon name="bell" size={22} /><span className="bell__badge">3</span></button>
        </div>
      </header>

      {/* 전체 화면 지도 레이아웃 */}
      <div style={{ position: 'relative', flex: 1, display: 'flex', overflow: 'hidden', margin: '0 24px 24px', borderRadius: 16 }}>
        {/* 지도 */}
        <div style={{ position: 'absolute', inset: 0, borderRadius: 16, overflow: 'hidden' }}>
          <Map selectedRank={selectedRank} />
        </div>

        {/* 좌측 설정 패널 */}
        <div style={{ position: 'relative', zIndex: 10, width: 272, margin: 16, background: '#fff', borderRadius: 14, boxShadow: '0 4px 24px rgba(0,0,0,0.18)', display: 'flex', flexDirection: 'column', gap: 18, padding: '22px 20px', alignSelf: 'flex-start' }}>
          <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--text-strong)' }}>집중 구역 분석 설정</h2>

          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-alternative)', marginBottom: 6 }}>분석 내용</div>
            <select style={{ width: '100%', height: 38, padding: '0 12px', borderRadius: 8, border: '1px solid var(--line-normal)', background: 'var(--fill-normal)', fontSize: 13, fontFamily: 'inherit', cursor: 'pointer' }}>
              <option>불법 주차 집중 구역</option>
            </select>
          </div>

          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-alternative)', marginBottom: 6 }}>분석 지역</div>
            <select style={{ width: '100%', height: 38, padding: '0 12px', borderRadius: 8, border: '1px solid var(--line-normal)', background: 'var(--fill-normal)', fontSize: 13, fontFamily: 'inherit', cursor: 'pointer' }}>
              <option>제주시</option><option>서귀포시</option>
            </select>
          </div>

          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-alternative)', marginBottom: 6 }}>분석 기간</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
              {[['1m', '최근1개월'], ['3m', '최근3개월'], ['6m', '최근6개월'], ['custom', '직접설정']].map(([k, l]) => (
                <button key={k} type="button" className={`segment__btn ${period === k ? 'segment__btn--active' : ''}`} onClick={() => setPeriod(k)} style={{ fontSize: 12 }}>{l}</button>
              ))}
            </div>
            {period === 'custom' && (
              <div style={{ marginTop: 8, fontSize: 12, color: 'var(--text-assistive)', background: 'var(--fill-normal)', padding: '8px 10px', borderRadius: 6 }}>
                2026-01-01 ~ 2026-05-31
              </div>
            )}
          </div>

          <button type="button" style={{ height: 42, borderRadius: 10, border: 'none', background: 'var(--primary)', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <svg viewBox="0 0 24 24" fill="none" width="14" height="14"><path d="M8 5v14l11-7z" fill="currentColor" /></svg>
            집중 구역 분석 실행
          </button>
        </div>

        {/* 우측 결과 패널 */}
        <div style={{ position: 'absolute', top: 16, right: 16, bottom: 16, zIndex: 10, width: 288, background: '#fff', borderRadius: 14, boxShadow: '0 4px 24px rgba(0,0,0,0.18)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ padding: '18px 20px 10px', borderBottom: '1px solid var(--line-alternative)' }}>
            <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--text-strong)' }}>불법 주차 집중 구역 순위</h2>
            <p style={{ margin: '4px 0 0', fontSize: 11, color: 'var(--text-assistive)' }}>종합점수 기준 : 민원 건수 60% / 단속 40%</p>
          </div>
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {RANKINGS.map((r) => (
              <div key={r.rank} onClick={() => setSelectedRank(r.rank)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 16px', borderBottom: '1px solid var(--line-alternative)', cursor: 'pointer', background: selectedRank === r.rank ? 'var(--blue-99)' : 'transparent', transition: 'background 0.15s' }}>
                <span style={{ width: 24, height: 24, borderRadius: '50%', background: DOT_COLOR[r.level], color: '#fff', fontSize: 11, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{r.rank}</span>
                <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: 'var(--text-strong)' }}>{r.name}</span>
                <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-strong)', fontFamily: 'var(--font-sans)' }}>{r.score}점</span>
              </div>
            ))}
          </div>
        </div>

        {/* 범례 (좌하단) */}
        <div style={{ position: 'absolute', bottom: 16, left: 16, zIndex: 10, background: 'rgba(255,255,255,0.96)', borderRadius: 10, padding: '10px 14px', boxShadow: '0 2px 10px rgba(0,0,0,0.12)', display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-alternative)', marginBottom: 2 }}>종합점수 기준</div>
          {LEGEND.map((l) => (
            <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--text-neutral)' }}>
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: l.color, flexShrink: 0 }} />
              {l.label}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
