import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../components/Icon';
import NotificationBell from '../components/NotificationBell';
import { isAdmin } from '../data/currentUser';

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

const CONFIG_ROWS = [
  { author: '홍길동', dept: '교통정책과', cycle: '월간',   dates: ['월', '1일'],  lastRun: '2026.05.01 14:21' },
  { author: '김지수', dept: '주차관리',   cycle: '1분기',  dates: ['4월', '1일'], lastRun: '2026.04.01 14:21' },
  { author: '고민호', dept: '주차관리',   cycle: '상반기', dates: ['7월', '1일'], lastRun: '2026.07.01 14:21' },
  { author: '김경미', dept: '전체',      cycle: '연간',   dates: ['1월', '1일'], lastRun: '2026.07.31 14:21' },
];

export default function ReportManagement() {
  const navigate = useNavigate();
  const [rows, setRows] = useState(CONFIG_ROWS);

  if (!isAdmin()) {
    return (
      <>
        <header className="topbar">
          <div>
            <h1 className="page-title">보고서 관리</h1>
            <p className="page-sub">민원 분석 결과 자동 보고서 생성 및 관리</p>
          </div>
          <div className="topbar__actions">
            <NotificationBell />
          </div>
        </header>
        <div className="content" style={{ padding: 40 }}>
          <p style={{ color: 'var(--text-alternative)' }}>이 페이지는 관리자만 사용할 수 있습니다.</p>
        </div>
      </>
    );
  }

  const removeRow = (i) => setRows((r) => r.filter((_, idx) => idx !== i));

  return (
    <>
      <header className="topbar">
        <div>
          <h1 className="page-title">보고서 관리</h1>
          <p className="page-sub">민원 분석 결과 자동 보고서 생성 및 관리</p>
        </div>
        <div className="topbar__actions">
          <button className="btn btn--ai" type="button" onClick={() => navigate('/ai-assistant', { state: { focus: true } })}>{AI_ICON} AI 대화 시작하기</button>
          <NotificationBell />
        </div>
      </header>

      <div className="content content--reports">
        {/* 보고서 자동 생성 설정 */}
        <div className="card rpt-cfg" style={{ maxWidth: 420 }}>
          <div className="rpt-cfg__head">
            <h2 className="card-head__title">보고서 자동 생성 설정</h2>
          </div>
          <div className="rpt-cfg__body" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
            <div className="rpt-cfg__fields" style={{ flexDirection: 'column', alignItems: 'stretch', gap: 16 }}>
              <div className="field">
                <label className="field__label">정책 보고서 종류</label>
                <div className="field__select">주차장 확충 <Icon name="chevron-down" size={18} /></div>
              </div>
              <div className="field">
                <label className="field__label">배포 부서</label>
                <div className="field__select">교통정책과 <Icon name="chevron-down" size={18} /></div>
              </div>
              <div className="field">
                <label className="field__label">배포 주기 / 배포 일자</label>
                <div className="field__dates">
                  <div className="field__select field__date">1분기 <Icon name="chevron-down" size={18} /></div>
                  <div className="field__select field__date">4월 <Icon name="chevron-down" size={18} /></div>
                  <div className="field__select field__date">1일 <Icon name="chevron-down" size={18} /></div>
                </div>
              </div>
            </div>
            <div className="rpt-cfg__foot">
              <button className="btn-gen" type="button">
                <svg viewBox="0 0 24 24" fill="none" width="18" height="18"><path d="M8 5v14l11-7z" fill="currentColor" /></svg> 보고서 자동 생성
              </button>
            </div>
          </div>
        </div>

        {/* 자동 생성 설정 목록 */}
        <div className="card rpt-list">
          <div className="rpt-card__head"><h2 className="card-head__title">자동 생성 설정 목록</h2></div>
          <div className="rt-wrap">
            <table className="mt">
              <thead>
                <tr>
                  <th>생성자</th>
                  <th>배포 부서</th>
                  <th>배포 주기</th>
                  <th>배포 일자</th>
                  <th>최근 생성 일시</th>
                  <th className="col-center">수정</th>
                  <th className="col-center">삭제</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={i}>
                    <td>{r.author}</td>
                    <td>{r.dept}</td>
                    <td>{r.cycle}</td>
                    <td>{r.dates.join(' ')}</td>
                    <td className="rt-date">{r.lastRun}</td>
                    <td className="col-center"><button className="mt-act">수정</button></td>
                    <td className="col-center"><button className="mt-act mt-act--del" onClick={() => removeRow(i)}>삭제</button></td>
                  </tr>
                ))}
                {rows.length === 0 && (
                  <tr><td colSpan={7} style={{ textAlign: 'center', color: 'var(--text-alternative)', padding: 20 }}>등록된 자동 생성 설정이 없습니다.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}
