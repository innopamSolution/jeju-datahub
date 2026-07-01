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
      bar('민원 빈도', lot.m.civil) +
      bar('이용 패턴', lot.m.usage) +
      bar('사고 이력', lot.m.accident) +
    '</div></div>';
}

export default function InvestmentPriority() {
  const mapRef    = useRef(null);
  const mapInst   = useRef(null);
  const markerMap = useRef({});
  const rowRefs   = useRef([]);
  const listRef   = useRef(null);
  const [risk, setRisk] = useState('전체');
  const [activeRank, setActiveRank] = useState(null);

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
        '<text x="22" y="19" text-anchor="middle" dominant-baseline="central" font-family="\'Pretendard\', sans-serif" font-size="16" font-weight="800" fill="' + fill + '">' + lot.rank + '</text></svg>';
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

  const handleRowClick = (rank) => {
    const mk = markerMap.current[rank];
    if (!mk || !mapInst.current) return;
    setActiveRow(rank);
    mapInst.current.panTo(mk.getLatLng(), { animate: true, duration: 0.5 });
    mk.openPopup();
  };

  return (
    <>
      <header className="topbar">
        <div>
          <h1 className="page-title">공영주차장 투자·보강 우선순위 보드</h1>
          <p className="page-sub">안전위험도 · 민원빈도 · 이용패턴 · 사고이력 종합 지표 자동 산정</p>
        </div>
        <div className="topbar__actions">
          <button className="btn btn--ai" type="button">{AI_ICON} AI 대화 시작하기</button>
          <button className="btn" type="button"><Icon name="download" size={20} /> 내보내기</button>
          <button className="bell" type="button" aria-label="알림"><Icon name="bell" size={22} /><span className="bell__badge">3</span></button>
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
              <div className="stat__delta"><span className="delta-neg">↗ +2개</span> 전분기 대비</div>
            </div>
          </div>
          <div className="card stat">
            <div className="stat__icon stat__icon--orange"><Icon name="car" size={28} /></div>
            <div>
              <div className="stat__label">최근 3개월 사고</div>
              <div className="stat__value">2<span className="stat__unit">건</span></div>
              <div className="stat__delta">노형 · 연동 주차장</div>
            </div>
          </div>
        </section>

        {/* 지도 + 우선순위 패널 */}
        <section className="gis-row">
          {/* 지도 */}
          <div className="card map-card">
            <div className="map-controls">
              <div className="ctrl">
                <span className="ctrl__label">행정구역</span>
                <span className="select">제주 전체 <Icon name="chevron-down" size={18} /></span>
              </div>
              <div className="ctrl">
                <span className="ctrl__label">정렬 기준</span>
                <span className="select">종합점수 높은순 <Icon name="chevron-down" size={18} /></span>
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
              <div className="card-head">
                <div>
                  <h2 className="card-head__title">투자·보강 우선순위</h2>
                  <p className="card-head__sub">종합점수 기준 : 안전위험도 35% / 민원빈도 25% / 이용패턴 20% / 사고이력 20%</p>
                </div>
              </div>
              <div className="prio-list" ref={listRef}>
                {LOTS.map((lot, i) => {
                  const t = TIER[lot.tier];
                  return (
                    <div
                      key={lot.rank}
                      className={`prio-row${activeRank === lot.rank ? ' is-active' : ''}`}
                      ref={(el) => (rowRefs.current[i] = el)}
                      onClick={() => handleRowClick(lot.rank)}
                    >
                      <span className="prio-row__rank">{lot.rank}</span>
                      <div className="prio-row__body">
                        <div className="prio-row__name">{lot.name}</div>
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
