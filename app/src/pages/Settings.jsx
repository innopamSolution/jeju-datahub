import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../components/Icon';
import NotificationBell from '../components/NotificationBell';
import DsSelect from '../components/DsSelect';
import './Settings.css';

const AI_ICON = (
  <svg viewBox="0 0 36 36" fill="none" width="24" height="24" aria-hidden="true" style={{ flexShrink: 0 }}>
    <path d="M18.6 8.4c0-2.6 2.1-4.6 4.7-4.6 0 2.6-2.1 4.6-4.7 4.6Z" fill="#3DA35D" />
    <circle cx="18" cy="21" r="12.5" fill="#F79009" />
    <circle cx="13.6" cy="19.6" r="1.8" fill="#4A3415" />
    <circle cx="22.4" cy="19.6" r="1.8" fill="#4A3415" />
    <path d="M14.2 24.4a4.6 4.6 0 0 0 7.6 0" stroke="#4A3415" strokeWidth="1.7" strokeLinecap="round" fill="none" />
  </svg>
);

const CHECK = (
  <svg viewBox="0 0 24 24" fill="none" width="14" height="14"><path d="M5 12.5 10 17.5 19 7" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
);

/* ---------- 권한 그룹 ---------- */
const ROLES = {
  system:  { label: '시스템 관리자', dot: 'var(--violet-50)', desc: '전체 시스템 설정' },
  service: { label: '서비스 관리자', dot: 'var(--blue-50)',   desc: '보고서 · 알림 관리' },
  user:    { label: '일반 사용자',   dot: 'var(--green-50)',  desc: '대시보드 · 민원 현황 등 조회 전용' },
};

const USERS = [
  { dept: '정보화담당관', name: '오지민', email: 'jimin.oh@jeju.go.kr',    role: 'system',  last: '2026-07-21 09:12' },
  { dept: '차량관리과',   name: '김지수', email: 'jisu.kim@jeju.go.kr',    role: 'service', last: '2026-07-20 18:03' },
  { dept: '교통행정과',   name: '이준호', email: 'junho.lee@jeju.go.kr',   role: 'service', last: '2026-07-21 08:40' },
  { dept: '교통행정과',   name: '최하늘', email: 'haneul.choi@jeju.go.kr', role: 'user',    last: '2026-07-19 14:22' },
  { dept: '교통행정과',   name: '장민호', email: 'minho.jang@jeju.go.kr',  role: 'user',    last: '2026-06-30 11:05' },
  { dept: '차량관리과',   name: '김서연', email: 'seoyeon.kim@jeju.go.kr', role: 'user',    last: '2026-07-18 16:47' },
];

/* ---------- 메뉴 권한 ---------- */
const MENUS = [
  { name: '대시보드', type: '메뉴' },
  { name: '민원 현황', type: '메뉴' },
  { name: '집중구역 분석', type: '메뉴' },
  { name: '정책 시뮬레이션', type: '메뉴' },
  { name: '생활권 시뮬레이션', type: '메뉴' },
  { name: '구역 추천', type: '메뉴' },
  { name: '투자우선순위 보드', type: '메뉴' },
  { name: '보고서 목록', type: '메뉴' },
  { name: '위험단계 알림 조회', type: '메뉴' },
  { name: 'AI 어시스턴트', type: '메뉴' },
  { name: '보고서 관리', type: '관리' },
  { name: '위험단계 알림 관리', type: '관리' },
  { name: '사용자 정보 관리', type: '관리' },
  { name: '메뉴 권한 관리', type: '관리' },
  { name: '분석 지표 가중치 설정', type: '관리' },
];

/* 관리자 전용(시스템 관리자만) 메뉴 */
const SYSTEM_ONLY = ['사용자 정보 관리', '메뉴 권한 관리', '분석 지표 가중치 설정'];

const DEFAULT_PERMS = Object.fromEntries(MENUS.map((m) => [
  m.name,
  m.type === '메뉴'
    ? { system: true, service: true, user: true }
    : (SYSTEM_ONLY.includes(m.name)
        ? { system: true, service: false, user: false }
        : { system: true, service: true, user: false }),
]));

/* ---------- 분석 지표 가중치 ---------- */
const WEIGHT_MODELS = [
  {
    key: 'hotspot', label: '집중구역 분석',
    metrics: [
      { key: 'complaint', label: '민원빈도', sub: '수집플랫폼 표준 민원 데이터', value: 60 },
      { key: 'enforce',   label: '단속건수', sub: '주차관제 단속 실적',          value: 40 },
    ],
  },
  {
    key: 'recommend', label: '구역 추천',
    metrics: [
      { key: 'demand',    label: '수요밀도',  sub: '주차 수요 추정 · 유동인구',     value: 40 },
      { key: 'access',    label: '접근성',    sub: '도로망 · 도보 접근시간',        value: 30 },
      { key: 'complaint', label: '민원빈도',  sub: '수집플랫폼 표준 민원 데이터',   value: 20 },
      { key: 'cost',      label: '지가·비용', sub: '공시지가 · 조성비 추정',        value: 10 },
    ],
  },
  {
    key: 'invest', label: '투자·보강 우선순위',
    metrics: [
      { key: 'safety',    label: '안전위험도', sub: '시설물 안전점검 · 노후연수',    value: 35 },
      { key: 'complaint', label: '민원빈도',   sub: '수집플랫폼 표준 민원 데이터',   value: 25 },
      { key: 'usage',     label: '이용패턴',   sub: '주차관제 점유율 · 단속건수',    value: 20 },
      { key: 'accident',  label: '사고이력',   sub: '재난상황시스템 화재 · 출동',    value: 20 },
    ],
  },
  {
    key: 'lifestyle', label: '생활권 시뮬레이션',
    metrics: [
      { key: 'complaint',  label: '민원 건수', sub: '생활권 단위 민원 집계',  value: 40 },
      { key: 'supply',     label: '주차 수급', sub: '수요-공급 갭 분석',      value: 40 },
      { key: 'congestion', label: '혼잡도',    sub: '도로 혼잡 · 점유율',     value: 20 },
    ],
  },
];

const DEFAULT_WEIGHTS = Object.fromEntries(WEIGHT_MODELS.map((m) => [
  m.key, Object.fromEntries(m.metrics.map((x) => [x.key, x.value])),
]));

const HISTORY = [
  { at: '2026-07-23 04:10', who: '이제주 (담당자)', item: '투자·보강 우선순위', change: '안전위험도 30 → 35, 사고이력 25 → 20 (시설 노후화 반영)' },
  { at: '2026-06-11 10:32', who: '김주차 (관리자)', item: '집중구역 분석',      change: '민원 50 → 60, 단속 50 → 40 (관광성수기 반영)' },
  { at: '2026-05-02 15:07', who: '김주차 (관리자)', item: '등급 구간',          change: '심각 기준 85 → 80점 하향' },
];

const TABS = ['사용자 정보', '메뉴 권한 관리', '분석 지표 가중치 설정'];

function RoleChip({ role, sm }) {
  const r = ROLES[role];
  return (
    <span className={`st-chip${sm ? ' st-chip--sm' : ''}`}>
      <i className="st-chip__dot" style={{ background: r.dot }} />
      {r.label}
    </span>
  );
}

export default function Settings() {
  const navigate = useNavigate();
  const [tab, setTab] = useState(0);

  /* 사용자 정보 */
  const [query, setQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const filteredUsers = useMemo(() => USERS.filter((u) => {
    if (roleFilter !== 'all' && u.role !== roleFilter) return false;
    const q = query.trim();
    if (!q) return true;
    return u.name.includes(q) || u.email.includes(q) || u.dept.includes(q);
  }), [query, roleFilter]);
  const roleCounts = useMemo(() => USERS.reduce((acc, u) => ({ ...acc, [u.role]: (acc[u.role] ?? 0) + 1 }), {}), []);

  /* 메뉴 권한 관리 */
  const [selMenu, setSelMenu] = useState(MENUS[0].name);
  const [perms, setPerms] = useState(DEFAULT_PERMS);
  const [permSaved, setPermSaved] = useState(false);
  const togglePerm = (role) => {
    setPermSaved(false);
    setPerms((p) => ({ ...p, [selMenu]: { ...p[selMenu], [role]: !p[selMenu][role] } }));
  };
  const savePerms = () => {
    setPermSaved(true);
    setTimeout(() => setPermSaved(false), 2000);
  };

  /* 분석 지표 가중치 */
  const [model, setModel] = useState('invest');
  const [weights, setWeights] = useState(DEFAULT_WEIGHTS);
  const curModel = WEIGHT_MODELS.find((m) => m.key === model);
  const curWeights = weights[model];
  const sum = Object.values(curWeights).reduce((a, b) => a + b, 0);
  const setWeight = (metricKey, v) => {
    const n = Math.max(0, Math.min(100, Math.round(Number(v) || 0)));
    setWeights((w) => ({ ...w, [model]: { ...w[model], [metricKey]: n } }));
  };

  return (
    <>
      <header className="topbar">
        <div>
          <h1 className="page-title">설정</h1>
          <p className="page-sub">사용자 정보 · 메뉴 권한 · 분석 지표 가중치 관리</p>
        </div>
        <div className="topbar__actions">
          <button className="btn btn--ai" type="button" onClick={() => navigate('/ai-assistant', { state: { focus: true } })}>{AI_ICON} AI 대화 시작하기</button>
          <NotificationBell />
        </div>
      </header>

      <div className="content" style={{ paddingTop: 24 }}>
        <div className="card st-body">
          {/* 탭 */}
          <div className="segment">
            {TABS.map((t, i) => (
              <button key={t} type="button" className={`segment__btn${tab === i ? ' segment__btn--active' : ''}`} onClick={() => setTab(i)}>
                {t}
              </button>
            ))}
          </div>

          {/* ---------- 탭 1: 사용자 정보 ---------- */}
          {tab === 0 && (
            <>
              <div className="st-roles">
                {Object.entries(ROLES).map(([key, r]) => (
                  <div key={key} className="st-role">
                    <div className="st-role__top">
                      <RoleChip role={key} />
                      <span className="st-role__count">
                        <span className="st-role__num">{roleCounts[key] ?? 0}</span>
                        <span className="st-role__unit">명</span>
                      </span>
                    </div>
                    <div className="st-role__desc">{r.desc}</div>
                  </div>
                ))}
              </div>

              <div className="st-toolbar">
                <div className="st-search">
                  <Icon name="search" size={16} />
                  <input
                    type="text"
                    placeholder="이름 · 이메일 · 소속 검색"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                  />
                </div>
                <DsSelect value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
                  <option value="all">전체 권한 그룹</option>
                  {Object.entries(ROLES).map(([key, r]) => <option key={key} value={key}>{r.label}</option>)}
                </DsSelect>
              </div>

              <div className="st-table-wrap">
                <table className="st-table">
                  <thead>
                    <tr>
                      <th style={{ width: 140 }}>소속</th>
                      <th style={{ width: 90 }}>이름</th>
                      <th>이메일</th>
                      <th style={{ width: 140 }}>권한 그룹</th>
                      <th style={{ width: 150 }}>최근 접속</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((u) => (
                      <tr key={u.email}>
                        <td>{u.dept}</td>
                        <td className="st-td-name">{u.name}</td>
                        <td className="st-td-dim">{u.email}</td>
                        <td><RoleChip role={u.role} sm /></td>
                        <td className="st-td-dim">{u.last}</td>
                      </tr>
                    ))}
                    {filteredUsers.length === 0 && (
                      <tr><td colSpan={5} style={{ textAlign: 'center', color: 'var(--text-alternative)', padding: 24 }}>검색 결과가 없습니다.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* ---------- 탭 2: 메뉴 권한 관리 ---------- */}
          {tab === 1 && (
            <>
              <p className="st-hint">왼쪽 목록에서 메뉴를 선택하면 오른쪽에서 해당 메뉴의 사용 권한 그룹을 지정할 수 있습니다.</p>
              <div className="st-perm">
                <div className="st-menu-card">
                  <div className="st-menu-head"><span>메뉴명</span><span>구분</span></div>
                  <div className="st-menu-list">
                    {MENUS.map((m) => (
                      <button
                        key={m.name}
                        type="button"
                        className={`st-menu-row${selMenu === m.name ? ' st-menu-row--on' : ''}`}
                        onClick={() => { setSelMenu(m.name); setPermSaved(false); }}
                      >
                        <span>{m.name}</span>
                        <span className={`st-tag${m.type === '관리' ? ' st-tag--manage' : ''}`}>{m.type}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="st-assign">
                  <div>
                    <h3 className="st-assign__title">‘{selMenu}’ 접근 권한</h3>
                    <p className="st-assign__sub">이 메뉴를 사용할 권한 그룹을 선택하세요.</p>
                  </div>
                  <div className="st-opts">
                    {Object.entries(ROLES).map(([key, r]) => {
                      const on = perms[selMenu][key];
                      return (
                        <button key={key} type="button" className={`st-opt${on ? ' st-opt--on' : ''}`} onClick={() => togglePerm(key)}>
                          <span className={`st-chk${on ? ' st-chk--on' : ''}`}>{CHECK}</span>
                          {r.label}
                        </button>
                      );
                    })}
                  </div>
                  <div className="st-savewrap">
                    {permSaved && <span className="st-saved">저장되었습니다</span>}
                    <button type="button" className="btn-save" style={{ height: 41 }} onClick={savePerms}>권한 저장</button>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* ---------- 탭 3: 분석 지표 가중치 설정 ---------- */}
          {tab === 2 && (
            <>
              <p className="st-hint">
                분석 모델별 종합점수 산출에 사용되는 지표와 가중치를 지역 여건에 맞게 조정할 수 있습니다. 변경 내역은 이력으로 기록되며 이전 설정으로 되돌릴 수 있습니다.
              </p>

              <div className="st-sec">
                <div>
                  <h3 className="st-sec__title">종합점수 가중치</h3>
                  <p className="st-sec__sub">
                    조정할 분석 모델을 선택한 뒤, 각 지표가 종합점수에 반영되는 비율을 입력합니다. 합계가 100%가 아니면 저장되지 않으며, 원천 데이터가 없는 지표는 자동 비활성 후 나머지 지표로 재정규화됩니다.
                  </p>
                </div>

                <div className="segment">
                  {WEIGHT_MODELS.map((m) => (
                    <button key={m.key} type="button" className={`segment__btn${model === m.key ? ' segment__btn--active' : ''}`} onClick={() => setModel(m.key)}>
                      {m.label}
                    </button>
                  ))}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {curModel.metrics.map((x) => {
                    const v = curWeights[x.key];
                    return (
                      <div key={x.key} className="st-w-row">
                        <div className="st-w-info">
                          <div className="st-w-name">{x.label}</div>
                          <div className="st-w-sub">{x.sub}</div>
                        </div>
                        <input
                          type="range"
                          className="st-range"
                          min="0" max="100" step="5"
                          value={v}
                          style={{ '--pct': `${v}%` }}
                          onChange={(e) => setWeight(x.key, e.target.value)}
                        />
                        <span className="st-num">
                          <input type="text" inputMode="numeric" value={v} onChange={(e) => setWeight(x.key, e.target.value)} />
                          <span>%</span>
                        </span>
                      </div>
                    );
                  })}
                </div>

                <div className="st-sum">
                  <div>
                    <div className="st-w-name">가중치 합계</div>
                    <div className="st-w-sub">합계가 100%가 아니면 저장 버튼이 비활성화됩니다.</div>
                  </div>
                  <span className={`st-sum__badge${sum !== 100 ? ' st-sum__badge--err' : ''}`}>{sum}%</span>
                </div>
              </div>

              <div className="st-sec">
                <div>
                  <h3 className="st-sec__title">설정 변경 이력</h3>
                  <p className="st-sec__sub">
                    가중치 · 임계값 변경 시 변경자와 사유가 기록되며, 이전 설정으로 되돌릴 수 있습니다. 분석 결과에는 산출 당시의 설정 스냅샷이 함께 저장됩니다.
                  </p>
                </div>
                <div className="st-table-wrap">
                  <table className="st-table">
                    <thead>
                      <tr>
                        <th style={{ width: 150 }}>변경 일시</th>
                        <th style={{ width: 130 }}>변경자</th>
                        <th style={{ width: 180 }}>변경 항목</th>
                        <th>변경 내용</th>
                      </tr>
                    </thead>
                    <tbody>
                      {HISTORY.map((h) => (
                        <tr key={h.at}>
                          <td className="st-td-dim">{h.at}</td>
                          <td>{h.who}</td>
                          <td>{h.item}</td>
                          <td className="st-td-dim" style={{ whiteSpace: 'normal' }}>{h.change}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="st-actions">
                <button type="button" className="btn" onClick={() => setWeights(DEFAULT_WEIGHTS)}>기본값으로 초기화</button>
                <button type="button" className="btn-save" style={{ height: 41 }} disabled={sum !== 100}>설정 저장</button>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
