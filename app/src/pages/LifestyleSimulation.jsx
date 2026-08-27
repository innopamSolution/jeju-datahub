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

/* 5단계 백분위 등급 — 심각(상위 10%) / 경고(~25%) / 주의(~50%) / 보통(~75%) / 낮음(하위 25%) */
const LEVELS5 = [
  { key: 'severe',  label: '심각', pct: '상위 10%',    color: 'var(--red-50)' },
  { key: 'warn',    label: '경고', pct: '상위 10~25%', color: 'var(--orange-50)' },
  { key: 'caution', label: '주의', pct: '상위 25~50%', color: 'var(--blue-50)' },
  { key: 'normal',  label: '보통', pct: '상위 50~75%', color: 'var(--green-50)' },
  { key: 'low',     label: '낮음', pct: '하위 25%',    color: 'var(--cool-neutral-80)' },
];

const ANALYSIS_TYPES = [
  { key: 'complaints', label: '민원 건수' },
  { key: 'demand',     label: '주차 수급' },
  { key: 'congestion', label: '혼잡도' },
];

const LOCATIONS = [
  '연동 대로변', '제주도청 인근', '신광초등학교 주변', '제주공항 인근', '동문시장 주변',
  '한림해수욕장 근처', '이도2동 상업지구', '노형 사거리', '삼도동 골목', '아라동 주택가',
  '서귀포 올레시장 인근', '중문 관광단지', '성산 일출봉 입구', '애월 해안도로', '용담 해안도로',
];
/* 15개 기준 5단계 백분위: 1~2 심각 / 3~4 경고 / 5~8 주의 / 9~12 보통 / 13~15 낮음 */
const LOC_DOTS = [
  'var(--red-50)', 'var(--red-50)',
  'var(--orange-50)', 'var(--orange-50)',
  'var(--blue-50)', 'var(--blue-50)', 'var(--blue-50)', 'var(--blue-50)',
  'var(--green-50)', 'var(--green-50)', 'var(--green-50)', 'var(--green-50)',
  'var(--cool-neutral-80)', 'var(--cool-neutral-80)', 'var(--cool-neutral-80)',
];

/* 분석 유형별 표시 단위·기준·목데이터. 격자 맵의 공간 분포(Gaussian 핫스팟)는
   공통이며, 유형에 따라 값의 의미(건수/부족률/혼잡지수)와 임계값만 달라진다. */
const MODE_CONFIG = {
  complaints: {
    unit: '건',
    transform: (v) => Math.round(v),
    popup: (val, near) => {
      const il = Math.round(val * (near ? near.il / (near.il + near.et) : 0.78));
      const et = Math.max(0, val - il);
      return `<div class="gp__big">${val}건<span>/3개월</span></div><div class="gp__bd"><span>불법주차 <b>${il}</b></span><span>기타 <b>${et}</b></span></div>`;
    },
    sectionTitle: '민원 집중 구역',
    sectionSub: '격자 기반 민원 집중 구역 (심각, 경고)',
    summary: [
      { label: '총 분석 격자', val: '156개', total: true },
      { label: '심각', dot: 'var(--red-50)',          val: '16개' },
      { label: '경고', dot: 'var(--orange-50)',       val: '23개' },
      { label: '주의', dot: 'var(--blue-50)',         val: '39개' },
      { label: '보통', dot: 'var(--green-50)',        val: '39개' },
      { label: '낮음', dot: 'var(--cool-neutral-80)', val: '39개' },
    ],
    ranking: [
      { cnt: '52건', sub: '불법주차 41 · 기타 11' },
      { cnt: '38건', sub: '불법주차 30 · 기타 8'  },
      { cnt: '29건', sub: '불법주차 22 · 기타 7'  },
      { cnt: '21건', sub: '불법주차 16 · 기타 5'  },
      { cnt: '18건', sub: '불법주차 14 · 기타 4'  },
      { cnt: '16건', sub: '불법주차 12 · 기타 4'  },
      { cnt: '14건', sub: '불법주차 11 · 기타 3'  },
      { cnt: '13건', sub: '불법주차 10 · 기타 3'  },
      { cnt: '11건', sub: '불법주차 8 · 기타 3'   },
      { cnt: '10건', sub: '불법주차 8 · 기타 2'   },
      { cnt: '9건',  sub: '불법주차 7 · 기타 2'   },
      { cnt: '8건',  sub: '불법주차 6 · 기타 2'   },
      { cnt: '7건',  sub: '불법주차 5 · 기타 2'   },
      { cnt: '6건',  sub: '불법주차 5 · 기타 1'   },
      { cnt: '5건',  sub: '불법주차 4 · 기타 1'   },
    ],
  },
  demand: {
    unit: '%',
    transform: (v) => Math.min(96, Math.round(v * 1.3)),
    popup: (val) => {
      const demand = Math.round(20 + val * 0.6);
      const supply = Math.max(1, Math.round(demand * (1 - val / 100)));
      return `<div class="gp__big">부족률 ${val}%</div><div class="gp__bd"><span>수요 <b>${demand}대</b></span><span>공급 <b>${supply}면</b></span></div>`;
    },
    sectionTitle: '주차 수급 부족 구역',
    sectionSub: '격자 기반 수요·공급 격차 (심각, 경고)',
    summary: [
      { label: '총 분석 격자', val: '156개', total: true },
      { label: '심각', dot: 'var(--red-50)',          val: '16개' },
      { label: '경고', dot: 'var(--orange-50)',       val: '23개' },
      { label: '주의', dot: 'var(--blue-50)',         val: '39개' },
      { label: '보통', dot: 'var(--green-50)',        val: '39개' },
      { label: '낮음', dot: 'var(--cool-neutral-80)', val: '39개' },
    ],
    ranking: [
      { cnt: '82%', sub: '수요 69대 · 공급 12면' },
      { cnt: '74%', sub: '수요 58대 · 공급 15면' },
      { cnt: '65%', sub: '수요 49대 · 공급 17면' },
      { cnt: '58%', sub: '수요 42대 · 공급 18면' },
      { cnt: '52%', sub: '수요 38대 · 공급 18면' },
      { cnt: '47%', sub: '수요 35대 · 공급 19면' },
      { cnt: '43%', sub: '수요 33대 · 공급 19면' },
      { cnt: '39%', sub: '수요 31대 · 공급 19면' },
      { cnt: '36%', sub: '수요 29대 · 공급 19면' },
      { cnt: '33%', sub: '수요 28대 · 공급 19면' },
      { cnt: '30%', sub: '수요 27대 · 공급 19면' },
      { cnt: '27%', sub: '수요 26대 · 공급 19면' },
      { cnt: '24%', sub: '수요 25대 · 공급 19면' },
      { cnt: '21%', sub: '수요 24대 · 공급 19면' },
      { cnt: '18%', sub: '수요 23대 · 공급 19면' },
    ],
  },
  congestion: {
    unit: '점',
    transform: (v) => Math.min(99, Math.round(v * 1.15)),
    popup: (val) => `<div class="gp__big">혼잡 지수 ${val}점</div><div class="gp__bd"><span>피크시간 통행 <b>${Math.min(99, Math.round(40 + val * 0.4))}%</b></span></div>`,
    sectionTitle: '혼잡 집중 구역',
    sectionSub: '격자 기반 혼잡도 분석 (심각, 경고)',
    summary: [
      { label: '총 분석 격자', val: '156개', total: true },
      { label: '심각', dot: 'var(--red-50)',          val: '16개' },
      { label: '경고', dot: 'var(--orange-50)',       val: '23개' },
      { label: '주의', dot: 'var(--blue-50)',         val: '39개' },
      { label: '보통', dot: 'var(--green-50)',        val: '39개' },
      { label: '낮음', dot: 'var(--cool-neutral-80)', val: '39개' },
    ],
    ranking: [
      { cnt: '91점', sub: '피크시간 통행 76%' },
      { cnt: '84점', sub: '피크시간 통행 73%' },
      { cnt: '78점', sub: '피크시간 통행 71%' },
      { cnt: '71점', sub: '피크시간 통행 68%' },
      { cnt: '66점', sub: '피크시간 통행 66%' },
      { cnt: '61점', sub: '피크시간 통행 64%' },
      { cnt: '55점', sub: '피크시간 통행 62%' },
      { cnt: '50점', sub: '피크시간 통행 60%' },
      { cnt: '46점', sub: '피크시간 통행 58%' },
      { cnt: '42점', sub: '피크시간 통행 56%' },
      { cnt: '38점', sub: '피크시간 통행 55%' },
      { cnt: '34점', sub: '피크시간 통행 53%' },
      { cnt: '31점', sub: '피크시간 통행 52%' },
      { cnt: '28점', sub: '피크시간 통행 51%' },
      { cnt: '25점', sub: '피크시간 통행 50%' },
    ],
  },
};

/* 목록에는 심각·경고 등급(상위 25%)만 노출 */
function buildRanking(mode) {
  const cfg = MODE_CONFIG[mode];
  return LOCATIONS.map((name, i) => ({
    rank: i + 1, name, dot: LOC_DOTS[i], cnt: cfg.ranking[i].cnt, sub: cfg.ranking[i].sub,
  })).filter((r) => r.dot === 'var(--red-50)' || r.dot === 'var(--orange-50)');
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
  const [period, setPeriod] = useState('최근3개월');
  const [dong, setDong] = useState('전체');
  const [gridSize, setGridSize] = useState('500m');
  const [sizeChip, setSizeChip] = useState('500M');
  const [analysisType, setAnalysisType] = useState('complaints');
  const [showResult, setShowResult] = useState(true);
  const [exportOpen, setExportOpen] = useState(false);
  const exportRef = useRef(null);
  const modeCfg = MODE_CONFIG[analysisType];

  /* 격자 렌더 시 계산된 백분위 컷 (범례 건수 표기용) */
  const [cuts, setCuts] = useState(null);
  const setCutsRef = useRef(null);
  setCutsRef.current = setCuts;

  /* 범례에는 현재 설정 조건으로 계산된 값 구간(건/%/점)을 표기 */
  const cntRange = (key) => {
    if (!cuts) return null;
    const u = modeCfg.unit;
    switch (key) {
      case 'severe':  return `${cuts.t10}${u} 이상`;
      case 'warn':    return `${cuts.t25}~${cuts.t10 - 1}${u}`;
      case 'caution': return `${cuts.t50}~${cuts.t25 - 1}${u}`;
      case 'normal':  return `${cuts.t75}~${cuts.t50 - 1}${u}`;
      default:        return `${cuts.t75}${u} 미만`;
    }
  };

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
      severe:  resolveColor('var(--red-50)'),
      warn:    resolveColor('var(--orange-50)'),
      caution: resolveColor('var(--blue-50)'),
      normal:  resolveColor('var(--green-50)'),
      low:     resolveColor('var(--cool-neutral-80)'),
    };
    const center = [33.483, 126.512];

    const map = L.map(mapRef.current, { zoomControl: false, attributionControl: true, zoomSnap: 0.5 }).setView(center, 13);
    L.control.zoom({ position: 'topright' }).addTo(map);
    map.attributionControl.setPosition('bottomleft');
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19, opacity: 0.92, attribution: '&copy; OpenStreetMap',
    }).addTo(map);

    const badgeClass = (b) => ({
      severe: 'badge--severe', warn: 'badge--warn', caution: 'badge--caution',
      normal: 'badge--done', low: 'badge--neutral',
    })[b];
    /* 5단계 백분위 등급 — 값 분포에서 상위 10/25/50/75% 컷을 구해 배정 */
    const levelOf = (val, cuts) => {
      if (val >= cuts.t10) return ['심각', 'severe', C.severe];
      if (val >= cuts.t25) return ['경고', 'warn', C.warn];
      if (val >= cuts.t50) return ['주의', 'caution', C.caution];
      if (val >= cuts.t75) return ['보통', 'normal', C.normal];
      return ['낮음', 'low', C.low];
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

      /* 1차: 분석 대상 격자 값 수집 */
      const cells = [];
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
          const cellSW = [sw[0] + r * dLat, sw[1] + c * dLng];
          cells.push({ val, near, cellSW });
        }
      }

      /* 백분위 컷 계산 (내림차순 분포에서 상위 p% 경계값) */
      const sorted = cells.map((x) => x.val).sort((a, b) => b - a);
      const cutAt = (p) => sorted[Math.min(sorted.length - 1, Math.max(0, Math.ceil(sorted.length * p) - 1))];
      const cuts = { t10: cutAt(0.10), t25: cutAt(0.25), t50: cutAt(0.50), t75: cutAt(0.75) };
      if (setCutsRef.current) setCutsRef.current(cuts);

      /* 2차: 등급 배정 후 렌더 (보통·낮음은 옅게) */
      cells.forEach(({ val, near, cellSW }) => {
        const bounds = [[cellSW[0], cellSW[1]], [cellSW[0] + dLat, cellSW[1] + dLng]];
        const lv = levelOf(val, cuts);
        const op = lv[1] === 'normal' ? 0.36 : lv[1] === 'low' ? 0.24 : 0.58;
        const rect = L.rectangle(bounds, { color: '#fff', weight: 1, fillColor: lv[2], fillOpacity: op });
        rect.bindPopup(
          '<div class="gp"><div class="gp__h"><span class="badge ' + badgeClass(lv[1]) + '">' + lv[0] + '</span>' +
          '<span class="gp__loc">' + (near ? near.name : '격자 셀') + '</span></div>' +
          cfg.popup(val, near) + '</div>',
          { closeButton: false, offset: [0, -2] });
        rect.on('mouseover', function () { this.openPopup(); });
        rect.addTo(gridLayer.current);
        if (val >= cuts.t50) {
          const ctr = [cellSW[0] + dLat / 2, cellSW[1] + dLng / 2];
          L.marker(ctr, {
            interactive: false, keyboard: false,
            icon: L.divIcon({ className: 'gcell-lab', iconSize: [40, 16], html: String(val) }),
          }).addTo(labelLayer.current);
        }
      });
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
              <div className="grid-seg">
                {['최근1개월', '최근3개월', '최근6개월', '직접설정'].map((p) => (
                  <button key={p} className={period === p ? 'is-active' : ''} onClick={() => setPeriod(p)}>{p}</button>
                ))}
              </div>
              {period === '직접설정' && (
                <DateRangeField defaultFrom="2026-01-01" defaultTo="2026-05-31" />
              )}
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
                      <p className="sim-sec__sub">격자 기반 분석(등급은 조회 조건 내 상대 순위입니다.)</p>
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
              {LEVELS5.map((l) => (
                <div key={l.key} className="row">
                  <span className="dot" style={{ background: l.color }} />
                  {l.label}{cntRange(l.key) ? ` (${cntRange(l.key)})` : ''}
                </div>
              ))}
            </div>
            <div className="sim-gridchip"><span className="dot" style={{ background: 'var(--blue-50)' }} />격자 {gridSize} × {gridSize}</div>
          </div>
        </section>
      </div>
    </>
  );
}
