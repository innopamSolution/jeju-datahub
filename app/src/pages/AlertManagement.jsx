import { useState } from 'react';
import Icon from '../components/Icon';

const INIT_RECEIVERS = [
  { dept: '주차관리', name: '김지수', email: 'jisu.kim@jeju.go.kr', groups: ['severe', 'warn'], active: true },
  { dept: '주차관리', name: '김서연', email: 'seoyeon.kim@jeju.go.kr', groups: ['caution'], active: true },
  { dept: '교통정책과', name: '이준호', email: 'junho.lee@jeju.go.kr', groups: ['warn'], active: false },
  { dept: '교통정책과', name: '최하늘', email: 'haneul.choi@jeju.go.kr', groups: ['caution'], active: true },
  { dept: '교통정책과', name: '장민호', email: 'minho.jang@jeju.go.kr', groups: ['warn'], active: false },
  { dept: '정보화', name: '오지민', email: 'jimin.oh@jeju.go.kr', groups: ['caution'], active: true },
];

const CRITERIA = [
  { level: 'severe', label: '심각', badge: 'badge--severe', threshold: '90건 이상' },
  { level: 'warn', label: '경고', badge: 'badge--warn', threshold: '60건 이상' },
  { level: 'caution', label: '주의', badge: 'badge--caution', threshold: '30건 이상' },
];

const GROUP_BADGE = { severe: 'badge--severe', warn: 'badge--warn', caution: 'badge--caution' };
const GROUP_LABEL = { severe: '심각', warn: '경고', caution: '주의' };

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

function Switch({ on, onToggle }) {
  return (
    <button
      role="switch"
      aria-checked={on}
      onClick={onToggle}
      type="button"
      style={{ position: 'relative', width: 44, height: 24, borderRadius: 12, border: 'none', background: on ? 'var(--primary)' : 'var(--cool-neutral-80)', cursor: 'pointer', flexShrink: 0, transition: 'background 0.2s' }}
    >
      <span style={{ position: 'absolute', top: 3, left: on ? 23 : 3, width: 18, height: 18, borderRadius: '50%', background: '#fff', transition: 'left 0.2s', boxShadow: '0 1px 4px rgba(0,0,0,0.2)' }} />
    </button>
  );
}

const TH = ({ center, children }) => (
  <th style={{ padding: '12px 16px', textAlign: center ? 'center' : 'left', fontSize: 13, fontWeight: 600, color: 'var(--text-alternative)', borderBottom: '1px solid var(--line-alternative)', whiteSpace: 'nowrap', background: 'var(--cool-neutral-99)' }}>
    {children}
  </th>
);
const TD = ({ center, children }) => (
  <td style={{ padding: '14px 16px', borderBottom: '1px solid var(--line-alternative)', color: 'var(--text-neutral)', fontSize: 14, textAlign: center ? 'center' : 'left', verticalAlign: 'middle' }}>
    {children}
  </td>
);

export default function AlertManagement() {
  const [receivers, setReceivers] = useState(INIT_RECEIVERS);

  const toggle = (i) => setReceivers((r) => r.map((x, idx) => idx === i ? { ...x, active: !x.active } : x));
  const remove = (i) => setReceivers((r) => r.filter((_, idx) => idx !== i));

  return (
    <>
      <header className="topbar">
        <div>
          <h1 className="page-title">위험단계 알림 관리</h1>
          <p className="page-sub">민원 급증·위험 단계별 알림 기준 및 수신자 관리</p>
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
        <section style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 20, alignItems: 'start' }}>

          {/* 수신자 관리 */}
          <div className="card" style={{ overflow: 'hidden' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--line-alternative)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: 'var(--text-strong)' }}>수신자 관리</h2>
              <button type="button" style={{ height: 34, padding: '0 16px', borderRadius: 8, border: '1px solid var(--primary)', background: 'var(--blue-99)', color: 'var(--primary)', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>＋ 수신자 추가</button>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr><TH>소속</TH><TH>이름</TH><TH>이메일</TH><TH>단계 그룹</TH><TH center>활성화</TH><TH center>삭제</TH></tr>
              </thead>
              <tbody>
                {receivers.map((r, i) => (
                  <tr key={i}>
                    <TD>{r.dept}</TD>
                    <TD><span style={{ fontWeight: 600, color: 'var(--text-strong)' }}>{r.name}</span></TD>
                    <TD><span style={{ fontSize: 13, color: 'var(--text-assistive)' }}>{r.email}</span></TD>
                    <TD>
                      <span style={{ display: 'inline-flex', gap: 4 }}>
                        {r.groups.map((g) => (
                          <span key={g} className={`badge ${GROUP_BADGE[g]}`}>{GROUP_LABEL[g]}</span>
                        ))}
                      </span>
                    </TD>
                    <TD center><Switch on={r.active} onToggle={() => toggle(i)} /></TD>
                    <TD center>
                      <button type="button" onClick={() => remove(i)} style={{ height: 28, padding: '0 12px', borderRadius: 6, border: '1px solid var(--red-80)', background: 'var(--red-99)', color: 'var(--red-40)', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>삭제</button>
                    </TD>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* 알림 기준 */}
          <div className="card" style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
              <div>
                <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: 'var(--text-strong)' }}>알림 기준</h2>
                <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--text-alternative)' }}>민원건수·위험도 등 알림 발생 기준 단계 설정</p>
              </div>
              <button type="button" style={{ height: 32, padding: '0 14px', borderRadius: 8, border: '1px solid var(--line-normal)', background: 'none', fontSize: 13, fontWeight: 600, cursor: 'pointer', color: 'var(--text-neutral)', flexShrink: 0 }}>설정</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {CRITERIA.map((c) => (
                <div key={c.level} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 0', borderBottom: '1px solid var(--line-alternative)' }}>
                  <span className={`badge ${c.badge}`} style={{ flexShrink: 0 }}>{c.label}</span>
                  <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-strong)' }}>{c.threshold}</span>
                </div>
              ))}
            </div>
          </div>

        </section>
      </div>
    </>
  );
}
