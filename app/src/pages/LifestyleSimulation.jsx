import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import Icon from '../components/Icon';
import '../styles/analysis.css';

const GRID_SIZES = ['100m', '200m', '300m', '500m'];

const GRID_DATA = [
  { latlng: [33.4866, 126.49], color: '#ef4444', opacity: 0.5 },
  { latlng: [33.479, 126.476], color: '#f97316', opacity: 0.45 },
  { latlng: [33.4995, 126.532], color: '#f97316', opacity: 0.4 },
  { latlng: [33.456, 126.547], color: '#3b82f6', opacity: 0.35 },
  { latlng: [33.512, 126.521], color: '#22c55e', opacity: 0.3 },
];

const RESULTS = [
  { rank: 1, name: '연동 대로변', sub: '불법주차 41 · 기타 11', cnt: '52건', color: 'var(--red-50)' },
  { rank: 2, name: '제주도청 인근', sub: '불법주차 30 · 기타 8', cnt: '38건', color: 'var(--orange-50)' },
  { rank: 3, name: '신광초등학교 주변', sub: '불법주차 22 · 기타 7', cnt: '29건', color: 'var(--orange-50)' },
  { rank: 4, name: '제주공항 인근', sub: '불법주차 16 · 기타 5', cnt: '21건', color: 'var(--blue-50)' },
  { rank: 5, name: '동문시장 주변', sub: '불법주차 14 · 기타 4', cnt: '10건', color: 'var(--green-50)' },
];

export default function LifestyleSimulation() {
  const mapRef = useRef(null);
  const mapObjRef = useRef(null);
  const [gridSize, setGridSize] = useState('500m');
  const [showResult, setShowResult] = useState(true);

  useEffect(() => {
    const el = mapRef.current;
    if (!el || mapObjRef.current) return;
    const map = L.map(el, { center: [33.489, 126.505], zoom: 13, zoomControl: true });
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap',
    }).addTo(map);
    GRID_DATA.forEach(({ latlng, color, opacity }) => {
      const d = 0.005;
      L.rectangle(
        [[latlng[0] - d, latlng[1] - d], [latlng[0] + d, latlng[1] + d]],
        { color, weight: 1, fillColor: color, fillOpacity: opacity }
      ).addTo(map);
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
          <h2 className="sim-panel__title">생활권 분석 설정</h2>
          <div className="field">
            <label className="field__label">분석 내용</label>
            <div className="field__select">민원 건수 <Icon name="chevron-down" size={18} /></div>
          </div>
          <div className="field">
            <label className="field__label">분석 지역</label>
            <div className="field__select">제주시 <Icon name="chevron-down" size={18} /></div>
          </div>
          <div className="field">
            <label className="field__label">분석 기간</label>
            <div className="field__dates">
              <div className="field__date">2026-01-01 <Icon name="calendar" size={16} /></div>
              <span className="field__tilde">~</span>
              <div className="field__date">2026-05-31 <Icon name="calendar" size={16} /></div>
            </div>
          </div>
          <div className="field">
            <label className="field__label">격자 크기</label>
            <div className="grid-seg">
              {GRID_SIZES.map((s) => (
                <button key={s} className={gridSize === s ? 'is-active' : ''} onClick={() => setGridSize(s)}>{s}</button>
              ))}
            </div>
          </div>
          <button className="btn-run" onClick={() => setShowResult(true)}>▷ 생활권 분석 실행</button>
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
                <div className="sim-sec__head">
                  <div>
                    <h3 className="sim-sec__title">분석 결과 요약</h3>
                    <p className="sim-sec__sub" style={{ margin: '4px 0 0' }}>격자 기반 분석 요약</p>
                  </div>
                  <span className="size-chip">{gridSize.toUpperCase()}</span>
                </div>
                <div className="sum">
                  <div className="sum__row sum__row--total"><span>총 분석 격자</span><b>156개</b></div>
                  <div className="sum__row"><span><span className="dot" style={{ background: 'var(--red-50)' }} />심각</span><b>52개</b></div>
                  <div className="sum__row"><span><span className="dot" style={{ background: 'var(--orange-50)' }} />경고</span><b>38개</b></div>
                  <div className="sum__row"><span><span className="dot" style={{ background: 'var(--blue-50)' }} />주의</span><b>19개</b></div>
                  <div className="sum__row"><span><span className="dot" style={{ background: 'var(--cool-neutral-80)' }} />양호</span><b>4개</b></div>
                </div>
              </div>
              <div className="sim-sec">
                <h3 className="sim-sec__title">민원 집중 구역</h3>
                <p className="sim-sec__sub">격자 기반 민원 집중 구역</p>
                <div className="rl">
                  {RESULTS.map((r) => (
                    <div key={r.rank} className="rl__row">
                      <span className="rl__rank">{r.rank}</span>
                      <div className="rl__main">
                        <div className="rl__top">
                          <span className="rl__name"><span className="dot" style={{ background: r.color }} />{r.name}</span>
                          <span className="rl__val"><span className="rl__cnt">{r.cnt}</span></span>
                        </div>
                        <span className="rl__sub">{r.sub}</span>
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
