import { useState } from 'react';
import Icon from '../components/Icon';

const HISTORY = [
  { id: 1, title: '연동 대로변 심각 단계 진입', level: '심각', area: '연동', time: '2025-12-01 11:30', resolved: false },
  { id: 2, title: 'GIS 집중구역 현황 리포트 생성', level: '정보', area: '전체', time: '2025-12-01 11:20', resolved: true },
  { id: 3, title: '노형사거리 위험 단계 상향', level: '경고', area: '노형동', time: '2025-11-30 09:40', resolved: true },
  { id: 4, title: '이도2동 민원 급증 감지', level: '경고', area: '이도동', time: '2025-11-29 16:15', resolved: true },
  { id: 5, title: '주간 리포트 발송 완료', level: '정보', area: '전체', time: '2025-11-25 09:00', resolved: true },
  { id: 6, title: '아라동 위험 단계 해제', level: '정보', area: '아라동', time: '2025-11-24 14:30', resolved: true },
  { id: 7, title: '연동 대로변 경고 단계 진입', level: '경고', area: '연동', time: '2025-11-22 10:00', resolved: true },
];

const LEVEL_STYLE = {
  심각: { bg: 'var(--red-95)', color: 'var(--red-50)' },
  경고: { bg: 'var(--orange-95)', color: 'var(--orange-50)' },
  정보: { bg: 'var(--blue-95)', color: 'var(--blue-45)' },
};

const LEVELS = ['전체', '심각', '경고', '정보'];

export default function AlertInquiry() {
  const [filter, setFilter] = useState('전체');
  const [search, setSearch] = useState('');

  const filtered = HISTORY.filter((h) => {
    const matchLevel = filter === '전체' || h.level === filter;
    const matchSearch = !search || h.title.includes(search) || h.area.includes(search);
    return matchLevel && matchSearch;
  });

  return (
    <div style={{ padding: '40px 48px', display: 'flex', flexDirection: 'column', gap: 28, flex: 1, minHeight: 0, overflowY: 'auto' }}>
      <div>
        <h1 style={{ fontSize: 28, fontWeight: 700, margin: 0 }}>위험 단계 알림 조회</h1>
        <p style={{ color: 'var(--text-alternative)', marginTop: 4 }}>발생한 알림 이력 조회 및 현황 확인</p>
      </div>

      {/* 요약 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
        {[
          { label: '전체 알림', value: HISTORY.length, color: 'var(--text-strong)' },
          { label: '심각', value: HISTORY.filter((h) => h.level === '심각').length, color: 'var(--red-50)' },
          { label: '경고', value: HISTORY.filter((h) => h.level === '경고').length, color: 'var(--orange-50)' },
          { label: '정보', value: HISTORY.filter((h) => h.level === '정보').length, color: 'var(--blue-45)' },
        ].map((s) => (
          <div key={s.label} className="card" style={{ padding: '20px 24px', textAlign: 'center' }}>
            <div style={{ fontSize: 12, color: 'var(--text-assistive)', fontWeight: 600, marginBottom: 8 }}>{s.label}</div>
            <div style={{ fontSize: 32, fontWeight: 800, fontFamily: 'var(--font-sans)', color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* 필터 */}
      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: 6 }}>
          {LEVELS.map((l) => (
            <button
              key={l}
              onClick={() => setFilter(l)}
              style={{ height: 36, padding: '0 16px', borderRadius: 20, border: `1px solid ${filter === l ? 'var(--primary)' : 'var(--line-normal)'}`, background: filter === l ? 'var(--blue-95)' : 'none', color: filter === l ? 'var(--primary)' : 'var(--text-alternative)', fontFamily: 'inherit', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
            >
              {l}
            </button>
          ))}
        </div>
        <div style={{ position: 'relative', flex: 1, maxWidth: 300 }}>
          <Icon name="location" size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-assistive)' }} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="알림명 또는 지역 검색"
            style={{ width: '100%', height: 38, padding: '0 12px 0 36px', borderRadius: 10, border: '1px solid var(--line-normal)', background: 'var(--fill-normal)', fontFamily: 'inherit', fontSize: 13, outline: 'none', boxSizing: 'border-box' }}
          />
        </div>
      </div>

      {/* 목록 */}
      <div className="card" style={{ overflow: 'hidden' }}>
        <div style={{ padding: '14px 24px', borderBottom: '1px solid var(--line-alternative)' }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-alternative)' }}>총 {filtered.length}건</span>
        </div>
        {filtered.length === 0 ? (
          <div style={{ padding: '60px 0', textAlign: 'center', color: 'var(--text-assistive)', fontSize: 14 }}>조회 결과가 없습니다.</div>
        ) : filtered.map((h, i) => (
          <div key={h.id} style={{ padding: '16px 24px', display: 'flex', alignItems: 'center', gap: 16, borderBottom: i < filtered.length - 1 ? '1px solid var(--line-alternative)' : 'none' }}>
            <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: LEVEL_STYLE[h.level]?.bg, color: LEVEL_STYLE[h.level]?.color, flexShrink: 0 }}>{h.level}</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 2 }}>{h.title}</div>
              <div style={{ fontSize: 12, color: 'var(--text-assistive)' }}>지역: {h.area}</div>
            </div>
            <span style={{ fontSize: 12, color: 'var(--text-assistive)', fontFamily: 'var(--font-mono)', flexShrink: 0 }}>{h.time}</span>
            <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: h.resolved ? 'var(--green-95)' : 'var(--red-95)', color: h.resolved ? 'var(--green-40)' : 'var(--red-50)', flexShrink: 0 }}>
              {h.resolved ? '처리완료' : '처리중'}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
