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

const GRID_SIZES = ['100m', '200m', '300m', '500m'];

const HOTSPOTS = [
  { fx: 0.40, fy: 0.52, amp: 60 },
  { fx: 0.58, fy: 0.42, amp: 42 },
  { fx: 0.50, fy: 0.63, amp: 33 },
  { fx: 0.71, fy: 0.66, amp: 25 },
  { fx: 0.30, fy: 0.75, amp: 15 },
];

const RANKING = [
  { rank: 1, name: '연동 대로변',       color: '#E03131', cnt: 52, sub: '불법주차 41 · 기타 11' },
  { rank: 2, name: '제주도청 인근',     color: '#FD7E14', cnt: 38, sub: '불법주차 30 · 기타 8'  },
  { rank: 3, name: '신광초등학교 주변', color: '#FD7E14', cnt: 29, sub: '불법주차 22 · 기타 7'  },
  { rank: 4, name: '제주공항 인근',     color: '#339AF0', cnt: 21, sub: '불법주차 16 · 기타 5'  },
  { rank: 5, name: '동문시장 주변',     color: '#51CF66', cnt: 10, sub: '불법주차 14 · 기타 4'  },
  { rank: 6, name: '동문시장 주변',     color: '#51CF66', cnt: 10, sub: '불법주차 14 · 기타 4'  },
  { rank: 7, name: '동문시장 주변',     color: '#51CF66', cnt: 10, sub: '불법주차 14 · 기타 4'  },
  { rank: 8, name: '한림해수욕장 근처', color: '#E03131', cnt: 18, sub: '불법주차 12 · 기타 6'  },
];

const SUMMARY = [
  { label: '총 분석 격자', color: null,      val: '156개' },
  { label: '심각',         color: '#E03131', val: '52개'  },
  { label: '경고',         color: '#FD7E14', val: '38개'  },
  { label: '주의',         color: '#339AF0', val: '19개'  },
  { label: '양호',         color: '#ADB5BD', val: '4개'   },
];

function gaussian(dx, dy, sigma) {
  return Math.exp(-(dx * dx + dy * dy) / (2 * sigma * sigma));
}

function getColor(v) {
  if (v >= 40) return { fill: 'rgba(224,49,49,0.55)', stroke: 'rgba(224,49,49,0.8)' };
  if (v >= 20) return { fill: 'rgba(253,126,20,0.45)', stroke: 'rgba(253,126,20,0.75)' };
  if (v >= 10) return { fill: 'rgba(51,154,240,0.35)', stroke: 'rgba(51,154,240,0.65)' };
  return { fill: 'rgba(173,181,189,0.25)', stroke: 'rgba(173,181,189,0.5)' };
}

export default function LifestyleSimulation() {
  const mapRef = useRef(null);
  const mapInst = useRef(null);
  const gridLayerRef = useRef(null);
  const [period, setPeriod] = useState('직접설정');
  const [gridSize, setGridSize] = useState('500m');
  const [showResult, setShowResult] = useState(true);

  const buildGrid = (map, sizeName) => {
    if (gridLayerRef.current) { gridLayerRef.current.clearLayers(); }
    const layer = L.layerGroup().addTo(map);
    gridLayerRef.current = layer;

    const meters = { '100m': 100, '200m': 200, '300m': 300, '500m': 500 }[sizeName] || 500;
    const bounds = map.getBounds();
    const sw = bounds.getSouthWest();
    const ne = bounds.getNorthEast();
    const latStep = (meters / 111000);
    const lngStep = (meters / (111000 * Math.cos(sw.lat * Math.PI / 180)));
    const latRange = ne.lat - sw.lat;
    const lngRange = ne.lng - sw.lng;

    for (let la = sw.lat; la < ne.lat; la += latStep) {
      for (let lo = sw.lng; lo < ne.lng; lo += lngStep) {
        const fy = (la - sw.lat) / latRange;
        const fx = (lo - sw.lng) / lngRange;
        let v = 0;
        HOTSPOTS.forEach(h => {
          const sigma = meters < 200 ? 0.08 : meters < 400 ? 0.12 : 0.16;
          v += h.amp * gaussian(fx - h.fx, fy - h.fy, sigma);
        });
        if (v < 2) continue;
        const { fill, stroke } = getColor(v);
        L.rectangle([[la, lo], [la + latStep, lo + lngStep]], {
          fillColor: fill, fillOpacity: 1, color: stroke, weight: 0.5,
        }).bindPopup(`민원 ${Math.round(v)}건`).addTo(layer);
      }
    }
  };

  useEffect(() => {
    if (mapInst.current) return;
    const map = L.map(mapRef.current, { zoomControl: false, attributionControl: false }).setView([33.483, 126.512], 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
    L.control.zoom({ position: 'topright' }).addTo(map);
    mapInst.current = map;
    map.whenReady(() => buildGrid(map, '500m'));
  }, []);

  const handleRun = () => {
    if (mapInst.current) buildGrid(mapInst.current, gridSize);
    setShowResult(true);
  };

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

      <div className="content content--analysis">
        <section className="sim-stage">
          <div ref={mapRef} style={{ width: '100%', height: '100%' }} />

          {/* 왼쪽 설정 패널 */}
          <div className="card sim-panel--left">
            <div className="sim-panel__head">
              <p className="sim-panel__title">생활권 분석 설정</p>
            </div>
            <div className="sim-panel__body">
              <div className="field">
                <span className="field__label">분석 내용</span>
                <div className="field__select"><span>민원 건수</span><Icon name="chevron-down" size={16} /></div>
              </div>
              <div className="field">
                <span className="field__label">분석 지역</span>
                <div className="field__select"><span>제주시</span><Icon name="chevron-down" size={16} /></div>
              </div>
              <div className="field">
                <span className="field__label">분석 기간</span>
                <div className="date-range">
                  <div className="date-input">2026-01-01</div>
                  <span className="date-sep">~</span>
                  <div className="date-input">2026-05-31</div>
                </div>
              </div>
              <div className="field">
                <span className="field__label">격자 크기</span>
                <div className="grid-seg">
                  {GRID_SIZES.map(s => (
                    <button key={s} className={`grid-seg__btn${gridSize === s ? ' is-active' : ''}`} onClick={() => setGridSize(s)}>{s}</button>
                  ))}
                </div>
              </div>
            </div>
            <div className="sim-panel__foot">
              <button className="btn-run" onClick={handleRun}>
                <svg viewBox="0 0 24 24" fill="none" width="16" height="16"><path d="M8 5v14l11-7z" fill="currentColor" /></svg>
                생활권 분석 실행
              </button>
            </div>
          </div>

          {/* 오른쪽 결과 패널 */}
          {showResult && (
            <div className="sim-result">
              <div className="sim-result__head">
                <div className="sim-sec__title">분석 결과 요약</div>
                <div className="sim-result__actions">
                  <span className="sim-chip">{gridSize.toUpperCase()}</span>
                  <button className="sim-result__x" onClick={() => setShowResult(false)}>✕</button>
                </div>
              </div>
              <div className="sim-result__body">
                {/* 요약 */}
                <div className="sim-sec">
                  <div className="sum">
                    {SUMMARY.map(s => (
                      <div key={s.label} className="sum__row">
                        <div className="sum__label">
                          {s.color && <span style={{ width: 10, height: 10, borderRadius: '50%', background: s.color, display: 'inline-block', flexShrink: 0 }} />}
                          {s.label}
                        </div>
                        <div className="sum__val">{s.val}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 민원 집중 구역 */}
                <div className="sim-sec">
                  <div className="sim-sec__title">민원 집중 구역</div>
                  <div className="rl">
                    {RANKING.map(r => (
                      <div key={r.rank} className="rl__row">
                        <div className="rl__rank">{r.rank}</div>
                        <div className="rl__main">
                          <div className="rl__top">
                            <div className="rl__name">
                              <span className="dot" style={{ background: r.color }} />
                              {r.name}
                            </div>
                            <div className="rl__cnt">{r.cnt}건</div>
                          </div>
                          <div className="rl__sub">{r.sub}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 하단 범례 */}
          <div className="sim-legend">
            <div className="map-legend">
              <div className="map-legend__title">범례</div>
              {[
                { label: '심각 (40건 이상)', color: '#E03131' },
                { label: '경고 (20~39건)',   color: '#FD7E14' },
                { label: '주의 (10~19건)',   color: '#339AF0' },
                { label: '양호 (10건 미만)', color: '#ADB5BD' },
              ].map(l => (
                <div key={l.label} className="row">
                  <span style={{ width: 10, height: 10, borderRadius: 2, background: l.color, display: 'inline-block', flexShrink: 0 }} />
                  {l.label}
                </div>
              ))}
              <div className="row" style={{ marginTop: 6, fontSize: 11, color: 'var(--text-assistive)' }}>
                격자 {gridSize} × {gridSize}
              </div>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
