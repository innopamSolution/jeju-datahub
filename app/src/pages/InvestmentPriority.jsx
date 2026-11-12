import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import Icon from '../components/Icon';
import NotificationBell from '../components/NotificationBell';
import PageCrumb from '../components/PageCrumb';
import MapTypeToggle from '../components/MapTypeToggle';
import DataFreshness from '../components/DataFreshness';
import { exportSectionsPdf, hBarChartHtml } from '../utils/pageExport';
import { exportInvestXlsx } from '../utils/investExport';

const AI_ICON = (
  <svg viewBox="0 0 36 36" fill="none" width="24" height="24" aria-hidden="true" style={{ flexShrink: 0 }}>
    <path d="M18.6 8.4c0-2.6 2.1-4.6 4.7-4.6 0 2.6-2.1 4.6-4.7 4.6Z" fill="#3DA35D" />
    <circle cx="18" cy="21" r="12.5" fill="#F79009" />
    <circle cx="13.6" cy="19.6" r="1.4" fill="#4A3415" opacity="0.85" />
    <circle cx="22.4" cy="19.6" r="1.4" fill="#4A3415" opacity="0.85" />
    <path d="M14.9 24.2a3.9 3.9 0 0 0 6.2 0" stroke="#4A3415" strokeWidth="1.3" strokeLinecap="round" fill="none" opacity="0.85" />
  </svg>
);

const TIER = {
  high: { badge: 'badge--severe', label: '높음', cssVar: 'var(--red-50)' },
  mid:  { badge: 'badge--warn',   label: '중간', cssVar: 'var(--orange-50)' },
  low:  { badge: 'badge--caution', label: '낮음', cssVar: 'var(--blue-50)' },
};

const LOTS = [
  { rank: 1,  name: '노형공영주차장',   tier: 'high', score: 91, addr: '제주시 노형동 970',       spaces: 120, year: 2009, age: 17, m: { safety: 88, civil: 95, usage: 90, accident: 92 }, c: [33.4855, 126.481] },
  { rank: 2,  name: '연동공영주차장',   tier: 'high', score: 84, addr: '제주시 연동 312',         spaces: 95,  year: 2011, age: 15, m: { safety: 86, civil: 88, usage: 82, accident: 80 }, c: [33.489, 126.4955] },
  { rank: 3,  name: '이도공영주차장',   tier: 'mid',  score: 78, addr: '제주시 이도2동 1024',     spaces: 140, year: 2013, age: 13, m: { safety: 80, civil: 78, usage: 84, accident: 70 }, c: [33.4985, 126.529] },
  { rank: 4,  name: '삼도1동공영주차장', tier: 'mid', score: 73, addr: '제주시 삼도1동 565',      spaces: 80,  year: 2012, age: 14, m: { safety: 76, civil: 74, usage: 72, accident: 68 }, c: [33.512, 126.518] },
  { rank: 5,  name: '한림공영주차장',   tier: 'mid',  score: 69, addr: '제주시 한림읍 한림로',    spaces: 110, year: 2014, age: 12, m: { safety: 72, civil: 68, usage: 70, accident: 64 }, c: [33.413, 126.268] },
  { rank: 6,  name: '중문공영주차장',   tier: 'mid',  score: 65, addr: '서귀포시 중문동 2070',    spaces: 130, year: 2010, age: 16, m: { safety: 66, civil: 64, usage: 68, accident: 60 }, c: [33.252, 126.421] },
  { rank: 7,  name: '성산공영주차장',   tier: 'mid',  score: 62, addr: '서귀포시 성산읍 성산리',  spaces: 90,  year: 2015, age: 11, m: { safety: 64, civil: 60, usage: 62, accident: 58 }, c: [33.4585, 126.938] },
  { rank: 8,  name: '효돈공영주차장',   tier: 'low',  score: 58, addr: '서귀포시 효돈동 1565',    spaces: 70,  year: 2016, age: 10, m: { safety: 60, civil: 56, usage: 58, accident: 54 }, c: [33.267, 126.6] },
  { rank: 9,  name: '구좌공영주차장',   tier: 'low',  score: 54, addr: '제주시 구좌읍 김녕리',    spaces: 85,  year: 2017, age: 9,  m: { safety: 56, civil: 52, usage: 54, accident: 50 }, c: [33.528, 126.852] },
  { rank: 10, name: '애월공영주차장',   tier: 'low',  score: 51, addr: '제주시 애월읍 애월리',    spaces: 100, year: 2018, age: 8,  m: { safety: 52, civil: 50, usage: 52, accident: 46 }, c: [33.463, 126.31] },
  { rank: 11, name: '한경공영주차장',   tier: 'low',  score: 47, addr: '제주시 한경면 신창리',    spaces: 60,  year: 2019, age: 7,  m: { safety: 48, civil: 46, usage: 48, accident: 44 }, c: [33.344, 126.176] },
];

// 분석 기간별 사고 발생 현황 (KPI 연동 — 라벨·건수·대상이 분석 기간에 맞춰 변경)
const ACCIDENT_BY_PERIOD = {
  '최근1개월': { count: 0, lots: '사고 없음' },
  '최근3개월': { count: 2, lots: '노형 · 연동 주차장' },
  '최근6개월': { count: 3, lots: '노형 · 연동 · 성산 주차장' },
};

/* 설정 > 분석 지표 가중치 설정 > 투자우선순위.
   종합점수 가중치(4지표 합계 100% · 사고이력 미사용) + 분석 계수. */
const INVEST_WEIGHTS = [
  { key: 'safety',  label: '안전위험도' },
  { key: 'civil',   label: '민원 건수' },
  { key: 'usage',   label: '이용률' },
  { key: 'enforce', label: '사고이력' },
];
const INVEST_DEFAULT_W = { safety: 25, civil: 25, usage: 25, enforce: 25 };
const INVEST_COEFFS = [
  { key: 'assignRange', label: '배정 범위',          min: 50, max: 1000, step: 10, def: 300, unit: 'm',   hint: '민원·단속 1건을 최근접 대상 주차장 1곳에 배정하는 범위' },
  { key: 'highScore',   label: '상위 등급 기준점수',  min: 0,  max: 100,  step: 1,  def: 80,  unit: '점',  hint: '종합점수 이 값 이상이면 우선순위 높음(H)' },
  { key: 'midScore',    label: '중간 등급 기준점수',  min: 0,  max: 100,  step: 1,  def: 60,  unit: '점',  hint: '이상이고 상위 미만이면 중간(M), 미만이면 낮음(L)' },
  { key: 'showCount',   label: '표시 주차장 수',      min: 1,  max: 500,  step: 1,  def: 50,  unit: '개소', hint: '목록·지도 표시 수 (점수 계산엔 미사용)' },
];
const isDefaultW = (w) => INVEST_WEIGHTS.every(({ key }) => w[key] === INVEST_DEFAULT_W[key]);
/* idx 지표를 newVal로 조정 — 상위(0..idx-1)는 고정하고, 남은 몫을 하위(idx+1..)에 재분배해 합계 100% 유지.
   마지막 지표는 하위가 없으므로 (100 - 상위합)으로 강제돼 합계를 맞춘다. */
function adjustInvestWeights(w, idx, newVal) {
  const keys = INVEST_WEIGHTS.map((k) => k.key);
  const vals = keys.map((k) => w[k]);
  const sumAbove = vals.slice(0, idx).reduce((a, b) => a + b, 0);
  const maxForIdx = 100 - sumAbove;
  const belowCount = keys.length - idx - 1;
  const out = [...vals];
  if (belowCount === 0) {
    out[idx] = maxForIdx;                               // 마지막 지표: 합계 100 유지용
  } else {
    const v = Math.max(0, Math.min(maxForIdx, newVal));
    out[idx] = v;
    const remaining = maxForIdx - v;                    // 하위에 나눠줄 몫
    const belowVals = vals.slice(idx + 1);
    const belowSum = belowVals.reduce((a, b) => a + b, 0);
    let assigned = 0;
    for (let j = 0; j < belowCount; j++) {
      const k = idx + 1 + j;
      let share;
      if (j === belowCount - 1) share = Math.max(0, remaining - assigned); // 마지막 하위가 잔차 흡수
      else {
        share = belowSum > 0 ? Math.round((remaining * belowVals[j]) / belowSum) : Math.round(remaining / belowCount);
        assigned += share;
      }
      out[k] = share;
    }
  }
  const res = {};
  keys.forEach((k, i) => { res[k] = out[i]; });
  return res;
}
function investDefaultCoeffs() {
  const o = {};
  INVEST_COEFFS.forEach((c) => { o[c.key] = c.def; });
  return o;
}
const fmtCoeff = (v) => (Number.isInteger(v) ? String(v) : String(Math.round(v * 1000) / 1000));

function resolveColor(cssVar) {
  const probe = document.createElement('span');
  probe.style.cssText = 'position:absolute;left:-9999px;top:-9999px';
  probe.style.color = cssVar;
  document.body.appendChild(probe);
  const c = getComputedStyle(probe).color;
  document.body.removeChild(probe);
  return c;
}

function lotPopup(lot, fill, t) {
  const bar = (label, v) =>
    '<div class="lp__row"><span class="lp__lab">' + label + '</span>' +
    '<span class="lp__bar"><i style="width:' + v + '%;background:' + fill + '"></i></span>' +
    '<b class="lp__num">' + v + '</b></div>';
  return '<div class="lp">' +
    '<div class="lp__top"><span class="badge ' + t.badge + '">' + t.label + '</span>' +
      '<span class="lp__score">' + lot.score + '</span>' +
      '<span class="lp__name">' + lot.name + '</span></div>' +
    '<div class="lp__meta">' + lot.addr + ' · 총 ' + lot.spaces + '면</div>' +
    '<div class="lp__meta">준공 ' + lot.year + '년 (' + lot.age + '년 경과)</div>' +
    '<div class="lp__metrics">' +
      bar('안전위험도', lot.m.safety) +
      bar('민원 건수', lot.m.civil) +
      bar('이용률', lot.m.usage) +
      bar('사고 이력', lot.m.accident) +
    '</div></div>';
}

export default function InvestmentPriority() {
  const navigate = useNavigate();
  const mapRef    = useRef(null);
  const mapInst   = useRef(null);
  const markerMap = useRef({});
  const rowRefs   = useRef([]);
  const listRef   = useRef(null);
  const [risk, setRisk] = useState('전체');
  const [period, setPeriod] = useState('최근1개월');
  // 조회 조건(우선순위) → 지도·순위 필터
  const TIER_OF = { 높음: 'high', 중간: 'mid', 낮음: 'low' };
  const matchRisk = (lot) => risk === '전체' || lot.tier === TIER_OF[risk];
  const visibleLots = LOTS.filter(matchRisk);
  const [activeRank, setActiveRank] = useState(null);
  const [exportOpen, setExportOpen] = useState(false);
  const exportRef = useRef(null);

  useEffect(() => {
    if (!exportOpen) return;
    const onDoc = (e) => { if (exportRef.current && !exportRef.current.contains(e.target)) setExportOpen(false); };
    const onKey = (e) => { if (e.key === 'Escape') setExportOpen(false); };
    document.addEventListener('click', onDoc);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('click', onDoc); document.removeEventListener('keydown', onKey); };
  }, [exportOpen]);

  /* 분석 계수 조정 — 설정>투자우선순위(종합점수 가중치 + 분석 계수)를 사용자 화면에서 조정.
     side-col의 overflow-y:auto에 잘리지 않도록 팝오버는 포털(fixed 위치)로 띄운다. */
  const [advOpen, setAdvOpen] = useState(false);
  const advRef = useRef(null);        // 버튼 래퍼
  const popRef = useRef(null);        // 포털 팝오버
  const [popPos, setPopPos] = useState({ top: 0, left: 0 });
  const [draftW, setDraftW] = useState(INVEST_DEFAULT_W);
  const [appliedW, setAppliedW] = useState(INVEST_DEFAULT_W);
  const [draftC, setDraftC] = useState(investDefaultCoeffs);
  const [appliedC, setAppliedC] = useState(investDefaultCoeffs);
  useEffect(() => {
    if (!advOpen) return;
    const onDoc = (e) => {
      if (advRef.current && advRef.current.contains(e.target)) return;
      if (popRef.current && popRef.current.contains(e.target)) return;
      setAdvOpen(false);
    };
    const onKey = (e) => { if (e.key === 'Escape') setAdvOpen(false); };
    document.addEventListener('click', onDoc);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('click', onDoc); document.removeEventListener('keydown', onKey); };
  }, [advOpen]);
  const openAdv = () => {
    setDraftW(appliedW); setDraftC(appliedC);
    setAdvOpen((o) => {
      const next = !o;
      if (next && advRef.current) {
        const r = advRef.current.getBoundingClientRect();
        const W = 340;
        setPopPos({ top: r.bottom + 8, left: Math.max(8, r.right - W) });
      }
      return next;
    });
  };
  const resetAll = () => { setAppliedW(INVEST_DEFAULT_W); setDraftW(INVEST_DEFAULT_W); setAppliedC(investDefaultCoeffs()); setDraftC(investDefaultCoeffs()); };
  const apW = appliedW;
  const changedCoeffs = INVEST_COEFFS.filter((c) => appliedC[c.key] !== c.def);
  const isAdjusted = !isDefaultW(appliedW) || changedCoeffs.length > 0;
  const weightLine = INVEST_WEIGHTS.map(({ key, label }) => `${label} ${apW[key]}%`).join(' / ');

  const exportData = () => ({
    fileBase: '투자보강_우선순위',
    title: '투자·보강 우선순위',
    subtitle: `분석 기간 : ${period.replace('최근', '최근 ')} · 종합점수 기준 : ${weightLine}${isDefaultW(appliedW) ? '' : ' (조정됨)'}`,
    sections: [
      {
        type: 'chart',
        title: '주차장별 종합점수',
        html: hBarChartHtml(LOTS.map((lot) => ({
          label: lot.name, value: lot.score, valueLabel: `${lot.score}점`, color: TIER[lot.tier].cssVar,
        }))),
      },
      {
        type: 'table',
        title: '투자·보강 우선순위 목록',
        columns: ['순위', '주차장', '종합점수', '우선순위', '주소', '면수', '준공연도'],
        rows: LOTS.map((lot) => [
          lot.rank, lot.name, `${lot.score}점`, TIER[lot.tier].label, lot.addr, `${lot.spaces}면`, `${lot.year} (${lot.age}년 경과)`,
        ]),
      },
      {
        type: 'table',
        title: '세부 지표 (안전위험도 · 민원 건수 · 이용률 · 사고이력)',
        columns: ['순위', '주차장', '안전위험도', '민원 건수', '이용률', '사고이력'],
        rows: LOTS.map((lot) => [lot.rank, lot.name, lot.m.safety, lot.m.civil, lot.m.usage, lot.m.accident]),
      },
      {
        type: 'notes',
        title: '산정 기준',
        items: [
          `종합점수 = 안전위험도·민원 건수·이용률·사고이력 지표의 가중합 (적용 가중치 : ${weightLine})`,
          `우선순위 등급 : 상위 ${appliedC.highScore}점 이상(높음) · 중간 ${appliedC.midScore}점 이상(중간) · 미만(낮음) / 배정 범위 ${appliedC.assignRange}m${changedCoeffs.length ? ' · 계수 조정 적용' : ''}`,
        ],
      },
    ],
  });

  function setActiveRow(rank) {
    setActiveRank(rank);
    const row = rowRefs.current[rank - 1];
    if (row && listRef.current) {
      const top = row.offsetTop - listRef.current.offsetTop;
      if (top < listRef.current.scrollTop || top + row.offsetHeight > listRef.current.scrollTop + listRef.current.clientHeight) {
        listRef.current.scrollTo({ top: top - 8, behavior: 'smooth' });
      }
    }
  }

  useEffect(() => {
    if (mapInst.current) return;

    const center = [33.39, 126.55];
    const map = L.map(mapRef.current, { zoomControl: false, attributionControl: true, zoomSnap: 0.5 }).setView(center, 10.4);
    L.control.zoom({ position: 'topright' }).addTo(map);
    map.attributionControl.setPosition('bottomleft');
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19, opacity: 0.92, attribution: '&copy; OpenStreetMap',
    }).addTo(map);

    const fills = {
      high: resolveColor('var(--red-50)'),
      mid:  resolveColor('var(--orange-50)'),
      low:  resolveColor('var(--blue-50)'),
    };

    let topMarker = null;
    LOTS.forEach((lot) => {
      const t = TIER[lot.tier];
      const fill = fills[lot.tier];
      const pin = '<svg class="cmk__flag" width="44" height="56" viewBox="0 0 44 56" fill="none">' +
        '<path d="M22 54 C22 54 39 33 39 19 A17 17 0 1 0 5 19 C5 33 22 54 22 54 Z" fill="' + fill + '" stroke="#fff" stroke-width="2.5"></path>' +
        '<circle cx="22" cy="19" r="12.5" fill="rgba(255,255,255,0.95)"></circle>' +
        '<text x="22" y="19" text-anchor="middle" dominant-baseline="central" font-family="\'Pretendard\', sans-serif" font-size="12" font-weight="800" fill="' + fill + '">' + lot.rank + '</text></svg>';
      const icon = L.divIcon({
        className: 'cmk', iconSize: [44, 56], iconAnchor: [22, 54],
        html: pin + '<span class="cmk__lab">' + lot.name + '</span>',
      });
      const mk = L.marker(lot.c, { icon, riseOnHover: true })
        .bindPopup(lotPopup(lot, fill, t), { closeButton: true, offset: [0, -46], minWidth: 236, maxWidth: 280, className: 'lot-popup' })
        .addTo(map);
      mk.on('click', () => setActiveRow(lot.rank));
      mk.on('popupopen', () => setActiveRow(lot.rank));
      markerMap.current[lot.rank] = mk;
      if (lot.rank === 1) topMarker = mk;
    });

    setTimeout(() => { map.invalidateSize(); if (topMarker) topMarker.openPopup(); }, 300);
    window.addEventListener('resize', () => map.invalidateSize());
    mapInst.current = map;
  }, []);

  // 우선순위 조회 조건에 따라 지도 마커 표시/숨김
  useEffect(() => {
    const map = mapInst.current;
    if (!map) return;
    map.closePopup();
    LOTS.forEach((lot) => {
      const mk = markerMap.current[lot.rank];
      if (!mk) return;
      if (matchRisk(lot)) mk.addTo(map);
      else map.removeLayer(mk);
    });
  }, [risk]);

  const handleRowClick = (rank) => {
    const mk = markerMap.current[rank];
    if (!mk || !mapInst.current) return;
    setActiveRow(rank);
    /* 목록 클릭 시 해당 지점으로 확대 이동 후 팝업 표시 */
    mapInst.current.flyTo(mk.getLatLng(), Math.max(mapInst.current.getZoom(), 15), { duration: 0.8 });
    mapInst.current.once('moveend', () => mk.openPopup());
  };

  return (
    <>
      <header className="topbar">
        <div>
          <PageCrumb group="분석·시뮬레이션" page="투자우선순위 보드" />
          <h1 className="page-title">공영주차장 투자·보강 우선순위 보드</h1>
          <DataFreshness
            updated="2026.04.16"
            title="지표별 최근 갱신일"
            cols={['지표', '최근 갱신일']}
            sources={[
              { name: '안전위험도', date: '2026.01.15' },
              { name: '민원 건수', date: '2026.04.16' },
              { name: '이용률', date: '2026.04.16' },
              { name: '사고 이력', date: '2026.03.28' },
            ]}
          />
        </div>
        <div className="topbar__actions">
          <button className="btn btn--ai" type="button" onClick={() => navigate('/ai-assistant', { state: { focus: true } })}>{AI_ICON} AI 대화 시작하기</button>
          <NotificationBell />
        </div>
      </header>

      <div className="content">
        {/* 통계 카드 */}
        <section className="stat-row">
          <div className="card stat">
            <div className="stat__icon stat__icon--blue"><Icon name="company" size={28} /></div>
            <div>
              <div className="stat__label">분석대상 주차장</div>
              <div className="stat__value">28<span className="stat__unit">개소</span></div>
              <div className="stat__delta">제주시 · 서귀포시 전역</div>
            </div>
          </div>
          <div className="card stat">
            <div className="stat__icon stat__icon--red"><Icon name="warning" size={28} /></div>
            <div>
              <div className="stat__label">높음 우선순위</div>
              <div className="stat__value">7<span className="stat__unit">개소</span></div>
            </div>
          </div>
          <div className="card stat">
            <div className="stat__icon stat__icon--orange"><Icon name="car" size={28} /></div>
            <div>
              <div className="stat__label">{period.replace('최근', '최근 ')} 사고</div>
              <div className="stat__value">{(ACCIDENT_BY_PERIOD[period] ?? ACCIDENT_BY_PERIOD['최근3개월']).count}<span className="stat__unit">건</span></div>
              <div className="stat__delta">{(ACCIDENT_BY_PERIOD[period] ?? ACCIDENT_BY_PERIOD['최근3개월']).lots}</div>
            </div>
          </div>
        </section>

        {/* 지도 + 우선순위 패널 */}
        <section className="gis-row">
          {/* 지도 */}
          <div className="card map-card">
            <div className="map-controls">
              <div className="risk-group">
                <span className="ctrl__label">분석 기간</span>
                <div className="risk-seg">
                  {['최근1개월', '최근3개월', '최근6개월'].map((p) => (
                    <button key={p} className={period === p ? 'is-active' : ''} onClick={() => setPeriod(p)}>{p}</button>
                  ))}
                </div>
              </div>
              <div className="ctrl">
                <span className="ctrl__label">행정구역</span>
                <span className="select">제주 전체 <Icon name="chevron-down" size={18} /></span>
              </div>
              <div className="risk-group">
                <span className="ctrl__label">우선순위</span>
                <div className="risk-seg">
                  {['전체', '높음', '중간', '낮음'].map((r) => (
                    <button key={r} className={risk === r ? 'is-active' : ''} onClick={() => setRisk(r)}>{r}</button>
                  ))}
                </div>
                <button className="btn-reset" type="button" onClick={() => setRisk('전체')}>초기화</button>
              </div>
            </div>

            <div className="map-body">
              <div ref={mapRef} style={{ position: 'absolute', inset: 0, zIndex: 0 }} />
            <MapTypeToggle getMap={() => mapInst.current} />

              <div className="map-legend">
                <div className="map-legend__title">투자 우선순위</div>
                <div className="row"><span className="dot" style={{ background: 'var(--red-50)' }} />높음 (80점 이상)</div>
                <div className="row"><span className="dot" style={{ background: 'var(--orange-50)' }} />중간 (60~79점)</div>
                <div className="row"><span className="dot" style={{ background: 'var(--blue-50)' }} />낮음 (60점 미만)</div>
              </div>
            </div>
          </div>

          {/* 우선순위 랭킹 */}
          <div className="side-col">
            <div className="card prio">
              <div className="card-head" style={{ flexDirection: 'column', alignItems: 'stretch', gap: 10 }}>
                <div style={{ minWidth: 0 }}>
                  <h2 className="card-head__title">투자·보강 우선순위</h2>
                  <p className="card-head__sub prio-cond">조회 조건 · {period.replace('최근', '최근 ')} · 제주 전체 · 우선순위 {risk} · 결과 {visibleLots.length}개소</p>
                  <p className="card-head__sub">종합점수 기준 : {weightLine}{isDefaultW(appliedW) ? '' : ' (조정됨)'}</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0, justifyContent: 'flex-end' }}>
                  {/* 분석 계수 조정 — 종합점수 가중치 + 분석 계수 (다른 분석 화면과 동일 패턴) */}
                  <div ref={advRef} style={{ position: 'relative', flexShrink: 0 }}>
                    <button
                      className="btn"
                      type="button"
                      style={{
                        height: 36, padding: '0 var(--space-12)', fontSize: 'var(--label2-size)', display: 'inline-flex', alignItems: 'center', gap: 6,
                        ...(advOpen && { borderColor: 'var(--primary-normal)', color: 'var(--primary-normal)', background: 'rgba(59,112,247,0.08)' }),
                      }}
                      aria-expanded={advOpen}
                      onClick={(e) => { e.stopPropagation(); openAdv(); }}
                    >
                      분석 계수 조정
                      <svg viewBox="0 0 12 12" width="10" height="10" aria-hidden="true"
                        style={{ transform: advOpen ? 'rotate(180deg)' : 'none', transition: 'transform .15s' }}>
                        <path d="M2.5 4.5 6 8l3.5-3.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </button>
                    {advOpen && createPortal(
                      <div
                        ref={popRef}
                        role="dialog" aria-label="분석 계수 조정"
                        style={{
                          position: 'fixed', top: popPos.top, left: popPos.left, zIndex: 3000,
                          width: 340, maxHeight: 'min(560px, calc(100vh - 24px))', display: 'flex', flexDirection: 'column',
                          overflow: 'hidden', background: 'var(--card-bg)',
                          border: '1px solid var(--line-normal)', borderRadius: 12,
                          boxShadow: '0 12px 32px rgba(23,23,25,0.18)',
                        }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-strong)', padding: '16px 16px 10px', flexShrink: 0 }}>분석 계수 조정</div>

                        {/* 가운데 스크롤 영역 */}
                        <div className="coeff-scroll">
                        {/* 종합점수 가중치 (합계 100%) */}
                        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-neutral)', marginBottom: 2 }}>종합점수 가중치 (합계 100%)</div>
                        <div style={{ fontSize: 10.5, color: 'var(--text-alternative)', marginBottom: 8 }}>위에서 조정하면 아래 항목이 자동 재분배됩니다 (마지막 항목 자동).</div>
                        {INVEST_WEIGHTS.map(({ key, label }, idx) => {
                          const last = idx === INVEST_WEIGHTS.length - 1;
                          return (
                            <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, marginBottom: 8 }}>
                              <span style={{ width: 64 }}>{label}</span>
                              <input type="range" min="0" max="100" step="5" value={draftW[key]}
                                disabled={last}
                                onChange={(e) => setDraftW((w) => adjustInvestWeights(w, idx, Number(e.target.value)))}
                                style={{ flex: 1, opacity: last ? 0.5 : 1 }} aria-label={`${label} 가중치`} />
                              <b style={{ width: 36, textAlign: 'right' }}>{draftW[key]}%</b>
                            </div>
                          );
                        })}

                        {/* 분석 계수 */}
                        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-neutral)', margin: '4px 0 8px', paddingTop: 12, borderTop: '1px solid var(--line-alternative)' }}>분석 계수</div>
                        {INVEST_COEFFS.map((c) => (
                          <div key={c.key} style={{ marginBottom: 12 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
                              <span style={{ flex: 1 }}>{c.label}</span>
                              <input type="range" min={c.min} max={c.max} step={c.step} value={draftC[c.key]}
                                onChange={(e) => setDraftC((o) => ({ ...o, [c.key]: Number(e.target.value) }))}
                                style={{ width: 96 }} aria-label={`${c.label} 계수`} />
                              <b style={{ width: 48, textAlign: 'right' }}>{fmtCoeff(draftC[c.key])}{c.unit && ` ${c.unit}`}</b>
                            </div>
                            {c.hint && <div style={{ fontSize: 10.5, color: 'var(--text-alternative)', marginTop: 2 }}>{c.hint}</div>}
                            <div style={{ fontSize: 10.5, color: 'var(--text-assistive)', marginTop: 2 }}>범위 {fmtCoeff(c.min)} ~ {fmtCoeff(c.max)} · 기본값 {fmtCoeff(c.def)}</div>
                          </div>
                        ))}
                        </div>

                        {/* 하단 고정 푸터 */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderTop: '1px solid var(--line-alternative)', flexShrink: 0, background: 'var(--card-bg)' }}>
                          <button type="button"
                            onClick={() => { setDraftW(INVEST_DEFAULT_W); setDraftC(investDefaultCoeffs()); }}
                            style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontSize: 12, color: 'var(--text-alternative)', textDecoration: 'underline' }}>
                            기본값
                          </button>
                          <button type="button"
                            style={{ height: 28, padding: '0 14px', fontSize: 12, fontWeight: 600, border: 'none', borderRadius: 6, cursor: 'pointer', background: 'var(--primary-normal)', color: '#fff' }}
                            onClick={() => { setAppliedW(draftW); setAppliedC(draftC); setAdvOpen(false); }}>
                            적용
                          </button>
                        </div>
                      </div>,
                      document.body
                    )}
                  </div>
                  <div className="sim-export" ref={exportRef}>
                    <button className="btn" type="button" style={{ height: 36, padding: '0 var(--space-12)', fontSize: 'var(--label2-size)' }}
                      aria-haspopup="menu" aria-expanded={exportOpen}
                      onClick={(e) => { e.stopPropagation(); setExportOpen((o) => !o); }}>
                      <Icon name="download" size={16} /> 내보내기
                    </button>
                    {exportOpen && (
                      <div className="sim-export__menu" role="menu">
                        <button type="button" role="menuitem" className="sim-export__item"
                          onClick={() => { setExportOpen(false); exportSectionsPdf(exportData()); }}>
                          PDF 파일 (.pdf)
                        </button>
                        <button type="button" role="menuitem" className="sim-export__item"
                          onClick={() => { setExportOpen(false); exportInvestXlsx(LOTS, { period: period.replace('최근', '최근 '), weights: apW, coeffs: appliedC }); }}>
                          Excel 파일 (.xlsx)
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              {isAdjusted && (
                <div style={{
                  margin: '6px 0 12px', padding: '8px 12px', borderRadius: 8, fontSize: 12,
                  background: 'rgba(59,112,247,0.08)', color: 'var(--primary-normal)',
                  display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8,
                }}>
                  <span>
                    {!isDefaultW(appliedW) && <>적용 가중치 : {weightLine}</>}
                    {!isDefaultW(appliedW) && changedCoeffs.length > 0 && <br />}
                    {changedCoeffs.length > 0 && <>적용 계수 : {changedCoeffs.map((c) => `${c.label} ${fmtCoeff(c.def)}→${fmtCoeff(appliedC[c.key])}`).join(' · ')}</>}
                  </span>
                  <button type="button" onClick={resetAll}
                    style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontSize: 12, color: 'inherit', textDecoration: 'underline', flexShrink: 0 }}>
                    초기화
                  </button>
                </div>
              )}
              <div className="prio-list" ref={listRef}>
                {visibleLots.length === 0 && (
                  <div className="alert-empty" style={{ padding: 'var(--space-24)' }}>조회 조건에 해당하는 주차장이 없습니다.</div>
                )}
                {visibleLots.map((lot) => {
                  const t = TIER[lot.tier];
                  return (
                    <div
                      key={lot.rank}
                      className={`prio-row${activeRank === lot.rank ? ' is-active' : ''}`}
                      ref={(el) => (rowRefs.current[lot.rank - 1] = el)}
                      onClick={() => handleRowClick(lot.rank)}
                    >
                      <span className="prio-row__rank">{lot.rank}</span>
                      <div className="prio-row__body">
                        <div className="prio-row__name"><span className="dot" style={{ background: t.cssVar }} />{lot.name}</div>
                        <div className="prio-row__meta">종합점수 {lot.score}</div>
                      </div>
                      <span className={`badge ${t.badge}`}>{t.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
