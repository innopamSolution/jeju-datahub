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

const GRID_RANKINGS = [
  { rank: 1, name: '연동 대로변', count: 52, level: 'high' },
  { rank: 2, name: '제주도청 인근', count: 38, level: 'mid' },
  { rank: 3, name: '신광초등학교 주변', count: 29, level: 'mid' },
  { rank: 4, name: '제주공항 인근', count: 21, level: 'low-blue' },
  { rank: 5, name: '동문시장 주변', count: 10, level: 'low-green' },
  { rank: 6, name: '동문시장 주변 2', count: 10, level: 'low-green' },
  { rank: 7, name: '동문시장 주변 3', count: 10, level: 'low-green' },
  { rank: 8, name: '한림해수욕장 근처', count: 18, level: 'high' },
];

const DOT_COLOR = { high: '#ef4444', mid: '#f97316', 'low-blue': '#3b82f6', 'low-green': '#22c55e' };
const LEGEND = [
  { label: '심각 (40건↑)', color: '#ef4444' },
  { label: '경고 (20~39건)', color: '#f97316' },
  { label: '주의 (10~19건)', color: '#3b82f6' },
  { label: '양호 (10건 미만)', color: '#22c55e' },
];

const GRID_SUMMARY = [
  { label: '총 분석 격자', value: '156개', color: 'var(--text-strong)' },
  { label: '심각', value: '52개', color: '#ef4444' },
  { label: '경고', value: '38개', color: '#f97316' },
  { label: '주의', value: '19개', color: '#3b82f6' },
  { label: '양호', value: '4개', color: '#22c55e' },
];

function Map() {
  const ref = useRef(null);
  useEffect(() => {
    if (!ref.current) return;
    const map = L.map(ref.current, { zoomControl: true }).setView([33.489, 126.498], 12);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, opacity: 0.9 }).addTo(map);
    const pts = [
      { pos: [33.500, 126.527], name: '연동 대로변', count: 52, level: 'high' },
      { pos: [33.497, 126.529], name: '제주도청 인근', count: 38, level: 'mid' },
      { pos: [33.487, 126.499], name: '신광초등학교 주변', count: 29, level: 'mid' },
      { pos: [33.512, 126.493], name: '제주공항 인근', count: 21, level: 'low-blue' },
      { pos: [33.517, 126.527], name: '동문시장 주변', count: 10, level: 'low-green' },
    ];
    pts.forEach((p) => {
      const col = DOT_COLOR[p.level];
      const size = 36;
      const icon = L.divIcon({
        html: `<div style="width:${size}px;height:${size}px;border-radius:4px;background:${col};opacity:0.75;border:2px solid ${col};box-shadow:0 1px 6px rgba(0,0,0,0.2);display:flex;align-items:center;justify-content:center;color:#fff;font-size:11px;font-weight:800;">${p.count}</div>`,
        iconSize: [size, size], iconAnchor: [size / 2, size / 2], className: '',
      });
      L.marker(p.pos, { icon }).addTo(map).bindPopup(`<b>${p.name}</b><br>민원 ${p.count}건`);
    });
    return () => map.remove();
  }, []);
  return <div ref={ref} style={{ width: '100%', height: '100%' }} />;
}

export default function LifestyleSimulation() {
  const [mode, setMode] = useState('complaint');
  const [gridSize, setGridSize] = useState('500');
  const [period] = useState('2026-01-01 ~ 2026-05-31');

  return (
    <>
      <header className="topbar">
        <div>
          <h1 className="page-title">생활권 시뮬레이션</h1>
          <p className="page-sub">격자(Grid) 기반 민원·수급·혼잡도 분석</p>
        </div>
        <div className="topbar__actions">
          <button className="btn btn--ai" type="button">{AI_ICON} AI 대화 시작하기</button>
          <button className="btn" type="button"><Icon name="download" size={20} /> 내보내기</button>
          <button className="bell" type="button" aria-label="알림"><Icon name="bell" size={22} /><span className="bell__badge">3</span></button>
        </div>
      </header>

      <div style={{ position: 'relative', flex: 1, display: 'flex', overflow: 'hidden', margin: '0 24px 24px', borderRadius: 16 }}>
        {/* 지도 */}
        <div style={{ position: 'absolute', inset: 0, borderRadius: 16, overflow: 'hidden' }}>
          <Map />
        </div>

        {/* 좌측 설정 패널 */}
        <div style={{ position: 'relative', zIndex: 10, width: 272, margin: 16, background: '#fff', borderRadius: 14, boxShadow: '0 4px 24px rgba(0,0,0,0.18)', display: 'flex', flexDirection: 'column', gap: 18, padding: '22px 20px', alignSelf: 'flex-start' }}>
          <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--text-strong)' }}>생활권 분석 설정</h2>

          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-alternative)', marginBottom: 6 }}>분석 내용</div>
            <DsSelect value={mode} onChange={(e) => setMode(e.target.value)} style={{ width: '100%' }}>
              <option value="complaint">민원 건수</option>
              <option value="supply">수급 현황</option>
              <option value="congestion">혼잡도</option>
            </DsSelect>
          </div>

          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-alternative)', marginBottom: 6 }}>분석 지역</div>
            <DsSelect style={{ width: '100%' }}>
              <option>제주시</option><option>서귀포시</option>
            </DsSelect>
          </div>

          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-alternative)', marginBottom: 6 }}>분석 기간</div>
            <div style={{ fontSize: 12, color: 'var(--text-assistive)', background: 'var(--fill-normal)', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--line-normal)' }}>{period}</div>
          </div>

          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-alternative)', marginBottom: 6 }}>격자 크기</div>
            <div className="segment">
              {[['100', '100m'], ['200', '200m'], ['300', '300m'], ['500', '500m']].map(([k, l]) => (
                <button key={k} type="button" className={`segment__btn ${gridSize === k ? 'segment__btn--active' : ''}`} onClick={() => setGridSize(k)} style={{ fontSize: 12 }}>{l}</button>
              ))}
            </div>
          </div>

          <button type="button" style={{ height: 42, borderRadius: 10, border: 'none', background: 'var(--primary)', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <svg viewBox="0 0 24 24" fill="none" width="14" height="14"><path d="M8 5v14l11-7z" fill="currentColor" /></svg>
            생활권 분석 실행
          </button>
        </div>

        {/* 우측 결과 패널 */}
        <div style={{ position: 'absolute', top: 16, right: 16, bottom: 16, zIndex: 10, width: 288, background: '#fff', borderRadius: 14, boxShadow: '0 4px 24px rgba(0,0,0,0.18)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* 분석 결과 요약 */}
          <div style={{ padding: '18px 20px', borderBottom: '1px solid var(--line-alternative)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: 'var(--text-strong)' }}>분석 결과 요약</h3>
              <span style={{ padding: '2px 8px', borderRadius: 4, background: 'var(--primary)', color: '#fff', fontSize: 11, fontWeight: 700 }}>{gridSize}M</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
              {GRID_SUMMARY.map((s) => (
                <div key={s.label} style={{ padding: '8px 10px', borderRadius: 8, background: 'var(--fill-normal)', display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <span style={{ fontSize: 11, color: 'var(--text-assistive)' }}>{s.label}</span>
                  <span style={{ fontSize: 15, fontWeight: 800, color: s.color }}>{s.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* 민원 집중 구역 랭킹 */}
          <div style={{ padding: '14px 20px 8px', borderBottom: '1px solid var(--line-alternative)' }}>
            <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: 'var(--text-strong)' }}>민원 집중 구역</h3>
            <p style={{ margin: '3px 0 0', fontSize: 11, color: 'var(--text-assistive)' }}>격자 기반 집계</p>
          </div>
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {GRID_RANKINGS.map((r) => (
              <div key={r.rank} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', borderBottom: '1px solid var(--line-alternative)' }}>
                <span style={{ width: 22, height: 22, borderRadius: '50%', background: DOT_COLOR[r.level], color: '#fff', fontSize: 11, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{r.rank}</span>
                <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: 'var(--text-strong)' }}>{r.name}</span>
                <span style={{ fontSize: 14, fontWeight: 800, color: DOT_COLOR[r.level] }}>{r.count}건</span>
              </div>
            ))}
          </div>
        </div>

        {/* 범례 + 격자 크기 칩 (좌하단) */}
        <div style={{ position: 'absolute', bottom: 16, left: 16, zIndex: 10, background: 'rgba(255,255,255,0.96)', borderRadius: 10, padding: '10px 14px', boxShadow: '0 2px 10px rgba(0,0,0,0.12)', display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-alternative)' }}>민원 건수 기준</span>
            <span style={{ marginLeft: 16, padding: '2px 8px', borderRadius: 4, background: 'var(--primary)', color: '#fff', fontSize: 10, fontWeight: 700 }}>격자 {gridSize}m × {gridSize}m</span>
          </div>
          {LEGEND.map((l) => (
            <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--text-neutral)' }}>
              <span style={{ width: 10, height: 10, borderRadius: 2, background: l.color, flexShrink: 0 }} />
              {l.label}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
