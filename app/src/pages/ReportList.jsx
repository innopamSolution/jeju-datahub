import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import NotificationBell from '../components/NotificationBell';
import PageCrumb from '../components/PageCrumb';
import { exportReportPdf, exportReportDocx } from '../utils/reportExport';
import ReportPreviewModal from '../components/ReportPreviewModal';
import Pager from '../components/Pager';
import DsSelect from '../components/DsSelect';
import Icon from '../components/Icon';

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
  { name: '2026년 6월 월간 민원 보고서',  cycle: '월간', author: '박서준', date: '2026.07.01', status: 'done' },
  { name: '2026년 5월 월간 민원 보고서',  cycle: '월간', author: '이수민', date: '2026.06.01', status: 'done' },
  { name: '2026년 4월 월간 민원 보고서',  cycle: '월간', author: '김지수', date: '2026.05.01', status: 'done' },
  { name: '2026년 3월 월간 민원 보고서',  cycle: '월간', author: '홍길동', date: '2026.04.01', status: 'done' },
  { name: '2026년 2월 월간 민원 보고서',  cycle: '월간', author: '박서준', date: '2026.03.01', status: 'done' },
  { name: '2026년 1월 월간 민원 보고서',  cycle: '월간', author: '이수민', date: '2026.02.01', status: 'done' },
  { name: '2025년 12월 월간 민원 보고서', cycle: '월간', author: '김지수', date: '2026.01.01', status: 'done' },
  { name: '2025년 11월 월간 민원 보고서', cycle: '월간', author: '홍길동', date: '2025.12.01', status: 'done' },
  { name: '2026년 2/4분기 민원 보고서',   cycle: '분기', author: '홍길동', date: '2026.07.01', status: 'done' },
  { name: '2026년 1/4분기 민원 보고서',   cycle: '분기', author: '홍길동', date: '2026.04.01', status: 'done' },
  { name: '2025년 4/4분기 민원 보고서',   cycle: '분기', author: '김지수', date: '2026.01.01', status: 'done' },
  { name: '2026년 상반기 민원 보고서',    cycle: '반기', author: '이수민', date: '2026.07.01', status: 'done' },
  { name: '2025년 하반기 민원 보고서',    cycle: '반기', author: '박서준', date: '2026.01.01', status: 'done' },
  { name: '2025년 전체 민원 보고서',      cycle: '연간', author: '박서준', date: '2026.01.01', status: 'done' },
];

const MANUAL_ROWS = [
  { name: '민원 현황 보고서 제주시',           source: '민원현황',        period: '2026.06.22',              date: '2026.06.22', author: '이수민' },
  { name: '주차장 확충 제주시 연동 150면',     source: '정책 시뮬레이션', period: '2026.05.28 ~ 2026.06.15', date: '2026.05.28', author: '홍길동' },
  { name: '집중 구역 분석 보고서 노형 사거리',  source: '집중구역분석',    period: '2026.05.28 ~ 2026.06.15', date: '2026.05.28', author: '김지수' },
  { name: '생활권 주차 실태 분석 이도2동',     source: '생활권 시뮬레이션', period: '2026.05.02 ~ 2026.05.20', date: '2026.05.21', author: '박서준' },
  { name: '투자 우선순위 검토 보고서 상반기',   source: '투자우선순위',    period: '2026.01.01 ~ 2026.06.30', date: '2026.05.14', author: '홍길동' },
  { name: '구역 추천 결과 보고서 아라동',      source: '구역추천',        period: '2026.04.21 ~ 2026.05.09', date: '2026.05.10', author: '이수민' },
  { name: '민원 현황 보고서 서귀포시',         source: '민원현황',        period: '2026.04.30',              date: '2026.04.30', author: '김지수' },
  { name: '정책 효과 비교 보고서 단속 강화',    source: '정책 시뮬레이션', period: '2026.03.15 ~ 2026.04.15', date: '2026.04.17', author: '박서준' },
  { name: '집중 구역 분석 보고서 연동 대로변',  source: '집중구역분석',    period: '2026.03.02 ~ 2026.03.31', date: '2026.04.02', author: '홍길동' },
  { name: '공영주차장 이용률 분석 보고서',      source: '민원현황',        period: '2026.02.01 ~ 2026.02.28', date: '2026.03.05', author: '이수민' },
  { name: '구역 추천 결과 보고서 노형동',      source: '구역추천',        period: '2026.01.12 ~ 2026.01.30', date: '2026.02.02', author: '김지수' },
  { name: '민원 현황 보고서 연간 종합',        source: '민원현황',        period: '2025.01.01 ~ 2025.12.31', date: '2026.01.15', author: '박서준' },
];

const MANUAL_SOURCES = [...new Set(MANUAL_ROWS.map((r) => r.source))];

const toDate = (s) => new Date(s.replace(/\./g, '-') + 'T00:00:00');

const PER_PAGE = 10;

export default function ReportList() {
  const navigate = useNavigate();
  const [tab, setTab] = useState('auto');
  const [autoPage, setAutoPage] = useState(1);
  const [manualPage, setManualPage] = useState(1);
  const [previewReport, setPreviewReport] = useState(null);

  /* 직접 생성 보고서 — 보고서명 검색 · 출처 · 생성일 필터 */
  const [manualRows, setManualRows] = useState(MANUAL_ROWS);
  const [mQuery, setMQuery] = useState('');
  const [mSource, setMSource] = useState('all');
  const [mFrom, setMFrom] = useState('');
  const [mTo, setMTo] = useState('');

  const filteredManual = useMemo(() => manualRows.filter((r) => {
    if (mQuery.trim() && !r.name.includes(mQuery.trim())) return false;
    if (mSource !== 'all' && r.source !== mSource) return false;
    const d = toDate(r.date);
    if (mFrom && d < new Date(mFrom + 'T00:00:00')) return false;
    if (mTo && d > new Date(mTo + 'T23:59:59')) return false;
    return true;
  }), [manualRows, mQuery, mSource, mFrom, mTo]);

  useEffect(() => { setManualPage(1); }, [mQuery, mSource, mFrom, mTo]);

  useEffect(() => {
    const pages = Math.max(1, Math.ceil(filteredManual.length / PER_PAGE));
    if (manualPage > pages) setManualPage(pages);
  }, [filteredManual.length, manualPage]);

  const autoSlice = AUTO_ROWS.slice((autoPage - 1) * PER_PAGE, autoPage * PER_PAGE);
  const manualSlice = filteredManual.slice((manualPage - 1) * PER_PAGE, manualPage * PER_PAGE);

  return (
    <>
      <header className="topbar">
        <div>
          <PageCrumb group="보고서·알림" page="보고서 목록" />
          <h1 className="page-title">보고서 목록</h1>
          <p className="page-sub">민원 분석 결과 보고서 목록</p>
        </div>
        <div className="topbar__actions">
          <button className="btn btn--ai" type="button" onClick={() => navigate('/ai-assistant', { state: { focus: true } })}>{AI_ICON} AI 대화 시작하기</button>
          <NotificationBell />
        </div>
      </header>

      <div className="content content--reports">
        {/* 목록 전환 탭 */}
        <div className="segment">
          <button
            className={`segment__btn${tab === 'auto' ? ' segment__btn--active' : ''}`}
            type="button"
            onClick={() => setTab('auto')}
          >자동 생성 보고서</button>
          <button
            className={`segment__btn${tab === 'manual' ? ' segment__btn--active' : ''}`}
            type="button"
            onClick={() => setTab('manual')}
          >직접 생성 보고서</button>
        </div>

        {/* 자동 생성 목록 */}
        {tab === 'auto' && (
        <div className="card rpt-list">
          <div className="rt-wrap">
            <table className="rt">
              <thead>
                <tr>
                  <th>보고서 명</th>
                  <th>배포 주기</th>
                  <th>생성자</th>
                  <th>생성일</th>
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
                    <td className="rt-date">{r.date}</td>
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
        )}

        {/* 직접 생성 목록 */}
        {tab === 'manual' && (
        <div className="card rpt-manual">
          <div className="rpt-toolbar">
            <div className="rpt-search">
              <Icon name="search" size={16} />
              <input
                type="text"
                placeholder="보고서명 검색"
                value={mQuery}
                onChange={(e) => setMQuery(e.target.value)}
              />
            </div>
            <span className="filterbar__label">출처</span>
            <DsSelect value={mSource} onChange={(e) => setMSource(e.target.value)}>
              <option value="all">전체</option>
              {MANUAL_SOURCES.map((v) => <option key={v} value={v}>{v}</option>)}
            </DsSelect>
            <span className="filterbar__label">생성일</span>
            <input type="date" className="rpt-date" value={mFrom} onChange={(e) => setMFrom(e.target.value)} aria-label="생성일 시작" />
            <span className="rpt-toolbar__tilde">~</span>
            <input type="date" className="rpt-date" value={mTo} onChange={(e) => setMTo(e.target.value)} aria-label="생성일 종료" />
            {(mQuery.trim() !== '' || mSource !== 'all' || mFrom !== '' || mTo !== '') && (
              <button
                className="btn"
                type="button"
                style={{ height: 40 }}
                onClick={() => { setMQuery(''); setMSource('all'); setMFrom(''); setMTo(''); }}
              >초기화</button>
            )}
          </div>
          <div className="rt-wrap">
            <table className="rt">
              <thead>
                <tr>
                  <th>보고서 명</th>
                  <th>출처</th>
                  <th>분석 기간</th>
                  <th>생성일</th>
                  <th>생성자</th>
                  <th className="col-center">미리보기</th>
                  <th className="col-center">다운로드</th>
                  <th className="col-center">삭제</th>
                </tr>
              </thead>
              <tbody>
                {manualSlice.length === 0 && (
                  <tr><td colSpan={8} style={{ textAlign: 'center', color: 'var(--text-alternative)', padding: 24 }}>조건에 맞는 보고서가 없습니다.</td></tr>
                )}
                {manualSlice.map((r, i) => (
                  <tr key={i}>
                    <td><span className="rt-name">{r.name}</span></td>
                    <td>{r.source}</td>
                    <td className="rt-date">{r.period}</td>
                    <td className="rt-date">{r.date}</td>
                    <td>{r.author}</td>
                    <td className="col-center"><button className="tag" onClick={() => setPreviewReport(r)}>미리보기</button></td>
                    <td className="col-center">
                      <div style={{ display: 'inline-flex', gap: 6 }}>
                        <button className="tag tag--file" onClick={() => exportReportPdf(r, 'save')}>{DL_ICON}<span>PDF</span></button>
                        <button className="tag tag--file" onClick={() => exportReportDocx(r)}>{DL_ICON}<span>DOCX</span></button>
                      </div>
                    </td>
                    <td className="col-center">
                      <button className="rt-del" type="button" aria-label="삭제" onClick={() => setManualRows((rows) => rows.filter((x) => x !== r))}>
                        <svg viewBox="0 0 24 24" width="16" height="16" fill="none"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <Pager total={filteredManual.length} page={manualPage} setPage={setManualPage} />
          </div>
        </div>
        )}
      </div>

      {previewReport && (
        <ReportPreviewModal report={previewReport} onClose={() => setPreviewReport(null)} />
      )}
    </>
  );
}
