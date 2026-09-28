/* 데이터별 기준일·갱신 주기 (데이터 연동 전 목업 값) */
const SOURCES = [
  { name: '민원 (안전신문고 신고)', date: '2025.12.01 14:32', cycle: '실시간' },
  { name: '민원 (전화·방문 접수)', date: '2025.11.30', cycle: '일 1회' },
  { name: '민원 (감정 분석)', date: '2025.12.01', cycle: '일 1회' },
  { name: '단속', date: '2025.11월', cycle: '월 1회' },
  { name: '공영주차장', date: '2026.04.16', cycle: '수시' },
];

/* 헤더 서브 문구: 가장 최신 갱신 시각만 보여주고,
   ⓘ 호버 시 데이터별 기준일 팝오버를 띄운다 (데이터마다 갱신 주기가 다름) */
export default function DataFreshness() {
  return (
    <p className="page-sub freshness">
      최근 갱신 2025.12.01 · 14:32
      <span className="freshness__ic" tabIndex={0} aria-label="데이터 기준일 안내">
        <Icon name="info" size={14} />
        <span className="freshness__pop" role="tooltip">
          <span className="freshness__pop-title">데이터 기준일</span>
          <table className="freshness__table">
            <thead>
              <tr><th>데이터</th><th>기준일</th><th>갱신 주기</th></tr>
            </thead>
            <tbody>
              {SOURCES.map((s) => (
                <tr key={s.name}>
                  <td>{s.name}</td>
                  <td>{s.date}</td>
                  <td>{s.cycle}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </span>
      </span>
    </p>
  );
}
