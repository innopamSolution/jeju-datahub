import { useEffect, useRef, useState } from 'react';
import * as echarts from 'echarts';
import Icon from '../components/Icon';
import NotificationBell from '../components/NotificationBell';
import DsSelect from '../components/DsSelect';

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

const SCENARIOS = [
  { name: '주차장 확충 · 연동 150면', reduction: '-23%', improvement: '+18%', cost: '고', costLevel: 'high', recommend: true },
  { name: '이면도로 정비 · 일방통행', reduction: '-15%', improvement: '+12%', cost: '중', costLevel: 'mid', recommend: false },
  { name: '요금제 10%', reduction: '-12%', improvement: '+9%', cost: '저', costLevel: 'low', recommend: false },
  { name: '주차장 확충 · 노형 80면', reduction: '-18%', improvement: '+14%', cost: '중', costLevel: 'mid', recommend: false },
  { name: '거주자 우선주차 · 연동', reduction: '-10%', improvement: '+7%', cost: '저', costLevel: 'low', recommend: false },
  { name: '요금제 20%', reduction: '-16%', improvement: '+11%', cost: '저', costLevel: 'low', recommend: false },
];

const COST_BADGE = {
  high: { bg: 'var(--red-95)', color: 'var(--red-40)' },
  mid: { bg: 'var(--orange-95)', color: 'var(--orange-39)' },
  low: { bg: '#dcfce7', color: '#15803d' },
};

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

function EffectChart() {
  const months = ['1월', '2월', '3월', '4월', '5월', '6월'];
  const before = [52, 49, 55, 58, 48, 52];
  const after =  [52, 50, 47, 43, 41, 40];
  const max = 70;
  const W = 380, H = 160, PAD = 32, barW = 22, gapX = 12;
  const groupW = barW * 2 + 4;
  const totalGroupW = groupW + gapX;

  return (
    <svg viewBox={`0 0 ${W} ${H + 40}`} style={{ width: '100%', height: 'auto' }}>
      {months.map((m, i) => {
        const x = PAD + i * totalGroupW;
        const bH = (before[i] / max) * H;
        const aH = (after[i] / max) * H;
        return (
          <g key={m}>
            <rect x={x} y={H - bH + 4} width={barW} height={bH} rx={3} fill="#94a3b8" opacity={0.55} />
            <rect x={x + barW + 4} y={H - aH + 4} width={barW} height={aH} rx={3} fill="var(--primary)" />
            <text x={x + barW + 2} y={H + 20} textAnchor="middle" fontSize={11} fill="var(--text-assistive)">{m}</text>
          </g>
        );
      })}
      <rect x={PAD} y={H + 30} width={10} height={10} rx={2} fill="#94a3b8" opacity={0.55} />
      <text x={PAD + 14} y={H + 39} fontSize={11} fill="var(--text-alternative)">정책 전</text>
      <rect x={PAD + 60} y={H + 30} width={10} height={10} rx={2} fill="var(--primary)" />
      <text x={PAD + 74} y={H + 39} fontSize={11} fill="var(--text-alternative)">정책 후</text>
    </svg>
  );
}

export default function PolicySimulation() {
  const [policyType, setPolicyType] = useState('parking');
  const [period, setPeriod] = useState('3');
  const [roadType, setRoadType] = useState('one-way');
  const [feeRate, setFeeRate] = useState('5');

  return (
    <>
      <header className="topbar">
        <div>
          <h1 className="page-title">정책 시뮬레이션</h1>
          <p className="page-sub">정책 변수 입력 → 효과 예측 → 시나리오 비교</p>
        </div>
        <div className="topbar__actions">
          <button className="btn btn--ai" type="button">{AI_ICON} AI 대화 시작하기</button>
          <button className="btn" type="button"><Icon name="download" size={20} /> 내보내기</button>
          <NotificationBell />
        </div>
      </header>

      <div className="content" style={{ paddingTop: 24, gap: 20 }}>
        <section style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, alignItems: 'start' }}>

          {/* 정책 변수 설정 */}
          <div className="card" style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 20 }}>
            <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: 'var(--text-strong)' }}>정책 변수 설정</h2>

            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-alternative)', marginBottom: 8 }}>정책 유형</div>
              <div className="segment">
                {[['parking', '주차장 확충'], ['road', '이면도로 정비'], ['fee', '요금제 적용']].map(([k, l]) => (
                  <button key={k} type="button" className={`segment__btn ${policyType === k ? 'segment__btn--active' : ''}`} onClick={() => setPolicyType(k)}>{l}</button>
                ))}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-alternative)', marginBottom: 8 }}>대상 지역</div>
                <DsSelect style={{ width: '100%' }}>
                  <option>제주시</option><option>서귀포시</option>
                </DsSelect>
              </div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-alternative)', marginBottom: 8 }}>&nbsp;</div>
                <DsSelect style={{ width: '100%' }}>
                  <option>연동</option><option>노형동</option><option>이도동</option>
                </DsSelect>
              </div>
            </div>

            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-alternative)', marginBottom: 8 }}>예측 기간</div>
              <div className="segment">
                {[['3', '3개월'], ['6', '6개월'], ['12', '12개월'], ['24', '24개월']].map(([k, l]) => (
                  <button key={k} type="button" className={`segment__btn ${period === k ? 'segment__btn--active' : ''}`} onClick={() => setPeriod(k)}>{l}</button>
                ))}
              </div>
            </div>

            {policyType === 'parking' && (
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-alternative)', marginBottom: 8 }}>주차면 증설 수</div>
                <DsSelect style={{ width: '100%' }}>
                  <option>50면</option><option>80면</option><option>100면</option><option>150면</option><option>200면</option>
                </DsSelect>
              </div>
            )}
            {policyType === 'road' && (
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-alternative)', marginBottom: 8 }}>정비 유형</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {[['one-way', '일방통행 전환'], ['parking-zone', '주차구역 정비'], ['expand', '주차허용구역 확대'], ['resident', '거주자 우선주차 도입']].map(([k, l]) => (
                    <button key={k} type="button" className={`segment__btn ${roadType === k ? 'segment__btn--active' : ''}`} onClick={() => setRoadType(k)}>{l}</button>
                  ))}
                </div>
              </div>
            )}
            {policyType === 'fee' && (
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-alternative)', marginBottom: 8 }}>요금 인상율</div>
                <div className="segment">
                  {[['5', '5%'], ['10', '10%'], ['15', '15%'], ['20', '20%']].map(([k, l]) => (
                    <button key={k} type="button" className={`segment__btn ${feeRate === k ? 'segment__btn--active' : ''}`} onClick={() => setFeeRate(k)}>{l}</button>
                  ))}
                </div>
              </div>
            )}

            <button className="btn-run" type="button">▷ 시뮬레이션 실행</button>
          </div>

          {/* 효과 예측 */}
          <div className="card" style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 20 }}>
            <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: 'var(--text-strong)' }}>효과 예측</h2>
            <EffectChart />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div style={{ padding: '16px 20px', borderRadius: 12, background: 'var(--blue-99)', border: '1px solid var(--blue-90)' }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-alternative)', marginBottom: 6 }}>민원 감소 예측</div>
                <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--primary)' }}>-23%</div>
                <div style={{ fontSize: 12, color: 'var(--text-assistive)', marginTop: 4 }}>52건 → 40건 월평균</div>
              </div>
              <div style={{ padding: '16px 20px', borderRadius: 12, background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-alternative)', marginBottom: 6 }}>혼잡도 개선</div>
                <div style={{ fontSize: 28, fontWeight: 800, color: '#16a34a' }}>+18%</div>
                <div style={{ fontSize: 12, color: 'var(--text-assistive)', marginTop: 4 }}>혼잡 지수 0.78 → 0.64</div>
              </div>
            </div>
          </div>
        </section>

        {/* 시나리오 비교 */}
        <div className="card" style={{ overflow: 'hidden' }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--line-alternative)' }}>
            <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: 'var(--text-strong)' }}>시나리오 비교</h2>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <TH>시나리오</TH>
                <TH center>민원 감소</TH>
                <TH center>혼잡 개선</TH>
                <TH center>비용 수준</TH>
                <TH center>추천</TH>
              </tr>
            </thead>
            <tbody>
              {SCENARIOS.map((s, i) => (
                <tr key={i}>
                  <TD><span style={{ fontWeight: 600, color: 'var(--text-strong)' }}>{s.name}</span></TD>
                  <TD center><span style={{ fontWeight: 700, color: 'var(--primary)' }}>{s.reduction}</span></TD>
                  <TD center><span style={{ fontWeight: 700, color: '#16a34a' }}>{s.improvement}</span></TD>
                  <TD center>
                    <span className="badge" style={{ background: COST_BADGE[s.costLevel].bg, color: COST_BADGE[s.costLevel].color }}>{s.cost}</span>
                  </TD>
                  <TD center>
                    {s.recommend && <span className="badge" style={{ background: 'var(--blue-95)', color: 'var(--primary)', fontWeight: 700 }}>추천</span>}
                  </TD>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
