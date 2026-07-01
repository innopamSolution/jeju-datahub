import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import Icon from '../components/Icon';

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

const RANKING = [
  { rank: 1,  name: '연동 대로변',           dotColor: 'var(--red-50)',    score: '90점', sub: '민원 건수 51건 · 단속 32건' },
  { rank: 2,  name: '제주도청 인근',          dotColor: 'var(--red-50)',    score: '87점', sub: '민원 건수 48건 · 단속 30건' },
  { rank: 3,  name: '신광초등학교 주변',      dotColor: 'var(--red-50)',    score: '85점', sub: '민원 건수 45건 · 단속 28건' },
  { rank: 4,  name: '제주공항 인근',          dotColor: 'var(--orange-50)', score: '75점', sub: '불법주차 16 · 기타 5' },
  { rank: 5,  name: '동문시장 주변',          dotColor: 'var(--orange-50)', score: '72점', sub: '불법주차 14 · 기타 4' },
  { rank: 6,  name: '동문시장 주변',          dotColor: 'var(--orange-50)', score: '70점', sub: '불법주차 14 · 기타 4' },
  { rank: 7,  name: '동문시장 주변',          dotColor: 'var(--orange-50)', score: '68점', sub: '불법주차 14 · 기타 4' },
  { rank: 8,  name: '한림해수욕장 근처',      dotColor: 'var(--orange-50)', score: '65점', sub: '불법주차 12 · 기타 6' },
  { rank: 9,  name: '서귀포 올레시장 인근',   dotColor: 'var(--blue-50)',   score: '60점', sub: '불법주차 9 · 기타 6' },
  { rank: 10, name: '이중섭 거리 주변',       dotColor: 'var(--blue-50)',   score: '55점', sub: '불법주차 7 · 기타 6' },
  { rank: 11, name: '한라산 국립공원 입구',   dotColor: 'var(--green-50)',  score: '35점', sub: '불법주차 8 · 기타 3' },
  { rank: 12, name: '삼성혈 인근',            dotColor: 'var(--green-50)',  score: '32점', sub: '불법주차 6 · 기타 3' },
  { rank: 13, name: '용담 해안도로 주변',     dotColor: 'var(--green-50)',  score: '28점', sub: '불법주차 4 · 기타 3' },
];

const CLUSTERS = [
  { name: '노형사거리',      c: [33.4790, 126.4760], rank: 1, region: '노형동', badge: 'severe',  complaints: 51, enforce: 32 },
  { name: '연동대로변',      c: [33.4866, 126.4900], rank: 2, region: '연동',   badge: 'severe',  complaints: 48, enforce: 30 },
  { name: '이도2동 상업지구', c: [33.4995, 126.5320], rank: 3, region: '이도동', badge: 'warn',    complaints: 45, enforce: 28 },
  { name: '제주공항 인근',   c: [33.5070, 126.4930], rank: 4, region: '용담동', badge: 'warn',    complaints: 38, enforce: 24 },
  { name: '동문시장 주변',   c: [33.5130, 126.5270], rank: 5, region: '일도동', badge: 'warn',    complaints: 34, enforce: 22 },
  { name: '아라동 주변',     c: [33.4560, 126.5470], rank: 6, region: '아라동', badge: 'caution', complaints: 30, enforce: 20 },
];

const BADGE_COLOR = { severe: 'var(--red-50)', warn: 'var(--orange-50)', caution: 'var(--blue-50)', good: 'var(--green-50)' };
const BADGE_TEXT  = { severe: '심각', warn: '경고', caution: '주의', good: '양호' };

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
  const mapRef    = useRef(null);
  const mapInst   = useRef(null);
  const markerMap = useRef({});
  const rowRefs   = useRef([]);
  const bodyRef   = useRef(null);
  const [period, setPeriod]     = useState('직접설정');
  const [showResult, setShowResult] = useState(true);
  const [activeRank, setActiveRank] = useState(null);

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

    CLUSTERS.forEach(cl => {
      const fill = resolveColor(BADGE_COLOR[cl.badge]);
      const icon = L.divIcon({
        className: 'cmk',
        iconSize: [44, 56],
        iconAnchor: [22, 54],
        html: makePinHtml(cl.rank, fill, cl.name),
      });
      const badgeLabel = BADGE_TEXT[cl.badge];
      const popup = `<div class="gp">
        <div class="gp__h">
          <span class="badge badge--${cl.badge}">${badgeLabel}</span>
          <span class="gp__loc">${cl.region}</span>
        </div>
        <div class="gp__big">${cl.name}</div>
        <div class="gp__bd"><span>민원건수 <b>${cl.complaints}건</b></span><span>단속 <b>${cl.enforce}건</b></span></div>
      </div>`;
      const m = L.marker(cl.c, { icon, riseOnHover: true })
        .bindPopup(popup, { closeButton: false, offset: [0, -48] })
        .addTo(map);
      m.on('click', () => setActiveRow(cl.rank));
      m.on('popupopen', () => setActiveRow(cl.rank));
      markerMap.current[cl.rank] = m;
    });

    setTimeout(() => map.invalidateSize(), 250);
    window.addEventListener('resize', () => map.invalidateSize());
    mapInst.current = map;
  }, []);

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
          <h1 className="page-title">집중 구역 분석</h1>
          <p className="page-sub">불법 주차 집중 구역 자동 도출</p>
        </div>
        <div className="topbar__actions">
          <button className="btn btn--ai" type="button">{AI_ICON} AI 대화 시작하기</button>
          <button className="btn" type="button"><Icon name="download" size={20} /> 내보내기</button>
          <button className="bell" type="button" aria-label="알림"><Icon name="bell" size={22} /><span className="bell__badge">3</span></button>
        </div>
      </header>

      <div className="content content--analysis">
        <section className="sim-stage">
          <div ref={mapRef} style={{ position: 'absolute', inset: 0, zIndex: 0 }} />

          {/* 왼쪽 설정 패널 */}
          <div className="card sim-panel sim-panel--left">
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
                {['최근1개월', '최근3개월', '최근6개월', '직접설정'].map(p => (
                  <button key={p} className={period === p ? 'is-active' : ''} onClick={() => setPeriod(p)}>{p}</button>
                ))}
              </div>
              {period === '직접설정' && (
                <div className="field__dates">
                  <span className="field__date">2026-01-01 <Icon name="calendar" size={16} /></span>
                  <span className="field__tilde">~</span>
                  <span className="field__date">2026-05-31 <Icon name="calendar" size={16} /></span>
                </div>
              )}
            </div>

            <button className="btn-run" type="button" onClick={() => setShowResult(true)}>▷ 집중 구역 분석 실행</button>
          </div>

          {/* 오른쪽 결과 패널 */}
          {showResult && (
            <div className="sim-result">
              <div className="sim-result__top">
                <button className="sim-result__x" aria-label="뒤로가기"><Icon name="chevron-left" size={22} /></button>
                <button className="sim-result__x" aria-label="닫기" onClick={() => setShowResult(false)}><Icon name="close" size={22} /></button>
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
              <div className="row"><span className="dot" style={{ background: 'var(--green-50)' }} />양호 (40점 미만)</div>
            </div>
          </div>

        </section>
      </div>
    </>
  );
}
