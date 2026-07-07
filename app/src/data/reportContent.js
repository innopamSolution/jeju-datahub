// 보고서 본문에 쓰이는 공통 데이터 (대시보드 데이터와 동일한 값을 재사용)

export const REGIONS = [
  { num: 1, name: '연동',   value: 52, deltaLabel: '▲15%', dir: 'up',   breakdown: [['불법주차', 28], ['이중주차', 14], ['시설점거', 6], ['기타', 4]] },
  { num: 2, name: '노형동', value: 38, deltaLabel: '▲6%',  dir: 'up',   breakdown: [['불법주차', 21], ['이중주차', 11], ['시설점거', 4], ['기타', 2]] },
  { num: 3, name: '이도동', value: 29, deltaLabel: '▼3%',  dir: 'down', breakdown: [['불법주차', 15], ['이중주차', 8],  ['시설점거', 4], ['기타', 2]] },
  { num: 4, name: '아라동', value: 21, deltaLabel: '▼8%',  dir: 'down', breakdown: [['불법주차', 11], ['이중주차', 6],  ['시설점거', 2], ['기타', 2]] },
  { num: 5, name: '삼도동', value: 18, deltaLabel: '동일', dir: 'flat', breakdown: [['불법주차', 10], ['이중주차', 5],  ['시설점거', 2], ['기타', 1]] },
];

export const HOTSPOTS = [
  { rank: 1, name: '연동 대로변',      meta: '연동동 · 반경 200m',  level: '심각' },
  { rank: 2, name: '노형사거리 인근',   meta: '노형동 · 반경 150m',  level: '경고' },
  { rank: 3, name: '이도2동 상업지구',  meta: '이도동 · 반경 180m',  level: '경고' },
  { rank: 4, name: '아라동 주변',       meta: '아라동 · 반경 120m',  level: '주의' },
  { rank: 5, name: '삼도1동 골목',      meta: '삼도동 · 반경 100m',  level: '주의' },
];

export const RISK_SUMMARY = { 심각: 1, 경고: 2, 주의: 2, 양호: 0 };

export const TOTAL_COMPLAINTS = 247;

const COMPARE_LABEL = { 월간: '전월 대비', 반기: '전분기 대비', 연간: '전년 대비' };

/**
 * 보고서 한 건에 대한 5개 섹션 콘텐츠를 구성.
 * cycle(월간/반기/연간)에 따라 "총 민원건수" 비교 기준 라벨이 달라짐.
 */
export function buildReportContent(report) {
  const compareLabel = COMPARE_LABEL[report.cycle] || '전월 대비';
  return {
    total: {
      count: TOTAL_COMPLAINTS,
      deltaLabel: compareLabel,
      deltaValue: '+12%',
    },
    regions: REGIONS,
    hotspots: HOTSPOTS,
    risk: RISK_SUMMARY,
    overallAnalysis:
      `이번 ${report.cycle || '분석'} 기간 동안 총 민원 건수는 ${TOTAL_COMPLAINTS}건으로 ${compareLabel} 12% 증가했습니다. ` +
      `연동, 노형동을 중심으로 불법주차 민원이 집중되고 있으며, 특히 연동 대로변은 심각 단계로 분류되어 우선 대응이 필요합니다. ` +
      `전체 위험단계 발생 건수는 ${RISK_SUMMARY.심각 + RISK_SUMMARY.경고 + RISK_SUMMARY.주의}건(심각 ${RISK_SUMMARY.심각}, 경고 ${RISK_SUMMARY.경고}, 주의 ${RISK_SUMMARY.주의})으로, ` +
      `주차장 확충 및 단속 강화 등 정책적 개입이 요구되는 상황입니다.`,
  };
}
