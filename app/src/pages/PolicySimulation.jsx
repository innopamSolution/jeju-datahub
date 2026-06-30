import { useState } from 'react';
import Icon from '../components/Icon';

const POLICIES = ['주차 단속 강화', '공영주차장 확충', '거주자 우선 주차', '주정차 금지구역 확대'];
const REGIONS = ['제주시 전체', '연동', '노형동', '이도동', '아라동'];

const BEFORE = [
  { label: '일평균 민원 건수', value: '247건' },
  { label: '불법주차 비율', value: '68%' },
  { label: '집중 구역 수', value: '5개소' },
];
const AFTER = [
  { label: '일평균 민원 건수', value: '161건', delta: '▼35%', up: false },
  { label: '불법주차 비율', value: '44%', delta: '▼24%p', up: false },
  { label: '집중 구역 수', value: '2개소', delta: '▼3', up: false },
];

const CHART_BARS = [
  { label: '1개월', before: 247, after: 195 },
  { label: '2개월', before: 230, after: 175 },
  { label: '3개월', before: 220, after: 161 },
  { label: '4개월', before: 210, after: 150 },
  { label: '5개월', before: 200, after: 138 },
  { label: '6개월', before: 195, after: 128 },
];

export default function PolicySimulation() {
  const [policy, setPolicy] = useState(POLICIES[0]);
  const [region, setRegion] = useState(REGIONS[0]);
  const [ran, setRan] = useState(true);

  const max = 260;

  return (
    <div style={{ padding: '40px 48px', display: 'flex', flexDirection: 'column', gap: 32, flex: 1, minHeight: 0, overflowY: 'auto' }}>
      {/* 헤더 */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 700, margin: 0 }}>정책 효과 시뮬레이션</h1>
          <p style={{ color: 'var(--text-alternative)', marginTop: 4 }}>정책 적용 시 민원 감소 효과 예측</p>
        </div>
      </div>

      {/* 설정 카드 */}
      <div className="card" style={{ padding: 28, display: 'flex', gap: 24, flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: '1 1 200px' }}>
          <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-alternative)' }}>정책 유형</label>
          <select
            value={policy} onChange={(e) => setPolicy(e.target.value)}
            style={{ height: 46, padding: '0 16px', borderRadius: 10, border: '1px solid var(--line-normal)', background: 'var(--fill-normal)', fontFamily: 'inherit', fontSize: 14, fontWeight: 600, color: 'var(--text-strong)', cursor: 'pointer' }}
          >
            {POLICIES.map((p) => <option key={p}>{p}</option>)}
          </select>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: '1 1 160px' }}>
          <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-alternative)' }}>적용 지역</label>
          <select
            value={region} onChange={(e) => setRegion(e.target.value)}
            style={{ height: 46, padding: '0 16px', borderRadius: 10, border: '1px solid var(--line-normal)', background: 'var(--fill-normal)', fontFamily: 'inherit', fontSize: 14, fontWeight: 600, color: 'var(--text-strong)', cursor: 'pointer' }}
          >
            {REGIONS.map((r) => <option key={r}>{r}</option>)}
          </select>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: '1 1 160px' }}>
          <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-alternative)' }}>적용 기간</label>
          <div style={{ height: 46, padding: '0 16px', borderRadius: 10, border: '1px solid var(--line-normal)', background: 'var(--fill-normal)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
            6개월 <Icon name="chevron-down" size={16} />
          </div>
        </div>
        <button
          onClick={() => setRan(true)}
          style={{ height: 46, padding: '0 28px', borderRadius: 10, border: 'none', background: 'var(--primary)', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}
        >
          ▷ 시뮬레이션 실행
        </button>
      </div>

      {ran && (
        <>
          {/* 비교 카드 */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
            <div className="card" style={{ padding: 28 }}>
              <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20, color: 'var(--text-alternative)' }}>정책 적용 전</h2>
              {BEFORE.map((b) => (
                <div key={b.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid var(--line-alternative)' }}>
                  <span style={{ fontSize: 14, color: 'var(--text-neutral)' }}>{b.label}</span>
                  <b style={{ fontSize: 20, fontWeight: 700, fontFamily: 'var(--font-sans)' }}>{b.value}</b>
                </div>
              ))}
            </div>
            <div className="card" style={{ padding: 28, border: '2px solid var(--primary)' }}>
              <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20, color: 'var(--primary)' }}>정책 적용 후 (예측)</h2>
              {AFTER.map((a) => (
                <div key={a.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid var(--line-alternative)' }}>
                  <span style={{ fontSize: 14, color: 'var(--text-neutral)' }}>{a.label}</span>
                  <div style={{ textAlign: 'right' }}>
                    <b style={{ fontSize: 20, fontWeight: 700, fontFamily: 'var(--font-sans)' }}>{a.value}</b>
                    <span style={{ fontSize: 12, color: 'var(--green-40)', fontWeight: 700, marginLeft: 6 }}>{a.delta}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 막대 차트 */}
          <div className="card" style={{ padding: 28 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>월별 민원 건수 예측 비교</h2>
            <p style={{ fontSize: 13, color: 'var(--text-assistive)', marginBottom: 24 }}>{policy} 적용 후 6개월 추이</p>
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', height: 180 }}>
              {CHART_BARS.map((b) => (
                <div key={b.label} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                  <div style={{ display: 'flex', gap: 4, alignItems: 'flex-end', width: '100%', height: 140 }}>
                    <div style={{ flex: 1, background: 'var(--cool-neutral-90)', borderRadius: '4px 4px 0 0', height: `${(b.before / max) * 140}px` }} title={`이전: ${b.before}건`} />
                    <div style={{ flex: 1, background: 'var(--primary)', borderRadius: '4px 4px 0 0', height: `${(b.after / max) * 140}px`, opacity: 0.8 }} title={`이후: ${b.after}건`} />
                  </div>
                  <span style={{ fontSize: 11, color: 'var(--text-assistive)' }}>{b.label}</span>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 20, marginTop: 16 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-assistive)' }}>
                <span style={{ width: 12, height: 12, borderRadius: 3, background: 'var(--cool-neutral-90)' }} />적용 전
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-assistive)' }}>
                <span style={{ width: 12, height: 12, borderRadius: 3, background: 'var(--primary)', opacity: 0.8 }} />적용 후 (예측)
              </span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
