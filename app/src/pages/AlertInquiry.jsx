import { useState } from 'react';
import Icon from '../components/Icon';
import DsSelect from '../components/DsSelect';

const ALERT_DATA = [
  { level: 'severe', region: '연동', content: '민원 급증 심각 단계 감지 — 시간당 102건', datetime: '2026.06.22 14:30', count: 102 },
  { level: 'warn', region: '노형동', content: '민원 급증 경고 단계 감지 — 시간당 67건', datetime: '2026.06.22 11:15', count: 67 },
  { level: 'caution', region: '이도동', content: '민원 증가 주의 단계 감지 — 시간당 35건', datetime: '2026.06.21 16:45', count: 35 },
  { level: 'warn', region: '아라동', content: '민원 급증 경고 단계 감지 — 시간당 72건', datetime: '2026.06.21 09:20', count: 72 },
  { level: 'caution', region: '삼도동', content: '민원 증가 주의 단계 감지 — 시간당 31건', datetime: '2026.06.20 15:00', count: 31 },
  { level: 'severe', region: '연동', content: '민원 급증 심각 단계 감지 — 시간당 98건', datetime: '2026.06.18 13:10', count: 98 },
  { level: 'warn', region: '오라동', content: '민원 급증 경고 단계 감지 — 시간당 63건', datetime: '2026.06.15 10:30', count: 63 },
  { level: 'caution', region: '용담동', content: '민원 증가 주의 단계 감지 — 시간당 33건', datetime: '2026.06.10 08:50', count: 33 },
];

const LEVEL_BADGE = { severe: 'badge--severe', warn: 'badge--warn', caution: 'badge--caution' };
const LEVEL_LABEL = { severe: '심각', warn: '경고', caution: '주의' };

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

export default function AlertInquiry() {
  const [levelFilter, setLevelFilter] = useState('all');
  const [period, setPeriod] = useState('3');

  const filtered = levelFilter === 'all' ? ALERT_DATA : ALERT_DATA.filter((a) => a.level === levelFilter);
  const totalComplaints = filtered.reduce((s, a) => s + a.count, 0);

  return (
    <>
      <header className="topbar">
        <div>
          <h1 className="page-title">위험단계 알림 조회</h1>
          <p className="page-sub">민원 급증·위험 단계별 알림 이력 조회</p>
        </div>
        <div className="topbar__actions">
          <button className="btn btn--ai" type="button">{AI_ICON} AI 대화 시작하기</button>
          <button className="btn" type="button"><Icon name="download" size={20} /> 내보내기</button>
          <button className="bell" type="button" aria-label="알림">
            <Icon name="bell" size={22} /><span className="bell__badge">3</span>
          </button>
        </div>
      </header>

      <div className="filterbar" style={{ flexWrap: 'wrap', gap: 12 }}>
        <span className="filterbar__label">단계</span>
        <div className="segment">
          {[['all', '전체'], ['severe', '심각'], ['warn', '경고'], ['caution', '주의']].map(([k, l]) => (
            <button key={k} type="button" className={`segment__btn ${levelFilter === k ? 'segment__btn--active' : ''}`} onClick={() => setLevelFilter(k)}>{l}</button>
          ))}
        </div>
        <span className="filter-sep" />
        <span className="filterbar__label">시/도</span>
        <DsSelect>
          <option>전체</option><option>제주시</option><option>서귀포시</option>
        </DsSelect>
        <DsSelect>
          <option>읍면동 전체</option>
        </DsSelect>
        <span className="filter-sep" />
        <span className="filterbar__label">기간</span>
        <div className="segment">
          {[['yesterday', '어제'], ['week', '최근 1주일'], ['1', '최근 1개월'], ['3', '최근 3개월']].map(([k, l]) => (
            <button key={k} type="button" className={`segment__btn ${period === k ? 'segment__btn--active' : ''}`} onClick={() => setPeriod(k)}>{l}</button>
          ))}
        </div>
        <button className="btn" type="button" style={{ height: 40 }}>
          <Icon name="calendar" size={18} /> 기간 선택
        </button>
        <span className="filterbar__right">조회 결과 <strong>{filtered.length}건</strong></span>
      </div>

      <div className="content">
        <section className="stat-row">
          <div className="card stat">
            <div className="stat__icon stat__icon--blue"><Icon name="bell" size={28} /></div>
            <div>
              <div className="stat__label">조회 알림 건수</div>
              <div className="stat__value">{filtered.length}<span style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-alternative)', marginLeft: 4 }}>건</span></div>
              <div className="stat__delta">선택 조건 기준</div>
            </div>
          </div>
          <div className="card stat">
            <div className="stat__icon stat__icon--red"><Icon name="warning" size={28} /></div>
            <div>
              <div className="stat__label">심각 단계</div>
              <div className="stat__value">{filtered.filter((a) => a.level === 'severe').length}<span style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-alternative)', marginLeft: 4 }}>건</span></div>
              <div className="stat__delta">경고 {filtered.filter((a) => a.level === 'warn').length} · 주의 {filtered.filter((a) => a.level === 'caution').length}</div>
            </div>
          </div>
          <div className="card stat">
            <div className="stat__icon" style={{ width: 72, height: 72, borderRadius: 16, background: 'var(--orange-95)', color: 'var(--orange-39)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Icon name="chart" size={28} />
            </div>
            <div>
              <div className="stat__label">누적 민원 수</div>
              <div className="stat__value">{totalComplaints}<span style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-alternative)', marginLeft: 4 }}>건</span></div>
              <div className="stat__delta">선택 기간 합계</div>
            </div>
          </div>
        </section>

        <div className="card" style={{ overflow: 'hidden' }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--line-alternative)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: 'var(--text-strong)' }}>알림 이력</h2>
            <span style={{ fontSize: 13, color: 'var(--text-assistive)' }}>상단 필터 조건에 따라 자동 갱신</span>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr><TH center>단계</TH><TH center>지역</TH><TH>내용</TH><TH center>일시</TH><TH center>민원 수</TH></tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={5} style={{ padding: 40, textAlign: 'center', color: 'var(--text-assistive)' }}>조건에 해당하는 알림이 없습니다.</td></tr>
              ) : filtered.map((a, i) => (
                <tr key={i}>
                  <TD center><span className={`badge ${LEVEL_BADGE[a.level]}`}>{LEVEL_LABEL[a.level]}</span></TD>
                  <TD center><span style={{ fontWeight: 600 }}>{a.region}</span></TD>
                  <TD>{a.content}</TD>
                  <TD center gray>{a.datetime}</TD>
                  <TD center><span style={{ fontWeight: 700, color: 'var(--text-strong)' }}>{a.count}건</span></TD>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
