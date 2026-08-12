import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../components/Icon';
import NotificationBell from '../components/NotificationBell';
import PageCrumb from '../components/PageCrumb';
import Pager from '../components/Pager';

const AI_ICON = (
  <svg viewBox="0 0 36 36" fill="none" width="24" height="24" aria-hidden="true" style={{ flexShrink: 0 }}>
    <path d="M18.6 8.4c0-2.6 2.1-4.6 4.7-4.6 0 2.6-2.1 4.6-4.7 4.6Z" fill="#3DA35D" />
    <circle cx="18" cy="21" r="12.5" fill="#F79009" />
    <circle cx="13.6" cy="19.6" r="1.4" fill="#4A3415" opacity="0.85" />
    <circle cx="22.4" cy="19.6" r="1.4" fill="#4A3415" opacity="0.85" />
    <path d="M14.9 24.2a3.9 3.9 0 0 0 6.2 0" stroke="#4A3415" strokeWidth="1.3" strokeLinecap="round" fill="none" opacity="0.85" />
  </svg>
);

const INITIAL_RECEIVERS = [
  { dept: '주차관리',   name: '김지수', email: 'jisu.kim@jeju.go.kr',     region: '제주시 연동',   groups: ['severe', 'warn'], on: true },
  { dept: '주차관리',   name: '김서연', email: 'seoyeon.kim@jeju.go.kr',  region: '제주시 노형동', groups: ['caution'],        on: true },
  { dept: '교통정책과', name: '이준호', email: 'junho.lee@jeju.go.kr',    region: '제주시 전체',   groups: ['warn'],           on: false },
  { dept: '교통정책과', name: '최하늘', email: 'haneul.choi@jeju.go.kr',  region: '전체 지역',     groups: ['caution'],        on: true },
  { dept: '교통정책과', name: '장민호', email: 'minho.jang@jeju.go.kr',   region: '서귀포시 전체', groups: ['warn'],           on: false },
  { dept: '정보화',     name: '오지민', email: 'jimin.oh@jeju.go.kr',     region: '전체 지역',     groups: ['caution'],        on: true },
  { dept: '주차관리',   name: '박도윤', email: 'doyun.park@jeju.go.kr',   region: '제주시 이도동', groups: ['severe'],         on: true },
  { dept: '안전정책과', name: '정예린', email: 'yerin.jung@jeju.go.kr',   region: '제주시 아라동', groups: ['warn', 'caution'], on: true },
  { dept: '안전정책과', name: '한지우', email: 'jiwoo.han@jeju.go.kr',    region: '서귀포시 성산읍', groups: ['severe'],       on: false },
  { dept: '종합민원실', name: '문서준', email: 'seojun.moon@jeju.go.kr',  region: '전체 지역',     groups: ['warn'],           on: true },
  { dept: '종합민원실', name: '강하은', email: 'haeun.kang@jeju.go.kr',   region: '제주시 삼도동', groups: ['caution'],        on: true },
  { dept: '정보화',     name: '윤시우', email: 'siwoo.yoon@jeju.go.kr',   region: '서귀포시 중문동', groups: ['warn'],         on: false },
];

const PER_PAGE = 10;

const GROUP_META = {
  severe:  { label: '심각', badge: 'badge--severe' },
  warn:    { label: '경고', badge: 'badge--warn' },
  caution: { label: '주의', badge: 'badge--caution' },
};

const CRIT_LEVELS = [
  { key: 'severe',  label: '심각', badge: 'badge--severe' },
  { key: 'warn',    label: '경고', badge: 'badge--warn' },
  { key: 'caution', label: '주의', badge: 'badge--caution' },
];

const DONGS = {
  제주시: ['연동', '노형동', '이도동', '아라동', '삼도동', '애월읍'],
  서귀포시: ['성산읍', '중문동', '효돈동'],
};

export default function AlertManagement() {
  const navigate = useNavigate();
  const [receivers, setReceivers] = useState(INITIAL_RECEIVERS);
  const [addOpen, setAddOpen] = useState(false);
  const [critOpen, setCritOpen] = useState(false);
  const [crit, setCrit] = useState({ severe: 30, warn: 20, caution: 10 });
  const [critDraft, setCritDraft] = useState({ severe: 30, warn: 20, caution: 10 });
  const [addCity, setAddCity] = useState('전체');
  const [addDong, setAddDong] = useState('전체');
  const [addGroups, setAddGroups] = useState({ severe: true, warn: false, caution: false });

  useEffect(() => {
    const open = addOpen || critOpen;
    if (!open) return;
    document.body.style.overflow = 'hidden';
    const onKey = (e) => { if (e.key === 'Escape') { setAddOpen(false); setCritOpen(false); } };
    document.addEventListener('keydown', onKey);
    return () => { document.body.style.overflow = ''; document.removeEventListener('keydown', onKey); };
  }, [addOpen, critOpen]);

  const toggleSwitch = (i) => setReceivers((rs) => rs.map((r, j) => (j === i ? { ...r, on: !r.on } : r)));
  const removeRow = (i) => setReceivers((rs) => rs.filter((_, j) => j !== i));

  const openCrit = () => { setCritDraft(crit); setCritOpen(true); };
  const saveCrit = () => { setCrit(critDraft); setCritOpen(false); };

  return (
    <>
      <header className="topbar">
        <div>
          <PageCrumb group="보고서·알림" page="위험단계 알림 관리" />
          <h1 className="page-title">위험단계 알림 관리</h1>
          <p className="page-sub">민원 급증·위험 단계별 알림 기준 및 수신자 관리</p>
        </div>
        <div className="topbar__actions">
          <button className="btn btn--ai" type="button" onClick={() => navigate('/ai-assistant', { state: { focus: true } })}>{AI_ICON} AI 대화 시작하기</button>
          <NotificationBell />
        </div>
      </header>

      <div className="content content--manage">
        <section className="manage-row">
          {/* 수신자 관리 */}
          <div className="card recv-card">
            <div className="recv-card__head">
              <h2 className="card-head__title">수신자 관리</h2>
              <button className="btn-edit" type="button" onClick={() => setAddOpen(true)}>＋ 수신자 추가</button>
            </div>
            <div className="rt-wrap">
              <table className="rt">
                <thead>
                  <tr>
                    <th>소속</th>
                    <th>이름</th>
                    <th>이메일</th>
                    <th>지역</th>
                    <th>단계 그룹</th>
                    <th className="col-center">활성화</th>
                    <th className="col-center">삭제</th>
                  </tr>
                </thead>
                <tbody>
                  {receivers.map((r, i) => (
                    <tr key={i}>
                      <td>{r.dept}</td>
                      <td><span className="rt-name">{r.name}</span></td>
                      <td className="rt-email">{r.email}</td>
                      <td>{r.region}</td>
                      <td>
                        <span className="grp-set">
                          {r.groups.map((g) => (
                            <span key={g} className={`badge ${GROUP_META[g].badge}`}>{GROUP_META[g].label}</span>
                          ))}
                        </span>
                      </td>
                      <td className="col-center">
                        <button className={`switch${r.on ? ' is-on' : ''}`} role="switch" aria-checked={r.on} aria-label="활성화" onClick={() => toggleSwitch(i)}>
                          <span className="switch__knob" />
                        </button>
                      </td>
                      <td className="col-center"><button className="mt-act mt-act--del" onClick={() => removeRow(i)}>삭제</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* 알림 기준 */}
          <div className="card crit-card">
            <div className="crit-card__head">
              <div className="crit-card__heading">
                <h2 className="card-head__title">알림 기준</h2>
                <p className="crit-card__sub">민원 증가율 기준 알림 발생 단계 설정</p>
              </div>
              <button className="btn-edit" type="button" onClick={openCrit}>설정</button>
            </div>
            <div className="crit-list">
              {CRIT_LEVELS.map((c) => (
                <div key={c.key} className="crit-row">
                  <span className={`badge ${c.badge} crit-row__tag`}>{c.label}</span>
                  <span className="crit-row__view">{crit[c.key]}% 이상</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>

      {/* 수신자 추가 모달 */}
      {addOpen && (
        <div className="modal">
          <div className="modal__overlay" onClick={() => setAddOpen(false)} />
          <div className="modal__dialog modal__dialog--sm" role="dialog" aria-modal="true" aria-label="수신자 추가">
            <div className="modal__head">
              <h2 className="modal__title">수신자 추가</h2>
              <button className="modal__close" type="button" aria-label="닫기" onClick={() => setAddOpen(false)}>
                <svg viewBox="0 0 24 24" fill="none" width="24" height="24"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
              </button>
            </div>
            <div className="modal__body">
              <div className="form-field">
                <label className="form-field__label">소속</label>
                <div className="ds-select form-field__select">
                  <select aria-label="소속">
                    <option>주차관리</option>
                    <option>교통정책과</option>
                    <option>정보화</option>
                  </select>
                  <span className="ds-select__ic"><Icon name="chevron-down" size={18} /></span>
                </div>
              </div>
              <div className="form-field">
                <label className="form-field__label">이름</label>
                <input type="text" className="form-inp" placeholder="이름 입력" />
              </div>
              <div className="form-field">
                <label className="form-field__label">이메일</label>
                <input type="email" className="form-inp" placeholder="name@jeju.go.kr" />
              </div>
              <div className="form-field">
                <label className="form-field__label">지역</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <div className="ds-select form-field__select" style={{ flex: 1 }}>
                    <select aria-label="시/도" value={addCity}
                      onChange={(e) => { setAddCity(e.target.value); setAddDong('전체'); }}>
                      <option value="전체">전체</option>
                      <option value="제주시">제주시</option>
                      <option value="서귀포시">서귀포시</option>
                    </select>
                    <span className="ds-select__ic"><Icon name="chevron-down" size={18} /></span>
                  </div>
                  <div className="ds-select form-field__select" style={{ flex: 1 }}>
                    <select aria-label="읍면동" value={addDong} disabled={addCity === '전체'}
                      onChange={(e) => setAddDong(e.target.value)}>
                      <option value="전체">읍면동 전체</option>
                      {(DONGS[addCity] || []).map((d) => <option key={d} value={d}>{d}</option>)}
                    </select>
                    <span className="ds-select__ic"><Icon name="chevron-down" size={18} /></span>
                  </div>
                </div>
              </div>
              <div className="form-field">
                <label className="form-field__label">단계 그룹</label>
                <div className="chip-set">
                  {CRIT_LEVELS.map((c) => (
                    <button key={c.key} className={`fchip${addGroups[c.key] ? ' is-active' : ''}`} type="button"
                      onClick={() => setAddGroups((g) => ({ ...g, [c.key]: !g[c.key] }))}>{c.label}</button>
                  ))}
                </div>
              </div>
            </div>
            <div className="modal__foot modal__foot--split">
              <button className="btn" type="button" style={{ height: 44 }} onClick={() => setAddOpen(false)}>취소</button>
              <button className="btn-save" type="button" onClick={() => setAddOpen(false)}>추가</button>
            </div>
          </div>
        </div>
      )}

      {/* 알림 기준 설정 모달 */}
      {critOpen && (
        <div className="modal">
          <div className="modal__overlay" onClick={() => setCritOpen(false)} />
          <div className="modal__dialog modal__dialog--sm" role="dialog" aria-modal="true" aria-label="알림 기준 설정">
            <div className="modal__head">
              <h2 className="modal__title">알림 기준 설정</h2>
              <button className="modal__close" type="button" aria-label="닫기" onClick={() => setCritOpen(false)}>
                <svg viewBox="0 0 24 24" fill="none" width="24" height="24"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
              </button>
            </div>
            <div className="modal__body">
              <p className="crit-card__sub" style={{ marginTop: 0 }}>민원 증가율이 아래 기준 이상일 때 해당 단계 알림이 발생합니다.</p>
              <div className="crit-list">
                {CRIT_LEVELS.map((c) => (
                  <div key={c.key} className="crit-row">
                    <span className={`badge ${c.badge} crit-row__tag`}>{c.label}</span>
                    <input type="number" className="crit-inp" value={critDraft[c.key]}
                      onChange={(e) => setCritDraft((d) => ({ ...d, [c.key]: e.target.value }))} />
                    <span className="crit-row__unit">% 이상</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="modal__foot modal__foot--split">
              <button className="btn" type="button" style={{ height: 44 }} onClick={() => setCritOpen(false)}>취소</button>
              <button className="btn-save" type="button" onClick={saveCrit}>저장</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
