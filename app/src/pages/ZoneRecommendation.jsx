import { useState } from 'react';
import Icon from '../components/Icon';

const ZONES = [
  {
    rank: 1, name: '연동 대로변 구역 A', address: '제주시 연동 1100로 인근',
    score: 94, type: '공영주차장', area: '2,400㎡', capacity: 120,
    reason: '민원 빈도 최고, 유동인구 밀집, 인접 부지 활용 가능',
    tags: ['긴급', '신규'],
    color: 'var(--red-50)', bg: 'var(--red-95)',
  },
  {
    rank: 2, name: '제주도청 주변 구역 B', address: '제주시 문연로 6 주변',
    score: 88, type: '공영주차장', area: '1,800㎡', capacity: 90,
    reason: '단속 빈도 상위, 공공기관 밀집 지역, 주차 수요 상시 高',
    tags: ['우선'],
    color: 'var(--red-50)', bg: 'var(--red-95)',
  },
  {
    rank: 3, name: '노형사거리 구역 C', address: '제주시 노형동 상업지구',
    score: 82, type: '노상주차장', area: '800㎡', capacity: 40,
    reason: '상업시설 밀집, 야간 민원 다발, 단기 확충 가능',
    tags: ['검토'],
    color: 'var(--orange-50)', bg: 'var(--orange-95)',
  },
  {
    rank: 4, name: '신광초 주변 구역 D', address: '제주시 오라이동',
    score: 76, type: '공영주차장', area: '1,200㎡', capacity: 60,
    reason: '학교 주변 불법주차 상시, 어린이 통학로 안전 확보 필요',
    tags: ['안전'],
    color: 'var(--orange-50)', bg: 'var(--orange-95)',
  },
  {
    rank: 5, name: '동문시장 구역 E', address: '제주시 동문로 관광상권',
    score: 71, type: '스마트주차장', area: '1,500㎡', capacity: 75,
    reason: '관광객 집중, 주말·성수기 민원 급증, 스마트 시스템 도입 검토',
    tags: ['관광'],
    color: 'var(--blue-50)', bg: 'var(--blue-95)',
  },
];

const TAG_COLORS = {
  긴급: { bg: 'var(--red-95)', color: 'var(--red-50)' },
  신규: { bg: 'var(--blue-95)', color: 'var(--blue-45)' },
  우선: { bg: 'var(--orange-95)', color: 'var(--orange-50)' },
  검토: { bg: 'var(--cool-neutral-95)', color: 'var(--text-alternative)' },
  안전: { bg: 'var(--green-95)', color: 'var(--green-40)' },
  관광: { bg: 'var(--blue-95)', color: 'var(--blue-45)' },
};

export default function ZoneRecommendation() {
  const [selected, setSelected] = useState(null);

  return (
    <div style={{ padding: '40px 48px', display: 'flex', flexDirection: 'column', gap: 32, flex: 1, minHeight: 0, overflowY: 'auto' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 700, margin: 0 }}>구역 추천</h1>
          <p style={{ color: 'var(--text-alternative)', marginTop: 4 }}>AI 분석 기반 주차장 신설 추천 구역</p>
        </div>
        <button style={{ display: 'flex', alignItems: 'center', gap: 8, height: 44, padding: '0 20px', borderRadius: 10, border: '1px solid var(--line-normal)', background: 'var(--fill-normal)', fontFamily: 'inherit', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
          <Icon name="download" size={18} /> 보고서 내보내기
        </button>
      </div>

      {/* 요약 카드 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
        {[
          { label: '추천 구역 수', value: '5개소', icon: 'location', bg: 'var(--blue-95)', color: 'var(--blue-50)' },
          { label: '예상 수용 대수', value: '385대', icon: 'document', bg: 'var(--green-95)', color: 'var(--green-40)' },
          { label: '민원 감소 예측', value: '▼42%', icon: 'chart', bg: 'var(--orange-95)', color: 'var(--orange-50)' },
        ].map((s) => (
          <div key={s.label} className="card" style={{ padding: '24px 28px', display: 'flex', alignItems: 'center', gap: 20 }}>
            <div style={{ width: 60, height: 60, borderRadius: 16, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: s.color, flexShrink: 0 }}>
              <Icon name={s.icon} size={26} />
            </div>
            <div>
              <div style={{ fontSize: 13, color: 'var(--text-alternative)', fontWeight: 600, marginBottom: 4 }}>{s.label}</div>
              <div style={{ fontSize: 28, fontWeight: 700, fontFamily: 'var(--font-sans)', lineHeight: 1 }}>{s.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* 추천 목록 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {ZONES.map((z) => (
          <div
            key={z.rank}
            className="card"
            onClick={() => setSelected(selected === z.rank ? null : z.rank)}
            style={{ padding: '24px 28px', cursor: 'pointer', border: selected === z.rank ? '2px solid var(--primary)' : '1px solid transparent' }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 20 }}>
              <div style={{ width: 44, height: 44, borderRadius: '50%', background: z.bg, color: z.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 18, fontFamily: 'var(--font-sans)', flexShrink: 0 }}>
                {z.rank}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 18, fontWeight: 700 }}>{z.name}</span>
                  {z.tags.map((t) => (
                    <span key={t} style={{ fontSize: 11, fontWeight: 700, padding: '2px 10px', borderRadius: 20, background: TAG_COLORS[t]?.bg, color: TAG_COLORS[t]?.color }}>{t}</span>
                  ))}
                </div>
                <div style={{ fontSize: 13, color: 'var(--text-assistive)', marginBottom: 8 }}>{z.address}</div>
                <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 13, color: 'var(--text-neutral)' }}>유형: <b style={{ color: 'var(--text-strong)' }}>{z.type}</b></span>
                  <span style={{ fontSize: 13, color: 'var(--text-neutral)' }}>면적: <b style={{ color: 'var(--text-strong)' }}>{z.area}</b></span>
                  <span style={{ fontSize: 13, color: 'var(--text-neutral)' }}>수용: <b style={{ color: 'var(--text-strong)' }}>{z.capacity}대</b></span>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', flexShrink: 0 }}>
                <div style={{ fontSize: 11, color: 'var(--text-assistive)', marginBottom: 2 }}>종합점수</div>
                <div style={{ fontSize: 28, fontWeight: 800, fontFamily: 'var(--font-sans)', color: z.color }}>{z.score}</div>
              </div>
            </div>

            {selected === z.rank && (
              <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--line-alternative)' }}>
                <p style={{ fontSize: 13, color: 'var(--text-alternative)', fontWeight: 600, marginBottom: 6 }}>추천 사유</p>
                <p style={{ fontSize: 14, color: 'var(--text-neutral)', lineHeight: 1.7 }}>{z.reason}</p>
                <button style={{ marginTop: 16, padding: '10px 20px', borderRadius: 10, border: 'none', background: 'var(--primary)', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                  투자 우선순위 보드에 추가
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
