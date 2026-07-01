import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import Icon from '../components/Icon';

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
  { rank: 1,  name: '연동 대로변',          color: '#E03131', score: 90, sub: '민원 51건 · 단속 32건' },
  { rank: 2,  name: '제주도청 인근',         color: '#E03131', score: 87, sub: '민원 48건 · 단속 30건' },
  { rank: 3,  name: '신광초등학교 주변',     color: '#E03131', score: 85, sub: '민원 45건 · 단속 28건' },
  { rank: 4,  name: '제주공항 인근',         color: '#FD7E14', score: 75, sub: '불법주차 16 · 기타 5'  },
  { rank: 5,  name: '동문시장 주변',         color: '#FD7E14', score: 72, sub: '불법주차 14 · 기타 4'  },
  { rank: 6,  name: '동문시장 주변',         color: '#FD7E14', score: 70, sub: '불법주차 14 · 기타 4'  },
  { rank: 7,  name: '동문시장 주변',         color: '#FD7E14', score: 68, sub: '불법주차 14 · 기타 4'  },
  { rank: 8,  name: '한림해수욕장 근처',     color: '#FD7E14', score: 65, sub: '불법주차 12 · 기타 6'  },
  { rank: 9,  name: '서귀포 올레시장 인근',  color: '#339AF0', score: 60, sub: '불법주차 9 · 기타 6'   },
  { rank: 10, name: '이중섭 거리 주변',      color: '#339AF0', score: 55, sub: '불법주차 7 · 기타 6'   },
  { rank: 11, name: '한라산 국립공원 입구',  color: '#51CF66', score: 35, sub: '불법주차 8 · 기타 3'   },
  { rank: 12, name: '삼성혈 인근',           color: '#51CF66', score: 32, sub: '불법주차 6 · 기타 3'   },
  { rank: 13, name: '용담 해안도로 주변',    color: '#51CF66', score: 28, sub: '불법주차 4 · 기타 3'   },
];

const MAP_MARKERS = [
  { lat: 33.499, lng: 126.510, rank: 1, name: '노형사거리',       sev: 'severe',  complaints: 51, enforce: 32 },
  { lat: 33.490, lng: 126.523, rank: 2, name: '연동대로변',        sev: 'severe',  complaints: 48, enforce: 30 },
  { lat: 33.480, lng: 126.516, rank: 3, name: '이도2동 상업지구',  sev: 'warn',    complaints: 45, enforce: 28 },
  { lat: 33.506, lng: 126.488, rank: 4, name: '제주공항 인근',     sev: 'warn',    complaints: 38, enforce: 24 },
  { lat: 33.513, lng: 126.527, rank: 5, name: '동문시장 주변',     sev: 'warn',    complaints: 34, enforce: 22 },
  { lat: 33.467, lng: 126.532, rank: 6, name: '아라동 주변',       sev: 'caution', complaints: 30, enforce: 20 },
];

export default function HotspotAnalysis() {
  const mapRef = useRef(null);
  const mapInst = useRef(null);
  const markerRefs = useRef([]);
  const [period, setPeriod] = useState('직접설정');
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
        .bindPopup(`<b>${m.name}</b><br>민원 ${m.complaints}건 · 단속 ${m.enforce}건`);
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
          <h1 className="page-title">집중 구역 분석</h1>
          <p className="page-sub">불법 주차 집중 구역 자동 도출</p>
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
              <p className="sim-panel__title">집중 구역 분석 설정</p>
            </div>
            <div className="sim-panel__body">
              <div className="field">
                <span className="field__label">분석 내용</span>
                <div className="field__select"><span>불법 주차 집중 구역</span><Icon name="chevron-down" size={16} /></div>
              </div>
              <div className="field">
                <span className="field__label">분석 지역</span>
                <div className="field__select"><span>제주시</span><Icon name="chevron-down" size={16} /></div>
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
            </div>
            <div className="sim-panel__foot">
              <button className="btn-run" onClick={() => setShowResult(true)}>
                <svg viewBox="0 0 24 24" fill="none" width="16" height="16"><path d="M8 5v14l11-7z" fill="currentColor" /></svg>
                집중 구역 분석 실행
              </button>
            </div>
          </div>

          {/* 오른쪽 결과 패널 */}
          {showResult && (
            <div className="sim-result">
              <div className="sim-result__head">
                <div className="sim-sec__title">불법 주차 집중 구역 순위</div>
                <div className="sim-sec__sub">종합점수 기준 : 민원 건수 60% / 단속 40%</div>
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
                          <div className="rl__score">{r.score}점</div>
                        </div>
                        <div className="rl__sub">{r.sub}</div>
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
              <div className="map-legend__title">종합점수</div>
              {[
                { label: '심각 (80점 이상)', color: '#E03131' },
                { label: '경고 (60~79점)',   color: '#FD7E14' },
                { label: '주의 (40~59점)',   color: '#339AF0' },
                { label: '양호 (40점 미만)', color: '#51CF66' },
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
