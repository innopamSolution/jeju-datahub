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
import { exportSectionsPdf, exportSectionsDocx, hBarChartHtml } from '../utils/pageExport';

const AI_ICON = (
  <svg viewBox="0 0 36 36" fill="none" width="24" height="24" aria-hidden="true" style={{ flexShrink: 0 }}>
    <path d="M18.6 8.4c0-2.6 2.1-4.6 4.7-4.6 0 2.6-2.1 4.6-4.7 4.6Z" fill="#3DA35D" />
    <circle cx="18" cy="21" r="12.5" fill="#F79009" />
    <circle cx="13.6" cy="19.6" r="1.4" fill="#4A3415" opacity="0.85" />
    <circle cx="22.4" cy="19.6" r="1.4" fill="#4A3415" opacity="0.85" />
    <path d="M14.9 24.2a3.9 3.9 0 0 0 6.2 0" stroke="#4A3415" strokeWidth="1.3" strokeLinecap="round" fill="none" opacity="0.85" />
  </svg>
);



const BADGE_COLOR = { severe: 'var(--red-50)', warn: 'var(--orange-50)', caution: 'var(--blue-50)' };
const BADGE_TEXT  = { severe: '매우높음', warn: '높음', caution: '보통' };

/* ── 요금제 적용: 후보 = 선택 지역의 무료 공영주차장 중 20면 이상.
   순위 = 조회 기간 배정 민원 많은 순(동률 시 면수 순). 증가율은 참고 지표('—'는 직전 기간 10건 미만) ── */
const FEE_CANDIDATES_RAW = [
  { name: '연동공영주차장',     c: [33.4866, 126.4900], spaces: 95,  cnt: 46, rate: '+18%' },
  { name: '노형공영주차장',     c: [33.4790, 126.4760], spaces: 120, cnt: 41, rate: '+12%' },
  { name: '이도공영주차장',     c: [33.4995, 126.5320], spaces: 140, cnt: 33, rate: '—' },
  { name: '삼도1동공영주차장',  c: [33.5120, 126.5180], spaces: 80,  cnt: 29, rate: '+9%' },
  { name: '아라동공영주차장',   c: [33.4560, 126.5470], spaces: 64,  cnt: 24, rate: '—' },
  { name: '화북공영주차장',     c: [33.5170, 126.5700], spaces: 52,  cnt: 19, rate: '+6%' },
  { name: '일도2동공영주차장',  c: [33.5100, 126.5350], spaces: 44,  cnt: 15, rate: '—' },
  { name: '외도공영주차장',     c: [33.4940, 126.4310], spaces: 38,  cnt: 12, rate: '+4%' },
  { name: '도두공영주차장',     c: [33.5080, 126.4660], spaces: 30,  cnt: 9,  rate: '—' },
  { name: '삼양공영주차장',     c: [33.5230, 126.5850], spaces: 24,  cnt: 7,  rate: '—' },
];
/* 전환 검토 우선순위 등급: 상위 25% 높음(빨강) / ~50% 중간(주황) / 나머지 낮음(파랑) */
const FEE_CANDIDATES = [...FEE_CANDIDATES_RAW]
  .sort((a, b) => b.cnt - a.cnt || b.spaces - a.spaces)
  .map((x, i, arr) => {
    const q = (i + 1) / arr.length;
    const grade = q <= 0.25 ? 'high' : q <= 0.5 ? 'mid' : 'low';
    return { ...x, rank: i + 1, grade };
  });
const FEE_GRADE = {
  high: { label: '높음', color: 'var(--red-50)' },
  mid:  { label: '중간', color: 'var(--orange-50)' },
  low:  { label: '낮음', color: 'var(--blue-50)' },
};
/* 범례 구간: 등급 경계의 실제 배정 민원 값 */
const FEE_CUTS = (() => {
  const highMin = Math.min(...FEE_CANDIDATES.filter((x) => x.grade === 'high').map((x) => x.cnt));
  const midMin  = Math.min(...FEE_CANDIDATES.filter((x) => x.grade === 'mid').map((x) => x.cnt));
  return { highMin, midMin };
})();
/* 후보 아님 예시(지도 참고 표시용): 유료이거나 20면 미만 */
const FEE_NON_CANDIDATES = [
  { name: '동문시장 공영주차장', c: [33.5130, 126.5270], reason: '유료 주차장' },
  { name: '용담 소형 공영주차장', c: [33.5110, 126.5050], reason: '20면 미만 (14면)' },
];
const FEE_NOTES = [
  '후보는 선택 지역의 무료 공영주차장 중 면수 20면 이상인 곳입니다.',
  '주차 민원 1건을 배정 범위(300m) 안에서 가장 가까운 후보 주차장 1곳에만 배정합니다(같은 읍면동 안에서만).',
  '순위는 조회 기간 전체의 배정 민원이 많은 순이며, 같으면 면수가 많은 순입니다.',
  '민원 증가율은 직전 같은 기간과 비교한 참고 지표이며 순위에는 쓰지 않습니다.',
  "증가율 '—'는 직전 93일(약 3개월) 배정 민원이 10건 미만이어서 계산하지 않은 것입니다 — 분모가 작으면 몇 건 늘어난 것이 수백 %로 보입니다.",
  '배정 범위(300m)를 바꾸면 순위가 달라집니다.',
];

/* ── 공유주차제 적용: 읍면동 단위 '검토 지수' 산정 ──
   검토 지수 = min(월평균 주차 민원 ÷ 50건, 공영 100면당 월 민원 ÷ 7건)
   표시 순서 = 추세 반영 지수(검토 지수 × 증가계수 0.5~1.5), 검토 지수 1 이상 우선. 등급은 검토 지수 기준 */
const SHARE_REGIONS_RAW = [
  /* name, 월평균 주차 민원(건), 공영 주차면수(면), 민원 증가율(직전 동기간 대비, null=직전 10건 미만), 공한지 제외 시 기준 초과 여부, 좌표 */
  { name: '아라동', monthly: 58, supply: 640, growth: 0.24, vacantFlag: false, c: [33.4560, 126.5470] },
  { name: '연동',   monthly: 52, supply: 700, growth: 0.18, vacantFlag: false, c: [33.4866, 126.4900] },
  { name: '노형동', monthly: 48, supply: 820, growth: 0.12, vacantFlag: true,  c: [33.4790, 126.4760] },
  { name: '이도동', monthly: 44, supply: 560, growth: null, vacantFlag: true,  c: [33.4995, 126.5320] },
  { name: '삼도동', monthly: 31, supply: 380, growth: 0.09, vacantFlag: false, c: [33.5120, 126.5180] },
  { name: '화북동', monthly: 26, supply: 300, growth: null, vacantFlag: false, c: [33.5170, 126.5700] },
  { name: '외도동', monthly: 19, supply: 410, growth: 0.04, vacantFlag: false, c: [33.4940, 126.4310] },
  { name: '애월읍', monthly: 14, supply: 520, growth: null, vacantFlag: false, c: [33.4630, 126.3310] },
];
const SHARE_REGIONS = SHARE_REGIONS_RAW.map((r) => {
  const per100 = r.monthly / r.supply * 100;                       // 공영 100면당 월 민원
  const idx1 = r.monthly / 50;                                    // 월평균 민원 ÷ 50건
  const idx2 = per100 / 7;                                        // 100면당 월 민원 ÷ 7건
  const review = Math.min(idx1, idx2);                            // 검토 지수
  const growthClamped = r.growth === null ? null : Math.max(-1, Math.min(1, r.growth));
  const factor = growthClamped === null ? 1 : 1 + 0.5 * growthClamped; // 증가계수 0.5~1.5
  const trend = review * factor;                                  // 추세 반영 지수
  const grade = review >= 1 ? 'high' : review >= 0.7 ? 'mid' : 'low';
  return { ...r, per100, review, factor, trend, grade };
}).sort((a, b) => {
  const aOver = a.review >= 1 ? 1 : 0, bOver = b.review >= 1 ? 1 : 0;
  if (aOver !== bOver) return bOver - aOver;                      // 검토 지수 1 이상 우선
  return b.trend - a.trend;                                       // 추세 반영 지수 순
}).map((r, i) => ({ ...r, rank: i + 1 }));
const SHARE_GRADE = {
  high: { label: '높음', color: 'var(--red-50)', badge: 'badge--severe' },
  mid:  { label: '중간', color: 'var(--orange-50)', badge: 'badge--warn' },
  low:  { label: '낮음', color: 'var(--blue-50)', badge: 'badge--caution' },
};
const SHARE_NOTES = [
  '검토 지수 = (월평균 주차 민원 ÷ 50건)과 (공영 100면당 월 민원 ÷ 7건) 중 작은 값',
  '월평균 민원 = 조회 기간 민원 ÷ 개월 수 (조회 기간이 걸친 달별로 일수 비율을 더한 값, 온전한 달은 1개월)',
  '표시 순서 = 추세 반영 지수(검토 지수 × 증가계수 0.5~1.5) 순 — 검토 지수 1 이상인 읍면동 우선. 등급은 검토 지수 기준',
  "증가계수 = 1 + 0.5 × 민원 증가율(±100%에서 자름). 직전 기간 민원 10건 미만이면 계산하지 않고 계수 1 — 직전 기간 데이터가 없어 조회 기간을 반으로 갈라 비교(최근 121일 ↔ 이전 121일)",
  '번호는 표시 순서이며 우선순위가 아닙니다. 검토 지수·등급은 기준을 넘은 정도이며 공유주차 적합도나 사업 우선순위가 아닙니다',
  "'공한지를 빼면 후보' 배지: 공한지 주차장을 공급에서 빼면 두 기준을 모두 초과 (검토 지수 1 미만 읍면동에만 표시)",
];

const MODE_TITLES = {
  '요금제 적용':   '요금제 적용 추천 구역 순위',
  '공유주차제 적용': '공유주차제 적용 검토 지역',
};

function resolveColor(cssVar) {
  const probe = document.createElement('span');
  probe.style.cssText = 'position:absolute;left:-9999px;top:-9999px';
  probe.style.color = cssVar;
  document.body.appendChild(probe);
  const c = getComputedStyle(probe).color;
  document.body.removeChild(probe);
  return c;
}

function makePinHtml(rank, fillColor, name) {
  const pin = `<svg class="cmk__flag" width="44" height="56" viewBox="0 0 44 56" fill="none">
    <path d="M22 54 C22 54 39 33 39 19 A17 17 0 1 0 5 19 C5 33 22 54 22 54 Z" fill="${fillColor}" stroke="#fff" stroke-width="2.5"/>
    <circle cx="22" cy="19" r="12.5" fill="rgba(255,255,255,0.92)"/>
    <text x="22" y="19" text-anchor="middle" dominant-baseline="central" font-family="'Pretendard',sans-serif" font-size="12" font-weight="800" fill="${fillColor}">${rank}</text>
  </svg>`;
  return pin + `<span class="cmk__lab">${name}</span>`;
}

export default function ZoneRecommendation() {
  const navigate = useNavigate();
  const mapRef    = useRef(null);
  const mapInst   = useRef(null);
  const markerMap = useRef({});
  const rowRefs   = useRef([]);
  const bodyRef   = useRef(null);
  const [period, setPeriod]       = useState('직접설정');
  const [city, setCity]           = useState('전체');
  const [dong, setDong]           = useState('전체');
  const [mode, setMode]           = useState('요금제 적용');
  const [showResult, setShowResult] = useState(true);
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

  const exportData = () => (mode === '요금제 적용' ? {
    fileBase: '요금제적용_추천',
    title: MODE_TITLES[mode],
    subtitle: '무료 공영주차장(20면 이상) · 배정 민원 많은 순, 동률 시 면수 순 · 배정 범위 300m',
    sections: [
      {
        type: 'chart',
        title: '후보 주차장별 배정 민원 건수',
        html: hBarChartHtml(FEE_CANDIDATES.map((r) => ({
          label: r.name, value: r.cnt, valueLabel: `${r.cnt}건`, color: FEE_GRADE[r.grade].color,
        }))),
      },
      {
        type: 'table',
        title: '요금제 적용 추천 순위',
        columns: ['순위', '주차장', '면수', '배정 민원', '민원 증가율(참고)', '우선순위'],
        rows: FEE_CANDIDATES.map((r) => [r.rank, r.name, `${r.spaces}면`, `${r.cnt}건`, r.rate, FEE_GRADE[r.grade].label]),
      },
    ],
  } : {
    fileBase: '공유주차제_검토',
    title: MODE_TITLES[mode],
    subtitle: '읍·면·동 검토 지수 — 추세 반영 지수 순 (검토 지수 1 이상 우선) · 번호는 표시 순서',
    sections: [
      {
        type: 'chart',
        title: '읍·면·동별 검토 지수',
        html: hBarChartHtml(SHARE_REGIONS.map((r) => ({
          label: r.name, value: Math.round(r.review * 100), valueLabel: r.review.toFixed(2), color: SHARE_GRADE[r.grade].color,
        }))),
      },
      {
        type: 'table',
        title: '공유주차제 검토 목록',
        columns: ['번호', '읍·면·동', '검토 지수', '추세 반영 지수', '월평균 민원', '100면당 월 민원', '증가계수', '비고'],
        rows: SHARE_REGIONS.map((r) => [r.rank, r.name, r.review.toFixed(2), r.trend.toFixed(2), `${r.monthly}건`, `${r.per100.toFixed(1)}건`, r.factor.toFixed(2), r.review < 1 && r.vacantFlag ? '공한지를 빼면 후보' : '']),
      },
    ],
  });
  const [activeRank, setActiveRank] = useState(null);

  function setActiveRow(rank) {
    setActiveRank(rank);
    const row = rowRefs.current[rank - 1];
    if (row && bodyRef.current) {
      const top = row.offsetTop - bodyRef.current.offsetTop;
      if (top < bodyRef.current.scrollTop || top + row.offsetHeight > bodyRef.current.scrollTop + bodyRef.current.clientHeight) {
        bodyRef.current.scrollTo({ top: top - 8, behavior: 'smooth' });
      }
    }
  }

  const markerLayer = useRef(null);

  useEffect(() => {
    if (mapInst.current) return;
    const map = L.map(mapRef.current, { zoomControl: false, attributionControl: true, zoomSnap: 0.5 }).setView([33.486, 126.512], 13);
    L.control.zoom({ position: 'topright' }).addTo(map);
    map.attributionControl.setPosition('bottomleft');
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, opacity: 0.92, attribution: '© OpenStreetMap' }).addTo(map);
    setTimeout(() => map.invalidateSize(), 250);
    window.addEventListener('resize', () => map.invalidateSize());
    mapInst.current = map;
  }, []);

  /* 분석 내용(모드)에 따라 마커를 다시 그린다 */
  useEffect(() => {
    const map = mapInst.current;
    if (!map) return;
    if (markerLayer.current) map.removeLayer(markerLayer.current);
    const layer = L.layerGroup().addTo(map);
    markerLayer.current = layer;
    markerMap.current = {};

    if (mode === '요금제 적용') {
      FEE_CANDIDATES.forEach((lot) => {
        const g = FEE_GRADE[lot.grade];
        const fill = resolveColor(g.color);
        const icon = L.divIcon({
          className: 'cmk', iconSize: [44, 56], iconAnchor: [22, 54],
          html: makePinHtml(lot.rank, fill, lot.name),
        });
        const badgeCls = { high: 'badge--severe', mid: 'badge--warn', low: 'badge--caution' }[lot.grade];
        const popup = `<div class="gp">
          <div class="gp__h"><span class="badge ${badgeCls}">우선순위 ${g.label}</span></div>
          <div class="gp__big">${lot.name}</div>
          <div class="gp__bd"><span>배정 민원 <b>${lot.cnt}건</b></span><span>면수 ${lot.spaces}면</span></div>
          <div class="gp__bd"><span>민원 증가율(참고) <b>${lot.rate}</b></span></div>
        </div>`;
        const m = L.marker(lot.c, { icon, riseOnHover: true })
          .bindPopup(popup, { closeButton: false, offset: [0, -48] })
          .addTo(layer);
        m.on('click', () => setActiveRow(lot.rank));
        m.on('popupopen', () => setActiveRow(lot.rank));
        markerMap.current[lot.rank] = m;
      });
      /* 후보 아님(유료·20면 미만)은 회색 P로 참고 표시 */
      FEE_NON_CANDIDATES.forEach((lot) => {
        const icon = L.divIcon({
          className: '', iconSize: [26, 26], iconAnchor: [13, 13],
          html: '<div style="width:26px;height:26px;border-radius:50%;background:#9ea1aa;color:#fff;border:2.5px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,0.25);display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:800">P</div>',
        });
        L.marker(lot.c, { icon })
          .bindPopup(`<div class="gp"><div class="gp__big">${lot.name}</div><div class="gp__bd"><span>후보 아님 — <b>${lot.reason}</b></span></div></div>`, { closeButton: false })
          .addTo(layer);
      });
    } else {
      SHARE_REGIONS.forEach(r => {
        const g = SHARE_GRADE[r.grade];
        const fill = resolveColor(g.color);
        const icon = L.divIcon({
          className: 'cmk', iconSize: [44, 56], iconAnchor: [22, 54],
          html: makePinHtml(r.rank, fill, r.name),
        });
        const popup = `<div class="gp">
          <div class="gp__h"><span class="badge ${g.badge}">검토 ${g.label}</span>${r.review < 1 && r.vacantFlag ? '<span class="badge badge--done">공한지를 빼면 후보</span>' : ''}</div>
          <div class="gp__big">${r.name}</div>
          <div class="gp__bd"><span>검토 지수 <b>${r.review.toFixed(2)}</b></span><span>추세 반영 ${r.trend.toFixed(2)}</span></div>
          <div class="gp__bd"><span>월평균 민원 <b>${r.monthly}건</b></span><span>100면당 ${r.per100.toFixed(1)}건</span></div>
        </div>`;
        const m = L.marker(r.c, { icon, riseOnHover: true })
          .bindPopup(popup, { closeButton: false, offset: [0, -48] })
          .addTo(layer);
        m.on('click', () => setActiveRow(r.rank));
        m.on('popupopen', () => setActiveRow(r.rank));
        markerMap.current[r.rank] = m;
      });
    }
  }, [mode]);

  const handleRowClick = (rank) => {
    setActiveRow(rank);
    const m = markerMap.current[rank];
    if (m && mapInst.current) {
      mapInst.current.panTo(m.getLatLng(), { animate: true, duration: 0.5 });
      m.openPopup();
    }
  };

  return (
    <>
      <header className="topbar">
        <div>
          <PageCrumb group="분석·시뮬레이션" page="구역추천" />
          <h1 className="page-title">요금제·공유주차제 적용 구역 추천</h1>
          <p className="page-sub">민원 증가 추세를 분석하여 최적 구역 자동 추천</p>
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
            <h2 className="sim-panel__title">구역 추천 설정</h2>

            <div className="field">
              <label className="field__label">분석 내용</label>
              <div className="field__select" style={{ cursor: 'pointer' }} onClick={() => setMode(mode === '요금제 적용' ? '공유주차제 적용' : '요금제 적용')}>
                {mode}
                <Icon name="chevron-down" size={18} />
              </div>
            </div>

            <div className="field">
              <label className="field__label">분석 지역</label>
              <RegionSelect city={city} dong={dong} onCityChange={setCity} onDongChange={setDong} />
            </div>

            <div className="field">
              <label className="field__label">분석 기간</label>
              <div className="grid-seg">
                {['최근1개월', '최근3개월', '최근6개월', '직접설정'].map(p => (
                  <button key={p} className={period === p ? 'is-active' : ''} onClick={() => setPeriod(p)}>{p}</button>
                ))}
              </div>
              {period === '직접설정' && (
                <DateRangeField type="month" defaultFrom="2026-01" defaultTo="2026-05" />
              )}
            </div>

            <button className="btn-run" type="button" onClick={() => setShowResult(true)}>▷ 구역 추천 실행</button>
          </div>

          {/* 오른쪽 결과 패널 */}
          {showResult && (
            <div className="sim-result">
              <div className="sim-result__top">
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginLeft: 'auto' }}>
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
                          onClick={() => { setExportOpen(false); exportSectionsDocx(exportData()); }}>
                          Word 파일 (.docx)
                        </button>
                      </div>
                    )}
                  </div>
                  <button className="sim-result__x" aria-label="닫기" onClick={() => setShowResult(false)}><Icon name="close" size={22} /></button>
                </div>
              </div>

              <div className="sim-result__body" ref={bodyRef}>
                <div className="sim-sec">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <h3 className="sim-sec__title" style={{ margin: 0 }}>{MODE_TITLES[mode]}</h3>
                    {/* 산정 기준 참고 팝오버 (모드별 내용) */}
                    <div className="freshness__ic" tabIndex={0} aria-label="산정 기준 안내" style={{ marginLeft: 'auto' }}>
                      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" aria-hidden="true">
                        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
                        <circle cx="12" cy="8" r="1.3" fill="currentColor" />
                        <path d="M12 11.5v5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                      </svg>
                      <div className="freshness__pop freshness__pop--right" role="tooltip">
                        <div className="freshness__pop-title">{mode === '요금제 적용' ? '산정 기준' : '검토 지수 산정 기준'}</div>
                        <ul className="basis-list">
                          {(mode === '요금제 적용' ? FEE_NOTES : SHARE_NOTES).map((n) => <li key={n}>{n}</li>)}
                        </ul>
                      </div>
                    </div>
                  </div>
                  <p className="sim-sec__sub">
                    {mode === '요금제 적용'
                      ? '무료 공영주차장(20면 이상) · 배정 민원 많은 순, 동률 시 면수 순'
                      : '읍·면·동 검토 지수 — 추세 반영 지수 순 (검토 지수 1 이상 우선) · 번호는 표시 순서'}
                  </p>
                  <div className="rl">
                    {mode !== '요금제 적용' && SHARE_REGIONS.map((r, i) => (
                      <div
                        key={r.rank}
                        className={`rl__row${activeRank === r.rank ? ' is-active' : ''}`}
                        ref={el => rowRefs.current[i] = el}
                        style={{ cursor: 'pointer' }}
                        onClick={() => handleRowClick(r.rank)}
                      >
                        <span className="rl__rank">{r.rank}</span>
                        <div className="rl__main">
                          <div className="rl__top">
                            <span className="rl__name">
                              <span className="dot" style={{ background: SHARE_GRADE[r.grade].color }} />
                              {r.name}
                              {r.review < 1 && r.vacantFlag && (
                                <span className="badge badge--done" style={{ marginLeft: 6, fontSize: 10 }}>공한지를 빼면 후보</span>
                              )}
                            </span>
                            <span className="rl__val">
                              <span className="rl__cnt">지수 {r.review.toFixed(2)}</span>
                            </span>
                          </div>
                          <span className="rl__sub">
                            월평균 민원 {r.monthly}건 · 100면당 {r.per100.toFixed(1)}건 · 증가계수 {r.factor.toFixed(2)}{r.growth === null ? ' (증가율 미산정)' : ''}
                          </span>
                        </div>
                      </div>
                    ))}
                    {mode === '요금제 적용' && FEE_CANDIDATES.map((r, i) => (
                      <div
                        key={r.rank}
                        className={`rl__row${activeRank === r.rank ? ' is-active' : ''}`}
                        ref={el => rowRefs.current[i] = el}
                        style={{ cursor: 'pointer' }}
                        onClick={() => handleRowClick(r.rank)}
                      >
                        <span className="rl__rank">{r.rank}</span>
                        <div className="rl__main">
                          <div className="rl__top">
                            <span className="rl__name">
                              <span className="dot" style={{ background: FEE_GRADE[r.grade].color }} />
                              {r.name}
                            </span>
                            <span className="rl__val">
                              <span className="rl__cnt">{r.cnt}건</span>
                            </span>
                          </div>
                          <span className="rl__sub">면수 {r.spaces}면 · 민원 증가율(참고) {r.rate}</span>
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
            {mode === '요금제 적용' ? (
              <div className="map-legend">
                <div className="map-legend__title">우선순위</div>
                <div className="row"><span className="dot" style={{ background: 'var(--red-50)' }} />높음 (배정 민원 {FEE_CUTS.highMin}건 이상)</div>
                <div className="row"><span className="dot" style={{ background: 'var(--orange-50)' }} />중간 ({FEE_CUTS.midMin}~{FEE_CUTS.highMin - 1}건)</div>
                <div className="row"><span className="dot" style={{ background: 'var(--blue-50)' }} />낮음 ({FEE_CUTS.midMin}건 미만)</div>
                <div className="row"><span className="dot" style={{ background: '#9ea1aa' }} />후보 아님 (유료·20면 미만)</div>
              </div>
            ) : (
              <div className="map-legend">
                <div className="map-legend__title">검토 등급 (검토 지수 기준)</div>
                <div className="row"><span className="dot" style={{ background: 'var(--red-50)' }} />높음 (지수 1.0 이상 — 두 기준 초과)</div>
                <div className="row"><span className="dot" style={{ background: 'var(--orange-50)' }} />중간 (0.7~1.0)</div>
                <div className="row"><span className="dot" style={{ background: 'var(--blue-50)' }} />낮음 (0.7 미만)</div>
              </div>
            )}
          </div>
        </section>
      </div>
    </>
  );
}
