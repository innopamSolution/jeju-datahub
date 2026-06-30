import { useState } from 'react';
import Icon from '../components/Icon';

const COLUMNS = [
  { id: 'urgent', label: '긴급', color: 'var(--red-50)', bg: 'var(--red-95)' },
  { id: 'high', label: '높음', color: 'var(--orange-50)', bg: 'var(--orange-95)' },
  { id: 'medium', label: '보통', color: 'var(--blue-50)', bg: 'var(--blue-95)' },
  { id: 'low', label: '낮음', color: 'var(--cool-neutral-60)', bg: 'var(--cool-neutral-95)' },
];

const INIT_CARDS = {
  urgent: [
    { id: 1, name: '연동 대로변 공영주차장', budget: '32억', area: '연동', score: 94, type: '공영' },
    { id: 2, name: '제주도청 인근 주차장', budget: '25억', area: '일도동', score: 88, type: '공영' },
  ],
  high: [
    { id: 3, name: '노형사거리 노상주차장', budget: '8억', area: '노형동', score: 82, type: '노상' },
    { id: 4, name: '신광초 주변 공영주차장', budget: '18억', area: '오라이동', score: 76, type: '공영' },
  ],
  medium: [
    { id: 5, name: '동문시장 스마트주차장', budget: '22억', area: '일도동', score: 71, type: '스마트' },
  ],
  low: [],
};

export default function InvestmentPriority() {
  const [cards] = useState(INIT_CARDS);

  const totalBudget = '105억';
  const totalCards = Object.values(cards).flat().length;

  return (
    <div style={{ padding: '40px 48px', display: 'flex', flexDirection: 'column', gap: 28, flex: 1, minHeight: 0, overflowY: 'auto' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 700, margin: 0 }}>투자 우선순위 보드</h1>
          <p style={{ color: 'var(--text-alternative)', marginTop: 4 }}>주차장 신설 투자 계획 칸반 보드</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <div className="card" style={{ padding: '12px 20px', display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 13, color: 'var(--text-alternative)', fontWeight: 600 }}>총 사업 수</span>
            <span style={{ fontSize: 20, fontWeight: 800, fontFamily: 'var(--font-sans)' }}>{totalCards}건</span>
          </div>
          <div className="card" style={{ padding: '12px 20px', display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 13, color: 'var(--text-alternative)', fontWeight: 600 }}>총 예산</span>
            <span style={{ fontSize: 20, fontWeight: 800, fontFamily: 'var(--font-sans)', color: 'var(--primary)' }}>{totalBudget}</span>
          </div>
          <button style={{ display: 'flex', alignItems: 'center', gap: 8, height: 46, padding: '0 20px', borderRadius: 10, border: '1px solid var(--line-normal)', background: 'var(--fill-normal)', fontFamily: 'inherit', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
            <Icon name="download" size={18} /> 내보내기
          </button>
        </div>
      </div>

      {/* 칸반 보드 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, flex: 1, minHeight: 0 }}>
        {COLUMNS.map((col) => (
          <div key={col.id} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {/* 컬럼 헤더 */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderRadius: 10, background: col.bg }}>
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: col.color, flexShrink: 0 }} />
              <span style={{ fontSize: 14, fontWeight: 700, color: col.color, flex: 1 }}>{col.label}</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: col.color, background: 'rgba(255,255,255,0.6)', borderRadius: 20, padding: '1px 8px' }}>
                {cards[col.id].length}
              </span>
            </div>

            {/* 카드 목록 */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, flex: 1 }}>
              {cards[col.id].map((card) => (
                <div key={card.id} className="card" style={{ padding: '18px 20px', cursor: 'grab' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: col.bg, color: col.color }}>{card.type}</span>
                    <span style={{ fontSize: 12, color: 'var(--text-assistive)' }}>점수 {card.score}</span>
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-strong)', marginBottom: 6, lineHeight: 1.4 }}>{card.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-assistive)', marginBottom: 12 }}>{card.area}</div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 10, borderTop: '1px solid var(--line-alternative)' }}>
                    <span style={{ fontSize: 12, color: 'var(--text-alternative)', fontWeight: 600 }}>예상 예산</span>
                    <span style={{ fontSize: 16, fontWeight: 800, fontFamily: 'var(--font-sans)', color: 'var(--primary)' }}>{card.budget}</span>
                  </div>
                </div>
              ))}

              {/* 추가 버튼 */}
              <button style={{ height: 44, border: '1.5px dashed var(--line-normal)', borderRadius: 12, background: 'transparent', color: 'var(--text-assistive)', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                <Icon name="plus" size={16} /> 사업 추가
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
