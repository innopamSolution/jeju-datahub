import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../components/Icon';
import NotificationBell from '../components/NotificationBell';

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

const DL_ICON = (
  <svg viewBox="0 0 24 24" fill="none" width="15" height="15" aria-hidden="true">
    <path d="M12 4v9m0 0 3.5-3.5M12 13 8.5 9.5M5 18h14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const CYCLE_LABEL = { month: '매월', quarter: '1/4분기', year: '연간' };

const AUTO_ROWS = [
  { name: '2026년 3월 월간 민원 보고서',   cycle: '월간', date: '2026.04.01', status: 'done' },
  { name: '2026년 4월 월간 민원 보고서',   cycle: '월간', date: '2026.05.01', status: 'done' },
  { name: '2026년 5월 월간 민원 보고서',   cycle: '월간', date: '2026.06.01', status: 'done' },
  { name: '2026년 6월 월간 민원 보고서',   cycle: '월간', date: '2026.07.01', status: 'done' },
  { name: '2026년 1/4분기 민원 보고서',    cycle: '반기', date: '2026.04.01', status: 'wait' },
  { name: '2026년 3/4분기 민원 보고서',    cycle: '반기', date: '2026.10.01', status: 'wait' },
  { name: '2026년 반기 민원 보고서',       cycle: '반기', date: '2026.07.01', status: 'wait' },
  { name: '2026년 전체 민원 보고서',       cycle: '연간', date: '2027.01.01', status: 'wait' },
];

const MANUAL_ROWS = [
  { name: '주차장 확충 제주시 연동 150면',       period: '2026.05.28 ~ 2026.06.15', date: '2026.05.28', author: '홍길동' },
  { name: '집중 구역 분석 보고서 노형 사거리',    period: '2026.05.28 ~ 2026.06.15', date: '2026.05.28', author: '홍길동' },
  { name: '민원 현황 보고서 제주시',             period: '2026.06.22',              date: '2026.06.22', author: '홍길동' },
];

const MODAL_ROWS = [
  { name: '홍길동', dept: '(교통정책과)', cycle: '월간',   dates: ['월 1일'] },
  { name: '김지수', dept: '(주차관리)',   cycle: '1/4분기', dates: ['4월', '1일'] },
  { name: '고민호', dept: '(주차관리)',   cycle: '반기',   dates: ['7월', '1일'] },
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

export default function Reports() {
  const navigate = useNavigate();
  const [cycle, setCycle] = useState('quarter');
  const [autoPage, setAutoPage] = useState(1);
  const [manualPage, setManualPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    if (!modalOpen) return;
    document.body.style.overflow = 'hidden';
    const onKey = (e) => { if (e.key === 'Escape') setModalOpen(false); };
    document.addEventListener('keydown', onKey);
    return () => { document.body.style.overflow = ''; document.removeEventListener('keydown', onKey); };
  }, [modalOpen]);

  const autoSlice = AUTO_ROWS.slice((autoPage - 1) * PER_PAGE, autoPage * PER_PAGE);
  const manualSlice = MANUAL_ROWS.slice((manualPage - 1) * PER_PAGE, manualPage * PER_PAGE);

  return (
    <>
      <header className="topbar">
        <div>
          <h1 className="page-title">보고서 관리</h1>
          <p className="page-sub">민원 분석 결과 자동 보고서 생성 및 관리</p>
        </div>
        <div className="topbar__actions">
          <button className="btn btn--ai" type="button" onClick={() => navigate('/ai-assistant', { state: { focus: true } })}>{AI_ICON} AI 대화 시작하기</button>
          <button className="btn" type="button"><Icon name="download" size={20} /> 내보내기</button>
          <NotificationBell />
        </div>
      </header>

      <div className="content content--reports">
        <section className="rpt-top">
          {/* 자동 생성 설정 */}
          <div className="card rpt-cfg">
            <div className="rpt-cfg__head">
              <h2 className="card-head__title">보고서 자동 생성 설정</h2>
              <button className="btn-edit" type="button" onClick={() => setModalOpen(true)}>편집</button>
            </div>
            <div className="rpt-cfg__body">
              <div className="rpt-cfg__fields">
                <div className="field">
                  <label className="field__label">주기 유형</label>
                  <div className="seg-row">
                    <button className={`seg-pill${cycle === 'month' ? ' is-active' : ''}`} type="button" onClick={() => setCycle('month')}>월</button>
                    <button className={`seg-pill${cycle === 'quarter' ? ' is-active' : ''}`} type="button" onClick={() => setCycle('quarter')}>분기</button>
                    <button className={`seg-pill${cycle === 'year' ? ' is-active' : ''}`} type="button" onClick={() => setCycle('year')}>연</button>
                  </div>
                </div>
                <div className="field">
                  <label className="field__label">배포 주기</label>
                  <div className="field__select">{CYCLE_LABEL[cycle]} <Icon name="chevron-down" size={18} /></div>
                </div>
                <div className="field">
                  <label className="field__label">배포 일자</label>
                  <div className="field__dates">
                    {cycle === 'year' && <div className="field__select field__date">4월 <Icon name="chevron-down" size={18} /></div>}
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

          {/* 자동 생성 목록 */}
          <div className="card rpt-list">
            <div className="rpt-card__head"><h2 className="card-head__title">자동 생성 보고서 목록</h2></div>
            <div className="rt-wrap">
              <table className="rt">
                <thead>
                  <tr>
                    <th>보고서 명</th>
                    <th>배포 주기</th>
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
                      <td className="rt-date">{r.date}</td>
                      <td><span className={`badge badge--${r.status === 'done' ? 'done' : 'neutral'}`}>{r.status === 'done' ? '완료' : '대기'}</span></td>
                      <td className="col-center"><button className="tag">미리보기</button></td>
                      <td className="col-center"><button className="tag tag--file">{DL_ICON}<span>PDF</span></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <Pager total={AUTO_ROWS.length} page={autoPage} setPage={setAutoPage} />
            </div>
          </div>
        </section>

        {/* 직접 생성 목록 */}
        <div className="card rpt-manual">
          <div className="rpt-card__head"><h2 className="card-head__title">직접 생성 보고서 목록</h2></div>
          <div className="rt-wrap">
            <table className="rt">
              <thead>
                <tr>
                  <th>보고서 명</th>
                  <th>분석 기간</th>
                  <th>생성일</th>
                  <th>생성자</th>
                  <th className="col-center">미리보기</th>
                  <th className="col-center">다운로드</th>
                </tr>
              </thead>
              <tbody>
                {manualSlice.map((r, i) => (
                  <tr key={i}>
                    <td><span className="rt-name">{r.name}</span></td>
                    <td className="rt-date">{r.period}</td>
                    <td className="rt-date">{r.date}</td>
                    <td>{r.author}</td>
                    <td className="col-center"><button className="tag">미리보기</button></td>
                    <td className="col-center"><button className="tag tag--file">{DL_ICON}<span>PDF</span></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
            <Pager total={MANUAL_ROWS.length} page={manualPage} setPage={setManualPage} />
          </div>
        </div>
      </div>

      {/* 편집 모달 */}
      {modalOpen && (
        <div className="modal">
          <div className="modal__overlay" onClick={() => setModalOpen(false)} />
          <div className="modal__dialog" role="dialog" aria-modal="true" aria-label="자동 생성 설정 편집">
            <div className="modal__head">
              <h2 className="modal__title">자동 생성 설정 편집</h2>
              <button className="modal__close" type="button" aria-label="닫기" onClick={() => setModalOpen(false)}>
                <svg viewBox="0 0 24 24" fill="none" width="24" height="24"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
              </button>
            </div>
            <div className="modal__body">
              <table className="mt">
                <thead>
                  <tr>
                    <th>설정자</th>
                    <th>배포 주기</th>
                    <th>배포 일자</th>
                    <th className="col-center">수정</th>
                    <th className="col-center">삭제</th>
                  </tr>
                </thead>
                <tbody>
                  {MODAL_ROWS.map((r, i) => (
                    <tr key={i}>
                      <td><span className="rt-name">{r.name}</span> <span className="mt-dept">{r.dept}</span></td>
                      <td><div className="field__select field__select--sm">{r.cycle} <Icon name="chevron-down" size={18} /></div></td>
                      <td>
                        <div className="field__dates">
                          {r.dates.map((d, j) => (
                            <div key={j} className="field__select field__select--sm field__date">{d} <Icon name="chevron-down" size={18} /></div>
                          ))}
                        </div>
                      </td>
                      <td className="col-center"><button className="mt-act">수정</button></td>
                      <td className="col-center"><button className="mt-act mt-act--del">삭제</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="modal__foot">
              <button className="btn-save" type="button" onClick={() => setModalOpen(false)}>저장</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
