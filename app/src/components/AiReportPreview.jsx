/* AI 어시스턴트 채팅에서 "리포트 생성 →" 클릭 시 뜨는 리포트 미리보기 모달.
   Figma UI-PAR-005_AI어시스턴트_보고서 / ReportPreview_Overlay 설계 반영. */
export default function AiReportPreview({ report, onClose }) {
  if (!report) return null;
  const maxVal = Math.max(...report.chart.map((c) => c.value));

  return (
    <div className="modal">
      <div className="modal__overlay" onClick={onClose} />
      <div className="modal__dialog modal__dialog--sm" role="dialog" aria-modal="true" aria-label="리포트 미리보기">
        <div className="modal__head">
          <h2 className="modal__title" style={{ fontSize: 'var(--headline1-size)' }}>리포트 미리보기</h2>
          <button type="button" className="modal__close" aria-label="닫기" onClick={onClose}>✕</button>
        </div>

        <div className="modal__body ai-rpt-body">
          <div className="ai-rpt-doc">
            <h2 className="ai-rpt-doc__title">{report.title}</h2>
            <p className="ai-rpt-doc__meta">{report.meta}</p>
            <div className="ai-rpt-doc__rule" />
          </div>

          <div className="ai-rpt-kpis">
            {report.kpis.map((k) => (
              <div key={k.label} className="ai-rpt-kpi">
                <span className="ai-rpt-kpi__label">{k.label}</span>
                <span className="ai-rpt-kpi__value">{k.value}</span>
                <span className="ai-rpt-kpi__delta">{k.delta}</span>
              </div>
            ))}
          </div>

          <div className="ai-rpt-summary">
            <h3 className="ai-rpt-summary__title">핵심 요약</h3>
            <p className="ai-rpt-summary__body">{report.summary}</p>
          </div>

          <div className="ai-rpt-chart">
            <h3 className="ai-rpt-chart__title">{report.chartTitle}</h3>
            {report.chart.map((c) => (
              <div key={c.label} className="ai-rpt-chart__row">
                <span className="ai-rpt-chart__label">{c.label}</span>
                <div className="ai-rpt-chart__track">
                  <div className="ai-rpt-chart__bar" style={{ width: `${(c.value / maxVal) * 100}%` }} />
                </div>
                <span className="ai-rpt-chart__val">{c.value}{report.chartUnit ?? '건'}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
