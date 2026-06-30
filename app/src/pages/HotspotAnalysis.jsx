import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import Icon from '../components/Icon';
import '../styles/analysis.css';

const HOTSPOTS = [
  { rank: 1, name: '연동 대로변', sub: '민원 건수 51건 · 단속 32건', score: 90, color: 'var(--red-50)', latlng: [33.4866, 126.49] },
  { rank: 2, name: '제주도청 인근', sub: '민원 건수 48건 · 단속 30건', score: 87, color: 'var(--red-50)', latlng: [33.501, 126.527] },
  { rank: 3, name: '신광초등학교 주변', sub: '민원 건수 45건 · 단속 28건', score: 85, color: 'var(--red-50)', latlng: [33.488, 126.498] },
  { rank: 4, name: '제주공항 인근', sub: '민원 건수 39건 · 단속 21건', score: 75, color: 'var(--orange-50)', latlng: [33.5065, 126.493] },
  { rank: 5, name: '동문시장 주변', sub: '민원 건수 34건 · 단속 18건', score: 72, color: 'var(--orange-50)', latlng: [33.513, 126.527] },
  { rank: 6, name: '노형사거리 인근', sub: '민원 건수 30건 · 단속 14건', score: 70, color: 'var(--orange-50)', latlng: [33.479, 126.476] },
  { rank: 7, name: '이도2동 상업지구', sub: '민원 건수 27건 · 단속 12건', score: 68, color: 'var(--blue-50)', latlng: [33.4995, 126.532] },
];

const PERIOD_OPTS = ['최근1개월', '최근3개월', '최근6개월', '직접설정'];

export default function HotspotAnalysis() {
  const mapRef = useRef(null);
  const mapObjRef = useRef(null);
  const [period, setPeriod] = useState('직접설정');
  const [showResult, setShowResult] = useState(true);

  useEffect(() => {
    const el = mapRef.current;
    if (!el || mapObjRef.current) return;
    const map = L.map(el, { center: [33.489, 126.498], zoom: 13, zoomControl: true });
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap',
    }).addTo(map);
    HOTSPOTS.forEach((h) => {
      const div = document.createElement('div');
      div.style.cssText = `width:32px;height:32px;border-radius:50%;background:${h.color};color:#fff;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:13px;border:2px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,0.25)`;
      div.textContent = h.rank;
      L.marker(h.latlng, { icon: L.divIcon({ html: div, className: '', iconSize: [32, 32], iconAnchor: [16, 16] }) })
        .bindPopup(`<b>${h.name}</b><br/>${h.sub}<br/><b>${h.score}점</b>`)
        .addTo(map);
    });
    mapObjRef.current = map;
    return () => { map.remove(); mapObjRef.current = null; };
  }, []);

  return (
    <div className="content content--analysis" style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
      <section className="sim-stage" style={{ flex: 1 }}>
        <div ref={mapRef} style={{ position: 'absolute', inset: 0, zIndex: 0 }} />

        {/* 좌측 설정 패널 */}
        <div className="card sim-panel--left">
          <h2 className="sim-panel__title">집중 구역 분석 설정</h2>
          <div className="field">
            <label className="field__label">분석 내용</label>
            <div className="field__select">
              불법 주차 집중 구역
              <Icon name="chevron-down" size={18} />
            </div>
          </div>
          <div className="field">
            <label className="field__label">분석 지역</label>
            <div className="field__select">
              제주시
              <Icon name="chevron-down" size={18} />
            </div>
          </div>
          <div className="field">
            <label className="field__label">분석 기간</label>
            <div className="grid-seg">
              {PERIOD_OPTS.map((p) => (
                <button key={p} className={period === p ? 'is-active' : ''} onClick={() => setPeriod(p)}>{p}</button>
              ))}
            </div>
            {period === '직접설정' && (
              <div className="field__dates">
                <div className="field__date">2026-01-01 <Icon name="calendar" size={16} /></div>
                <span className="field__tilde">~</span>
                <div className="field__date">2026-05-31 <Icon name="calendar" size={16} /></div>
              </div>
            )}
          </div>
          <button className="btn-run" onClick={() => setShowResult(true)}>▷ 집중 구역 분석 실행</button>
        </div>

        {/* 우측 결과 패널 */}
        {showResult && (
          <div className="sim-result">
            <div className="sim-result__top">
              <button className="sim-result__x" onClick={() => setShowResult(false)}>
                <Icon name="close" size={20} />
              </button>
            </div>
            <div className="sim-result__body">
              <div className="sim-sec">
                <h3 className="sim-sec__title">불법 주차 집중 구역 순위</h3>
                <p className="sim-sec__sub">종합점수 기준 : 민원 건수 60% / 단속 40%</p>
                <div className="rl">
                  {HOTSPOTS.map((h) => (
                    <div key={h.rank} className="rl__row">
                      <span className="rl__rank">{h.rank}</span>
                      <div className="rl__main">
                        <div className="rl__top">
                          <span className="rl__name">
                            <span className="dot" style={{ background: h.color }} />
                            {h.name}
                          </span>
                          <span className="rl__val"><span className="rl__cnt">{h.score}점</span></span>
                        </div>
                        <span className="rl__sub">{h.sub}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
