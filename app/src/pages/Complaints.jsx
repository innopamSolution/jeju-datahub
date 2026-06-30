import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
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

const STATS = [
  { label: '총 민원 건수', value: 247, unit: '건', delta: '↗ +12%', deltaType: 'pos', sub: '전기 대비' },
  { label: '집중구역 수', value: 5, unit: '개소', delta: '↗ +1개', deltaType: 'pos', sub: '전기 대비' },
  { label: '단속 집중 지역', value: 3, unit: '개소', delta: '—', deltaType: 'neutral', sub: '변동 없음' },
  { label: '수요 부족 지역', value: 7, unit: '개소', delta: '↘ -1개', deltaType: 'neg', sub: '전기 대비' },
  { label: '공영주차장', value: 19, unit: '개소', delta: '운영 중', deltaType: 'neutral', sub: '' },
];

const REGION_RANKINGS = [
  { rank: 1, name: '연동동', count: 52, delta: '↑13%', dotColor: '#ef4444', illegal: 38, other: 14 },
  { rank: 2, name: '노형동', count: 38, delta: '↑6%', dotColor: '#f97316', illegal: 27, other: 11 },
  { rank: 3, name: '이도동', count: 29, delta: '↓3%', dotColor: '#f97316', illegal: 20, other: 9 },
  { rank: 4, name: '아라동', count: 21, delta: '↓6%', dotColor: '#3b82f6', illegal: 14, other: 7 },
  { rank: 5, name: '삼도동', count: 10, delta: '—', dotColor: '#22c55e', illegal: 7, other: 3 },
];

const HOTSPOTS = [
  { rank: 1, name: '연동 대로변', radius: '250m', count: 52, level: 'severe' },
  { rank: 2, name: '노형사거리', radius: '200m', count: 38, level: 'warn' },
  { rank: 3, name: '이도2동 상업지구', radius: '180m', count: 29, level: 'warn' },
  { rank: 4, name: '제주공항 인근', radius: '300m', count: 21, level: 'caution' },
  { rank: 5, name: '삼도1동 문화거리', radius: '150m', count: 10, level: 'caution' },
];

const LEVEL_BADGE = { severe: 'badge--severe', warn: 'badge--warn', caution: 'badge--caution' };
const LEVEL_LABEL = { severe: '심각', warn: '경고', caution: '주의' };

const LAYERS = [
  { id: 'complaint', label: '민원 다발 지역', default: true },
  { id: 'crackdown', label: '단속 집중 지역', default: false },
  { id: 'shortage', label: '수요 부족 지역', default: false },
  { id: 'public', label: '공영주차장', default: true },
];

const LEGEND_ITEMS = [
  { label: '심각 (40건↑)', color: '#ef4444' },
  { label: '경고 (20~39건)', color: '#f97316' },
  { label: '주의 (10~19건)', color: '#3b82f6' },
  { label: '양호 (10건 미만)', color: '#22c55e' },
];

const MARKER_PTS = [
  { pos: [33.500, 126.527], count: 52, level: 'severe' },
  { pos: [33.499, 126.489], count: 38, level: 'warn' },
  { pos: [33.510, 126.522], count: 29, level: 'warn' },
  { pos: [33.512, 126.493], count: 21, level: 'caution' },
  { pos: [33.505, 126.519], count: 10, level: 'caution' },
  { pos: [33.480, 126.540], count: 7, level: 'good' },
  { pos: [33.450, 126.570], count: 5, level: 'good' },
];
const DOT_COLOR = { severe: '#ef4444', warn: '#f97316', caution: '#3b82f6', good: '#22c55e' };

function Map({ layers }) {
  const ref = useRef(null);
  useEffect(() => {
    if (!ref.current) return;
    const map = L.map(ref.current, { zoomControl: true }).setView([33.489, 126.498], 12);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, opacity: 0.9 }).addTo(map);
    if (layers.complaint) {
      const cluster = L.markerClusterGroup();
      MARKER_PTS.forEach((p) => {
        const col = DOT_COLOR[p.level];
        const icon = L.divIcon({ html: `<div style="width:38px;height:38px;border-radius:50%;background:${col};border:3px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,0.28);display:flex;align-items:center;justify-content:center;color:#fff;font-size:12px;font-weight:800;">${p.count}</div>`, iconSize: [38, 38], iconAnchor: [19, 19], className: '' });
        cluster.addLayer(L.marker(p.pos, { icon }));
      });
      map.addLayer(cluster);
    }
    return () => map.remove();
  }, [layers]);
  return <div ref={ref} style={{ width: '100%', height: '100%' }} />;
}

export default function Complaints() {
  const [period, setPeriod] = useState('today');
  const [filterOpen, setFilterOpen] = useState(false);
  const [layers, setLayers] = useState(() => Object.fromEntries(LAYERS.map((l) => [l.id, l.default])));

  const toggleLayer = (id) => setLayers((prev) => ({ ...prev, [id]: !prev[id] }));

  return (
    <>
      <header className="topbar">
        <div>
          <h1 className="page-title">민원현황</h1>
          <p className="page-sub">최종 업데이트 2025.12.01 · 14:32 · 자동 갱신</p>
        </div>
        <div className="topbar__actions">
          <button className="btn btn--ai" type="button">{AI_ICON} AI 대화 시작하기</button>
          <button className="btn" type="button"><Icon name="download" size={20} /> 내보내기</button>
          <button className="bell" type="button" aria-label="알림"><Icon name="bell" size={22} /><span className="bell__badge">3</span></button>
        </div>
      </header>

      {/* 필터바 */}
      <div className="filterbar" style={{ flexWrap: 'wrap', gap: 10 }}>
        <span className="filterbar__label">조회 단위</span>
        <div className="segment">
          {[['today', '오늘'], ['week', '주간'], ['month', '월간']].map(([k, l]) => (
            <button key={k} type="button" className={`segment__btn ${period === k ? 'segment__btn--active' : ''}`} onClick={() => setPeriod(k)}>{l}</button>
          ))}
        </div>
        <button className="btn" type="button" style={{ height: 38 }}><Icon name="calendar" size={16} /> 기간 선택</button>
        <button type="button" aria-pressed={filterOpen} onClick={() => setFilterOpen(!filterOpen)} style={{ height: 38, padding: '0 16px', borderRadius: 8, border: `1px solid ${filterOpen ? 'var(--primary)' : 'var(--line-normal)'}`, background: filterOpen ? 'var(--blue-99)' : 'none', color: filterOpen ? 'var(--primary)' : 'var(--text-neutral)', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
          <Icon name="filter" size={16} /> 상세 필터
        </button>
        <span className="filterbar__right" style={{ fontSize: 13, color: 'var(--text-alternative)' }}>
          {period === 'today' ? '2025.12.01' : period === 'week' ? '2025.11.24 ~ 2025.12.01' : '2025.11.01 ~ 2025.12.01'}
        </span>
      </div>

      {/* 상세 필터 패널 */}
      {filterOpen && (
        <div style={{ margin: '0 24px', padding: '20px 24px', background: 'var(--fill-normal)', borderRadius: 12, border: '1px solid var(--line-alternative)', display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-alternative)', marginBottom: 6 }}>행정구역</div>
            <DsSelect>
              <option>제주시</option><option>서귀포시</option><option>제주 전체</option>
            </DsSelect>
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-alternative)', marginBottom: 6 }}>민원유형</div>
            <DsSelect>
              <option>전체</option><option>불법주정차</option><option>주차장 혼잡</option><option>시설 고장</option><option>기타</option>
            </DsSelect>
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-alternative)', marginBottom: 6 }}>위험 단계</div>
            <div className="segment">
              {[['all', '전체'], ['severe', '심각'], ['caution', '주의'], ['normal', '보통'], ['good', '양호']].map(([k, l]) => (
                <button key={k} type="button" className={`segment__btn ${k === 'all' ? 'segment__btn--active' : ''}`}>{l}</button>
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, alignSelf: 'flex-end' }}>
            <button type="button" style={{ height: 36, padding: '0 16px', borderRadius: 8, border: '1px solid var(--line-normal)', background: '#fff', fontSize: 13, cursor: 'pointer', color: 'var(--text-neutral)' }}>초기화</button>
            <button type="button" style={{ height: 36, padding: '0 16px', borderRadius: 8, border: 'none', background: 'var(--primary)', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>필터 적용</button>
          </div>
        </div>
      )}

      <div className="content" style={{ paddingTop: 20, gap: 20 }}>
        {/* 통계 카드 5개 */}
        <section className="stat-row" style={{ gridTemplateColumns: 'repeat(5, 1fr)' }}>
          {STATS.map((s) => (
            <div key={s.label} className="card stat">
              <div>
                <div className="stat__label">{s.label}</div>
                <div className="stat__value">{s.value}<span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-alternative)', marginLeft: 4 }}>{s.unit}</span></div>
                <div className="stat__delta">
                  <span className={s.deltaType === 'pos' ? 'delta-pos' : s.deltaType === 'neg' ? 'delta-neg' : ''}>{s.delta}</span>
                  {s.sub && <span style={{ marginLeft: 4 }}>{s.sub}</span>}
                </div>
              </div>
            </div>
          ))}
        </section>

        {/* 지도 + 우측 사이드 */}
        <section style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 20, minHeight: 480 }}>
          {/* 지도 카드 */}
          <div className="card" style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            {/* 레이어 토글 */}
            <div style={{ padding: '12px 20px', borderBottom: '1px solid var(--line-alternative)', display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
              {LAYERS.map((layer) => (
                <label key={layer.id} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer', color: 'var(--text-neutral)', userSelect: 'none' }}>
                  <input type="checkbox" checked={layers[layer.id]} onChange={() => toggleLayer(layer.id)} style={{ width: 16, height: 16, cursor: 'pointer', accentColor: 'var(--primary)' }} />
                  {layer.label}
                </label>
              ))}
            </div>
            {/* 지도 */}
            <div style={{ flex: 1 }}>
              <Map layers={layers} />
            </div>
            {/* 범례 */}
            <div style={{ padding: '10px 20px', borderTop: '1px solid var(--line-alternative)', display: 'flex', gap: 18, flexWrap: 'wrap' }}>
              {LEGEND_ITEMS.map((l) => (
                <span key={l.label} className="legend__item">
                  <span className="dot" style={{ background: l.color }} />{l.label}
                </span>
              ))}
            </div>
          </div>

          {/* 우측 사이드 컬럼 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* 지역별 민원 현황 */}
            <div className="card" style={{ padding: '20px 20px', display: 'flex', flexDirection: 'column', gap: 12, flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <h2 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: 'var(--text-strong)' }}>지역별 민원 현황</h2>
                <button type="button" style={{ fontSize: 12, color: 'var(--primary)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>전체 →</button>
              </div>
              <p style={{ margin: 0, fontSize: 11, color: 'var(--text-assistive)' }}>읍·면·동 기준 집계</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {REGION_RANKINGS.map((r) => (
                  <div key={r.rank} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ width: 20, height: 20, borderRadius: '50%', background: r.dotColor, color: '#fff', fontSize: 11, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{r.rank}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-strong)' }}>{r.name}</span>
                        <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-neutral)' }}>{r.count}건</span>
                        <span style={{ fontSize: 11, color: r.delta.startsWith('↑') ? '#16a34a' : r.delta.startsWith('↓') ? '#dc2626' : 'var(--text-assistive)' }}>{r.delta}</span>
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-assistive)' }}>불법주차 {r.illegal} · 기타 {r.other}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 민원 집중구역 */}
            <div className="card" style={{ padding: '20px 20px', display: 'flex', flexDirection: 'column', gap: 12, flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <h2 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: 'var(--text-strong)' }}>민원 집중구역</h2>
                <span className="badge" style={{ background: 'var(--blue-95)', color: 'var(--primary)' }}>5개소</span>
              </div>
              <p style={{ margin: 0, fontSize: 11, color: 'var(--text-assistive)' }}>AI 클러스터링 결과</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {HOTSPOTS.map((h) => (
                  <div key={h.rank} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ width: 20, height: 20, borderRadius: '50%', background: DOT_COLOR[h.level] || '#94a3b8', color: '#fff', fontSize: 11, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{h.rank}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-strong)' }}>{h.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-assistive)' }}>반경 {h.radius} · {h.count}건</div>
                    </div>
                    <span className={`badge ${LEVEL_BADGE[h.level]}`}>{LEVEL_LABEL[h.level]}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
