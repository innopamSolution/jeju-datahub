import { useState } from 'react';
import Icon from '../components/Icon';

const AUTO_REPORTS = [
  { name: '2026년 3월 월간 민원 보고서', cycle: '월간', date: '2026.04.01', status: 'done' },
  { name: '2026년 4월 월간 민원 보고서', cycle: '월간', date: '2026.05.01', status: 'done' },
  { name: '2026년 5월 월간 민원 보고서', cycle: '월간', date: '2026.06.01', status: 'done' },
  { name: '2026년 6월 월간 민원 보고서', cycle: '월간', date: '2026.07.01', status: 'done' },
  { name: '2026년 1/4분기 민원 보고서', cycle: '반기', date: '2026.04.01', status: 'wait' },
  { name: '2026년 3/4분기 민원 보고서', cycle: '반기', date: '2026.10.01', status: 'wait' },
  { name: '2026년 반기 민원 보고서', cycle: '반기', date: '2026.07.01', status: 'wait' },
  { name: '2026년 전체 민원 보고서', cycle: '연간', date: '2027.01.01', status: 'wait' },
];

const MANUAL_REPORTS = [
  { name: '주차장 확충 제주시 연동 150면', period: '2026.05.28 ~ 2026.06.15', date: '2026.05.28', author: '홍길동' },
  { name: '집중 구역 분석 보고서 노형 사거리', period: '2026.05.28 ~ 2026.06.15', date: '2026.05.28', author: '홍길동' },
  { name: '민원 현황 보고서 제주시', period: '2026.06.22', date: '2026.06.22', author: '홍길동' },
];

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

const TH = ({ center, children }) => (
  <th style={{ padding: '12px 16px', textAlign: center ? 'center' : 'left', fontSize: 13, fontWeight: 600, color: 'var(--text-alternative)', borderBottom: '1px solid var(--line-alternative)', whiteSpace: 'nowrap', background: 'var(--cool-neutral-99)' }}>
    {children}
  </th>
);
const TD = ({ center, gray, children }) => (
  <td style={{ padding: '14px 16px', borderBottom: '1px solid var(--line-alternative)', color: gray ? 'var(--text-assistive)' : 'var(--text-neutral)', fontSize: gray ? 13 : 14, textAlign: center ? 'center' : 'left', verticalAlign: 'middle' }}>
    {children}
  </td>
);

function FileTag({ children, file }) {
  return (
    <button type="button" style={{ height: 28, padding: '0 12px', borderRadius: 6, border: '1px solid var(--line-normal)', background: file ? 'var(--blue-95)' : 'var(--fill-normal)', color: file ? 'var(--blue-45)' : 'var(--text-neutral)', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
      {children}
    </button>
  );
}

export default function Reports() {
  const [cycle, setCycle] = useState('quarter');

  return (
    <>
      <header className="topbar">
        <div>
          <h1 className="page-title">보고서 관리</h1>
          <p className="page-sub">민원 분석 결과 자동 보고서 생성 및 관리</p>
        </div>
        <div className="topbar__actions">
          <button className="btn btn--ai" type="button">{AI_ICON} AI 대화 시작하기</button>
          <button className="btn" type="button"><Icon name="download" size={20} /> 내보내기</button>
          <button className="bell" type="button" aria-label="알림">
            <Icon name="bell" size={22} /><span className="bell__badge">3</span>
          </button>
        </div>
      </header>

      <div className="content" style={{ paddingTop: 24 }}>

        {/* 상단: 설정 카드 + 자동 생성 목록 */}
        <section style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 20, alignItems: 'start' }}>

          {/* 보고서 자동 생성 설정 */}
          <div className="card" style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: 'var(--text-strong)' }}>보고서 자동 생성 설정</h2>
              <button type="button" style={{ height: 32, padding: '0 14px', borderRadius: 8, border: '1px solid var(--line-normal)', background: 'none', fontSize: 13, fontWeight: 600, cursor: 'pointer', color: 'var(--text-neutral)' }}>편집</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-alternative)', marginBottom: 8 }}>주기 유형</div>
                <div className="segment">
                  {[['month', '월'], ['quarter', '분기'], ['year', '연']].map(([k, l]) => (
                    <button key={k} type="button" className={`segment__btn ${cycle === k ? 'segment__btn--active' : ''}`} onClick={() => setCycle(k)}>{l}</button>
                  ))}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-alternative)', marginBottom: 8 }}>배포 주기</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, height: 40, padding: '0 14px', border: '1px solid var(--line-normal)', borderRadius: 8, fontSize: 14, background: 'var(--fill-normal)', cursor: 'pointer' }}>
                  1/4분기 <Icon name="chevron-down" size={16} />
                </div>
              </div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-alternative)', marginBottom: 8 }}>배포 일자</div>
                <div style={{ display: 'flex', gap: 8 }}>
                  {['4월', '1일'].map((v) => (
                    <div key={v} style={{ display: 'flex', alignItems: 'center', gap: 6, height: 40, padding: '0 14px', border: '1px solid var(--line-normal)', borderRadius: 8, fontSize: 14, background: 'var(--fill-normal)', cursor: 'pointer' }}>
                      {v} <Icon name="chevron-down" size={16} />
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <button type="button" style={{ height: 44, borderRadius: 10, border: 'none', background: 'var(--primary)', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <svg viewBox="0 0 24 24" fill="none" width="16" height="16"><path d="M8 5v14l11-7z" fill="currentColor" /></svg>
              보고서 자동 생성
            </button>
          </div>

          {/* 자동 생성 보고서 목록 */}
          <div className="card" style={{ overflow: 'hidden' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--line-alternative)' }}>
              <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: 'var(--text-strong)' }}>자동 생성 보고서 목록</h2>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr><TH>보고서 명</TH><TH>배포 주기</TH><TH>생성일</TH><TH>상태</TH><TH center>미리보기</TH><TH center>다운로드</TH></tr></thead>
              <tbody>
                {AUTO_REPORTS.map((r, i) => (
                  <tr key={i}>
                    <TD><span style={{ fontWeight: 600, color: 'var(--text-strong)' }}>{r.name}</span></TD>
                    <TD>{r.cycle}</TD>
                    <TD gray>{r.date}</TD>
                    <TD><span className={r.status === 'done' ? 'badge badge--done' : 'badge badge--wait'}>{r.status === 'done' ? '완료' : '대기'}</span></TD>
                    <TD center><FileTag>미리보기</FileTag></TD>
                    <TD center><FileTag file>PDF</FileTag></TD>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* 직접 생성 보고서 목록 */}
        <div className="card" style={{ overflow: 'hidden' }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--line-alternative)' }}>
            <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: 'var(--text-strong)' }}>직접 생성 보고서 목록</h2>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr><TH>보고서 명</TH><TH>분석 기간</TH><TH>생성일</TH><TH>생성자</TH><TH center>미리보기</TH><TH center>다운로드</TH></tr></thead>
            <tbody>
              {MANUAL_REPORTS.map((r, i) => (
                <tr key={i}>
                  <TD><span style={{ fontWeight: 600, color: 'var(--text-strong)' }}>{r.name}</span></TD>
                  <TD gray>{r.period}</TD>
                  <TD gray>{r.date}</TD>
                  <TD>{r.author}</TD>
                  <TD center><FileTag>미리보기</FileTag></TD>
                  <TD center><FileTag file>PDF</FileTag></TD>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>
    </>
  );
}
