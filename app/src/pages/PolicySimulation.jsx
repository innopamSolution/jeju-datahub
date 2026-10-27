import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import * as echarts from 'echarts';
import NotificationBell from '../components/NotificationBell';
import PageCrumb from '../components/PageCrumb';
import DsSelect from '../components/DsSelect';
import Icon from '../components/Icon';
import ConfirmDialog from '../components/ConfirmDialog';
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

/* 시나리오명 표기: 정책 유형 · 지역 · 방식 · 규모 · 예측 기간(공통, 항상 마지막) */
const SCENARIOS = [
  { name: '주차장 확충 · 제주시 연동 · 공한지 조성 · 150면 · 3개월', at: '2026.11.28 14:02', reduction: '-23%', improvement: '+18%', cost: '고', costLevel: 'high', recommend: true },
  { name: '이면도로 정비 · 제주시 연동 · 일방통행 · 600m · 3개월', at: '2026.11.27 16:40', reduction: '-15%', improvement: '+12%', cost: '중', costLevel: 'mid', recommend: false },
  { name: '요금제 적용 · 제주시 연동 · 요금 인상 · +10% · 3개월', at: '2026.11.27 10:15', reduction: '-12%', improvement: '+9%', cost: '저', costLevel: 'low', recommend: false },
  { name: '주차장 확충 · 제주시 노형동 · 복층화 · 80면 · 6개월', at: '2026.11.25 13:22', reduction: '-18%', improvement: '+14%', cost: '중', costLevel: 'mid', recommend: false },
  { name: '요금제 적용 · 제주 전체 1급지 · 요금 인상 · +20% · 6개월', at: '2026.11.21 15:31', reduction: '-16%', improvement: '+11%', cost: '저', costLevel: 'low', recommend: false },
];

const COST_BADGE = {
  high: { bg: 'var(--red-95)', color: 'var(--red-40)' },
  mid: { bg: 'var(--orange-95)', color: 'var(--orange-39)' },
  low: { bg: '#dcfce7', color: '#15803d' },
};

const TH = ({ center, children }) => (
  <th style={{ padding: '12px 16px', textAlign: center ? 'center' : 'left', fontSize: 13, fontWeight: 600, color: 'var(--text-neutral)', borderBottom: '1px solid var(--line-alternative)', whiteSpace: 'nowrap', background: 'var(--cool-neutral-99)', position: 'sticky', top: 0, zIndex: 1 }}>
    {children}
  </th>
);
const TD = ({ center, children }) => (
  <td style={{ padding: '14px 16px', borderBottom: '1px solid var(--line-alternative)', color: 'var(--text-neutral)', fontSize: 14, textAlign: center ? 'center' : 'left', verticalAlign: 'middle' }}>
    {children}
  </td>
);

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

// Apache Superset의 시계열 라인 차트(Time-series Line Chart)와 동일한
// 오픈소스 렌더링 엔진(Apache ECharts)을 사용해 정책 전/후 추이를 시각화
function EffectChart({ reduction = -23 }) {
  const hostRef = useRef(null);
  const chartRef = useRef(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const probe = document.createElement('span');
    probe.style.cssText = 'position:absolute;left:-9999px;top:-9999px';
    document.body.appendChild(probe);

    const months = ['1월', '2월', '3월', '4월', '5월', '6월'];
    const before = [52, 49, 55, 58, 48, 52];
    /* 선택 시나리오의 감소율을 향해 점진 수렴하는 정책 후 추이 */
    const after = before.map((v, i) => Math.round(v * (1 + (reduction / 100) * (i / (before.length - 1)))));

    const fontBody = getComputedStyle(document.documentElement).getPropertyValue('--font-body').trim();
    const cAxis = resolveColor('--text-assistive', probe);
    const cGrid = resolveColor('--line-alternative', probe);
    const cBefore = resolveColor('--cool-neutral-60', probe) || '#94a3b8';
    const cAfter = resolveColor('--primary', probe);

    const chart = echarts.init(host, null, { renderer: 'svg' });
    chartRef.current = chart;
    chart.setOption({
      color: [cBefore, cAfter],
      textStyle: { fontFamily: fontBody },
      grid: { left: 8, right: 16, top: 36, bottom: 8, containLabel: true },
      legend: {
        top: 0, right: 0, itemWidth: 10, itemHeight: 10, icon: 'roundRect',
        textStyle: { color: cAxis, fontFamily: fontBody, fontSize: 12 },
      },
      tooltip: {
        trigger: 'axis',
        backgroundColor: resolveColor('--cool-neutral-15', probe) || '#1b1c1e',
        borderWidth: 0, padding: [10, 14],
        textStyle: { color: '#fff', fontFamily: fontBody, fontSize: 13 },
        axisPointer: { type: 'line', lineStyle: { color: cGrid, width: 1 } },
        valueFormatter: (v) => `${v}건`,
      },
      xAxis: {
        type: 'category', boundaryGap: false, data: months,
        axisLine: { lineStyle: { color: cGrid } },
        axisTick: { show: false },
        axisLabel: { color: cAxis, fontSize: 12, fontFamily: fontBody, margin: 12 },
      },
      yAxis: {
        type: 'value', min: 0, max: 70, interval: 14,
        axisLine: { show: false }, axisTick: { show: false },
        splitLine: { lineStyle: { color: cGrid, type: 'solid' } },
        axisLabel: { color: cAxis, fontSize: 12, fontFamily: fontBody },
      },
      series: [
        {
          name: '정책 전', type: 'line', smooth: 0.4, symbol: 'circle', symbolSize: 6,
          showSymbol: false, lineStyle: { width: 2.5, color: cBefore, type: 'dashed' },
          itemStyle: { color: cBefore, borderColor: '#fff', borderWidth: 2 },
          emphasis: { focus: 'series' }, data: before, z: 2,
        },
        {
          name: '정책 후', type: 'line', smooth: 0.4, symbol: 'circle', symbolSize: 7,
          showSymbol: false, lineStyle: { width: 2.5, color: cAfter },
          itemStyle: { color: cAfter, borderColor: '#fff', borderWidth: 2 },
          emphasis: { focus: 'series' }, data: after, z: 3,
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: rgba(cAfter, 0.22) },
              { offset: 1, color: rgba(cAfter, 0.0) },
            ]),
          },
        },
      ],
    });

    const onResize = () => chart.resize();
    window.addEventListener('resize', onResize);

    return () => {
      window.removeEventListener('resize', onResize);
      chart.dispose();
      probe.remove();
    };
  }, [reduction]);

  return <div ref={hostRef} className="effect-chart" style={{ width: '100%', height: '100%', minHeight: 180 }} />;
}

export default function PolicySimulation() {
  const navigate = useNavigate();
  const [policyType, setPolicyType] = useState('parking');
  const [roadMethod, setRoadMethod] = useState('commercial');
  const [roadLength, setRoadLength] = useState(600);
  const [expandType, setExpandType] = useState('vacant');
  const [feeMethod, setFeeMethod] = useState('raise');   // 요금 인상 | 무료→유료 전환
  const [feeZone, setFeeZone] = useState('all');          // 적용 급지 (전체 지역 선택 시에만 노출)
  const [feeRatePct, setFeeRatePct] = useState('10');     // 인상률
  const [simCity, setSimCity] = useState('제주 전체');
  const [simDong, setSimDong] = useState('전체');
  const [exportOpen, setExportOpen] = useState(false);
  const exportRef = useRef(null);
  /* 시나리오 비교 — 행 삭제 가능, 내보낼 시나리오 선택(기본 전체 선택). 선택은 인덱스 대신 id로 추적 */
  const [scenarios, setScenarios] = useState(() => SCENARIOS.map((sc, i) => ({ ...sc, id: i })));
  const [selectedScenarios, setSelectedScenarios] = useState(() => SCENARIOS.map((_, i) => i));
  const allSelected = scenarios.length > 0 && selectedScenarios.length === scenarios.length;
  const toggleScenario = (id) => setSelectedScenarios((sel) =>
    sel.includes(id) ? sel.filter((x) => x !== id) : [...sel, id]);
  const toggleAllScenarios = () => setSelectedScenarios(allSelected ? [] : scenarios.map((sc) => sc.id));
  /* 삭제는 확인 모달을 거친다 (delTarget: 삭제 대기 중인 시나리오) */
  const [delTarget, setDelTarget] = useState(null);
  const removeScenario = (id) => {
    setScenarios((rows) => rows.filter((sc) => sc.id !== id));
    setSelectedScenarios((sel) => sel.filter((x) => x !== id));
  };
  const confirmDelete = () => {
    if (delTarget) removeScenario(delTarget.id);
    setDelTarget(null);
  };

  /* 목록에서 선택한 시나리오 — 상단 효과 예측에 반영 */
  const [activeId, setActiveId] = useState(0);
  const active = scenarios.find((sc) => sc.id === activeId) ?? scenarios[0] ?? null;

  /* 시나리오 비교 필터 — 시나리오명 첫 구간(정책 유형)별 분류 */
  const [scFilter, setScFilter] = useState('all');
  const scType = (sc) => sc.name.split(' · ')[0];
  const scCategories = [...new Set(scenarios.map(scType))].map((key) => ({
    key, count: scenarios.filter((sc) => scType(sc) === key).length,
  }));
  const visibleScenarios = scFilter === 'all' ? scenarios : scenarios.filter((sc) => scType(sc) === scFilter);
  const redPct = active ? parseInt(active.reduction, 10) : 0;
  const impPct = active ? parseInt(active.improvement, 10) : 0;
  const BASE_MONTHLY = 52;
  const BASE_CONGESTION = 0.78;
  const afterMonthly = Math.round(BASE_MONTHLY * (1 + redPct / 100));
  const afterCongestion = (BASE_CONGESTION * (1 - impPct / 100)).toFixed(2);

  useEffect(() => {
    if (!exportOpen) return;
    const onDoc = (e) => { if (exportRef.current && !exportRef.current.contains(e.target)) setExportOpen(false); };
    const onKey = (e) => { if (e.key === 'Escape') setExportOpen(false); };
    document.addEventListener('click', onDoc);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('click', onDoc); document.removeEventListener('keydown', onKey); };
  }, [exportOpen]);

  const exportData = async () => {
    const policyLabel = { parking: '주차장 확충', road: '이면도로 정비', fee: '요금제 적용' }[policyType];
    const selected = scenarios.filter((sc) => selectedScenarios.includes(sc.id));
    /* 차트 라벨용 축약: '정책 · 지역'까지만 */
    const shortName = (name) => name.split(' · ').slice(0, 2).join(' · ');
    return {
      fileBase: '정책효과_시뮬레이션',
      title: '정책효과 시뮬레이션',
      subtitle: `정책 유형: ${policyLabel}`,
      sections: [
        {
          type: 'table',
          title: '시나리오 비교',
          columns: ['순번', '시나리오', '민원 감소', '혼잡 개선', '비용 수준', '추천'],
          rows: selected.map((sc, i) => [i + 1, sc.name, sc.reduction, sc.improvement, sc.cost, sc.recommend ? '추천' : '—']),
        },
        /* 선택된 모든 시나리오를 지표별 막대 차트로 비교 (추천 시나리오는 주황색) */
        {
          type: 'chart',
          title: '시나리오별 민원 감소율 비교',
          html: hBarChartHtml(selected.map((sc) => ({
            label: shortName(sc.name), value: Math.abs(parseInt(sc.reduction, 10)),
            valueLabel: `${sc.reduction}${sc.recommend ? ' (추천)' : ''}`,
            color: sc.recommend ? '#f97316' : '#0066ff',
          }))),
        },
        {
          type: 'chart',
          title: '시나리오별 혼잡도 개선 비교',
          html: hBarChartHtml(selected.map((sc) => ({
            label: shortName(sc.name), value: Math.abs(parseInt(sc.improvement, 10)),
            valueLabel: `${sc.improvement}${sc.recommend ? ' (추천)' : ''}`,
            color: sc.recommend ? '#f97316' : '#0066ff',
          }))),
        },
      ],
    };
  };

  return (
    <>
      <header className="topbar">
        <div>
          <PageCrumb group="분석·시뮬레이션" page="정책 효과 시뮬레이션" />
          <h1 className="page-title">정책효과시뮬레이션</h1>
          <p className="page-sub" style={{ color: 'var(--orange-39)' }}>※ 참고: 가정값에 기반한 시뮬레이션 결과이며 실제 정책 효과를 보장하지 않습니다.</p>
        </div>
        <div className="topbar__actions">
          <button className="btn btn--ai" type="button" onClick={() => navigate('/ai-assistant', { state: { focus: true } })}>{AI_ICON} AI 대화 시작하기</button>
          <NotificationBell />
        </div>
      </header>

      <div className="content" style={{ gap: 20 }}>
        <section style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, alignItems: 'stretch' }}>

          {/* 정책 변수 설정 */}
          <div className="card" style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, flexWrap: 'wrap' }}>
              <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: 'var(--text-strong)' }}>정책 변수 설정</h2>
              <span style={{ fontSize: 'var(--caption1-size)', color: 'var(--text-alternative)' }}>정책 변수 입력 → 효과 예측 → 시나리오 비교</span>
            </div>

            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-neutral)', marginBottom: 8 }}>정책 유형</div>
              <div className="segment">
                {[['parking', '주차장 확충'], ['road', '이면도로 정비'], ['fee', '요금제 적용']].map(([k, l]) => (
                  <button key={k} type="button" className={`segment__btn ${policyType === k ? 'segment__btn--active' : ''}`} onClick={() => setPolicyType(k)}>{l}</button>
                ))}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-neutral)', marginBottom: 8 }}>대상 지역</div>
                <DsSelect style={{ width: '100%' }} value={simCity}
                  onChange={(e) => { setSimCity(e.target.value); setSimDong('전체'); }}>
                  <option>제주 전체</option><option>제주시</option><option>서귀포시</option>
                </DsSelect>
              </div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-neutral)', marginBottom: 8 }}>&nbsp;</div>
                <DsSelect style={{ width: '100%' }} value={simDong} disabled={simCity === '제주 전체'}
                  onChange={(e) => setSimDong(e.target.value)}>
                  <option>전체</option>
                  {(simCity === '서귀포시' ? ['동홍동', '중문동', '성산읍'] : ['연동', '노형동', '이도동', '아라동', '삼도동']).map((d) => (
                    <option key={d}>{d}</option>
                  ))}
                </DsSelect>
              </div>
            </div>

            {policyType === 'parking' && (
              <>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-neutral)', marginBottom: 8 }}>확충 방식</div>
                  <div className="segment">
                    {[['vacant', '공한지 조성'], ['multi', '복층화'], ['new', '신규 조성']].map(([k, l]) => (
                      <button key={k} type="button" className={`segment__btn ${expandType === k ? 'segment__btn--active' : ''}`} onClick={() => setExpandType(k)}>{l}</button>
                    ))}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-neutral)', marginBottom: 8 }}>주차면 증설 수</div>
                  <DsSelect style={{ width: '100%' }}>
                    <option>50면</option><option>80면</option><option>100면</option><option>150면</option><option>200면</option>
                  </DsSelect>
                </div>
              </>
            )}
            {policyType === 'road' && (
              <>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-neutral)', marginBottom: 8 }}>정비 방식</div>
                  <div className="segment" style={{ flexWrap: 'wrap', width: '100%' }}>
                    {[['commercial', '상업지역형 (주차환경개선지구)'], ['residential', '주거지역형 (주민참여형)']].map(([k, l]) => (
                      <button key={k} type="button" className={`segment__btn ${roadMethod === k ? 'segment__btn--active' : ''}`} onClick={() => setRoadMethod(k)}>{l}</button>
                    ))}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-neutral)', marginBottom: 8 }}>정비 구간 연장</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <input
                      type="number" className="form-inp" min="0" step="100"
                      style={{ width: 120, textAlign: 'right' }}
                      value={roadLength}
                      onChange={(e) => setRoadLength(Math.max(0, Number(e.target.value) || 0))}
                    />
                    <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-neutral)' }}>m</span>
                  </div>
                </div>
              </>
            )}
            {policyType === 'fee' && (
              <>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-neutral)', marginBottom: 8 }}>적용 방식</div>
                  <div className="segment">
                    {[['raise', '요금 인상'], ['convert', '무료 → 유료 전환']].map(([k, l]) => (
                      <button key={k} type="button" className={`segment__btn ${feeMethod === k ? 'segment__btn--active' : ''}`} onClick={() => setFeeMethod(k)}>{l}</button>
                    ))}
                  </div>
                </div>
                {/* 적용 급지 — 특정 읍면동이 아닌 전체 지역(제주 전체 또는 시 전체)일 때만 선택 */}
                {(simCity === '제주 전체' || simDong === '전체') && (
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-neutral)', marginBottom: 8 }}>적용 급지</div>
                    <div className="segment">
                      {[['all', '전체'], ['z1', '1급지 (동)'], ['z2', '2급지 (읍·면)']].map(([k, l]) => (
                        <button key={k} type="button" className={`segment__btn ${feeZone === k ? 'segment__btn--active' : ''}`} onClick={() => setFeeZone(k)}>{l}</button>
                      ))}
                    </div>
                  </div>
                )}
                {feeMethod === 'raise' && (
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-neutral)', marginBottom: 8 }}>인상률</div>
                    <div className="segment">
                      {[['10', '+10%'], ['20', '+20%'], ['30', '+30%']].map(([k, l]) => (
                        <button key={k} type="button" className={`segment__btn ${feeRatePct === k ? 'segment__btn--active' : ''}`} onClick={() => setFeeRatePct(k)}>{l}</button>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}

            <button className="btn-run" type="button">▷ 시뮬레이션 실행</button>
          </div>

          {/* 효과 예측 */}
          <div className="card" style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: 'var(--text-strong)' }}>효과 예측</h2>
              {active && <span style={{ fontSize: 'var(--caption1-size)', color: 'var(--text-alternative)' }}>{active.name}</span>}
              {/* 분석 근거 안내 — 호버 시 참고 사항 팝오버 */}
              <div className="freshness__ic" tabIndex={0} aria-label="분석 근거 안내" style={{ marginLeft: 'auto' }}>
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" aria-hidden="true">
                  <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
                  <circle cx="12" cy="8" r="1.3" fill="currentColor" />
                  <path d="M12 11.5v5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
                <div className="freshness__pop freshness__pop--right" role="tooltip">
                  <div className="freshness__pop-title">분석 근거</div>
                  <ul className="basis-list">
                    <li>가정값에 기반한 시뮬레이션 결과이며 실제 정책 효과를 보장하지 않습니다.</li>
                    <li>혼잡 지수는 주차 혼잡(정상 이용 + 불법주차 ÷ 공급 면수)이며 도로 통행량이 아닙니다.</li>
                    <li>점유율 실측값이 없어 설정값 0.85를 사용했습니다. 이 값이 결과를 크게 좌우합니다.</li>
                  </ul>
                </div>
              </div>
            </div>
            <div style={{ flex: 1, minHeight: 0 }}><EffectChart reduction={redPct} /></div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div style={{ padding: '16px 20px', borderRadius: 12, background: 'var(--blue-99)', border: '1px solid var(--blue-90)' }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-neutral)', marginBottom: 6 }}>민원 감소 예측</div>
                <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--primary)' }}>{active ? active.reduction : '—'}</div>
                <div style={{ fontSize: 12, color: 'var(--text-neutral)', marginTop: 4 }}>{BASE_MONTHLY}건 → {afterMonthly}건 월평균</div>
              </div>
              <div style={{ padding: '16px 20px', borderRadius: 12, background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-neutral)', marginBottom: 6 }}>혼잡도 개선</div>
                <div style={{ fontSize: 28, fontWeight: 800, color: '#16a34a' }}>{active ? active.improvement : '—'}</div>
                <div style={{ fontSize: 12, color: 'var(--text-neutral)', marginTop: 4 }}>혼잡 지수 {BASE_CONGESTION} → {afterCongestion}</div>
              </div>
            </div>
          </div>
        </section>

        {/* 시나리오 비교 — 남은 화면 높이를 채움 */}
        <div className="card" style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--line-alternative)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
              <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: 'var(--text-strong)' }}>시나리오 비교</h2>
              {/* 정책 유형별 필터: 시나리오명 첫 구간 기준, 괄호는 건수 */}
              <div className="sc-filter">
                {[['all', `전체 (${scenarios.length})`], ...scCategories.map((c) => [c.key, `${c.key} (${c.count})`])].map(([key, label]) => (
                  <button key={key} type="button" className={`sc-filter__chip${scFilter === key ? ' is-active' : ''}`}
                    onClick={() => setScFilter(key)}>{label}</button>
                ))}
              </div>
            </div>
            <div className="sim-export" ref={exportRef}>
              <button className="btn" type="button"
                style={{ height: 36, padding: '0 var(--space-12)', fontSize: 'var(--label2-size)', opacity: selectedScenarios.length === 0 ? 0.4 : 1 }}
                disabled={selectedScenarios.length === 0}
                aria-haspopup="menu" aria-expanded={exportOpen}
                onClick={(e) => { e.stopPropagation(); setExportOpen((o) => !o); }}>
                <Icon name="download" size={16} /> 내보내기 ({selectedScenarios.length})
              </button>
              {exportOpen && (
                <div className="sim-export__menu" role="menu">
                  <button type="button" role="menuitem" className="sim-export__item"
                    onClick={async () => { setExportOpen(false); exportSectionsPdf(await exportData()); }}>
                    PDF 파일 (.pdf)
                  </button>
                  <button type="button" role="menuitem" className="sim-export__item"
                    onClick={async () => { setExportOpen(false); exportSectionsDocx(await exportData()); }}>
                    Word 파일 (.docx)
                  </button>
                </div>
              )}
            </div>
          </div>
          <div style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <TH center>
                    <input type="checkbox" aria-label="전체 선택" checked={allSelected}
                      onChange={toggleAllScenarios}
                      style={{ width: 16, height: 16, accentColor: 'var(--cool-neutral-17)', cursor: 'pointer', verticalAlign: 'middle' }} />
                  </TH>
                  <TH>시나리오</TH>
                  <TH center>민원 감소</TH>
                  <TH center>혼잡 개선</TH>
                  <TH center>비용 수준</TH>
                  <TH center>추천</TH>
                  <TH center>삭제</TH>
                </tr>
              </thead>
              <tbody>
                {visibleScenarios.map((s) => (
                  <tr key={s.id}
                    onClick={() => setActiveId(s.id)}
                    style={{ cursor: 'pointer', background: active && active.id === s.id ? 'var(--blue-99)' : 'transparent' }}>
                    <TD center>
                      <input type="checkbox" aria-label={`${s.name} 선택`} checked={selectedScenarios.includes(s.id)}
                        onClick={(e) => e.stopPropagation()}
                        onChange={() => toggleScenario(s.id)}
                        style={{ width: 16, height: 16, accentColor: 'var(--cool-neutral-17)', cursor: 'pointer', verticalAlign: 'middle' }} />
                    </TD>
                    <TD>
                      <span style={{ fontWeight: 600, color: 'var(--text-strong)' }}>{s.name}</span>
                      <div style={{ fontSize: 'var(--caption1-size)', color: 'var(--text-alternative)', marginTop: 4 }}>{s.at}</div>
                    </TD>
                    <TD center><span style={{ fontWeight: 700, color: 'var(--primary)' }}>{s.reduction}</span></TD>
                    <TD center><span style={{ fontWeight: 700, color: '#16a34a' }}>{s.improvement}</span></TD>
                    <TD center>
                      <span className="badge" style={{ background: COST_BADGE[s.costLevel].bg, color: COST_BADGE[s.costLevel].color }}>{s.cost}</span>
                    </TD>
                    <TD center>
                      {s.recommend && <span className="badge" style={{ background: 'var(--blue-95)', color: 'var(--primary)', fontWeight: 700 }}>추천</span>}
                    </TD>
                    <TD center>
                      <button
                        type="button"
                        aria-label={`${s.name} 삭제`}
                        title="삭제"
                        onClick={(e) => { e.stopPropagation(); setDelTarget(s); }}
                        style={{ width: 32, height: 32, border: 'none', borderRadius: 'var(--radius-full)', background: 'none', color: 'var(--text-neutral)', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--fill-normal)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = 'none'; }}
                      >
                        <Icon name="close" size={16} />
                      </button>
                    </TD>
                  </tr>
                ))}
                {visibleScenarios.length === 0 && (
                  <tr><td colSpan={7} style={{ textAlign: 'center', color: 'var(--text-alternative)', padding: 24, fontSize: 14 }}>비교할 시나리오가 없습니다. 시뮬레이션을 실행해 시나리오를 추가하세요.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={!!delTarget}
        message="저장된 시나리오를 삭제하시겠습니까?"
        onCancel={() => setDelTarget(null)}
        onConfirm={confirmDelete}
      />
    </>
  );
}
