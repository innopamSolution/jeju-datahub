/* 데이터별 기준일·갱신 주기 (데이터 연동 전 목업 값) */
const SOURCES = [
  { name: '민원 (안전신문고 신고)', date: '2025.12.01 14:32', cycle: '실시간' },
  { name: '민원 (전화·방문 접수)', date: '2025.11.30', cycle: '일 1회' },
  { name: '민원 (감정 분석)', date: '2025.12.01', cycle: '일 1회' },
  { name: '단속', date: '2025.11월', cycle: '월 1회' },
  { name: '공영주차장', date: '2026.04.16', cycle: '수시' },
];

/* 헤더 서브 문구: 가장 최신 갱신 시각만 보여주고,
   ⓘ 호버 시 데이터별 기준일 팝오버를 띄운다 (데이터마다 갱신 주기가 다름)
   props 로 갱신 시각·표 제목·헤더·목록을 바꿔 화면별로 재사용한다. */
export default function DataFreshness({
  updated = '2025.12.01 · 14:32',
  title = '데이터 기준일',
  cols = ['데이터', '기준일', '갱신 주기'],
  sources = SOURCES,
}) {
  return (
    <div className="page-sub freshness">
      최근 갱신 {updated}
      <div className="freshness__ic" tabIndex={0} aria-label="데이터 기준일 안내">
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" aria-hidden="true">
          <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
          <circle cx="12" cy="8" r="1.3" fill="currentColor" />
          <path d="M12 11.5v5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
        <div className="freshness__pop" role="tooltip">
          <div className="freshness__pop-title">{title}</div>
          <table className="freshness__table">
            <thead>
              <tr>{cols.map((c, i) => <th key={i}>{c}</th>)}</tr>
            </thead>
            <tbody>
              {sources.map((s) => (
                <tr key={s.name}>
                  {[s.name, s.date, s.cycle].slice(0, cols.length).map((v, i) => <td key={i}>{v}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
