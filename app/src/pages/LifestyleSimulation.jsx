import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import Icon from '../components/Icon';
import NotificationBell from '../components/NotificationBell';

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

const GRID_SIZES = ['100m', '200m', '300m', '500m'];

const SUMMARY = [
  { label: '총 분석 격자', dot: null,                     val: '156개', total: true },
  { label: '심각',         dot: 'var(--red-50)',          val: '52개'  },
  { label: '경고',         dot: 'var(--orange-50)',       val: '38개'  },
  { label: '주의',         dot: 'var(--blue-50)',         val: '19개'  },
  { label: '양호',         dot: 'var(--cool-neutral-80)', val: '4개'   },
];

const RANKING = [
  { rank: 1, name: '연동 대로변',       dot: 'var(--red-50)',    cnt: '52건', sub: '불법주차 41 · 기타 11' },
  { rank: 2, name: '제주도청 인근',     dot: 'var(--orange-50)', cnt: '38건', sub: '불법주차 30 · 기타 8'  },
  { rank: 3, name: '신광초등학교 주변', dot: 'var(--orange-50)', cnt: '29건', sub: '불법주차 22 · 기타 7'  },
  { rank: 4, name: '제주공항 인근',     dot: 'var(--blue-50)',   cnt: '21건', sub: '불법주차 16 · 기타 5'  },
  { rank: 5, name: '동문시장 주변',     dot: 'var(--green-50)',  cnt: '10건', sub: '불법주차 14 · 기타 4'  },
  { rank: 6, name: '동문시장 주변',     dot: 'var(--green-50)',  cnt: '10건', sub: '불법주차 14 · 기타 4'  },
  { rank: 7, name: '동문시장 주변',     dot: 'var(--green-50)',  cnt: '10건', sub: '불법주차 14 · 기타 4'  },
  { rank: 8, name: '한림해수욕장 근처', dot: 'var(--red-50)',    cnt: '18건', sub: '불법주차 12 · 기타 6'  },
];

function resolveColor(cssVar) {
  const probe = document.createElement('span');
  probe.style.cssText = 'position:absolute;left:-9999px;top:-9999px';
  probe.style.color = cssVar;
  document.body.appendChild(probe);
  const c = getComputedStyle(probe).color;
  document.body.removeChild(probe);
  return c;
}

function mulberry32(a) {
  return function () {
    a |= 0; a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

export default function LifestyleSimulation() {
  const navigate = useNavigate();
  const mapRef      = useRef(null);
  const mapInst     = useRef(null);
  const gridLayer   = useRef(null);
  const labelLayer  = useRef(null);
  const cellRef     = useRef(500);
  const [gridSize, setGridSize] = useState('500m');
  const [sizeChip, setSizeChip] = useState('500M');
  const [showResult, setShowResult] = useState(true);

  useEffect(() => {
    if (mapInst.current) return;

    const C = {
      severe: resolveColor('var(--red-50)'),
      warn:   resolveColor('var(--orange-50)'),
      caution: resolveColor('var(--blue-50)'),
      good:   resolveColor('var(--cool-neutral-80)'),
    };
    const center = [33.483, 126.512];

    const map = L.map(mapRef.current, { zoomControl: false, attributionControl: true, zoomSnap: 0.5 }).setView(center, 13);
    L.control.zoom({ position: 'topright' }).addTo(map);
    map.attributionControl.setPosition('bottomleft');
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19, opacity: 0.92, attribution: '&copy; OpenStreetMap',
    }).addTo(map);

    const badgeClass = (b) => ({ severe: 'badge--severe', warn: 'badge--warn', caution: 'badge--caution', good: 'badge--done' })[b];
    const levelOf = (v) => {
      if (v >= 40) return ['심각', 'severe', C.severe];
      if (v >= 20) return ['경고', 'warn', C.warn];
      if (v >= 10) return ['주의', 'caution', C.caution];
      return ['양호', 'good', C.good];
    };

    const ZOOM = { 500: 13, 300: 13.5, 200: 14, 100: 15 };

    const renderGrid = (cellM) => {
      if (gridLayer.current) map.removeLayer(gridLayer.current);
      if (labelLayer.current) map.removeLayer(labelLayer.current);
      gridLayer.current = L.layerGroup().addTo(map);
      labelLayer.current = L.layerGroup().addTo(map);
      map.setView(center, ZOOM[cellM] || 13);

      const latM = 111320, lngM = 111320 * Math.cos(center[0] * Math.PI / 180);
      const dLat = cellM / latM, dLng = cellM / lngM;
      const spanLat = Math.min(0.072, 18 * dLat), spanLng = Math.min(0.084, 24 * dLng);
      const rows = Math.round(spanLat / dLat), cols = Math.round(spanLng / dLng);
      const sw = [center[0] - spanLat / 2, center[1] - spanLng / 2];

      const hot = [
        { fx: 0.40, fy: 0.52, amp: 60, sig: 0.13, name: '연동 대로변',      il: 41, et: 11 },
        { fx: 0.58, fy: 0.42, amp: 42, sig: 0.12, name: '제주도청 인근',    il: 30, et: 8 },
        { fx: 0.50, fy: 0.63, amp: 33, sig: 0.10, name: '신광초등학교 주변', il: 22, et: 7 },
        { fx: 0.71, fy: 0.66, amp: 25, sig: 0.12, name: '제주공항 인근',    il: 16, et: 5 },
        { fx: 0.30, fy: 0.75, amp: 15, sig: 0.11, name: '동문시장 주변',    il: 14, et: 4 },
      ];
      const rnd = mulberry32(20260622 + cellM);

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const fx = c / (cols - 1), fy = r / (rows - 1);
          let v = 0, near = null, nd = 1e9;
          for (let i = 0; i < hot.length; i++) {
            const h = hot[i], dx = fx - h.fx, dy = fy - h.fy, d2 = dx * dx + dy * dy;
            v += h.amp * Math.exp(-d2 / (2 * h.sig * h.sig));
            if (d2 < nd) { nd = d2; near = h; }
          }
          v += (rnd() - 0.5) * 6;
          const val = Math.round(v);
          if (val < 4) continue;
          const cellSW = [sw[0] + r * dLat, sw[1] + c * dLng];
          const bounds = [[cellSW[0], cellSW[1]], [cellSW[0] + dLat, cellSW[1] + dLng]];
          const lv = levelOf(val);
          const op = lv[1] === 'good' ? 0.30 : 0.58;
          const rect = L.rectangle(bounds, { color: '#fff', weight: 1, fillColor: lv[2], fillOpacity: op });
          const il = Math.round(val * (near ? near.il / (near.il + near.et) : 0.78));
          const et = Math.max(0, val - il);
          rect.bindPopup(
            '<div class="gp"><div class="gp__h"><span class="badge ' + badgeClass(lv[1]) + '">' + lv[0] + '</span>' +
            '<span class="gp__loc">' + (near ? near.name : '격자 셀') + '</span></div>' +
            '<div class="gp__big">' + val + '건<span>/3개월</span></div>' +
            '<div class="gp__bd"><span>불법주차 <b>' + il + '</b></span><span>기타 <b>' + et + '</b></span></div></div>',
            { closeButton: false, offset: [0, -2] });
          rect.on('mouseover', function () { this.openPopup(); });
          rect.addTo(gridLayer.current);
          if (val >= 10) {
            const ctr = [cellSW[0] + dLat / 2, cellSW[1] + dLng / 2];
            L.marker(ctr, {
              interactive: false, keyboard: false,
              icon: L.divIcon({ className: 'gcell-lab', iconSize: [40, 16], html: String(val) }),
            }).addTo(labelLayer.current);
          }
        }
      }
    };

    renderGrid(cellRef.current);
    setTimeout(() => map.invalidateSize(), 250);
    window.addEventListener('resize', () => map.invalidateSize());
    mapInst.current = map;
    mapInst.current._renderGrid = renderGrid;
  }, []);

  const applyCell = (label) => {
    const meters = { '100m': 100, '200m': 200, '300m': 300, '500m': 500 }[label] || 500;
    cellRef.current = meters;
    setGridSize(label);
    setSizeChip(label.toUpperCase());
    if (mapInst.current && mapInst.current._renderGrid) mapInst.current._renderGrid(meters);
  };

  return (
    <>
      <header className="topbar">
        <div>
          <h1 className="page-title">생활권 시뮬레이션</h1>
          <p className="page-sub">격자(Grid) 기반 민원·수급·혼잡도 분석</p>
        </div>
        <div className="topbar__actions">
          <button className="btn btn--ai" type="button" onClick={() => navigate('/ai-assistant', { state: { focus: true } })}>{AI_ICON} AI 대화 시작하기</button>
          <button className="btn" type="button"><Icon name="download" size={20} /> 내보내기</button>
          <NotificationBell />
        </div>
      </header>

      <div className="content content--analysis">
        <section className="sim-stage">
          <div ref={mapRef} style={{ position: 'absolute', inset: 0, zIndex: 0 }} />

          {/* 왼쪽 설정 패널 */}
          <div className="card sim-panel sim-panel--left">
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
                <span className="field__date">2026-01-01 <Icon name="calendar" size={16} /></span>
                <span className="field__tilde">~</span>
                <span className="field__date">2026-05-31 <Icon name="calendar" size={16} /></span>
              </div>
            </div>

            <div className="field">
              <label className="field__label">격자 크기</label>
              <div className="grid-seg">
                {GRID_SIZES.map(s => (
                  <button key={s} className={gridSize === s ? 'is-active' : ''} onClick={() => applyCell(s)}>{s}</button>
                ))}
              </div>
            </div>

            <button className="btn-run" type="button" onClick={() => { applyCell(gridSize); setShowResult(true); }}>▷ 생활권 분석 실행</button>
          </div>

          {/* 오른쪽 결과 패널 */}
          {showResult && (
            <div className="sim-result">
              <div className="sim-result__top">
                <button className="sim-result__x" aria-label="뒤로가기"><Icon name="chevron-left" size={22} /></button>
                <button className="sim-result__x" aria-label="닫기" onClick={() => setShowResult(false)}><Icon name="close" size={22} /></button>
              </div>

              <div className="sim-result__body">
                <div className="sim-sec">
                  <div className="sim-sec__head">
                    <div>
                      <h3 className="sim-sec__title">분석 결과 요약</h3>
                      <p className="sim-sec__sub">격자 기반 분석 요약</p>
                    </div>
                    <span className="size-chip">{sizeChip}</span>
                  </div>
                  <div className="sum">
                    {SUMMARY.map(s => (
                      <div key={s.label} className={`sum__row${s.total ? ' sum__row--total' : ''}`}>
                        <span>{s.dot && <span className="dot" style={{ background: s.dot }} />}{s.label}</span>
                        <b>{s.val}</b>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="sim-sec">
                  <h3 className="sim-sec__title">민원 집중 구역</h3>
                  <p className="sim-sec__sub">격자 기반 민원 집중 구역</p>
                  <div className="rl">
                    {RANKING.map((r, i) => (
                      <div key={i} className="rl__row">
                        <span className="rl__rank">{r.rank}</span>
                        <div className="rl__main">
                          <div className="rl__top">
                            <span className="rl__name"><span className="dot" style={{ background: r.dot }} />{r.name}</span>
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

          {/* 하단 범례 */}
          <div className="sim-legend">
            <div className="map-legend">
              <div className="map-legend__title">범례</div>
              <div className="row"><span className="dot" style={{ background: 'var(--red-50)' }} />심각 (40건 이상)</div>
              <div className="row"><span className="dot" style={{ background: 'var(--orange-50)' }} />경고 (20~39건)</div>
              <div className="row"><span className="dot" style={{ background: 'var(--blue-50)' }} />주의 (10~19건)</div>
              <div className="row"><span className="dot" style={{ background: 'var(--cool-neutral-80)' }} />양호 (10건 미만)</div>
            </div>
            <div className="sim-gridchip"><span className="dot" style={{ background: 'var(--blue-50)' }} />격자 {gridSize} × {gridSize}</div>
          </div>
        </section>
      </div>
    </>
  );
}
