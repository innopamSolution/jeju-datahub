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
import { exportHotspotPdf, exportHotspotXlsx } from '../utils/hotspotExport';

const AI_ICON = (
  <svg viewBox="0 0 36 36" fill="none" width="24" height="24" aria-hidden="true" style={{ flexShrink: 0 }}>
    <path d="M18.6 8.4c0-2.6 2.1-4.6 4.7-4.6 0 2.6-2.1 4.6-4.7 4.6Z" fill="#3DA35D" />
    <circle cx="18" cy="21" r="12.5" fill="#F79009" />
    <circle cx="13.6" cy="19.6" r="1.4" fill="#4A3415" opacity="0.85" />
    <circle cx="22.4" cy="19.6" r="1.4" fill="#4A3415" opacity="0.85" />
    <path d="M14.9 24.2a3.9 3.9 0 0 0 6.2 0" stroke="#4A3415" strokeWidth="1.3" strokeLinecap="round" fill="none" opacity="0.85" />
  </svg>
);

/* 순위 목록과 지도 마커가 같은 데이터를 공유한다 — 행 선택 시 해당 좌표로 지도 확대·이동.
   cs/es: 민원·단속 건수를 기준값 대비 점수화한 값(0~100) — 가중합으로 종합점수 산출 */
const ZONES = [
  { name: '연동 대로변',         region: '연동',     c: [33.4866, 126.4900], cs: 96, es: 81, sub: '민원 건수 51건 · 단속 32건' },
  { name: '제주도청 인근',        region: '연동',     c: [33.4890, 126.4985], cs: 93, es: 78, sub: '민원 건수 48건 · 단속 30건' },
  { name: '신광초등학교 주변',    region: '연동',     c: [33.4930, 126.4815], cs: 91, es: 76, sub: '민원 건수 45건 · 단속 28건' },
  { name: '제주공항 인근',        region: '용담동',   c: [33.5070, 126.4930], cs: 81, es: 66, sub: '불법주차 16 · 기타 5' },
  { name: '동문시장 주변',        region: '일도동',   c: [33.5128, 126.5273], cs: 78, es: 63, sub: '불법주차 14 · 기타 4' },
  { name: '이중섭 거리 주변',     region: '서귀포시', c: [33.2465, 126.5655], cs: 61, es: 46, sub: '불법주차 7 · 기타 6' },
  { name: '한라산 국립공원 입구', region: '오등동',   c: [33.4335, 126.5490], cs: 58, es: 43, sub: '불법주차 8 · 기타 3' },
];

/* 화면에는 상위 7개 구역만 노출: 주의(40점) 이상만 표시 (목록·지도 마커·내보내기 공통) */
const TOP_N = 7;
const DEFAULT_WC = 60; // 민원 건수 가중치(%) 기본값 — 단속은 100-WC

function gradeColor(score) {
  if (score >= 80) return 'var(--red-50)';
  if (score >= 60) return 'var(--orange-50)';
  return 'var(--blue-50)';
}

/* 가중치(민원 wC%)에 따라 종합점수·등급·순위를 재산정 */
function computeRanking(wC) {
  const w = wC / 100;
  return ZONES
    .map((z) => {
      const num = Math.round(z.cs * w + z.es * (1 - w));
      return { ...z, num, score: `${num}점`, dotColor: gradeColor(num) };
    })
    .filter((z) => z.num >= 40)
    .sort((a, b) => b.num - a.num)
    .slice(0, TOP_N)
    .map((z, i) => ({ ...z, rank: i + 1 }));
}

/* 설정 > 분석 지표 가중치 설정 > 불법 주차 집중 구역 분석의 '분석 계수' (가중치는 민원/단속 wC로 별도 관리) */
const HOTSPOT_COEFFS = [
  { key: 'compMonthBase', label: '민원 월기준값', min: 1, max: 1000, step: 1, def: 30, unit: '건/월', hint: '월 민원 몇 건을 100점으로 볼지 — 종합점수 = min(월평균/기준값,1)×가중치' },
  { key: 'enfMonthBase',  label: '단속 월기준값', min: 1, max: 1000, step: 1, def: 60, unit: '건/월', hint: '월 단속 몇 건을 100점으로 볼지' },
];
function hotspotDefaultCoeffs() {
  const o = {};
  HOTSPOT_COEFFS.forEach((c) => { o[c.key] = c.def; });
  return o;
}
const fmtCoeff = (v) => (Number.isInteger(v) ? String(v) : String(Math.round(v * 1000) / 1000));

const DOT_BADGE = { 'var(--red-50)': 'severe', 'var(--orange-50)': 'warn', 'var(--blue-50)': 'caution' };
const BADGE_TEXT = { severe: '심각', warn: '경고', caution: '주의' };

function makePinHtml(rank, fillColor, name) {
  const pin = `<svg class="cmk__flag" width="44" height="56" viewBox="0 0 44 56" fill="none">
    <path d="M22 54 C22 54 39 33 39 19 A17 17 0 1 0 5 19 C5 33 22 54 22 54 Z" fill="${fillColor}" stroke="#fff" stroke-width="2.5"/>
    <circle cx="22" cy="19" r="12.5" fill="rgba(255,255,255,0.92)"/>
    <text x="22" y="19" text-anchor="middle" dominant-baseline="central" font-family="'Pretendard',sans-serif" font-size="12" font-weight="800" fill="${fillColor}">${rank}</text>
  </svg>`;
  return pin + `<span class="cmk__lab">${name}</span>`;
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

export default function HotspotAnalysis() {
  const navigate = useNavigate();
  const mapRef    = useRef(null);
  const mapInst   = useRef(null);
  const markerMap = useRef({});
  const rowRefs   = useRef([]);
  const bodyRef   = useRef(null);
  const [period, setPeriod]     = useState('최근1개월');
  const [city, setCity]         = useState('전체');
  const [dong, setDong]         = useState('전체');
  const [showResult, setShowResult] = useState(true);
  const [activeRank, setActiveRank] = useState(null);
  /* 분석식 조정(고급) — 입력값(draft)과 실행 시 적용된 값(applied)을 분리 */
  const [advOpen, setAdvOpen]   = useState(false);
  const advRef = useRef(null);
  useEffect(() => {
    if (!advOpen) return;
    const onDoc = (e) => { if (advRef.current && !advRef.current.contains(e.target)) setAdvOpen(false); };
    const onKey = (e) => { if (e.key === 'Escape') setAdvOpen(false); };
    document.addEventListener('click', onDoc);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('click', onDoc); document.removeEventListener('keydown', onKey); };
  }, [advOpen]);
  const [draftWc, setDraftWc]   = useState(DEFAULT_WC);
  const [appliedWc, setAppliedWc] = useState(DEFAULT_WC);
  /* 분석 계수(민원·단속 월기준값) — 다른 분석 화면과 통일. 목업이라 순위 재계산엔 반영되지 않는 표시용 */
  const [draftC, setDraftC]     = useState(hotspotDefaultCoeffs);
  const [appliedC, setAppliedC] = useState(hotspotDefaultCoeffs);
  const openAdv = () => { setDraftWc(appliedWc); setDraftC(appliedC); setAdvOpen((o) => !o); };
  const resetAdv = () => { setAppliedWc(DEFAULT_WC); setDraftWc(DEFAULT_WC); setAppliedC(hotspotDefaultCoeffs()); setDraftC(hotspotDefaultCoeffs()); };
  const changedCoeffs = HOTSPOT_COEFFS.filter((c) => appliedC[c.key] !== c.def);
  const isAdjusted = appliedWc !== DEFAULT_WC || changedCoeffs.length > 0;
  const ranking = computeRanking(appliedWc);
  const exportMeta = { period: period === '직접설정' ? '2026-01 ~ 2026-05' : period.replace('최근', '최근 '), wc: appliedWc };
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

  function setActiveRow(rank) {
    setActiveRank(rank);
    const rows = rowRefs.current;
    const row  = rows[rank - 1];
    if (row && bodyRef.current) {
      const top = row.offsetTop - bodyRef.current.offsetTop;
      if (top < bodyRef.current.scrollTop || top + row.offsetHeight > bodyRef.current.scrollTop + bodyRef.current.clientHeight) {
        bodyRef.current.scrollTo({ top: top - 8, behavior: 'smooth' });
      }
    }
  }

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

  /* 가중치 적용 결과에 따라 마커 재구성 */
  useEffect(() => {
    const map = mapInst.current;
    if (!map) return;
    Object.values(markerMap.current).forEach((m) => map.removeLayer(m));
    markerMap.current = {};
    ranking.forEach((r) => {
      const badge = DOT_BADGE[r.dotColor] ?? 'caution';
      const fill = resolveColor(r.dotColor);
      const icon = L.divIcon({
        className: 'cmk',
        iconSize: [44, 56],
        iconAnchor: [22, 54],
        html: makePinHtml(r.rank, fill, r.name),
      });
      const popup = `<div class="gp">
        <div class="gp__h">
          <span class="badge badge--${badge}">${BADGE_TEXT[badge]}</span>
          <span class="gp__loc">${r.region}</span>
        </div>
        <div class="gp__big">${r.name}</div>
        <div class="gp__bd"><span>종합점수 <b>${r.score}</b></span><span>${r.sub}</span></div>
      </div>`;
      const m = L.marker(r.c, { icon, riseOnHover: true })
        .bindPopup(popup, { closeButton: false, offset: [0, -48] })
        .addTo(map);
      m.on('click', () => setActiveRow(r.rank));
      m.on('popupopen', () => setActiveRow(r.rank));
      markerMap.current[r.rank] = m;
    });
  }, [appliedWc]);

  /* 목록 행 선택 → 지도를 해당 위치로 확대(줌 15)·중심 이동 후 팝업 표시 */
  const handleRowClick = (rank) => {
    setActiveRow(rank);
    const m = markerMap.current[rank];
    if (m && mapInst.current) {
      mapInst.current.flyTo(m.getLatLng(), 15, { duration: 0.8 });
      mapInst.current.once('moveend', () => m.openPopup());
    }
  };

  return (
    <>
      <header className="topbar">
        <div>
          <PageCrumb group="분석·시뮬레이션" page="불법 주차 집중 구역 분석" />
          <h1 className="page-title">불법 주차 집중 구역 분석</h1>
          <p className="page-sub">불법 주차 집중 구역 자동 도출</p>
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
          <div className="card sim-panel sim-panel--left" style={{ zIndex: advOpen ? 1200 : undefined }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
              <h2 className="sim-panel__title" style={{ margin: 0, fontSize: 16, whiteSpace: 'nowrap' }}>불법 주차 집중 구역 분석 설정</h2>
              <div ref={advRef} style={{ position: 'relative', flexShrink: 0 }}>
                <button
                  className="btn"
                  type="button"
                  style={{
                    height: 30, padding: '0 10px', fontSize: 12, display: 'inline-flex', alignItems: 'center', gap: 6,
                    ...(advOpen && {
                      borderColor: 'var(--primary-normal)', color: 'var(--primary-normal)',
                      background: 'rgba(59,112,247,0.08)',
                    }),
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
                {/* 버튼 오른쪽 팝오버 — 종합점수 가중치 + 분석 계수 (다른 분석 화면과 통일) */}
                {advOpen && (
                  <div
                    role="dialog" aria-label="분석 계수 조정"
                    style={{
                      position: 'absolute', left: 'calc(100% + 10px)', top: -8, zIndex: 1100,
                      width: 320, maxHeight: 460, display: 'flex', flexDirection: 'column', overflow: 'hidden',
                      background: 'var(--card-bg)',
                      border: '1px solid var(--line-normal)', borderRadius: 12,
                      boxShadow: '0 12px 32px rgba(23,23,25,0.18)',
                    }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {/* 헤더 고정 */}
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-strong)', padding: '16px 16px 10px', flexShrink: 0 }}>분석 계수 조정</div>

                    {/* 가운데 스크롤 */}
                    <div className="coeff-scroll">
                      {/* 종합점수 가중치 (합계 100%) */}
                      <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-neutral)', marginBottom: 8 }}>종합점수 가중치 (합계 100%)</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, marginBottom: 8 }}>
                        <span style={{ width: 56 }}>민원 건수</span>
                        <input type="range" min="0" max="100" step="5" value={draftWc}
                          onChange={(e) => setDraftWc(Number(e.target.value))} style={{ flex: 1 }} aria-label="민원 건수 가중치" />
                        <b style={{ width: 36, textAlign: 'right' }}>{draftWc}%</b>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--text-alternative)', marginBottom: 4 }}>
                        <span style={{ width: 56 }}>단속 건수</span>
                        <span style={{ flex: 1 }}>자동 (합계 100%)</span>
                        <b style={{ width: 36, textAlign: 'right' }}>{100 - draftWc}%</b>
                      </div>

                      {/* 분석 계수 */}
                      <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-neutral)', margin: '8px 0', paddingTop: 12, borderTop: '1px solid var(--line-alternative)' }}>분석 계수</div>
                      {HOTSPOT_COEFFS.map((c) => (
                        <div key={c.key} style={{ marginBottom: 12 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
                            <span style={{ flex: 1 }}>{c.label}</span>
                            <input type="range" min={c.min} max={c.max} step={c.step} value={draftC[c.key]}
                              onChange={(e) => setDraftC((o) => ({ ...o, [c.key]: Number(e.target.value) }))}
                              style={{ width: 96 }} aria-label={`${c.label} 계수`} />
                            <b style={{ width: 56, textAlign: 'right' }}>{fmtCoeff(draftC[c.key])} {c.unit}</b>
                          </div>
                          {c.hint && <div style={{ fontSize: 10.5, color: 'var(--text-alternative)', marginTop: 2 }}>{c.hint}</div>}
                          <div style={{ fontSize: 10.5, color: 'var(--text-assistive)', marginTop: 2 }}>범위 {fmtCoeff(c.min)} ~ {fmtCoeff(c.max)} · 기본값 {fmtCoeff(c.def)}</div>
                        </div>
                      ))}
                    </div>

                    {/* 하단 고정 푸터 */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderTop: '1px solid var(--line-alternative)', flexShrink: 0, background: 'var(--card-bg)' }}>
                      <button type="button"
                        onClick={() => { setDraftWc(DEFAULT_WC); setDraftC(hotspotDefaultCoeffs()); }}
                        style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontSize: 12, color: 'var(--text-alternative)', textDecoration: 'underline' }}>
                        기본값
                      </button>
                      <button type="button"
                        style={{ height: 28, padding: '0 14px', fontSize: 12, fontWeight: 600, border: 'none', borderRadius: 6, cursor: 'pointer', background: 'var(--primary-normal)', color: '#fff' }}
                        onClick={() => { setAppliedWc(draftWc); setAppliedC(draftC); setAdvOpen(false); setShowResult(true); setActiveRank(null); }}>
                        적용
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* 기본값에서 변경한 경우에만 타이틀 아래에 적용 값 표시 */}
            {isAdjusted && (
              <div style={{
                margin: '-12px 0 0', padding: '8px 12px', borderRadius: 8, fontSize: 12,
                background: 'rgba(59,112,247,0.08)', color: 'var(--primary-normal)',
                display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8,
              }}>
                <span>
                  {appliedWc !== DEFAULT_WC && <>적용 가중치 : 민원 건수 {appliedWc}% + 단속 건수 {100 - appliedWc}%</>}
                  {appliedWc !== DEFAULT_WC && changedCoeffs.length > 0 && <br />}
                  {changedCoeffs.length > 0 && <>적용 계수 : {changedCoeffs.map((c) => `${c.label} ${fmtCoeff(c.def)}→${fmtCoeff(appliedC[c.key])}`).join(' · ')}</>}
                </span>
                <button type="button"
                  onClick={resetAdv}
                  style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontSize: 12, color: 'inherit', textDecoration: 'underline', flexShrink: 0 }}
                >초기화</button>
              </div>
            )}

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

            <button className="btn-run" type="button" onClick={() => { setShowResult(true); setActiveRank(null); }}>▷ 집중 구역 분석 실행</button>

          </div>

          {/* 오른쪽 결과 패널 */}
          {showResult && (
            <div className="sim-result">
              <div className="sim-result__top">
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginLeft: 'auto' }}>
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
                        onClick={() => { setExportOpen(false); exportHotspotPdf(ranking, exportMeta); }}>
                        PDF 파일 (.pdf)
                      </button>
                      <button type="button" role="menuitem" className="sim-export__item"
                        onClick={() => { setExportOpen(false); exportHotspotXlsx(ranking, exportMeta); }}>
                        Excel 파일 (.xlsx)
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
                    <h3 className="sim-sec__title" style={{ margin: 0 }}>불법 주차 집중 구역 순위</h3>
                    {/* 순위 산정 기준 — 호버 시 안내 팝오버 */}
                    <div className="freshness__ic" tabIndex={0} aria-label="순위 산정 기준 안내" style={{ marginLeft: 'auto' }}>
                      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" aria-hidden="true">
                        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
                        <circle cx="12" cy="8" r="1.3" fill="currentColor" />
                        <path d="M12 11.5v5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                      </svg>
                      <div className="freshness__pop freshness__pop--right" role="tooltip">
                        <div className="freshness__pop-title">순위 산정 기준</div>
                        <ul className="basis-list">
                          <li>구역은 반경 50m 내 3개 지점 이상의 민원·단속 위치를 묶은 것입니다(DBSCAN).</li>
                          <li>종합점수(0~100) = 월평균 민원·단속 건수를 기준값 대비 점수화해 가중합한 값입니다.</li>
                          <li>등급: 심각 80 · 경고 60 · 주의 40점 이상 — 주의 이상 구역만 표시됩니다.</li>
                          <li>가중치·기준값은 설정 &gt; 분석 지표 가중치 설정에서 변경할 수 있습니다(권한 필요).</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                  <p className="sim-sec__sub">
                    분석 기간 : {period === '직접설정' ? '2026-01 ~ 2026-05' : period.replace('최근', '최근 ')}
                    <span aria-hidden="true" style={{ margin: '0 6px', color: 'var(--line-normal)' }}>|</span>
                    종합점수 기준 : 민원 건수 {appliedWc}% / 단속 {100 - appliedWc}%{appliedWc !== DEFAULT_WC ? ' (조정됨)' : ''}
                  </p>
                  <div className="rl">
                    {ranking.map((r, i) => (
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
                              <span className="dot" style={{ background: r.dotColor }} />
                              {r.name}
                            </span>
                            <span className="rl__val"><span className="rl__cnt">{r.score}</span></span>
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
              <div className="map-legend__title">종합점수</div>
              <div className="row"><span className="dot" style={{ background: 'var(--red-50)' }} />심각 (80점 이상)</div>
              <div className="row"><span className="dot" style={{ background: 'var(--orange-50)' }} />경고 (60~79점)</div>
              <div className="row"><span className="dot" style={{ background: 'var(--blue-50)' }} />주의 (40~59점)</div>
            </div>
          </div>

        </section>
      </div>

    </>
  );
}
