import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import * as echarts from 'echarts';
import Icon from '../components/Icon';
import NotificationBell from '../components/NotificationBell';
import DsSelect from '../components/DsSelect';
import './Dashboard.css';

const HOTSPOTS = [
  { rank: 1, accent: 'var(--rank-1)', name: '연동 대로변', meta: '연동동 · 반경 200m', badge: 'severe', label: '심각' },
  { rank: 2, accent: 'var(--rank-3)', name: '노형사거리 인근', meta: '노형동 · 반경 150m', badge: 'warn', label: '경고' },
  { rank: 3, accent: 'var(--rank-3)', name: '이도2동 상업지구', meta: '이도동 · 반경 180m', badge: 'warn', label: '경고' },
  { rank: 4, accent: 'var(--rank-4)', name: '아라동 주변', meta: '아라동 · 반경 120m', badge: 'caution', label: '주의' },
  { rank: 5, accent: 'var(--rank-5)', name: '삼도1동 골목', meta: '삼도동 · 반경 100m', badge: 'caution', label: '주의' },
];

const REGIONS = [
  {
    num: 1, accent: 'var(--rank-4)', name: '연동', trend: 'up', trendLabel: '↗ 1위', value: 52,
    delta: { dir: 'up', label: '↗ ▲15%' },
    breakdown: [
      { key: 'illegal', label: '불법주차', value: 28, pct: 53.8 },
      { key: 'double', label: '이중주차', value: 14, pct: 26.9 },
      { key: 'facility', label: '시설점거', value: 6, pct: 11.5 },
      { key: 'etc', label: '기타', value: 4, pct: 7.7 },
    ],
  },
  {
    num: 2, accent: 'var(--rank-2)', name: '노형동', trend: 'down', trendLabel: '↘ 1위', value: 38,
    delta: { dir: 'up', label: '↗ ▲6%' },
    breakdown: [
      { key: 'illegal', label: '불법주차', value: 21, pct: 55.3 },
      { key: 'double', label: '이중주차', value: 11, pct: 28.9 },
      { key: 'facility', label: '시설점거', value: 4, pct: 10.5 },
      { key: 'etc', label: '기타', value: 2, pct: 5.3 },
    ],
  },
  {
    num: 3, accent: 'var(--rank-3)', name: '이도동', trend: 'flat', trendLabel: '—', value: 29,
    delta: { dir: 'down', label: '↘ ▼3%' },
    breakdown: [
      { key: 'illegal', label: '불법주차', value: 15, pct: 51.7 },
      { key: 'double', label: '이중주차', value: 8, pct: 27.6 },
      { key: 'facility', label: '시설점거', value: 4, pct: 13.8 },
      { key: 'etc', label: '기타', value: 2, pct: 6.9 },
    ],
  },
  {
    num: 4, accent: 'var(--rank-1)', name: '아라동', trend: 'up', trendLabel: '↗ 1위', value: 21,
    delta: { dir: 'down', label: '↘ ▼8%' },
    breakdown: [
      { key: 'illegal', label: '불법주차', value: 11, pct: 52.4 },
      { key: 'double', label: '이중주차', value: 6, pct: 28.6 },
      { key: 'facility', label: '시설점거', value: 2, pct: 9.5 },
      { key: 'etc', label: '기타', value: 2, pct: 9.5 },
    ],
  },
  {
    num: 5, accent: 'var(--rank-5)', name: '삼도동', trend: 'down', trendLabel: '↘ 1위', value: 18,
    delta: null,
    breakdown: [
      { key: 'illegal', label: '불법주차', value: 10, pct: 55.6 },
      { key: 'double', label: '이중주차', value: 5, pct: 27.8 },
      { key: 'facility', label: '시설점거', value: 2, pct: 11.1 },
      { key: 'etc', label: '기타', value: 1, pct: 5.6 },
    ],
  },
];

const SERIES_COLOR_VAR = {
  illegal: '--series-illegal',
  double: '--series-double',
  facility: '--series-facility',
  etc: '--series-etc',
};

function cssVar(name) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

function resolveColor(varName, probe) {
  probe.style.color = `var(${varName})`;
  return getComputedStyle(probe).color;
}

function rgba(color, a) {
  const c = document.createElement('canvas').getContext('2d');
  c.fillStyle = color;
  const hex = c.fillStyle;
  if (hex[0] === '#') {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r},${g},${b},${a})`;
  }
  return hex.replace(/rgba?\(([^)]+)\)/, (_, body) => {
    const p = body.split(',').slice(0, 3).join(',');
    return `rgba(${p},${a})`;
  });
}

function TrendChart() {
  const hostRef = useRef(null);
  const chartRef = useRef(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const probe = document.createElement('span');
    probe.style.cssText = 'position:absolute;left:-9999px;top:-9999px';
    document.body.appendChild(probe);

    const labels = ['00', '02', '04', '06', '08', '10', '12', '14', '16', '18', '20', '22'].map((h) => `${h}시`);
    const fontBody = cssVar('--font-body');
    const cAxis = resolveColor('--text-assistive', probe);
    const cGrid = resolveColor('--line-alternative', probe);

    // 안전신문고 불법주정차 신고현황('25.1월~'26.5월) 유형별 비중을 기준으로 재구성
    // 인도·횡단보도(41.9%) > 안전시설 인근(24.0%) > 장애인전용구역(18.5%) > 기타 불법주정차(9.6%) > 친환경차충전구역(6.0%)
    const defs = [
      { name: '인도·횡단보도 점유', color: resolveColor('--series-illegal', probe), area: true, data: [13, 11, 9, 10, 15, 24, 30, 37, 42, 44, 40, 35] },
      { name: '안전시설 인근 위반', color: resolveColor('--series-double', probe), area: false, data: [8, 6, 5, 6, 9, 13, 17, 21, 24, 25, 23, 20] },
      { name: '장애인전용구역 위반', color: resolveColor('--series-facility', probe), area: false, data: [6, 5, 4, 4, 7, 10, 13, 16, 19, 19, 18, 16] },
      { name: '기타 불법주정차', color: resolveColor('--series-etc', probe), area: false, data: [3, 3, 2, 2, 3, 5, 7, 8, 10, 10, 9, 9] },
      { name: '친환경차충전구역 위반', color: resolveColor('--series-ev', probe), area: false, data: [2, 2, 1, 1, 2, 3, 4, 5, 6, 6, 6, 6] },
    ];

    const series = defs.map((d) => {
      const s = {
        name: d.name, type: 'line', smooth: 0.4, symbol: 'circle', symbolSize: 7,
        showSymbol: false, lineStyle: { width: 2.5, color: d.color },
        itemStyle: { color: d.color, borderColor: '#fff', borderWidth: 2 },
        emphasis: { focus: 'series' }, data: d.data, z: d.area ? 3 : 2,
      };
      if (d.area) {
        s.areaStyle = {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: rgba(d.color, 0.22) },
            { offset: 1, color: rgba(d.color, 0.0) },
          ]),
        };
      }
      return s;
    });

    const chart = echarts.init(host, null, { renderer: 'svg' });
    chartRef.current = chart;
    chart.setOption({
      color: defs.map((d) => d.color),
      textStyle: { fontFamily: fontBody },
      grid: { left: 8, right: 16, top: 16, bottom: 8, containLabel: true },
      tooltip: {
        trigger: 'axis',
        backgroundColor: resolveColor('--cool-neutral-15', probe) || '#1b1c1e',
        borderWidth: 0, padding: [10, 14],
        textStyle: { color: '#fff', fontFamily: fontBody, fontSize: 13 },
        axisPointer: { type: 'line', lineStyle: { color: cGrid, width: 1 } },
        valueFormatter: (v) => `${v}건`,
      },
      xAxis: {
        type: 'category', boundaryGap: false, data: labels,
        axisLine: { lineStyle: { color: cGrid } },
        axisTick: { show: false },
        axisLabel: { color: cAxis, fontSize: 12, fontFamily: fontBody, margin: 12 },
      },
      yAxis: {
        type: 'value', min: 0, max: 60, interval: 15,
        axisLine: { show: false }, axisTick: { show: false },
        splitLine: { lineStyle: { color: cGrid, type: 'solid' } },
        axisLabel: { color: cAxis, fontSize: 12, fontFamily: fontBody },
      },
      series,
    });

    const onResize = () => chart.resize();
    window.addEventListener('resize', onResize);

    return () => {
      window.removeEventListener('resize', onResize);
      chart.dispose();
      probe.remove();
    };
  }, []);

  return <div className="trend__chart" ref={hostRef} style={{ height: 300 }} />;
}

const AI_ICON_DASH = (
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

export default function Dashboard() {
  const navigate = useNavigate();
  const [period, setPeriod] = useState('오늘');
  const [filterOpen, setFilterOpen] = useState(false);
  const [datePopOpen, setDatePopOpen] = useState(false);
  const [customRange, setCustomRange] = useState(null);
  const [dateFrom, setDateFrom] = useState('2025-11-01');
  const [dateTo, setDateTo] = useState('2025-12-01');
  const [riskSeg, setRiskSeg] = useState('전체');
  const datePickRef = useRef(null);

  useEffect(() => {
    if (!datePopOpen) return;
    const onDoc = (e) => { if (datePickRef.current && !datePickRef.current.contains(e.target)) setDatePopOpen(false); };
    const onKey = (e) => { if (e.key === 'Escape') setDatePopOpen(false); };
    document.addEventListener('click', onDoc);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('click', onDoc); document.removeEventListener('keydown', onKey); };
  }, [datePopOpen]);

  const applyDateRange = () => {
    if (dateFrom && dateTo) setCustomRange({ from: dateFrom, to: dateTo });
    setDatePopOpen(false);
  };

  const goToAiInput = (prefill) => navigate('/ai-assistant', { state: prefill ? { prefill } : { focus: true } });

  return (
    <>
      <header className="topbar">
        <div>
          <h1 className="page-title">대시보드</h1>
          <p className="page-sub">최종 업데이트 2025.12.01 · 14:32 · 자동 갱신</p>
        </div>
        <div className="topbar__actions">
          <button className="btn btn--ai" type="button" onClick={() => goToAiInput()}>{AI_ICON_DASH} AI 대화 시작하기</button>
          <button className="btn" type="button"><Icon name="download" size={20} /> 내보내기</button>
          <NotificationBell />
        </div>
      </header>

      <div className="filterbar">
        <span className="filterbar__label">조회 단위</span>
        <div className="segment">
          {['오늘', '주간', '월간'].map((k) => (
            <button key={k} type="button" className={`segment__btn ${!customRange && period === k ? 'segment__btn--active' : ''}`} onClick={() => { setPeriod(k); setCustomRange(null); }}>{k}</button>
          ))}
        </div>

        {/* 기간 선택 버튼 + 팝오버 */}
        <div className="date-pick" ref={datePickRef}>
          <button className={`btn${customRange ? ' btn--apply' : ''}`} type="button" style={{ height: 40 }} aria-haspopup="true" aria-expanded={datePopOpen}
            onClick={(e) => { e.stopPropagation(); setDatePopOpen((o) => !o); }}>
            <Icon name="calendar" size={18} /> {customRange ? `${customRange.from} ~ ${customRange.to}` : '기간 선택'}
          </button>
          {datePopOpen && (
            <div className="date-pop">
              <div className="date-pop__row">
                <label className="date-pop__field">
                  <span>시작일</span>
                  <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
                </label>
                <label className="date-pop__field">
                  <span>종료일</span>
                  <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
                </label>
              </div>
              <div className="date-pop__foot">
                <button className="btn" type="button" style={{ height: 38 }} onClick={() => setDatePopOpen(false)}>취소</button>
                <button className="btn btn--apply" type="button" style={{ height: 38 }} onClick={applyDateRange}>적용</button>
              </div>
            </div>
          )}
        </div>

        <span className="filter-sep" />
        <button className="btn btn--toggle" type="button" style={{ height: 40 }} aria-pressed={filterOpen} onClick={() => setFilterOpen((o) => !o)}>
          <Icon name="filter" size={18} /> 상세 필터
        </button>
        <span className="filterbar__right">현재: <strong>{customRange ? `${customRange.from} ~ ${customRange.to}` : period}</strong></span>
      </div>

      {/* 상세 필터 패널 */}
      {filterOpen && (
        <div className="detail-filter">
          <div className="detail-filter__group">
            <span className="detail-filter__label">행정구역</span>
            <DsSelect className="detail-filter__select" aria-label="행정구역">
              <option>제주시</option><option>서귀포시</option><option>제주 전체</option>
            </DsSelect>
          </div>
          <div className="detail-filter__group">
            <span className="detail-filter__label">민원유형</span>
            <DsSelect className="detail-filter__select" aria-label="민원유형">
              <option>전체</option><option>불법주정차</option><option>주차장 혼잡</option><option>시설 고장</option><option>기타</option>
            </DsSelect>
          </div>
          <div className="detail-filter__group">
            <span className="detail-filter__label">위험 단계</span>
            <div className="risk-seg">
              {['전체', '심각', '주의', '보통', '양호'].map((k) => (
                <button key={k} type="button" className={riskSeg === k ? 'is-active' : ''} onClick={() => setRiskSeg(k)}>{k}</button>
              ))}
            </div>
          </div>
          <div className="detail-filter__foot">
            <button className="btn" type="button" style={{ height: 38 }} onClick={() => setRiskSeg('전체')}>초기화</button>
            <button className="btn btn--apply" type="button" style={{ height: 38 }}>필터 적용</button>
          </div>
        </div>
      )}

      <div className="content">
        <section className="stat-row">
          <div className="card stat">
            <div className="stat__icon stat__icon--blue"><Icon name="document" size={32} /></div>
            <div>
              <div className="stat__label">총 민원 건수</div>
              <div className="stat__value">247</div>
              <div className="stat__delta"><span className="delta-pos">↗ +12%</span> 전일 대비</div>
            </div>
          </div>
          <div className="card stat">
            <div className="stat__icon stat__icon--green"><Icon name="location" size={32} /></div>
            <div>
              <div className="stat__label">불법주차 발생</div>
              <div className="stat__value">183</div>
              <div className="stat__delta"><span className="delta-pos">↗ +6%</span> 전일 대비</div>
            </div>
          </div>
          <div className="card stat">
            <div className="stat__icon stat__icon--red"><Icon name="warning" size={32} /></div>
            <div>
              <div className="stat__label">위험 단계 발생</div>
              <div className="stat__value">3</div>
              <div className="stat__delta"><span className="delta-warn">⚠ 경보 1, 경고 2</span> 전일 대비</div>
            </div>
          </div>
        </section>

        <section className="mid-row">
          <div className="card trend">
            <div className="card-head">
              <div>
                <h2 className="card-head__title">민원 발생 추이 <span className="card-head__note">(오늘 · 전체 유형)</span></h2>
                <p className="card-head__sub">기간별 민원 건수 및 유형별 분포</p>
              </div>
            </div>
            <TrendChart />
            <div className="legend">
              <span className="legend__item"><span className="dot" style={{ background: 'var(--series-illegal)' }} />인도·횡단보도 점유</span>
              <span className="legend__item"><span className="dot" style={{ background: 'var(--series-double)' }} />안전시설 인근 위반</span>
              <span className="legend__item"><span className="dot" style={{ background: 'var(--series-facility)' }} />장애인전용구역 위반</span>
              <span className="legend__item"><span className="dot" style={{ background: 'var(--series-etc)' }} />기타 불법주정차</span>
              <span className="legend__item"><span className="dot" style={{ background: 'var(--series-ev)' }} />친환경차충전구역 위반</span>
            </div>
          </div>

          <div className="card hotspots">
            <div className="card-head">
              <div>
                <h2 className="card-head__title">민원 집중구역 순위</h2>
                <p className="card-head__sub">AI 클러스터링 자동 분석 결과</p>
              </div>
              <a className="card-link">GIS 보기 <Icon name="chevron-right" size={16} /></a>
            </div>
            <div className="hot-list">
              {HOTSPOTS.map((h) => (
                <div className="hot" key={h.rank}>
                  <span className="hot__rank" style={{ background: h.accent }}>{h.rank}</span>
                  <div className="hot__body">
                    <div className="hot__name">{h.name}</div>
                    <div className="hot__meta">{h.meta}</div>
                  </div>
                  <span className={`badge badge--${h.badge}`}>{h.label}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section>
          <div className="region-head">
            <div>
              <h2 className="section-title">읍·면·동 민원 순위</h2>
              <p className="section-sub">오늘 민원 건수 · 순위 · 전기 대비 변화 비교</p>
            </div>
            <a className="card-link">전체 보기 <Icon name="chevron-right" size={16} /></a>
          </div>
          <div className="region-row">
            {REGIONS.map((r) => (
              <div className="card region" key={r.num}>
                <div className="region__top">
                  <span className="region__id">
                    <span className="region__num" style={{ background: r.accent }}>{r.num}</span>
                    <span className="region__name">{r.name}</span>
                  </span>
                  <span className={`region__trend t-${r.trend}`}>{r.trendLabel}</span>
                </div>
                <div className="region__value"><b>{r.value}</b><span>건</span></div>
                <div className="region__delta">
                  {r.delta ? <><span className={`t-${r.delta.dir}`}>{r.delta.label}</span> 전일 대비</> : '전기 동일 · 전일 대비'}
                </div>
                <div className="stackbar">
                  {r.breakdown.map((b) => (
                    <i key={b.key} style={{ width: `${b.pct}%`, background: `var(${SERIES_COLOR_VAR[b.key]})` }} />
                  ))}
                </div>
                <div className="region__breakdown">
                  {r.breakdown.map((b) => (
                    <span className="bd" key={b.key}>
                      <span className="dot" style={{ background: `var(${SERIES_COLOR_VAR[b.key]})` }} />
                      {b.label} {b.value}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="bottom-row">
          <div className="card panel">
            <div className="card-head">
              <h2 className="card-head__title"><span className="panel__icon"><Icon name="chart" size={20} /></span>분석</h2>
              <a className="card-link">전체 <Icon name="arrow-right" size={16} /></a>
            </div>
            <div className="list">
              <div className="list__row"><span className="name">연동동 정책 시뮬레이션</span><span className="badge badge--done">완료</span></div>
              <div className="list__row"><span className="name">11월 생활권 집중도 분석</span><span className="badge badge--progress">진행</span></div>
              <div className="list__row"><span className="name">요일제 적용구역 추천</span><span className="badge badge--pending">처리중</span></div>
              <div className="list__row"><span className="name">불법주차 집중구역 도출</span><span className="badge badge--done">완료</span></div>
            </div>
          </div>

          <div className="card panel">
            <div className="card-head">
              <h2 className="card-head__title"><span className="panel__icon panel__icon--green"><Icon name="document" size={20} /></span>보고서</h2>
              <a className="card-link">전체 <Icon name="arrow-right" size={16} /></a>
            </div>
            <div className="list">
              <div className="list__row"><span className="name">11월 주차민원 분석 리포트</span><span className="time">11:30</span></div>
              <div className="list__row"><span className="name">정책 시뮬레이션 효과 비교</span><span className="time">11:23</span></div>
              <div className="list__row"><span className="name">4분기 정책 보고서</span><span className="badge badge--wait">대기</span><span className="time">11:20</span></div>
              <div className="list__row"><span className="name">GIS 집중구역 현황 리포트</span><span className="time">11:20</span></div>
            </div>
          </div>

          <div className="card panel">
            <div className="card-head">
              <h2 className="card-head__title"><span className="panel__icon panel__icon--violet"><Icon name="sparkle" size={20} /></span>AI 어시스턴트</h2>
              <a className="card-link" onClick={() => goToAiInput()} style={{ cursor: 'pointer' }}>대화 열기 <Icon name="arrow-right" size={16} /></a>
            </div>
            <div className="ai-input" onClick={() => goToAiInput()} style={{ cursor: 'pointer' }}>오늘 민원 현황을 요약해줘...</div>
            <div className="ai-suggest">
              <button type="button" onClick={() => goToAiInput('불법주차 관련 조례 검색')}><Icon className="chev" name="chevron-right" size={16} />불법주차 관련 조례 검색</button>
              <button type="button" onClick={() => goToAiInput('이번 달 민원 현황 요약')}><Icon className="chev" name="chevron-right" size={16} />이번 달 민원 현황 요약</button>
              <button type="button" onClick={() => goToAiInput('공영주차장 운영 관련 지침')}><Icon className="chev" name="chevron-right" size={16} />공영주차장 운영 관련 지침</button>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
