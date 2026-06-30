import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import Icon from '../components/Icon';

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
  { rank: 1, name: '노형사거리', rate: '+52%', count: 142, level: 'high' },
  { rank: 2, name: '연동 대로변', rate: '+52%', count: 138, level: 'high' },
  { rank: 3, name: '이도2동 상업지구', rate: '+52%', count: 131, level: 'high' },
  { rank: 4, name: '삼도1동 문화거리', rate: '+48%', count: 118, level: 'high' },
  { rank: 5, name: '용담 해안도로', rate: '+45%', count: 109, level: 'high' },
  { rank: 6, name: '아라동 주택가', rate: '+44%', count: 98, level: 'mid' },
  { rank: 7, name: '도남동 공원 인근', rate: '+43%', count: 91, level: 'mid' },
  { rank: 8, name: '화북동 전통시장', rate: '+41%', count: 84, level: 'mid' },
  { rank: 9, name: '일도2동 학교 주변', rate: '+40%', count: 77, level: 'mid' },
  { rank: 10, name: '삼양동 농산물시장', rate: '+39%', count: 68, level: 'low' },
  { rank: 11, name: '외도동 항구 일대', rate: '+38%', count: 62, level: 'low' },
  { rank: 12, name: '노형동 카페 거리', rate: '+37%', count: 57, level: 'low' },
  { rank: 13, name: '도두동 해변가', rate: '+36%', count: 51, level: 'low' },
  { rank: 14, name: '이호동 관광명소', rate: '+35%', count: 47, level: 'low' },
];

const DOT_COLOR = { high: '#ef4444', mid: '#f97316', low: '#3b82f6' };
const LEGEND = [
  { level: 'high', label: '매우 높음 (45%↑)', color: '#ef4444' },
  { level: 'mid', label: '높음 (40~44%)', color: '#f97316' },
  { level: 'low', label: '보통 (40% 미만)', color: '#3b82f6' },
];

const MAP_PTS = [
  { pos: [33.500, 126.489], name: '노형사거리', rate: '+52%', level: 'high' },
  { pos: [33.500, 126.527], name: '연동 대로변', rate: '+52%', level: 'high' },
  { pos: [33.508, 126.522], name: '이도2동 상업지구', rate: '+52%', level: 'high' },
  { pos: [33.505, 126.520], name: '삼도1동 문화거리', rate: '+48%', level: 'high' },
  { pos: [33.514, 126.498], name: '용담 해안도로', rate: '+45%', level: 'high' },
];

function Map() {
  const ref = useRef(null);
  useEffect(() => {
    if (!ref.current) return;
    const map = L.map(ref.current, { zoomControl: true }).setView([33.489, 126.498], 12);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, opacity: 0.9 }).addTo(map);
    MAP_PTS.forEach((p, i) => {
      const col = DOT_COLOR[p.level];
      const icon = L.divIcon({ html: `<div style="width:32px;height:32px;border-radius:50%;background:${col};border:3px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;color:#fff;font-size:12px;font-weight:800;">${i + 1}</div>`, iconSize: [32, 32], iconAnchor: [16, 16], className: '' });
      L.marker(p.pos, { icon }).addTo(map).bindPopup(`<b>${p.name}</b><br>민원 증가율: ${p.rate}`);
    });
    return () => map.remove();
  }, []);
  return <div ref={ref} style={{ width: '100%', height: '100%' }} />;
}

export default function ZoneRecommendation() {
  const [mode, setMode] = useState('fee');
  const [period, setPeriod] = useState('custom');
  const [threshold, setThreshold] = useState('15');

  return (
    <>
      <header className="topbar">
        <div>
          <h1 className="page-title">요금제·공유주차제 적용 구역 추천</h1>
          <p className="page-sub">민원 증가 추세를 분석하여 최적 구역 자동 추천</p>
        </div>
        <div className="topbar__actions">
          <button className="btn btn--ai" type="button">{AI_ICON} AI 대화 시작하기</button>
          <button className="btn" type="button"><Icon name="download" size={20} /> 내보내기</button>
          <button className="bell" type="button" aria-label="알림"><Icon name="bell" size={22} /><span className="bell__badge">3</span></button>
        </div>
      </header>

      {/* 전체 화면 레이아웃 */}
      <div style={{ position: 'relative', flex: 1, display: 'flex', overflow: 'hidden', margin: '0 24px 24px', borderRadius: 16 }}>
        {/* 지도 (배경) */}
        <div style={{ position: 'absolute', inset: 0, borderRadius: 16, overflow: 'hidden' }}>
          <Map />
        </div>

        {/* 좌측 설정 패널 */}
        <div style={{ position: 'relative', zIndex: 10, width: 280, margin: 16, background: '#fff', borderRadius: 14, boxShadow: '0 4px 24px rgba(0,0,0,0.18)', display: 'flex', flexDirection: 'column', gap: 18, padding: '22px 20px', alignSelf: 'flex-start', maxHeight: 'calc(100% - 32px)', overflowY: 'auto' }}>
          <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--text-strong)' }}>구역 추천 설정</h2>

          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-alternative)', marginBottom: 6 }}>분석 내용</div>
            <select value={mode} onChange={(e) => setMode(e.target.value)} style={{ width: '100%', height: 38, padding: '0 12px', borderRadius: 8, border: '1px solid var(--line-normal)', background: 'var(--fill-normal)', fontSize: 13, fontFamily: 'inherit', cursor: 'pointer' }}>
              <option value="fee">요금제 적용</option>
              <option value="share">공유주차제 적용</option>
            </select>
          </div>

          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-alternative)', marginBottom: 6 }}>분석 지역</div>
            <select style={{ width: '100%', height: 38, padding: '0 12px', borderRadius: 8, border: '1px solid var(--line-normal)', background: 'var(--fill-normal)', fontSize: 13, fontFamily: 'inherit', cursor: 'pointer' }}>
              <option>제주시</option><option>서귀포시</option><option>제주 전체</option>
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

          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-alternative)', marginBottom: 6 }}>민원 증가율 임계값</div>
            <select value={threshold} onChange={(e) => setThreshold(e.target.value)} style={{ width: '100%', height: 38, padding: '0 12px', borderRadius: 8, border: '1px solid var(--line-normal)', background: 'var(--fill-normal)', fontSize: 13, fontFamily: 'inherit', cursor: 'pointer' }}>
              <option value="15">15% 이상</option>
              <option value="20">20% 이상</option>
              <option value="30">30% 이상</option>
              <option value="50">50% 이상</option>
            </select>
          </div>

          <button type="button" style={{ height: 42, borderRadius: 10, border: 'none', background: 'var(--primary)', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <svg viewBox="0 0 24 24" fill="none" width="14" height="14"><path d="M8 5v14l11-7z" fill="currentColor" /></svg>
            구역 추천 실행
          </button>
        </div>

        {/* 우측 결과 패널 */}
        <div style={{ position: 'absolute', top: 16, right: 16, bottom: 16, zIndex: 10, width: 300, background: '#fff', borderRadius: 14, boxShadow: '0 4px 24px rgba(0,0,0,0.18)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ padding: '18px 20px 12px', borderBottom: '1px solid var(--line-alternative)' }}>
            <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--text-strong)' }}>
              {mode === 'fee' ? '요금제 적용' : '공유주차제 적용'} 추천 구역 순위
            </h2>
            <p style={{ margin: '4px 0 0', fontSize: 11, color: 'var(--text-assistive)' }}>
              종합점수 기준 : 민원 건수 40% / 증가율 30% / 단속 20% / 공급부족 10%
            </p>
          </div>
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {RANKINGS.map((r) => (
              <div key={r.rank} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 16px', borderBottom: '1px solid var(--line-alternative)' }}>
                <span style={{ width: 22, height: 22, borderRadius: '50%', background: DOT_COLOR[r.level], color: '#fff', fontSize: 11, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{r.rank}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-strong)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-assistive)' }}>최근 3개월 {r.count}건</div>
                </div>
                <span style={{ fontSize: 13, fontWeight: 700, color: DOT_COLOR[r.level], flexShrink: 0 }}>{r.rate}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 범례 (좌하단) */}
        <div style={{ position: 'absolute', bottom: 16, left: 16, zIndex: 10, background: 'rgba(255,255,255,0.96)', borderRadius: 10, padding: '10px 14px', boxShadow: '0 2px 10px rgba(0,0,0,0.12)', display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-alternative)', marginBottom: 2 }}>민원 증가율 기준</div>
          {LEGEND.map((l) => (
            <div key={l.level} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--text-neutral)' }}>
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: l.color, flexShrink: 0 }} />
              {l.label}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
