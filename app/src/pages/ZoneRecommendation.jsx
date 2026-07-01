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
  { rank: 1,  name: '노형사거리',       dotColor: 'var(--red-50)',    rate: '+52%', cnt: 52 },
  { rank: 2,  name: '연동 대로변',       dotColor: 'var(--red-50)',    rate: '+52%', cnt: 52 },
  { rank: 3,  name: '이도2동 상업지구',  dotColor: 'var(--red-50)',    rate: '+52%', cnt: 52 },
  { rank: 4,  name: '삼도1동 문화거리',  dotColor: 'var(--red-50)',    rate: '+48%', cnt: 48 },
  { rank: 5,  name: '용담 해안도로',     dotColor: 'var(--red-50)',    rate: '+45%', cnt: 45 },
  { rank: 6,  name: '아라동 주택가',     dotColor: 'var(--orange-50)', rate: '+44%', cnt: 44 },
  { rank: 7,  name: '도남동 공원 인근',  dotColor: 'var(--orange-50)', rate: '+43%', cnt: 43 },
  { rank: 8,  name: '화북동 전통시장',   dotColor: 'var(--orange-50)', rate: '+41%', cnt: 41 },
  { rank: 9,  name: '일도2동 학교 주변', dotColor: 'var(--orange-50)', rate: '+40%', cnt: 40 },
  { rank: 10, name: '삼양동 농산물시장', dotColor: 'var(--blue-50)',   rate: '+39%', cnt: 39 },
  { rank: 11, name: '외도동 항구 일대',  dotColor: 'var(--blue-50)',   rate: '+38%', cnt: 38 },
  { rank: 12, name: '노형동 카페 거리',  dotColor: 'var(--blue-50)',   rate: '+37%', cnt: 37 },
  { rank: 13, name: '도두동 해변가',     dotColor: 'var(--blue-50)',   rate: '+36%', cnt: 36 },
  { rank: 14, name: '이호동 관광명소',   dotColor: 'var(--blue-50)',   rate: '+35%', cnt: 35 },
];

const CLUSTERS = [
  { name: '노형사거리',      c: [33.4790, 126.4760], rank: 1, badge: 'severe',  rate: '+52%', cnt: 52 },
  { name: '연동 대로변',     c: [33.4866, 126.4900], rank: 2, badge: 'severe',  rate: '+52%', cnt: 52 },
  { name: '이도2동 상업지구', c: [33.4995, 126.5320], rank: 3, badge: 'severe',  rate: '+52%', cnt: 52 },
  { name: '제주공항 인근',   c: [33.5070, 126.4930], rank: 4, badge: 'warn',    rate: '+48%', cnt: 48 },
  { name: '동문시장 주변',   c: [33.5130, 126.5270], rank: 5, badge: 'warn',    rate: '+45%', cnt: 45 },
  { name: '아라동 주변',     c: [33.4560, 126.5470], rank: 6, badge: 'caution', rate: '+44%', cnt: 44 },
];

const BADGE_COLOR = { severe: 'var(--red-50)', warn: 'var(--orange-50)', caution: 'var(--blue-50)' };
const BADGE_TEXT  = { severe: '매우높음', warn: '높음', caution: '보통' };

const MODE_TITLES = {
  '요금제 적용':   '요금제 적용 추천 구역 순위',
  '공유주차제 적용': '공유주차제 적용 추천 구역 순위',
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
    <text x="22" y="19" text-anchor="middle" dominant-baseline="central" font-family="'Pretendard',sans-serif" font-size="16" font-weight="800" fill="${fillColor}">${rank}</text>
  </svg>`;
  return pin + `<span class="cmk__lab">${name}</span>`;
}

export default function ZoneRecommendation() {
  const mapRef    = useRef(null);
  const mapInst   = useRef(null);
  const markerMap = useRef({});
  const rowRefs   = useRef([]);
  const bodyRef   = useRef(null);
  const [period, setPeriod]       = useState('직접설정');
  const [mode, setMode]           = useState('요금제 적용');
  const [threshold, setThreshold] = useState('15% 이상');
  const [showResult, setShowResult] = useState(true);
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
      const popup = `<div class="gp">
        <div class="gp__h"><span class="badge badge--${cl.badge}">${BADGE_TEXT[cl.badge]}</span></div>
        <div class="gp__big">${cl.name}</div>
        <div class="gp__bd"><span>증가율 <b>${cl.rate}</b></span><span>${cl.cnt}건 (3개월)</span></div>
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
          <h1 className="page-title">요금제·공유주차제 적용 구역 추천</h1>
          <p className="page-sub">민원 증가 추세를 분석하여 최적 구역 자동 추천</p>
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

            <div className="field">
              <label className="field__label">민원 증가율 임계값</label>
              <div className="field__select" style={{ cursor: 'pointer' }}>
                {threshold}
                <Icon name="chevron-down" size={18} />
              </div>
            </div>

            <button className="btn-run" type="button" onClick={() => setShowResult(true)}>▷ 구역 추천 실행</button>
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
                  <h3 className="sim-sec__title">{MODE_TITLES[mode]}</h3>
                  <p className="sim-sec__sub">종합점수 기준 : 민원 건수 40% / 증가율 30% / 단속 건수 20% / 공급부족 10%</p>
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
                            <span className="rl__val">
                              <span className="rl__cnt" style={{ color: 'var(--red-40)' }}>{r.rate}</span>
                            </span>
                          </div>
                          <span className="rl__sub">{r.cnt}건 (3개월)</span>
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
              <div className="map-legend__title">민원 증가율</div>
              <div className="row"><span className="dot" style={{ background: 'var(--red-50)' }} />매우 높음 (45% 이상)</div>
              <div className="row"><span className="dot" style={{ background: 'var(--orange-50)' }} />높음 (40~44%)</div>
              <div className="row"><span className="dot" style={{ background: 'var(--blue-50)' }} />보통 (40% 미만)</div>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
