import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import Icon from '../components/Icon';
import DsSelect from '../components/DsSelect';
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

/* ── 지역 데이터 (HTML 민원현황.html 기준) ── */
const REGIONS = [
  { rank: 1, name: '연동동', dotColor: 'var(--red-50)',    count: 52, delta: '▲13%', deltaClass: 't-up',   illegal: 41, etc: 11 },
  { rank: 2, name: '노형동', dotColor: 'var(--orange-50)', count: 38, delta: '▲6%',  deltaClass: 't-up',   illegal: 30, etc: 8 },
  { rank: 3, name: '이도동', dotColor: 'var(--orange-50)', count: 29, delta: '▼3%',  deltaClass: 't-down', illegal: 22, etc: 7 },
  { rank: 4, name: '아라동', dotColor: 'var(--blue-50)',   count: 21, delta: '▼6%',  deltaClass: 't-down', illegal: 16, etc: 5 },
  { rank: 5, name: '삼도동', dotColor: 'var(--green-50)',  count: 10, delta: '—',    deltaClass: 't-flat', illegal: 14, etc: 4 },
];

const HOTSPOTS = [
  { rank: 1, rankColor: 'var(--rank-1)', name: '연동 대로변',      meta: '반경 200m · 52건',    badge: 'badge--severe',  label: '심각' },
  { rank: 2, rankColor: 'var(--rank-3)', name: '노형사거리 인근',   meta: '반경 150m · 38건',    badge: 'badge--warn',    label: '경고' },
  { rank: 3, rankColor: 'var(--rank-3)', name: '이도2동 상업지구',  meta: '반경 180m · 28건',    badge: 'badge--warn',    label: '경고' },
  { rank: 4, rankColor: 'var(--rank-4)', name: '아라동 주변',       meta: '아라동 · 반경 120m',  badge: 'badge--caution', label: '주의' },
  { rank: 5, rankColor: 'var(--rank-5)', name: '삼도1동 골목',      meta: '삼도동 · 반경 100m',  badge: 'badge--caution', label: '주의' },
];

const LAYER_DEFS = [
  { key: 'hotspot', label: '민원 다발 지역', defaultOn: true  },
  { key: 'enforce', label: '단속 집중 지역', defaultOn: false },
  { key: 'demand',  label: '수요 부족 지역', defaultOn: false },
  { key: 'parking', label: '공영주차장',     defaultOn: true  },
];

const LEGEND_ITEMS = [
  { label: '심각 (40건 이상)', color: 'var(--red-50)'          },
  { label: '경고 (20~39건)',   color: 'var(--orange-50)'       },
  { label: '주의 (10~19건)',   color: 'var(--blue-50)'         },
  { label: '양호 (10건 미만)', color: 'var(--cool-neutral-80)' },
];

/* ── Leaflet 지도 컴포넌트 ── */
function GisMap({ layerState }) {
  const ref = useRef(null);
  const mapRef = useRef(null);
  const layerGroupsRef = useRef({});

  useEffect(() => {
    if (!ref.current) return;

    const COLORS = {
      severe:  '#ef4444',
      warn:    '#f97316',
      caution: '#3b82f6',
      good:    '#22c55e',
      park:    '#a855f7',
    };

    const regions = [
      { name: '연동',   c: [33.4866, 126.4900], count: 52, level: 'severe',  color: COLORS.severe,  illegal: 41, etc: 11 },
      { name: '노형동', c: [33.4790, 126.4760], count: 38, level: '경고',    color: COLORS.warn,    illegal: 30, etc: 8  },
      { name: '이도동', c: [33.4995, 126.5320], count: 29, level: '경고',    color: COLORS.warn,    illegal: 22, etc: 7  },
      { name: '아라동', c: [33.4560, 126.5470], count: 21, level: '주의',    color: COLORS.caution, illegal: 16, etc: 5  },
      { name: '삼도동', c: [33.5120, 126.5210], count: 10, level: '양호',    color: COLORS.good,    illegal: 7,  etc: 3  },
    ];

    const parking = [
      ['시청 공영주차장',    33.4996, 126.5285],
      ['연동 지하주차장',    33.4880, 126.4925],
      ['노형 공영주차장',    33.4775, 126.4790],
      ['이도 환승주차장',    33.4950, 126.5360],
      ['아라 공영주차장',    33.4585, 126.5440],
      ['탑동 해변주차장',    33.5170, 126.5235],
      ['중앙로 공영주차장',  33.5110, 126.5260],
      ['삼도 공영주차장',    33.5085, 126.5180],
    ];

    const map = L.map(ref.current, { zoomControl: false, attributionControl: true })
      .setView([33.486, 126.512], 13);
    L.control.zoom({ position: 'topright' }).addTo(map);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19, attribution: '&copy; OpenStreetMap',
    }).addTo(map);

    /* 육각형 폴리곤 좌표 */
    function hexPoly(c, rx, ry) {
      const pts = [];
      for (let a = 0; a < 6; a++) {
        const t = Math.PI / 6 + a * Math.PI / 3;
        pts.push([c[0] + ry * Math.sin(t), c[1] + rx * Math.cos(t)]);
      }
      return pts;
    }

    /* 팝업 HTML */
    function popupHtml(r) {
      const badgeMap = { severe: 'badge--severe', warn: 'badge--warn', caution: 'badge--caution', '경고': 'badge--warn', '주의': 'badge--caution', '양호': 'badge--done', '심각': 'badge--severe' };
      const bc = badgeMap[r.level] || 'badge--done';
      const lvLabel = { severe: '심각', '경고': '경고', '주의': '주의', '양호': '양호' }[r.level] || r.level;
      return `<div style="min-width:168px;font-family:system-ui">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px">
          <span style="width:10px;height:10px;border-radius:50%;background:${r.color};flex-shrink:0;display:inline-block"></span>
          <b style="font-size:15px;color:#171717">${r.name}</b>
          <span class="badge ${bc}" style="margin-left:auto">${lvLabel}</span>
        </div>
        <div style="display:flex;justify-content:space-between;padding:4px 0;font-size:14px;color:#70737c">총 민원<b style="color:#171717">${r.count}건</b></div>
        <div style="display:flex;justify-content:space-between;padding:4px 0;font-size:14px;color:#70737c;border-top:1px solid rgba(112,115,124,0.08)">불법주차<b style="color:#171717">${r.illegal}건</b></div>
        <div style="display:flex;justify-content:space-between;padding:4px 0;font-size:14px;color:#70737c;border-top:1px solid rgba(112,115,124,0.08)">기타<b style="color:#171717">${r.etc}건</b></div>
      </div>`;
    }

    /* ── 민원 다발 레이어 ── */
    const boundaryLayer = L.layerGroup();
    const regionGroup = L.markerClusterGroup({ maxClusterRadius: 44, showCoverageOnHover: false });

    regions.forEach((r) => {
      L.polygon(hexPoly(r.c, 0.013, 0.010), {
        color: r.color, weight: 2, opacity: 0.7,
        fillColor: r.color, fillOpacity: 0.12,
      }).bindPopup(popupHtml(r)).addTo(boundaryLayer);

      const icon = L.divIcon({
        className: '',
        iconSize: [18, 18], iconAnchor: [9, 9],
        html: `<div style="position:relative;display:inline-flex;align-items:center">
          <div style="width:18px;height:18px;border-radius:50%;background:${r.color};border:3px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,0.3);flex-shrink:0"></div>
          <div style="position:absolute;left:24px;top:50%;transform:translateY(-50%);display:inline-flex;align-items:center;gap:6px;height:28px;padding:0 10px;background:#fff;border-radius:999px;box-shadow:0 1px 4px rgba(23,23,25,0.1);font-size:13px;font-weight:700;color:#171717;white-space:nowrap">
            ${r.name}<span style="color:#70737c;font-weight:600">${r.count}건</span>
          </div>
        </div>`,
      });
      L.marker(r.c, { icon }).bindPopup(popupHtml(r)).addTo(regionGroup);
    });

    /* ── 공영주차장 클러스터 ── */
    const parkingGroup = L.markerClusterGroup({ maxClusterRadius: 50, showCoverageOnHover: false });
    parking.forEach(([name, lat, lng]) => {
      const icon = L.divIcon({
        className: '',
        iconSize: [28, 28], iconAnchor: [14, 14],
        html: `<div style="width:28px;height:28px;border-radius:50%;background:${COLORS.park};color:#fff;border:2.5px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,0.28);display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:800">P</div>`,
      });
      L.marker([lat, lng], { icon })
        .bindPopup(`<div style="font-family:system-ui;min-width:140px"><b style="font-size:15px">${name}</b><div style="margin-top:8px;font-size:13px;color:#70737c">구분: <b style="color:#171717">공영주차장</b></div><div style="font-size:13px;color:#70737c">상태: <b style="color:#171717">운영중</b></div></div>`)
        .addTo(parkingGroup);
    });

    /* ── 단속 집중 레이어 ── */
    const enforceLayer = L.layerGroup();
    [regions[0], regions[1], regions[2]].forEach((r) => {
      L.circle(r.c, { radius: 520, color: COLORS.severe, weight: 1.5, dashArray: '5,5', fillColor: COLORS.severe, fillOpacity: 0.08 })
        .bindPopup(`<b>${r.name} 단속 집중구역</b>`)
        .addTo(enforceLayer);
    });

    /* ── 수요 부족 레이어 ── */
    const demandLayer = L.layerGroup();
    [regions[3], regions[4]].forEach((r) => {
      L.circle(r.c, { radius: 480, color: COLORS.caution, weight: 1.5, dashArray: '5,5', fillColor: COLORS.caution, fillOpacity: 0.08 })
        .bindPopup(`<b>${r.name} 수요 부족구역</b>`)
        .addTo(demandLayer);
    });

    layerGroupsRef.current = {
      hotspot: [boundaryLayer, regionGroup],
      parking: [parkingGroup],
      enforce: [enforceLayer],
      demand:  [demandLayer],
    };
    mapRef.current = map;

    /* 초기 레이어 적용 */
    Object.entries(layerState).forEach(([key, on]) => {
      (layerGroupsRef.current[key] || []).forEach((lyr) => {
        if (on) map.addLayer(lyr);
      });
    });

    setTimeout(() => map.invalidateSize(), 200);

    return () => map.remove();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* 레이어 토글 */
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    Object.entries(layerState).forEach(([key, on]) => {
      (layerGroupsRef.current[key] || []).forEach((lyr) => {
        if (on) { if (!map.hasLayer(lyr)) map.addLayer(lyr); }
        else    { if (map.hasLayer(lyr))  map.removeLayer(lyr); }
      });
    });
  }, [layerState]);

  return <div ref={ref} style={{ position: 'absolute', inset: 0 }} />;
}

/* ── 메인 컴포넌트 ── */
export default function Complaints() {
  const navigate = useNavigate();
  const [period, setPeriod]         = useState('오늘');
  const [datePopOpen, setDatePopOpen] = useState(false);
  const [filterOpen, setFilterOpen]  = useState(false);
  const [rangeLabel, setRangeLabel]  = useState('오늘');
  const [dateFrom, setDateFrom]      = useState('2025-11-01');
  const [dateTo, setDateTo]          = useState('2025-12-01');
  const [riskSeg, setRiskSeg]        = useState('전체');
  const [layers, setLayers]          = useState(() =>
    Object.fromEntries(LAYER_DEFS.map((d) => [d.key, d.defaultOn]))
  );

  const toggleLayer = (key) => setLayers((prev) => ({ ...prev, [key]: !prev[key] }));

  const applyDate = () => {
    if (dateFrom && dateTo) {
      const fmt = (s) => s.replace(/-/g, '.');
      setRangeLabel(`${fmt(dateFrom)} ~ ${fmt(dateTo)}`);
      setPeriod('');
    }
    setDatePopOpen(false);
  };

  return (
    <>
      {/* ── Top bar ── */}
      <header className="topbar">
        <div>
          <h1 className="page-title">민원현황</h1>
          <p className="page-sub">최종 업데이트 2025.12.01 · 14:32 · 자동 갱신</p>
        </div>
        <div className="topbar__actions">
          <button className="btn btn--ai" type="button" onClick={() => navigate('/ai-assistant', { state: { focus: true } })}>{AI_ICON} AI 대화 시작하기</button>
          <button className="btn" type="button"><Icon name="download" size={20} /> 내보내기</button>
          <NotificationBell />
        </div>
      </header>

      {/* ── Filter bar ── */}
      <div className="filterbar">
        <span className="filterbar__label">조회 단위</span>
        <div className="segment">
          {[['오늘','오늘'],['주간','주간'],['월간','월간']].map(([k, l]) => (
            <button
              key={k}
              type="button"
              className={`segment__btn${period === k ? ' segment__btn--active' : ''}`}
              onClick={() => { setPeriod(k); setRangeLabel(l); }}
            >{l}</button>
          ))}
        </div>

        {/* 기간 선택 팝오버 */}
        <div style={{ position: 'relative' }}>
          <button
            className="btn"
            type="button"
            style={{ height: 40 }}
            onClick={() => setDatePopOpen((o) => !o)}
            aria-expanded={datePopOpen}
          >
            <Icon name="calendar" size={18} /> 기간 선택
          </button>
          {datePopOpen && (
            <div style={{ position: 'absolute', top: 'calc(100% + 10px)', left: 0, zIndex: 40, background: 'var(--card-bg)', border: '1px solid var(--line-normal)', borderRadius: 14, boxShadow: '0 16px 40px rgba(23,23,25,0.18)', padding: 20, minWidth: 360 }}>
              <div style={{ display: 'flex', gap: 16 }}>
                <label style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-alternative)' }}>시작일</span>
                  <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)}
                    style={{ height: 44, padding: '0 14px', border: '1px solid var(--line-normal)', borderRadius: 10, fontFamily: 'inherit', fontSize: 15, color: 'var(--text-normal)', background: 'var(--card-bg)', outline: 'none' }} />
                </label>
                <label style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-alternative)' }}>종료일</span>
                  <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)}
                    style={{ height: 44, padding: '0 14px', border: '1px solid var(--line-normal)', borderRadius: 10, fontFamily: 'inherit', fontSize: 15, color: 'var(--text-normal)', background: 'var(--card-bg)', outline: 'none' }} />
                </label>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 20 }}>
                <button className="btn" type="button" style={{ height: 38 }} onClick={() => setDatePopOpen(false)}>취소</button>
                <button className="btn btn--apply" type="button" style={{ height: 38 }} onClick={applyDate}>적용</button>
              </div>
            </div>
          )}
        </div>

        <span className="filter-sep" />
        <button
          className="btn btn--toggle"
          type="button"
          style={{ height: 40 }}
          aria-pressed={filterOpen}
          onClick={() => setFilterOpen((o) => !o)}
        >
          <Icon name="filter" size={18} /> 상세 필터
        </button>
        <span className="filterbar__right">현재: <strong>{rangeLabel}</strong></span>
      </div>

      {/* ── 상세 필터 패널 ── */}
      {filterOpen && (
        <div className="detail-filter">
          <div className="detail-filter__group">
            <span className="detail-filter__label">행정구역</span>
            <DsSelect style={{ minWidth: 160 }}>
              <option>제주시</option>
              <option>서귀포시</option>
              <option>제주 전체</option>
            </DsSelect>
          </div>
          <div className="detail-filter__group">
            <span className="detail-filter__label">민원유형</span>
            <DsSelect style={{ minWidth: 160 }}>
              <option>전체</option>
              <option>불법주정차</option>
              <option>주차장 혼잡</option>
              <option>시설 고장</option>
              <option>기타</option>
            </DsSelect>
          </div>
          <div className="detail-filter__group">
            <span className="detail-filter__label">위험 단계</span>
            <div className="risk-seg">
              {['전체','심각','주의','보통','양호'].map((v) => (
                <button
                  key={v}
                  type="button"
                  className={riskSeg === v ? 'is-active' : ''}
                  onClick={() => setRiskSeg(v)}
                >{v}</button>
              ))}
            </div>
          </div>
          <div className="detail-filter__foot">
            <button className="btn" type="button" style={{ height: 38 }}
              onClick={() => setRiskSeg('전체')}>초기화</button>
            <button className="btn btn--apply" type="button" style={{ height: 38 }}>필터 적용</button>
          </div>
        </div>
      )}

      {/* ── Content ── */}
      <div className="content" style={{ flex: 1, minHeight: 0 }}>

        {/* Stat cards — 5열 */}
        <section className="stat-row stat-row--5">
          <div className="card stat">
            <div className="stat__icon stat__icon--blue"><Icon name="document" size={26} /></div>
            <div>
              <div className="stat__label">총 민원 건수</div>
              <div className="stat__value">247</div>
              <div className="stat__delta"><span className="delta-pos">↗ +12%</span> 전기 대비</div>
            </div>
          </div>
          <div className="card stat">
            <div className="stat__icon stat__icon--red"><Icon name="location" size={26} /></div>
            <div>
              <div className="stat__label">집중구역 수</div>
              <div className="stat__value">5</div>
              <div className="stat__delta"><span className="delta-pos">↗ +1개</span> 전기 대비</div>
            </div>
          </div>
          <div className="card stat">
            <div className="stat__icon stat__icon--orange"><Icon name="warning" size={26} /></div>
            <div>
              <div className="stat__label">단속 집중 지역</div>
              <div className="stat__value">3</div>
              <div className="stat__delta">변동 없음</div>
            </div>
          </div>
          <div className="card stat">
            <div className="stat__icon stat__icon--teal"><Icon name="car" size={26} /></div>
            <div>
              <div className="stat__label">수요 부족 지역</div>
              <div className="stat__value">7</div>
              <div className="stat__delta"><span className="delta-neg">↘ -1개</span> 전기 대비</div>
            </div>
          </div>
          <div className="card stat">
            <div className="stat__icon stat__icon--violet"><Icon name="company" size={26} /></div>
            <div>
              <div className="stat__label">공영주차장</div>
              <div className="stat__value">19</div>
              <div className="stat__delta">운영 중</div>
            </div>
          </div>
        </section>

        {/* GIS row */}
        <section className="gis-row">

          {/* 지도 카드 */}
          <div className="card map-card">
            <div className="map-body">
              <GisMap layerState={layers} />

              {/* 레이어 패널 */}
              <div className="layer-panel">
                <div className="layer-panel__title">레이어 표시</div>
                {LAYER_DEFS.map((d) => (
                  <div key={d.key} className="layer-row">
                    <span>{d.label}</span>
                    <button
                      type="button"
                      className={`toggle${layers[d.key] ? ' toggle--on' : ''}`}
                      onClick={() => toggleLayer(d.key)}
                      aria-label={d.label}
                    />
                  </div>
                ))}
              </div>

              {/* 범례 */}
              <div className="map-legend">
                <div className="map-legend__title">범례</div>
                {LEGEND_ITEMS.map((item) => (
                  <div key={item.label} className="row">
                    <span className="dot" style={{ background: item.color }} />
                    {item.label}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 사이드 컬럼 */}
          <div className="side-col">

            {/* 지역별 민원 현황 */}
            <div className="card hotspots">
              <div className="card-head">
                <div>
                  <h2 className="card-head__title">지역별 민원 현황</h2>
                  <p className="card-head__sub">읍·면·동 기준 집계</p>
                </div>
                <button className="card-link" type="button">
                  전체 <Icon name="chevron-right" size={16} />
                </button>
              </div>
              <div className="rl">
                {REGIONS.map((r) => (
                  <div key={r.rank} className="rl__row">
                    <span className="rl__rank">{r.rank}</span>
                    <div className="rl__main">
                      <div className="rl__top">
                        <span className="rl__name">
                          <span className="dot" style={{ background: r.dotColor }} />
                          {r.name}
                        </span>
                        <span className="rl__val">
                          <span className="rl__cnt">{r.count}건</span>
                          <span className={`rl__delta ${r.deltaClass}`}>{r.delta}</span>
                        </span>
                      </div>
                      <span className="rl__sub">불법주차 {r.illegal} · 기타 {r.etc}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 민원 집중구역 */}
            <div className="card cluster">
              <div className="card-head">
                <div>
                  <h2 className="card-head__title">
                    민원 집중구역 <span className="count-badge">5개소</span>
                  </h2>
                  <p className="card-head__sub">AI 클러스터링 자동 분석 결과</p>
                </div>
              </div>
              <div className="hot-list">
                {HOTSPOTS.map((h) => (
                  <div key={h.rank} className="hot">
                    <span className="hot__rank" style={{ background: h.rankColor }}>{h.rank}</span>
                    <div className="hot__body">
                      <div className="hot__name">{h.name}</div>
                      <div className="hot__meta">{h.meta}</div>
                    </div>
                    <span className={`badge ${h.badge}`}>{h.label}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </section>
      </div>
    </>
  );
}
