import { useState } from 'react';
import Icon from '../components/Icon';
import { useTheme } from '../hooks/useTheme';

const SECTIONS = [
  {
    title: '계정 정보',
    items: [
      { label: '이름', value: '김제주', type: 'text' },
      { label: '이메일', value: 'jeju@innopam.com', type: 'text' },
      { label: '소속', value: '제주특별자치도 교통정책과', type: 'text' },
      { label: '권한', value: '관리자', type: 'badge' },
    ],
  },
  {
    title: '화면 설정',
    items: [],
  },
];

export default function Settings() {
  const [data, setData] = useState(SECTIONS);
  const [theme, setTheme] = useTheme();

  const updateToggle = (si, ii) => {
    setData((d) => d.map((s, sIdx) => sIdx !== si ? s : {
      ...s,
      items: s.items.map((item, iIdx) => iIdx !== ii ? item : { ...item, value: !item.value }),
    }));
  };

  return (
    <div style={{ padding: '40px 48px', display: 'flex', flexDirection: 'column', gap: 28, flex: 1, minHeight: 0, overflowY: 'auto' }}>
      <div>
        <h1 style={{ fontSize: 28, fontWeight: 700, margin: 0 }}>설정</h1>
        <p style={{ color: 'var(--text-alternative)', marginTop: 4 }}>계정 및 시스템 환경 설정</p>
      </div>

      {data.map((section, si) => (
        <div key={section.title} className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '18px 28px', borderBottom: '1px solid var(--line-alternative)', background: 'var(--surface-alternative)' }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-strong)' }}>{section.title}</span>
          </div>
          {section.title === '화면 설정' && (
            <div style={{ padding: '18px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 14, color: 'var(--text-neutral)', fontWeight: 500 }}>테마</span>
              <div className="segment">
                <button type="button" className={`segment__btn${theme === 'light' ? ' segment__btn--active' : ''}`} onClick={() => setTheme('light')}>
                  라이트모드
                </button>
                <button type="button" className={`segment__btn${theme === 'dark' ? ' segment__btn--active' : ''}`} onClick={() => setTheme('dark')}>
                  다크모드
                </button>
              </div>
            </div>
          )}
          {section.items.map((item, ii) => (
            <div key={item.label} style={{ padding: '18px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: ii < section.items.length - 1 ? '1px solid var(--line-alternative)' : 'none' }}>
              <span style={{ fontSize: 14, color: 'var(--text-neutral)', fontWeight: 500 }}>{item.label}</span>
              {item.type === 'text' && (
                <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-strong)' }}>{item.value}</span>
              )}
              {item.type === 'badge' && (
                <span style={{ fontSize: 12, fontWeight: 700, padding: '3px 12px', borderRadius: 20, background: 'var(--blue-95)', color: 'var(--blue-45)' }}>{item.value}</span>
              )}
              {item.type === 'toggle' && (
                <button
                  onClick={() => updateToggle(si, ii)}
                  style={{ position: 'relative', width: 44, height: 24, borderRadius: 12, border: 'none', background: item.value ? 'var(--primary)' : 'var(--cool-neutral-80)', cursor: 'pointer', transition: 'background 0.2s' }}
                >
                  <span style={{ position: 'absolute', top: 3, left: item.value ? 23 : 3, width: 18, height: 18, borderRadius: '50%', background: '#fff', transition: 'left 0.2s', boxShadow: '0 1px 4px rgba(0,0,0,0.2)' }} />
                </button>
              )}
              {item.type === 'select' && (
                <select defaultValue={item.value} style={{ height: 36, padding: '0 12px', borderRadius: 8, border: '1px solid var(--line-normal)', background: 'var(--fill-normal)', fontFamily: 'inherit', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                  {item.options.map((o) => <option key={o}>{o}</option>)}
                </select>
              )}
            </div>
          ))}
        </div>
      ))}

      <div style={{ display: 'flex', gap: 12 }}>
        <button style={{ height: 44, padding: '0 24px', borderRadius: 10, border: 'none', background: 'var(--primary)', color: '#fff', fontFamily: 'inherit', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
          변경 사항 저장
        </button>
        <button style={{ height: 44, padding: '0 24px', borderRadius: 10, border: '1px solid var(--line-normal)', background: 'none', fontFamily: 'inherit', fontSize: 14, fontWeight: 600, cursor: 'pointer', color: 'var(--text-alternative)' }}>
          초기화
        </button>
      </div>
    </div>
  );
}
