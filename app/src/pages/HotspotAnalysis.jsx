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
import { exportHotspotPdf, exportHotspotDocx } from '../utils/hotspotExport';

const AI_ICON = (
  <svg viewBox="0 0 36 36" fill="none" width="24" height="24" aria-hidden="true" style={{ flexShrink: 0 }}>
    <path d="M18.6 8.4c0-2.6 2.1-4.6 4.7-4.6 0 2.6-2.1 4.6-4.7 4.6Z" fill="#3DA35D" />
    <circle cx="18" cy="21" r="12.5" fill="#F79009" />
    <circle cx="13.6" cy="19.6" r="1.4" fill="#4A3415" opacity="0.85" />
    <circle cx="22.4" cy="19.6" r="1.4" fill="#4A3415" opacity="0.85" />
    <path d="M14.9 24.2a3.9 3.9 0 0 0 6.2 0" stroke="#4A3415" strokeWidth="1.3" strokeLinecap="round" fill="none" opacity="0.85" />
  </svg>
);

/* 순위 목록과 지도 마커가 같은 데이터를 공유한다 — 행 선택 시 해당 좌표로 지도 확대·이동 */
const RANKING = [
  { rank: 1,  name: '연동 대로변',           region: '연동',     c: [33.4866, 126.4900], dotColor: 'var(--red-50)',    score: '90점', sub: '민원 건수 51건 · 단속 32건' },
  { rank: 2,  name: '제주도청 인근',          region: '연동',     c: [33.4890, 126.4985], dotColor: 'var(--red-50)',    score: '87점', sub: '민원 건수 48건 · 단속 30건' },
  { rank: 3,  name: '신광초등학교 주변',      region: '연동',     c: [33.4930, 126.4815], dotColor: 'var(--red-50)',    score: '85점', sub: '민원 건수 45건 · 단속 28건' },
  { rank: 4,  name: '제주공항 인근',          region: '용담동',   c: [33.5070, 126.4930], dotColor: 'var(--orange-50)', score: '75점', sub: '불법주차 16 · 기타 5' },
  { rank: 5,  name: '동문시장 주변',          region: '일도동',   c: [33.5128, 126.5273], dotColor: 'var(--orange-50)', score: '72점', sub: '불법주차 14 · 기타 4' },
  { rank: 6,  name: '동문시장 주변',          region: '일도동',   c: [33.5140, 126.5296], dotColor: 'var(--orange-50)', score: '70점', sub: '불법주차 14 · 기타 4' },
  { rank: 7,  name: '동문시장 주변',          region: '일도동',   c: [33.5112, 126.5252], dotColor: 'var(--orange-50)', score: '68점', sub: '불법주차 14 · 기타 4' },
  { rank: 8,  name: '한림해수욕장 근처',      region: '한림읍',   c: [33.4140, 126.2692], dotColor: 'var(--orange-50)', score: '65점', sub: '불법주차 12 · 기타 6' },
  { rank: 9,  name: '서귀포 올레시장 인근',   region: '서귀포시', c: [33.2500, 126.5630], dotColor: 'var(--orange-50)', score: '60점', sub: '불법주차 9 · 기타 6' },
  { rank: 10, name: '이중섭 거리 주변',       region: '서귀포시', c: [33.2465, 126.5655], dotColor: 'var(--blue-50)',   score: '55점', sub: '불법주차 7 · 기타 6' },
  { rank: 11, name: '한라산 국립공원 입구',   region: '오등동',   c: [33.4335, 126.5490], dotColor: 'var(--blue-50)',   score: '52점', sub: '불법주차 8 · 기타 3' },
  { rank: 12, name: '삼성혈 인근',            region: '이도동',   c: [33.5052, 126.5295], dotColor: 'var(--blue-50)',   score: '47점', sub: '불법주차 6 · 기타 3' },
  { rank: 13, name: '용담 해안도로 주변',     region: '용담동',   c: [33.5162, 126.5118], dotColor: 'var(--blue-50)',   score: '43점', sub: '불법주차 4 · 기타 3' },
];

const DOT_BADGE = { 'var(--red-50)': 'severe', 'var(--orange-50)': 'warn', 'var(--blue-50)': 'caution' };
const BADGE_TEXT = { severe: '심각', warn: '경고', caution: '주의' };

function makePinHtml(rank, fillColor, name) {
  const pin = `<svg class="cmk__flag" width="44" height="56" viewBox="0 0 44 56" fill="none">
    <path d="M22 54 C22 54 39 33 39 19 A17 17 0 1 0 5 19 C5 33 22 54 22 54 Z" fill="${fillColor}" stroke="#fff" stroke-width="2.5"/>
    <circle cx="22" cy="19" r="12.5" fill="rgba(255,255,255,0.92)"/>
    <text x="22" y="19" text-anchor="middle" dominant-baseline="central" font-family="'Pretendard',sans-serif" font-size="16" font-weight="800" fill="${fillColor}">${rank}</text>
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
  const [period, setPeriod]     = useState('직접설정');
  const [city, setCity]         = useState('전체');
  const [dong, setDong]         = useState('전체');
  const [showResult, setShowResult] = useState(true);
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

    RANKING.forEach((r) => {
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

    setTimeout(() => map.invalidateSize(), 250);
    window.addEventListener('resize', () => map.invalidateSize());
    mapInst.current = map;
  }, []);

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
          <div className="card sim-panel sim-panel--left">
            <h2 className="sim-panel__title">불법 주차 집중 구역 분석 설정</h2>


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

            <button className="btn-run" type="button" onClick={() => setShowResult(true)}>▷ 집중 구역 분석 실행</button>
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
                        onClick={() => { setExportOpen(false); exportHotspotPdf(RANKING); }}>
                        PDF 파일 (.pdf)
                      </button>
                      <button type="button" role="menuitem" className="sim-export__item"
                        onClick={() => { setExportOpen(false); exportHotspotDocx(RANKING); }}>
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
                  <h3 className="sim-sec__title">불법 주차 집중 구역 순위</h3>
                  <p className="sim-sec__sub">종합점수 기준 : 민원 건수 60% / 단속 40%</p>
                  <div className="rl">
                    {RANKING.map((r, i) => (
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
