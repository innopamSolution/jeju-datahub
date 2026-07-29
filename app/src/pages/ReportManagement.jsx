import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import NotificationBell from '../components/NotificationBell';
import DsSelect from '../components/DsSelect';
import { isAdmin, CURRENT_USER } from '../data/currentUser';

const AI_ICON = (
  <svg viewBox="0 0 36 36" fill="none" width="24" height="24" aria-hidden="true" style={{ flexShrink: 0 }}>
    <path d="M18.6 8.4c0-2.6 2.1-4.6 4.7-4.6 0 2.6-2.1 4.6-4.7 4.6Z" fill="#3DA35D" />
    <circle cx="18" cy="21" r="12.5" fill="#F79009" />
    <circle cx="13.6" cy="19.6" r="1.4" fill="#4A3415" opacity="0.85" />
    <circle cx="22.4" cy="19.6" r="1.4" fill="#4A3415" opacity="0.85" />
    <path d="M14.9 24.2a3.9 3.9 0 0 0 6.2 0" stroke="#4A3415" strokeWidth="1.3" strokeLinecap="round" fill="none" opacity="0.85" />
  </svg>
);

const REPORT_TYPES = ['주차장 확충', '이면도로 정비', '요금제 적용', '민원현황', '집중구역분석'];
const DEPTS = ['교통정책과', '주차관리', '안전정책과', '종합민원실', '차량관리과', '전체'];
const CYCLES = ['월간', '1분기', '상반기', '연간'];
const MONTHS = Array.from({ length: 12 }, (_, i) => `${i + 1}월`);
const DAYS = Array.from({ length: 28 }, (_, i) => `${i + 1}일`);

const CONFIG_ROWS = [
  { author: '홍길동', dept: '교통정책과', cycle: '월간',   month: '월',  day: '1일', lastRun: '2026.05.01 14:21' },
  { author: '김지수', dept: '주차관리',   cycle: '1분기',  month: '4월', day: '1일', lastRun: '2026.04.01 14:21' },
  { author: '고민호', dept: '주차관리',   cycle: '상반기', month: '7월', day: '1일', lastRun: '2026.07.01 14:21' },
  { author: '김경미', dept: '전체',      cycle: '연간',   month: '1월', day: '1일', lastRun: '2026.07.31 14:21' },
];

export default function ReportManagement() {
  const navigate = useNavigate();
  const [rows, setRows] = useState(CONFIG_ROWS);
  const [reportType, setReportType] = useState(REPORT_TYPES[0]);
  const [dept, setDept] = useState(DEPTS[0]);
  const [cycle, setCycle] = useState('1분기');
  const [month, setMonth] = useState('4월');
  const [day, setDay] = useState('1일');

  const [editingIndex, setEditingIndex] = useState(null);
  const [draft, setDraft] = useState(null);

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

  const removeRow = (i) => {
    setRows((r) => r.filter((_, idx) => idx !== i));
    if (editingIndex === i) { setEditingIndex(null); setDraft(null); }
  };

  const startEdit = (i) => { setEditingIndex(i); setDraft({ ...rows[i] }); };
  const cancelEdit = () => { setEditingIndex(null); setDraft(null); };
  const saveEdit = () => {
    setRows((r) => r.map((row, idx) => (idx === editingIndex ? draft : row)));
    setEditingIndex(null);
    setDraft(null);
  };

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
        <div className="card rpt-cfg">
          <div className="rpt-cfg__head">
            <h2 className="card-head__title">보고서 자동 생성 설정</h2>
          </div>
          <div className="rpt-cfg__body">
            <div className="rpt-cfg__fields">
              <div className="field">
                <label className="field__label">정책 보고서 종류</label>
                <DsSelect value={reportType} onChange={(e) => setReportType(e.target.value)}>
                  {REPORT_TYPES.map((v) => <option key={v} value={v}>{v}</option>)}
                </DsSelect>
              </div>
              <div className="field">
                <label className="field__label">배포 부서</label>
                <DsSelect value={dept} onChange={(e) => setDept(e.target.value)}>
                  {DEPTS.map((v) => <option key={v} value={v}>{v}</option>)}
                </DsSelect>
              </div>
              <div className="field">
                <label className="field__label">배포 주기</label>
                <DsSelect value={cycle} onChange={(e) => setCycle(e.target.value)}>
                  {CYCLES.map((v) => <option key={v} value={v}>{v}</option>)}
                </DsSelect>
              </div>
              <div className="field">
                <label className="field__label">배포 일자</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  {cycle === '연간' && (
                    <DsSelect value={month} onChange={(e) => setMonth(e.target.value)}>
                      {MONTHS.map((v) => <option key={v} value={v}>{v}</option>)}
                    </DsSelect>
                  )}
                  <DsSelect value={day} onChange={(e) => setDay(e.target.value)}>
                    {DAYS.map((v) => <option key={v} value={v}>{v}</option>)}
                  </DsSelect>
                </div>
              </div>
            </div>
            <div className="rpt-cfg__foot">
              <button
                className="btn-gen"
                type="button"
                onClick={() => setRows((r) => [
                  { author: CURRENT_USER.name, dept, cycle, month: cycle === '연간' ? month : (cycle === '1분기' ? '4월' : cycle === '상반기' ? '7월' : '월'), day, lastRun: '방금 생성' },
                  ...r,
                ])}
              >
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
                {rows.map((r, i) => {
                  const isEditing = editingIndex === i;
                  if (isEditing) {
                    return (
                      <tr key={i}>
                        <td><span className="rt-name">{r.author}</span></td>
                        <td>
                          <DsSelect value={draft.dept} onChange={(e) => setDraft((d) => ({ ...d, dept: e.target.value }))}>
                            {DEPTS.map((v) => <option key={v} value={v}>{v}</option>)}
                          </DsSelect>
                        </td>
                        <td>
                          <DsSelect value={draft.cycle} onChange={(e) => setDraft((d) => ({ ...d, cycle: e.target.value }))}>
                            {CYCLES.map((v) => <option key={v} value={v}>{v}</option>)}
                          </DsSelect>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: 6 }}>
                            {draft.cycle === '연간' && (
                              <DsSelect value={draft.month} onChange={(e) => setDraft((d) => ({ ...d, month: e.target.value }))}>
                                {MONTHS.map((v) => <option key={v} value={v}>{v}</option>)}
                              </DsSelect>
                            )}
                            <DsSelect value={draft.day} onChange={(e) => setDraft((d) => ({ ...d, day: e.target.value }))}>
                              {DAYS.map((v) => <option key={v} value={v}>{v}</option>)}
                            </DsSelect>
                          </div>
                        </td>
                        <td className="rt-date">{r.lastRun}</td>
                        <td className="col-center"><button className="mt-act mt-act--save" onClick={saveEdit}>저장</button></td>
                        <td className="col-center"><button className="mt-act" onClick={cancelEdit}>취소</button></td>
                      </tr>
                    );
                  }
                  return (
                    <tr key={i}>
                      <td>{r.author}</td>
                      <td>{r.dept}</td>
                      <td>{r.cycle}</td>
                      <td>{r.month && r.cycle === '연간' ? `${r.month} ` : ''}{r.day}</td>
                      <td className="rt-date">{r.lastRun}</td>
                      <td className="col-center"><button className="mt-act" onClick={() => startEdit(i)}>수정</button></td>
                      <td className="col-center"><button className="mt-act mt-act--del" onClick={() => removeRow(i)}>삭제</button></td>
                    </tr>
                  );
                })}
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
