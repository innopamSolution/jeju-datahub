import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import Icon from '../components/Icon';
import DsSelect from '../components/DsSelect';

const AI_ICON = (
  <svg viewBox="0 0 36 36" fill="none" width="20" height="20" aria-hidden="true" style={{ flexShrink: 0 }}>
    <path d="M18.4 8.6c.2-2.5 2.4-4.4 4.9-4.1-.2 2.5-2.4 4.3-4.9 4.1Z" fill="#3DA35D" />
    <path d="M18.4 8.6c-.2-2-2-3.5-4-3.3.2 2 2 3.5 4 3.3Z" fill="#4FB96A" />
    <circle cx="18" cy="21" r="12.5" fill="#F79009" />
    <path d="M9 18.6a9 9 0 0 1 18 0Z" fill="#FBB454" opacity="0.5" />
    <circle cx="13.8" cy="20" r="1.7" fill="#4A3415" /><circle cx="22.2" cy="20" r="1.7" fill="#4A3415" />
    <path d="M14 24.6a4.4 4.4 0 0 0 8 0" stroke="#4A3415" strokeWidth="1.6" strokeLinecap="round" fill="none" />
  </svg>
);

const PERIODS = ['최근1개월', '최근3개월', '최근6개월', '직접설정'];

const RANKING = [
  { rank: 1,  name: '노형사거리',        color: '#E03131', rate: '+52%', cnt: 52 },
  { rank: 2,  name: '연동 대로변',        color: '#E03131', rate: '+52%', cnt: 52 },
  { rank: 3,  name: '이도2동 상업지구',   color: '#E03131', rate: '+52%', cnt: 52 },
  { rank: 4,  name: '삼도1동 문화거리',   color: '#E03131', rate: '+48%', cnt: 48 },
  { rank: 5,  name: '용담 해안도로',      color: '#E03131', rate: '+45%', cnt: 45 },
  { rank: 6,  name: '아라동 주택가',      color: '#FD7E14', rate: '+44%', cnt: 44 },
  { rank: 7,  name: '도남동 공원 인근',   color: '#FD7E14', rate: '+43%', cnt: 43 },
  { rank: 8,  name: '화북동 전통시장',    color: '#FD7E14', rate: '+41%', cnt: 41 },
  { rank: 9,  name: '일도2동 학교 주변',  color: '#FD7E14', rate: '+40%', cnt: 40 },
  { rank: 10, name: '삼양동 농산물시장',  color: '#339AF0', rate: '+39%', cnt: 39 },
  { rank: 11, name: '외도동 항구 일대',   color: '#339AF0', rate: '+38%', cnt: 38 },
  { rank: 12, name: '노형동 카페 거리',   color: '#339AF0', rate: '+37%', cnt: 37 },
  { rank: 13, name: '도두동 해변가',      color: '#339AF0', rate: '+36%', cnt: 36 },
  { rank: 14, name: '이호동 관광명소',    color: '#339AF0', rate: '+35%', cnt: 35 },
];

const MAP_MARKERS = [
  { lat: 33.499, lng: 126.510, rank: 1, name: '노형사거리',       sev: 'severe',  rate: '+52%', cnt: 52 },
  { lat: 33.490, lng: 126.523, rank: 2, name: '연동 대로변',       sev: 'severe',  rate: '+52%', cnt: 52 },
  { lat: 33.480, lng: 126.516, rank: 3, name: '이도2동 상업지구',  sev: 'severe',  rate: '+52%', cnt: 52 },
  { lat: 33.506, lng: 126.488, rank: 4, name: '제주공항 인근',     sev: 'warn',    rate: '+48%', cnt: 48 },
  { lat: 33.513, lng: 126.527, rank: 5, name: '동문시장 주변',     sev: 'warn',    rate: '+45%', cnt: 45 },
  { lat: 33.467, lng: 126.532, rank: 6, name: '아라동 주변',       sev: 'caution', rate: '+44%', cnt: 44 },
];

const MODE_TITLES = {
  '요금제 적용': '요금제 적용 추천 구역 순위',
  '공유주차제 적용': '공유주차제 적용 추천 구역 순위',
};

export default function ZoneRecommendation() {
  const mapRef = useRef(null);
  const mapInst = useRef(null);
  const markerRefs = useRef([]);
  const [period, setPeriod] = useState('직접설정');
  const [mode, setMode] = useState('요금제 적용');
  const [threshold, setThreshold] = useState('15% 이상');
  const [showResult, setShowResult] = useState(true);
  const [activeRank, setActiveRank] = useState(null);

  useEffect(() => {
    if (mapInst.current) return;
    const map = L.map(mapRef.current, { zoomControl: false, attributionControl: false }).setView([33.486, 126.512], 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
    L.control.zoom({ position: 'topright' }).addTo(map);

    MAP_MARKERS.forEach((m, i) => {
      const icon = L.divIcon({
        className: '',
        html: `<div class="cmk cmk--${m.sev}"><div class="cmk__flag">${m.rank}</div><div class="cmk__lab">${m.name}</div></div>`,
        iconSize: [70, 56], iconAnchor: [35, 56],
      });
      const marker = L.marker([m.lat, m.lng], { icon }).addTo(map)
        .bindPopup(`<b>${m.name}</b><br>증가율 ${m.rate} · ${m.cnt}건`);
      marker.on('click', () => setActiveRank(m.rank));
      markerRefs.current[i] = { marker, ...m };
    });
    mapInst.current = map;
  }, []);

  const handleRowClick = (rank) => {
    setActiveRank(rank);
    const found = markerRefs.current.find(m => m.rank === rank);
    if (found && mapInst.current) mapInst.current.panTo([found.lat, found.lng]);
  };

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

      <div className="content content--analysis">
        <section className="sim-stage">
          <div ref={mapRef} style={{ width: '100%', height: '100%' }} />

          {/* 왼쪽 설정 패널 */}
          <div className="card sim-panel--left">
            <div className="sim-panel__head">
              <p className="sim-panel__title">구역 추천 설정</p>
            </div>
            <div className="sim-panel__body">
              <div className="field">
                <span className="field__label">분석 내용</span>
                <DsSelect value={mode} onChange={e => setMode(e.target.value)}>
                  <option>요금제 적용</option>
                  <option>공유주차제 적용</option>
                </DsSelect>
              </div>
              <div className="field">
                <span className="field__label">분석 지역</span>
                <DsSelect>
                  <option>제주시</option>
                  <option>서귀포시</option>
                  <option>제주 전체</option>
                </DsSelect>
              </div>
              <div className="field">
                <span className="field__label">분석 기간</span>
                <div className="grid-seg">
                  {PERIODS.map(p => (
                    <button key={p} className={`grid-seg__btn${period === p ? ' is-active' : ''}`} onClick={() => setPeriod(p)}>{p}</button>
                  ))}
                </div>
                {period === '직접설정' && (
                  <div className="date-range">
                    <div className="date-input">2026-01-01</div>
                    <span className="date-sep">~</span>
                    <div className="date-input">2026-05-31</div>
                  </div>
                )}
              </div>
              <div className="field">
                <span className="field__label">민원 증가율 임계값</span>
                <DsSelect value={threshold} onChange={e => setThreshold(e.target.value)}>
                  <option>15% 이상</option>
                  <option>20% 이상</option>
                  <option>30% 이상</option>
                  <option>50% 이상</option>
                </DsSelect>
              </div>
            </div>
            <div className="sim-panel__foot">
              <button className="btn-run" onClick={() => setShowResult(true)}>
                <svg viewBox="0 0 24 24" fill="none" width="16" height="16"><path d="M8 5v14l11-7z" fill="currentColor" /></svg>
                구역 추천 실행
              </button>
            </div>
          </div>

          {/* 오른쪽 결과 패널 */}
          {showResult && (
            <div className="sim-result">
              <div className="sim-result__head">
                <div className="sim-sec__title">{MODE_TITLES[mode]}</div>
                <div className="sim-sec__sub">종합점수 기준 : 민원 건수 40% / 증가율 30% / 단속 건수 20% / 공급부족 10%</div>
                <div className="sim-result__actions">
                  <button className="sim-result__x" onClick={() => setShowResult(false)}>✕</button>
                </div>
              </div>
              <div className="sim-result__body">
                <div className="rl">
                  {RANKING.map(r => (
                    <div
                      key={r.rank}
                      className="rl__row"
                      style={{
                        cursor: 'pointer',
                        background: activeRank === r.rank ? 'var(--fill-normal)' : undefined,
                        borderRadius: 8, margin: '0 -6px', padding: '10px 6px',
                      }}
                      onClick={() => handleRowClick(r.rank)}
                    >
                      <div className="rl__rank">{r.rank}</div>
                      <div className="rl__main">
                        <div className="rl__top">
                          <div className="rl__name">
                            <span className="dot" style={{ background: r.color }} />
                            {r.name}
                          </div>
                          <div style={{ textAlign: 'right', flexShrink: 0 }}>
                            <div className="rl__rate">{r.rate}</div>
                            <div style={{ fontSize: 12, color: 'var(--text-assistive)' }}>{r.cnt}건 (3개월)</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 하단 범례 */}
          <div className="sim-legend">
            <div className="map-legend">
              <div className="map-legend__title">민원 증가율</div>
              {[
                { label: '매우 높음 (45% 이상)', color: '#E03131' },
                { label: '높음 (40~44%)',         color: '#FD7E14' },
                { label: '보통 (40% 미만)',       color: '#339AF0' },
              ].map(l => (
                <div key={l.label} className="row">
                  <span style={{ width: 10, height: 10, borderRadius: '50%', background: l.color, display: 'inline-block', flexShrink: 0 }} />
                  {l.label}
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
