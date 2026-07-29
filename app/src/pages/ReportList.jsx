import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import NotificationBell from '../components/NotificationBell';
import { exportReportPdf, exportReportDocx } from '../utils/reportExport';
import ReportPreviewModal from '../components/ReportPreviewModal';

const AI_ICON = (
  <svg viewBox="0 0 36 36" fill="none" width="24" height="24" aria-hidden="true" style={{ flexShrink: 0 }}>
    <path d="M18.6 8.4c0-2.6 2.1-4.6 4.7-4.6 0 2.6-2.1 4.6-4.7 4.6Z" fill="#3DA35D" />
    <circle cx="18" cy="21" r="12.5" fill="#F79009" />
    <circle cx="13.6" cy="19.6" r="1.4" fill="#4A3415" opacity="0.85" />
    <circle cx="22.4" cy="19.6" r="1.4" fill="#4A3415" opacity="0.85" />
    <path d="M14.9 24.2a3.9 3.9 0 0 0 6.2 0" stroke="#4A3415" strokeWidth="1.3" strokeLinecap="round" fill="none" opacity="0.85" />
  </svg>
);

const DL_ICON = (
  <svg viewBox="0 0 24 24" fill="none" width="15" height="15" aria-hidden="true">
    <path d="M12 4v9m0 0 3.5-3.5M12 13 8.5 9.5M5 18h14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const AUTO_ROWS = [
  { name: '2026년 3월 월간 민원 보고서', cycle: '월간', author: '홍길동', dept: '교통정책과', date: '2026.04.01', status: 'done' },
  { name: '2026년 4월 월간 민원 보고서', cycle: '월간', author: '김지수', dept: '주차관리과', date: '2026.05.01', status: 'done' },
  { name: '2026년 5월 월간 민원 보고서', cycle: '월간', author: '이수민', dept: '안전정책과', date: '2026.06.01', status: 'done' },
  { name: '2026년 6월 월간 민원 보고서', cycle: '월간', author: '박서준', dept: '종합민원실', date: '2026.07.01', status: 'done' },
  { name: '2026년 1/4분기 민원 보고서', cycle: '반기', author: '홍길동', dept: '교통정책과', date: '2026.04.01', status: 'wait' },
  { name: '2026년 3/4분기 민원 보고서', cycle: '반기', author: '김지수', dept: '주차관리과', date: '2026.10.01', status: 'wait' },
  { name: '2026년 반기 민원 보고서',    cycle: '반기', author: '이수민', dept: '안전정책과', date: '2026.07.01', status: 'wait' },
  { name: '2026년 전체 민원 보고서',    cycle: '연간', author: '박서준', dept: '종합민원실', date: '2027.01.01', status: 'wait' },
];

const MANUAL_ROWS = [
  { name: '주차장 확충 제주시 연동 150면',    source: '정책 시뮬레이션', period: '2026.05.28 ~ 2026.06.15', date: '2026.05.28', author: '홍길동', dept: '차량관리과' },
  { name: '집중 구역 분석 보고서 노형 사거리', source: '집중구역분석',    period: '2026.05.28 ~ 2026.06.15', date: '2026.05.28', author: '김지수', dept: '교통행정과' },
  { name: '민원 현황 보고서 제주시',          source: '민원현황',        period: '2026.06.22',              date: '2026.06.22', author: '이수민', dept: '종합민원실' },
];

const PER_PAGE = 5;

function Pager({ total, page, setPage }) {
  const pages = Math.ceil(total / PER_PAGE);
  if (pages <= 1) return null;
  return (
    <div className="pager">
      <button className="pager__btn pager__btn--nav" disabled={page === 1} onClick={() => setPage(page - 1)}>‹</button>
      {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
        <button key={p} className={`pager__btn${p === page ? ' is-active' : ''}`} onClick={() => setPage(p)}>{p}</button>
      ))}
      <button className="pager__btn pager__btn--nav" disabled={page === pages} onClick={() => setPage(page + 1)}>›</button>
    </div>
  );
}

export default function ReportList() {
  const navigate = useNavigate();
  const [autoPage, setAutoPage] = useState(1);
  const [manualPage, setManualPage] = useState(1);
  const [previewReport, setPreviewReport] = useState(null);

  const autoSlice = AUTO_ROWS.slice((autoPage - 1) * PER_PAGE, autoPage * PER_PAGE);
  const manualSlice = MANUAL_ROWS.slice((manualPage - 1) * PER_PAGE, manualPage * PER_PAGE);

  return (
    <>
      <header className="topbar">
        <div>
          <h1 className="page-title">보고서 목록</h1>
          <p className="page-sub">민원 분석 결과 보고서 목록</p>
        </div>
        <div className="topbar__actions">
          <button className="btn btn--ai" type="button" onClick={() => navigate('/ai-assistant', { state: { focus: true } })}>{AI_ICON} AI 대화 시작하기</button>
          <NotificationBell />
        </div>
      </header>

      <div className="content content--reports">
        {/* 자동 생성 목록 */}
        <div className="card rpt-list">
          <div className="rpt-card__head"><h2 className="card-head__title">자동 생성 보고서 목록</h2></div>
          <div className="rt-wrap">
            <table className="rt">
              <thead>
                <tr>
                  <th>보고서 명</th>
                  <th>배포 주기</th>
                  <th>생성자</th>
                  <th>배포 부서</th>
                  <th>생성일</th>
                  <th>상태</th>
                  <th className="col-center">미리보기</th>
                  <th className="col-center">다운로드</th>
                </tr>
              </thead>
              <tbody>
                {autoSlice.map((r, i) => (
                  <tr key={i}>
                    <td><span className="rt-name">{r.name}</span></td>
                    <td>{r.cycle}</td>
                    <td>{r.author}</td>
                    <td>{r.dept}</td>
                    <td className="rt-date">{r.date}</td>
                    <td><span className={`badge badge--${r.status === 'done' ? 'done' : 'neutral'}`}>{r.status === 'done' ? '완료' : '대기'}</span></td>
                    <td className="col-center"><button className="tag" onClick={() => setPreviewReport(r)}>미리보기</button></td>
                    <td className="col-center">
                      <div style={{ display: 'inline-flex', gap: 6 }}>
                        <button className="tag tag--file" onClick={() => exportReportPdf(r, 'save')}>{DL_ICON}<span>PDF</span></button>
                        <button className="tag tag--file" onClick={() => exportReportDocx(r)}>{DL_ICON}<span>DOCX</span></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <Pager total={AUTO_ROWS.length} page={autoPage} setPage={setAutoPage} />
          </div>
        </div>

        {/* 직접 생성 목록 */}
        <div className="card rpt-manual">
          <div className="rpt-card__head"><h2 className="card-head__title">직접 생성 보고서 목록</h2></div>
          <div className="rt-wrap">
            <table className="rt">
              <thead>
                <tr>
                  <th>보고서 명</th>
                  <th>출처</th>
                  <th>분석 기간</th>
                  <th>생성일</th>
                  <th>생성자</th>
                  <th>배포 부서</th>
                  <th className="col-center">미리보기</th>
                  <th className="col-center">다운로드</th>
                </tr>
              </thead>
              <tbody>
                {manualSlice.map((r, i) => (
                  <tr key={i}>
                    <td><span className="rt-name">{r.name}</span></td>
                    <td>{r.source}</td>
                    <td className="rt-date">{r.period}</td>
                    <td className="rt-date">{r.date}</td>
                    <td>{r.author}</td>
                    <td>{r.dept}</td>
                    <td className="col-center"><button className="tag" onClick={() => setPreviewReport(r)}>미리보기</button></td>
                    <td className="col-center">
                      <div style={{ display: 'inline-flex', gap: 6 }}>
                        <button className="tag tag--file" onClick={() => exportReportPdf(r, 'save')}>{DL_ICON}<span>PDF</span></button>
                        <button className="tag tag--file" onClick={() => exportReportDocx(r)}>{DL_ICON}<span>DOCX</span></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <Pager total={MANUAL_ROWS.length} page={manualPage} setPage={setManualPage} />
          </div>
        </div>
      </div>

      {previewReport && (
        <ReportPreviewModal report={previewReport} onClose={() => setPreviewReport(null)} />
      )}
    </>
  );
}
