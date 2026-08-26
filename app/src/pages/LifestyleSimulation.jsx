import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import Icon from '../components/Icon';
import NotificationBell from '../components/NotificationBell';
import PageCrumb from '../components/PageCrumb';
import MapTypeToggle from '../components/MapTypeToggle';
import DateRangeField from '../components/DateRangeField';
import RegionSelect from '../components/RegionSelect';
import { exportLifestylePdf, exportLifestyleDocx } from '../utils/lifestyleExport';

const AI_ICON = (
  <svg viewBox="0 0 36 36" fill="none" width="24" height="24" aria-hidden="true" style={{ flexShrink: 0 }}>
    <path d="M18.6 8.4c0-2.6 2.1-4.6 4.7-4.6 0 2.6-2.1 4.6-4.7 4.6Z" fill="#3DA35D" />
    <circle cx="18" cy="21" r="12.5" fill="#F79009" />
    <circle cx="13.6" cy="19.6" r="1.4" fill="#4A3415" opacity="0.85" />
    <circle cx="22.4" cy="19.6" r="1.4" fill="#4A3415" opacity="0.85" />
    <path d="M14.9 24.2a3.9 3.9 0 0 0 6.2 0" stroke="#4A3415" strokeWidth="1.3" strokeLinecap="round" fill="none" opacity="0.85" />
  </svg>
);

const GRID_SIZES = ['100m', '200m', '300m', '500m'];

const ANALYSIS_TYPES = [
  { key: 'complaints', label: '민원 건수' },
  { key: 'demand',     label: '주차 수급' },
  { key: 'congestion', label: '혼잡도' },
];

const LOCATIONS = ['연동 대로변', '제주도청 인근', '신광초등학교 주변', '제주공항 인근', '동문시장 주변', '동문시장 주변', '동문시장 주변', '한림해수욕장 근처'];
const LOC_DOTS = ['var(--red-50)', 'var(--orange-50)', 'var(--orange-50)', 'var(--blue-50)', 'var(--blue-50)', 'var(--blue-50)', 'var(--blue-50)', 'var(--red-50)'];

/* 분석 유형별 표시 단위·기준·목데이터. 격자 맵의 공간 분포(Gaussian 핫스팟)는
   공통이며, 유형에 따라 값의 의미(건수/부족률/혼잡지수)와 임계값만 달라진다. */
const MODE_CONFIG = {
  complaints: {
    unit: '건',
    thresholds: [40, 20, 10], // [심각, 경고, 주의] 하한값
    transform: (v) => Math.round(v),
    legend: ['심각 (40건 이상)', '경고 (20~39건)', '주의 (10~19건)'],
    popup: (val, near) => {
      const il = Math.round(val * (near ? near.il / (near.il + near.et) : 0.78));
      const et = Math.max(0, val - il);
      return `<div class="gp__big">${val}건<span>/3개월</span></div><div class="gp__bd"><span>불법주차 <b>${il}</b></span><span>기타 <b>${et}</b></span></div>`;
    },
    sectionTitle: '민원 집중 구역',
    sectionSub: '격자 기반 민원 집중 구역',
    summary: [
      { label: '총 분석 격자', val: '156개', total: true },
      { label: '심각', dot: 'var(--red-50)',          val: '52개' },
      { label: '경고', dot: 'var(--orange-50)',       val: '38개' },
      { label: '주의', dot: 'var(--blue-50)',         val: '19개' },
    ],
    ranking: [
      { cnt: '52건', sub: '불법주차 41 · 기타 11' },
      { cnt: '38건', sub: '불법주차 30 · 기타 8'  },
      { cnt: '29건', sub: '불법주차 22 · 기타 7'  },
      { cnt: '21건', sub: '불법주차 16 · 기타 5'  },
      { cnt: '10건', sub: '불법주차 14 · 기타 4'  },
      { cnt: '10건', sub: '불법주차 14 · 기타 4'  },
      { cnt: '10건', sub: '불법주차 14 · 기타 4'  },
      { cnt: '18건', sub: '불법주차 12 · 기타 6'  },
    ],
  },
  demand: {
    unit: '%',
    thresholds: [70, 40, 20],
    transform: (v) => Math.min(96, Math.round(v * 1.3)),
    legend: ['심각 (70% 이상 부족)', '경고 (40~69% 부족)', '주의 (20~39% 부족)'],
    popup: (val) => {
      const demand = Math.round(20 + val * 0.6);
      const supply = Math.max(1, Math.round(demand * (1 - val / 100)));
      return `<div class="gp__big">부족률 ${val}%</div><div class="gp__bd"><span>수요 <b>${demand}대</b></span><span>공급 <b>${supply}면</b></span></div>`;
    },
    sectionTitle: '주차 수급 부족 구역',
    sectionSub: '격자 기반 수요·공급 격차',
    summary: [
      { label: '총 분석 격자', val: '156개', total: true },
      { label: '심각', dot: 'var(--red-50)',          val: '34개' },
      { label: '경고', dot: 'var(--orange-50)',       val: '45개' },
      { label: '주의', dot: 'var(--blue-50)',         val: '52개' },
    ],
    ranking: [
      { cnt: '82%', sub: '수요 69대 · 공급 12면' },
      { cnt: '74%', sub: '수요 58대 · 공급 15면' },
      { cnt: '65%', sub: '수요 49대 · 공급 17면' },
      { cnt: '58%', sub: '수요 42대 · 공급 18면' },
      { cnt: '39%', sub: '수요 31대 · 공급 19면' },
      { cnt: '38%', sub: '수요 30대 · 공급 19면' },
      { cnt: '37%', sub: '수요 30대 · 공급 19면' },
      { cnt: '61%', sub: '수요 44대 · 공급 17면' },
    ],
  },
  congestion: {
    unit: '점',
    thresholds: [80, 60, 40],
    transform: (v) => Math.min(99, Math.round(v * 1.15)),
    legend: ['심각 (80점 이상)', '경고 (60~79점)', '주의 (40~59점)'],
    popup: (val) => `<div class="gp__big">혼잡 지수 ${val}점</div><div class="gp__bd"><span>피크시간 통행 <b>${Math.min(99, Math.round(40 + val * 0.4))}%</b></span></div>`,
    sectionTitle: '혼잡 집중 구역',
    sectionSub: '격자 기반 혼잡도 분석',
    summary: [
      { label: '총 분석 격자', val: '156개', total: true },
      { label: '심각', dot: 'var(--red-50)',          val: '28개' },
      { label: '경고', dot: 'var(--orange-50)',       val: '41개' },
      { label: '주의', dot: 'var(--blue-50)',         val: '58개' },
    ],
    ranking: [
      { cnt: '91점', sub: '피크시간 통행 76%' },
      { cnt: '78점', sub: '피크시간 통행 71%' },
      { cnt: '68점', sub: '피크시간 통행 67%' },
      { cnt: '55점', sub: '피크시간 통행 62%' },
      { cnt: '32점', sub: '피크시간 통행 53%' },
      { cnt: '31점', sub: '피크시간 통행 52%' },
      { cnt: '30점', sub: '피크시간 통행 52%' },
      { cnt: '48점', sub: '피크시간 통행 59%' },
    ],
  },
};

function buildRanking(mode) {
  const cfg = MODE_CONFIG[mode];
  return LOCATIONS.map((name, i) => ({
    rank: i + 1, name, dot: LOC_DOTS[i], cnt: cfg.ranking[i].cnt, sub: cfg.ranking[i].sub,
  }));
}

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
  const modeRef     = useRef('complaints');
  const [city, setCity] = useState('전체');
  const [dong, setDong] = useState('전체');
  const [gridSize, setGridSize] = useState('500m');
  const [sizeChip, setSizeChip] = useState('500M');
  const [analysisType, setAnalysisType] = useState('complaints');
  const [showResult, setShowResult] = useState(true);
  const [exportOpen, setExportOpen] = useState(false);
  const exportRef = useRef(null);
  const modeCfg = MODE_CONFIG[analysisType];

  useEffect(() => {
    if (!exportOpen) return;
    const onDoc = (e) => { if (exportRef.current && !exportRef.current.contains(e.target)) setExportOpen(false); };
    const onKey = (e) => { if (e.key === 'Escape') setExportOpen(false); };
    document.addEventListener('click', onDoc);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('click', onDoc); document.removeEventListener('keydown', onKey); };
  }, [exportOpen]);

  const exportData = () => ({
    modeLabel: ANALYSIS_TYPES.find((t) => t.key === analysisType)?.label ?? analysisType,
    gridSize: sizeChip,
    summary: modeCfg.summary,
    sectionTitle: modeCfg.sectionTitle,
    ranking: buildRanking(analysisType),
  });

  useEffect(() => {
    if (mapInst.current) return;

    const C = {
      severe: resolveColor('var(--red-50)'),
      warn:   resolveColor('var(--orange-50)'),
      caution: resolveColor('var(--blue-50)'),
    };
    const center = [33.483, 126.512];

    const map = L.map(mapRef.current, { zoomControl: false, attributionControl: true, zoomSnap: 0.5 }).setView(center, 13);
    L.control.zoom({ position: 'topright' }).addTo(map);
    map.attributionControl.setPosition('bottomleft');
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19, opacity: 0.92, attribution: '&copy; OpenStreetMap',
    }).addTo(map);

    const badgeClass = (b) => ({ severe: 'badge--severe', warn: 'badge--warn', caution: 'badge--caution' })[b];
    /* 3단계(심각/경고/주의) 통일 — 주의 미만 격자는 표시하지 않는다 */
    const levelOf = (v, thresholds) => {
      const [t1, t2] = thresholds;
      if (v >= t1) return ['심각', 'severe', C.severe];
      if (v >= t2) return ['경고', 'warn', C.warn];
      return ['주의', 'caution', C.caution];
    };

    const ZOOM = { 500: 13, 300: 13.5, 200: 14, 100: 15 };

    const renderGrid = (cellM, mode) => {
      const cfg = MODE_CONFIG[mode];
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
          if (v < 4) continue;
          const val = cfg.transform(v);
          if (val < cfg.thresholds[2]) continue;
          const cellSW = [sw[0] + r * dLat, sw[1] + c * dLng];
          const bounds = [[cellSW[0], cellSW[1]], [cellSW[0] + dLat, cellSW[1] + dLng]];
          const lv = levelOf(val, cfg.thresholds);
          const rect = L.rectangle(bounds, { color: '#fff', weight: 1, fillColor: lv[2], fillOpacity: 0.58 });
          rect.bindPopup(
            '<div class="gp"><div class="gp__h"><span class="badge ' + badgeClass(lv[1]) + '">' + lv[0] + '</span>' +
            '<span class="gp__loc">' + (near ? near.name : '격자 셀') + '</span></div>' +
            cfg.popup(val, near) + '</div>',
            { closeButton: false, offset: [0, -2] });
          rect.on('mouseover', function () { this.openPopup(); });
          rect.addTo(gridLayer.current);
          if (val >= cfg.thresholds[2]) {
            const ctr = [cellSW[0] + dLat / 2, cellSW[1] + dLng / 2];
            L.marker(ctr, {
              interactive: false, keyboard: false,
              icon: L.divIcon({ className: 'gcell-lab', iconSize: [40, 16], html: String(val) }),
            }).addTo(labelLayer.current);
          }
        }
      }
    };

    renderGrid(cellRef.current, modeRef.current);
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
    if (mapInst.current && mapInst.current._renderGrid) mapInst.current._renderGrid(meters, modeRef.current);
  };

  const applyMode = (key) => {
    modeRef.current = key;
    setAnalysisType(key);
    if (mapInst.current && mapInst.current._renderGrid) mapInst.current._renderGrid(cellRef.current, key);
  };

  return (
    <>
      <header className="topbar">
        <div>
          <PageCrumb group="분석·시뮬레이션" page="생활권 시뮬레이션" />
          <h1 className="page-title">생활권 시뮬레이션</h1>
          <p className="page-sub">격자(Grid) 기반 민원·수급·혼잡도 분석</p>
        </div>
        <div className="topbar__actions">
          <button className="btn btn--ai" type="button" onClick={() => navigate('/ai-assistant', { state: { focus: true } })}>{AI_ICON} AI 대화 시작하기</button>
          <NotificationBell />
        </div>
      </header>

      <div className="content content--analysis">
        <section className="sim-stage">
          <div ref={mapRef} style={{ position: 'absolute', inset: 0, zIndex: 0 }} />
            <MapTypeToggle getMap={() => mapInst.current} />

          {/* 왼쪽 설정 패널 */}
          <div className="card sim-panel sim-panel--left">
            <h2 className="sim-panel__title">생활권 분석 설정</h2>

            <div className="field">
              <label className="field__label">분석 유형</label>
              <div className="segment" style={{ flexWrap: 'wrap', width: '100%' }}>
                {ANALYSIS_TYPES.map((t) => (
                  <button key={t.key} type="button" className={`segment__btn${analysisType === t.key ? ' segment__btn--active' : ''}`} onClick={() => applyMode(t.key)}>{t.label}</button>
                ))}
              </div>
            </div>

            <div className="field">
              <label className="field__label">분석 지역</label>
              <RegionSelect city={city} dong={dong} onCityChange={setCity} onDongChange={setDong} />
            </div>

            <div className="field">
              <label className="field__label">분석 기간</label>
              <DateRangeField defaultFrom="2026-01-01" defaultTo="2026-05-31" />
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
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <div className="sim-export" ref={exportRef}>
                    <button
                      className="btn"
                      type="button"
                      style={{ height: 36, padding: '0 var(--space-12)', fontSize: 'var(--label2-size)' }}
                      aria-haspopup="menu"
                      aria-expanded={exportOpen}
                      onClick={(e) => { e.stopPropagation(); setExportOpen((o) => !o); }}
                    >
                      <Icon name="download" size={16} /> 내보내기
                    </button>
                    {exportOpen && (
                      <div className="sim-export__menu" role="menu">
                        <button type="button" role="menuitem" className="sim-export__item"
                          onClick={() => { setExportOpen(false); exportLifestylePdf(exportData()); }}>
                          PDF 파일 (.pdf)
                        </button>
                        <button type="button" role="menuitem" className="sim-export__item"
                          onClick={() => { setExportOpen(false); exportLifestyleDocx(exportData()); }}>
                          Word 파일 (.docx)
                        </button>
                      </div>
                    )}
                  </div>
                  <button className="sim-result__x" aria-label="닫기" onClick={() => setShowResult(false)}><Icon name="close" size={22} /></button>
                </div>
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
                    {modeCfg.summary.map(s => (
                      <div key={s.label} className={`sum__row${s.total ? ' sum__row--total' : ''}`}>
                        <span>{s.dot && <span className="dot" style={{ background: s.dot }} />}{s.label}</span>
                        <b>{s.val}</b>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="sim-sec">
                  <h3 className="sim-sec__title">{modeCfg.sectionTitle}</h3>
                  <p className="sim-sec__sub">{modeCfg.sectionSub}</p>
                  <div className="rl">
                    {buildRanking(analysisType).map((r, i) => (
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
              <div className="row"><span className="dot" style={{ background: 'var(--red-50)' }} />{modeCfg.legend[0]}</div>
              <div className="row"><span className="dot" style={{ background: 'var(--orange-50)' }} />{modeCfg.legend[1]}</div>
              <div className="row"><span className="dot" style={{ background: 'var(--blue-50)' }} />{modeCfg.legend[2]}</div>
            </div>
            <div className="sim-gridchip"><span className="dot" style={{ background: 'var(--blue-50)' }} />격자 {gridSize} × {gridSize}</div>
          </div>
        </section>
      </div>
    </>
  );
}
