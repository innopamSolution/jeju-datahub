import { useState } from 'react';
import Icon from '../components/Icon';

const REPORTS = [
  { id: 1, title: '11월 주차민원 분석 리포트', type: '정기', date: '2025-11-30', status: '완료', size: '2.4MB' },
  { id: 2, name: 'GIS 집중구역 현황 리포트', type: '자동', date: '2025-11-28', status: '완료', size: '1.8MB' },
  { id: 3, title: '정책 시뮬레이션 효과 비교', type: '수동', date: '2025-11-25', status: '완료', size: '3.1MB' },
  { id: 4, title: '10월 민원 증감 분석', type: '정기', date: '2025-10-31', status: '완료', size: '2.2MB' },
  { id: 5, title: '생활권 격자 분석 리포트', type: '수동', date: '2025-10-20', status: '완료', size: '4.5MB' },
  { id: 6, title: '9월 주차 집중구역 보고서', type: '정기', date: '2025-09-30', status: '완료', size: '2.0MB' },
];

const ALERTS = [
  { id: 1, title: '연동 대로변 민원 급증 감지', level: '심각', time: '오늘 11:30', read: false },
  { id: 2, title: 'GIS 집중구역 현황 리포트 생성 완료', level: '정보', time: '오늘 11:20', read: false },
  { id: 3, title: '11월 주차민원 분석 리포트 준비됨', level: '정보', time: '어제 16:05', read: true },
  { id: 4, title: '노형사거리 위험 단계 상향', level: '경고', time: '어제 09:40', read: true },
  { id: 5, title: '정책 효과 시뮬레이션 완료', level: '정보', time: '2일 전', read: true },
];

const LEVEL_STYLE = {
  심각: { bg: 'var(--red-95)', color: 'var(--red-50)' },
  경고: { bg: 'var(--orange-95)', color: 'var(--orange-50)' },
  정보: { bg: 'var(--blue-95)', color: 'var(--blue-45)' },
};
const TYPE_STYLE = {
  정기: { bg: 'var(--blue-95)', color: 'var(--blue-45)' },
  자동: { bg: 'var(--green-95)', color: 'var(--green-40)' },
  수동: { bg: 'var(--cool-neutral-95)', color: 'var(--text-alternative)' },
};

export default function Reports() {
  const [tab, setTab] = useState('reports');
  const [alerts, setAlerts] = useState(ALERTS);
  const unread = alerts.filter((a) => !a.read).length;

  return (
    <div style={{ padding: '40px 48px', display: 'flex', flexDirection: 'column', gap: 28, flex: 1, minHeight: 0, overflowY: 'auto' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 700, margin: 0 }}>보고서·알림</h1>
          <p style={{ color: 'var(--text-alternative)', marginTop: 4 }}>분석 보고서 관리 및 시스템 알림</p>
        </div>
      </div>

      {/* 탭 */}
      <div style={{ display: 'flex', gap: 4, borderBottom: '1px solid var(--line-alternative)', paddingBottom: 0 }}>
        {[
          { key: 'reports', label: '보고서 목록' },
          { key: 'alerts', label: `알림${unread > 0 ? ` (${unread})` : ''}` },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{
              padding: '10px 20px', border: 'none', background: 'none', fontFamily: 'inherit',
              fontSize: 14, fontWeight: 700, cursor: 'pointer',
              color: tab === t.key ? 'var(--primary)' : 'var(--text-alternative)',
              borderBottom: tab === t.key ? '2px solid var(--primary)' : '2px solid transparent',
              marginBottom: -1,
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'reports' && (
        <div className="card" style={{ overflow: 'hidden' }}>
          <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--line-alternative)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-strong)' }}>전체 {REPORTS.length}건</span>
            <button style={{ display: 'flex', alignItems: 'center', gap: 6, height: 38, padding: '0 16px', borderRadius: 8, border: '1px solid var(--line-normal)', background: 'var(--fill-normal)', fontFamily: 'inherit', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
              <Icon name="download" size={16} /> 일괄 다운로드
            </button>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--cool-neutral-99)' }}>
                {['보고서명', '유형', '생성일', '크기', '상태', ''].map((h) => (
                  <th key={h} style={{ padding: '12px 20px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: 'var(--text-assistive)', borderBottom: '1px solid var(--line-alternative)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {REPORTS.map((r) => (
                <tr key={r.id} style={{ borderBottom: '1px solid var(--line-alternative)' }}>
                  <td style={{ padding: '16px 20px', fontSize: 14, fontWeight: 600, color: 'var(--text-strong)' }}>{r.title || r.name}</td>
                  <td style={{ padding: '16px 20px' }}>
                    <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: TYPE_STYLE[r.type]?.bg, color: TYPE_STYLE[r.type]?.color }}>{r.type}</span>
                  </td>
                  <td style={{ padding: '16px 20px', fontSize: 13, color: 'var(--text-neutral)', fontFamily: 'var(--font-mono)' }}>{r.date}</td>
                  <td style={{ padding: '16px 20px', fontSize: 13, color: 'var(--text-assistive)' }}>{r.size}</td>
                  <td style={{ padding: '16px 20px' }}>
                    <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: 'var(--green-95)', color: 'var(--green-40)' }}>{r.status}</span>
                  </td>
                  <td style={{ padding: '16px 20px' }}>
                    <button style={{ display: 'flex', alignItems: 'center', gap: 4, height: 34, padding: '0 14px', borderRadius: 8, border: '1px solid var(--line-normal)', background: 'none', fontFamily: 'inherit', fontSize: 12, fontWeight: 600, cursor: 'pointer', color: 'var(--text-alternative)' }}>
                      <Icon name="download" size={14} /> 다운로드
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'alerts' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {unread > 0 && (
            <button
              onClick={() => setAlerts((a) => a.map((x) => ({ ...x, read: true })))}
              style={{ alignSelf: 'flex-end', height: 36, padding: '0 16px', border: '1px solid var(--line-normal)', borderRadius: 8, background: 'none', fontFamily: 'inherit', fontSize: 13, fontWeight: 600, cursor: 'pointer', color: 'var(--text-alternative)' }}
            >
              모두 읽음 처리
            </button>
          )}
          {alerts.map((a) => (
            <div
              key={a.id}
              className="card"
              onClick={() => setAlerts((prev) => prev.map((x) => x.id === a.id ? { ...x, read: true } : x))}
              style={{ padding: '18px 24px', display: 'flex', alignItems: 'center', gap: 16, cursor: 'pointer', opacity: a.read ? 0.6 : 1, borderLeft: a.read ? 'none' : '3px solid var(--primary)' }}
            >
              <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: LEVEL_STYLE[a.level]?.bg, color: LEVEL_STYLE[a.level]?.color, flexShrink: 0 }}>{a.level}</span>
              <span style={{ fontSize: 14, fontWeight: a.read ? 400 : 700, color: 'var(--text-strong)', flex: 1 }}>{a.title}</span>
              <span style={{ fontSize: 12, color: 'var(--text-assistive)', flexShrink: 0 }}>{a.time}</span>
              {!a.read && <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--primary)', flexShrink: 0 }} />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
