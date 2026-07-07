import { useEffect } from 'react';
import { buildReportContent } from '../data/reportContent';
import { exportReportPdf, exportReportDocx } from '../utils/reportExport';

const LEVEL_COLOR = { 심각: '#e5322a', 경고: '#d4780a', 주의: '#0066ff', 양호: '#0da34e' };
const META_LABEL = { cycle: '배포 주기', period: '분석 기간', date: '생성일', author: '생성자', status: '상태' };
const STATUS_LABEL = { done: '완료', wait: '대기' };

export default function ReportPreviewModal({ report, onClose }) {
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => { document.body.style.overflow = ''; document.removeEventListener('keydown', onKey); };
  }, [onClose]);

  if (!report) return null;
  const { total, regions, hotspots, risk, overallAnalysis } = buildReportContent(report);

  const metaEntries = Object.entries(report).filter(([k]) => k in META_LABEL);

  return (
    <div className="modal">
      <div className="modal__overlay" onClick={onClose} />
      <div className="modal__dialog" role="dialog" aria-modal="true" aria-label="보고서 미리보기" style={{ maxWidth: 760 }}>
        <div className="modal__head">
          <h2 className="modal__title">보고서 미리보기</h2>
          <button className="modal__close" type="button" aria-label="닫기" onClick={onClose}>
            <svg viewBox="0 0 24 24" fill="none" width="24" height="24"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
          </button>
        </div>

        <div className="modal__body" style={{ maxHeight: '70vh' }}>
          <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 4, color: 'var(--text-strong)' }}>{report.name}</div>
          <div style={{ fontSize: 12, color: 'var(--text-assistive)', marginBottom: 4 }}>제주 주차민원분석 솔루션 · 자동 생성 보고서</div>
          <div style={{ fontSize: 12, color: 'var(--text-assistive)', marginBottom: 20 }}>
            {metaEntries.map(([k, v], i) => (
              <span key={k} style={{ marginRight: 16 }}>
                {META_LABEL[k]}: <b style={{ color: 'var(--text-neutral)' }}>{STATUS_LABEL[v] ?? v}</b>
              </span>
            ))}
          </div>

          <SectionTitle>1. 총 민원 건수</SectionTitle>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 24, padding: '16px 18px', background: 'var(--blue-99)', borderRadius: 10 }}>
            <span style={{ fontSize: 28, fontWeight: 800, color: 'var(--text-strong)' }}>{total.count}건</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--primary)' }}>↗ {total.deltaValue}</span>
            <span style={{ fontSize: 12, color: 'var(--text-assistive)' }}>{total.deltaLabel}</span>
          </div>

          <SectionTitle>2. 지역별 민원현황</SectionTitle>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, marginBottom: 24 }}>
            <thead>
              <tr style={{ background: 'var(--fill-normal)' }}>
                <Th>순위</Th><Th>지역</Th><Th align="right">민원 건수</Th><Th align="right">전기 대비</Th><Th>세부 유형</Th>
              </tr>
            </thead>
            <tbody>
              {regions.map((r) => (
                <tr key={r.num}>
                  <Td>{r.num}</Td>
                  <Td><b>{r.name}</b></Td>
                  <Td align="right">{r.value}건</Td>
                  <Td align="right" color={r.dir === 'up' ? '#e5322a' : r.dir === 'down' ? 'var(--primary)' : 'var(--text-assistive)'}>{r.deltaLabel}</Td>
                  <Td color="var(--text-assistive)">{r.breakdown.map(([l, v]) => `${l} ${v}`).join(' · ')}</Td>
                </tr>
              ))}
            </tbody>
          </table>

          <SectionTitle>3. 민원집중구역</SectionTitle>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, marginBottom: 24 }}>
            <thead>
              <tr style={{ background: 'var(--fill-normal)' }}>
                <Th>순위</Th><Th>위치</Th><Th>위치 설명</Th><Th align="center">위험도</Th>
              </tr>
            </thead>
            <tbody>
              {hotspots.map((h) => (
                <tr key={h.rank}>
                  <Td>{h.rank}</Td>
                  <Td><b>{h.name}</b></Td>
                  <Td color="var(--text-assistive)">{h.meta}</Td>
                  <Td align="center">
                    <span style={{ display: 'inline-block', padding: '2px 10px', borderRadius: 999, fontSize: 11, fontWeight: 700, color: '#fff', background: LEVEL_COLOR[h.level] }}>{h.level}</span>
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>

          <SectionTitle>4. 위험단계 현황</SectionTitle>
          <div style={{ display: 'flex', gap: 10, marginBottom: 24 }}>
            {Object.entries(risk).map(([label, cnt]) => (
              <div key={label} style={{ flex: 1, padding: 14, borderRadius: 10, background: 'var(--fill-normal)', textAlign: 'center' }}>
                <div style={{ fontSize: 11, color: 'var(--text-assistive)', marginBottom: 4 }}>{label}</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: LEVEL_COLOR[label] }}>{cnt}건</div>
              </div>
            ))}
          </div>

          <SectionTitle>5. 전체 분석 내용</SectionTitle>
          <div style={{ fontSize: 13, lineHeight: 1.7, color: 'var(--text-neutral)', padding: '16px 18px', background: 'var(--fill-normal)', borderRadius: 10 }}>
            {overallAnalysis}
          </div>
        </div>

        <div className="modal__foot modal__foot--split">
          <button className="btn" type="button" style={{ height: 44 }} onClick={onClose}>닫기</button>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn-save" type="button" onClick={() => exportReportPdf(report, 'save')}>PDF 다운로드</button>
            <button className="btn-save" type="button" onClick={() => exportReportDocx(report)}>DOCX 다운로드</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function SectionTitle({ children }) {
  return (
    <div style={{ fontSize: 15, fontWeight: 700, margin: '0 0 10px', borderLeft: '4px solid var(--primary)', paddingLeft: 10, color: 'var(--text-strong)' }}>
      {children}
    </div>
  );
}

function Th({ children, align = 'left' }) {
  return <th style={{ padding: '8px 10px', textAlign: align, borderBottom: '1px solid var(--line-alternative)', color: 'var(--text-alternative)', fontWeight: 600 }}>{children}</th>;
}

function Td({ children, align = 'left', color }) {
  return <td style={{ padding: '8px 10px', textAlign: align, borderBottom: '1px solid var(--line-alternative)', color: color || 'var(--text-neutral)' }}>{children}</td>;
}
