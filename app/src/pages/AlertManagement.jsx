import { useState } from 'react';
import Icon from '../components/Icon';

const RULES = [
  { id: 1, name: '심각 단계 자동 알림', condition: '민원 40건 이상 / 일', channel: '앱 + 이메일', active: true, level: '심각' },
  { id: 2, name: '집중구역 순위 변동', condition: 'TOP 5 순위 변경 시', channel: '앱', active: true, level: '경고' },
  { id: 3, name: '주간 리포트 발송', condition: '매주 월요일 09:00', channel: '이메일', active: true, level: '정보' },
  { id: 4, name: '단속 급감 감지', condition: '전일 대비 -30% 이하', channel: '앱', active: false, level: '경고' },
  { id: 5, name: '위험 단계 해제 알림', condition: '위험 단계 → 경고 이하', channel: '앱 + 이메일', active: false, level: '정보' },
];

const LEVEL_STYLE = {
  심각: { bg: 'var(--red-95)', color: 'var(--red-50)' },
  경고: { bg: 'var(--orange-95)', color: 'var(--orange-50)' },
  정보: { bg: 'var(--blue-95)', color: 'var(--blue-45)' },
};

export default function AlertManagement() {
  const [rules, setRules] = useState(RULES);

  const toggle = (id) => setRules((r) => r.map((x) => x.id === id ? { ...x, active: !x.active } : x));

  return (
    <div style={{ padding: '40px 48px', display: 'flex', flexDirection: 'column', gap: 28, flex: 1, minHeight: 0, overflowY: 'auto' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 700, margin: 0 }}>위험 단계 알림 관리</h1>
          <p style={{ color: 'var(--text-alternative)', marginTop: 4 }}>알림 규칙 설정 및 채널 관리</p>
        </div>
        <button style={{ display: 'flex', alignItems: 'center', gap: 8, height: 44, padding: '0 20px', borderRadius: 10, border: 'none', background: 'var(--primary)', color: '#fff', fontFamily: 'inherit', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
          + 알림 규칙 추가
        </button>
      </div>

      {/* 요약 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
        {[
          { label: '전체 규칙', value: rules.length, icon: 'document', bg: 'var(--blue-95)', color: 'var(--blue-50)' },
          { label: '활성 규칙', value: rules.filter((r) => r.active).length, icon: 'sparkle', bg: 'var(--green-95)', color: 'var(--green-40)' },
          { label: '비활성 규칙', value: rules.filter((r) => !r.active).length, icon: 'setting', bg: 'var(--cool-neutral-95)', color: 'var(--text-alternative)' },
        ].map((s) => (
          <div key={s.label} className="card" style={{ padding: '24px 28px', display: 'flex', alignItems: 'center', gap: 20 }}>
            <div style={{ width: 56, height: 56, borderRadius: 14, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: s.color, flexShrink: 0 }}>
              <Icon name={s.icon} size={24} />
            </div>
            <div>
              <div style={{ fontSize: 12, color: 'var(--text-alternative)', fontWeight: 600, marginBottom: 4 }}>{s.label}</div>
              <div style={{ fontSize: 28, fontWeight: 800, fontFamily: 'var(--font-sans)' }}>{s.value}개</div>
            </div>
          </div>
        ))}
      </div>

      {/* 규칙 목록 */}
      <div className="card" style={{ overflow: 'hidden' }}>
        <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--line-alternative)' }}>
          <span style={{ fontSize: 14, fontWeight: 700 }}>알림 규칙 목록</span>
        </div>
        {rules.map((r, i) => (
          <div key={r.id} style={{ padding: '20px 24px', display: 'flex', alignItems: 'center', gap: 16, borderBottom: i < rules.length - 1 ? '1px solid var(--line-alternative)' : 'none' }}>
            <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: LEVEL_STYLE[r.level]?.bg, color: LEVEL_STYLE[r.level]?.color, flexShrink: 0 }}>{r.level}</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>{r.name}</div>
              <div style={{ fontSize: 13, color: 'var(--text-assistive)' }}>조건: {r.condition} · 채널: {r.channel}</div>
            </div>
            {/* 토글 */}
            <button
              onClick={() => toggle(r.id)}
              style={{ position: 'relative', width: 44, height: 24, borderRadius: 12, border: 'none', background: r.active ? 'var(--primary)' : 'var(--cool-neutral-80)', cursor: 'pointer', flexShrink: 0, transition: 'background 0.2s' }}
            >
              <span style={{ position: 'absolute', top: 3, left: r.active ? 23 : 3, width: 18, height: 18, borderRadius: '50%', background: '#fff', transition: 'left 0.2s', boxShadow: '0 1px 4px rgba(0,0,0,0.2)' }} />
            </button>
            <button style={{ width: 34, height: 34, borderRadius: 8, border: '1px solid var(--line-normal)', background: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-assistive)' }}>
              <Icon name="setting" size={16} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
