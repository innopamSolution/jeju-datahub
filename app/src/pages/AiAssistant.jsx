import { useState, useRef, useEffect } from 'react';
import Icon from '../components/Icon';

const QUICK = ['오늘 민원 현황 요약해줘', '집중구역 TOP 3 알려줘', '이번 달 불법주차 추이는?', '추천 정책은 뭐야?'];

const INIT_MSGS = [
  { role: 'ai', text: '안녕하세요! 제주 주차민원 AI 어시스턴트입니다.\n민원 현황, 집중 구역 분석, 정책 추천 등 무엇이든 물어보세요.' },
];

const AUTO_REPLIES = {
  '오늘 민원 현황 요약해줘': '오늘(2025.12.01) 기준 민원 현황입니다.\n• 총 민원 건수: **247건** (+12% 전일 대비)\n• 불법주차 발생: **183건** (+6%)\n• 위험 단계 발생: **3건**\n\n집중 구역은 연동 대로변, 노형사거리 순으로 높습니다.',
  '집중구역 TOP 3 알려줘': 'AI 클러스터링 분석 결과 집중구역 TOP 3입니다.\n\n1️⃣ **연동 대로변** — 심각 (52건)\n2️⃣ **노형사거리 인근** — 경고 (38건)\n3️⃣ **이도2동 상업지구** — 경고 (28건)\n\n집중 구역 분석 페이지에서 상세 지도를 확인하실 수 있습니다.',
  '이번 달 불법주차 추이는?': '11월 불법주차 추이 분석 결과:\n• 월초 대비 증가율: +18%\n• 주말 평균이 평일 대비 2.3배 높음\n• 오전 9~11시, 오후 6~8시 집중\n\n특히 연동·노형 권역의 상업지구에서 급증하는 양상입니다.',
  '추천 정책은 뭐야?': '데이터 분석 기반 추천 정책입니다.\n\n🅐 **주차 단속 강화** — 예상 감소율 35%\n🅑 **공영주차장 확충 (연동)** — 수용 120대\n🅒 **스마트 주차 유도 시스템** — 혼잡도 실시간 안내\n\n정책 효과 시뮬레이션 페이지에서 상세 비교가 가능합니다.',
};

export default function AiAssistant() {
  const [messages, setMessages] = useState(INIT_MSGS);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const send = (text) => {
    const q = text || input.trim();
    if (!q) return;
    setInput('');
    setMessages((m) => [...m, { role: 'user', text: q }]);
    setLoading(true);
    setTimeout(() => {
      const reply = AUTO_REPLIES[q] || '죄송합니다, 해당 질문에 대한 데이터를 분석 중입니다. 잠시 후 다시 시도해 주세요.';
      setMessages((m) => [...m, { role: 'ai', text: reply }]);
      setLoading(false);
    }, 900);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, padding: '0 48px 0' }}>
      {/* 헤더 */}
      <div style={{ padding: '40px 0 24px', flexShrink: 0 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, margin: 0 }}>AI 어시스턴트</h1>
        <p style={{ color: 'var(--text-alternative)', marginTop: 4 }}>주차민원 데이터 기반 AI 분석 도우미</p>
      </div>

      {/* 채팅 영역 */}
      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 20, paddingBottom: 24 }}>
        {messages.map((m, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start', gap: 12 }}>
            {m.role === 'ai' && (
              <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'var(--blue-95)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, alignSelf: 'flex-end' }}>
                <Icon name="sparkle" size={20} />
              </div>
            )}
            <div style={{
              maxWidth: '68%', padding: '14px 18px', borderRadius: m.role === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
              background: m.role === 'user' ? 'var(--primary)' : 'var(--card-bg)',
              color: m.role === 'user' ? '#fff' : 'var(--text-strong)',
              fontSize: 14, lineHeight: 1.7, fontWeight: 400,
              boxShadow: m.role === 'ai' ? '0 2px 12px rgba(0,0,0,0.08)' : 'none',
              whiteSpace: 'pre-line',
            }}>
              {m.text.replace(/\*\*(.*?)\*\*/g, '$1')}
            </div>
          </div>
        ))}
        {loading && (
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end' }}>
            <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'var(--blue-95)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="sparkle" size={20} />
            </div>
            <div style={{ padding: '14px 18px', borderRadius: '18px 18px 18px 4px', background: 'var(--card-bg)', boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}>
              <span style={{ display: 'flex', gap: 4 }}>
                {[0, 1, 2].map((i) => (
                  <span key={i} style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--text-assistive)', animation: `bounce 1s ${i * 0.2}s infinite` }} />
                ))}
              </span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* 빠른 질문 */}
      <div style={{ flexShrink: 0, display: 'flex', gap: 8, flexWrap: 'wrap', paddingBottom: 12 }}>
        {QUICK.map((q) => (
          <button key={q} onClick={() => send(q)} style={{ height: 34, padding: '0 14px', borderRadius: 20, border: '1px solid var(--primary)', background: 'var(--blue-95)', color: 'var(--primary)', fontFamily: 'inherit', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
            {q}
          </button>
        ))}
      </div>

      {/* 입력창 */}
      <div style={{ flexShrink: 0, display: 'flex', gap: 10, padding: '12px 0 32px', borderTop: '1px solid var(--line-alternative)' }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && send()}
          placeholder="민원 현황, 집중 구역, 정책 추천 등을 물어보세요..."
          style={{ flex: 1, height: 52, padding: '0 20px', borderRadius: 12, border: '1px solid var(--line-normal)', background: 'var(--fill-normal)', fontFamily: 'inherit', fontSize: 14, outline: 'none' }}
        />
        <button
          onClick={() => send()}
          disabled={!input.trim() && !loading}
          style={{ width: 52, height: 52, borderRadius: 12, border: 'none', background: input.trim() ? 'var(--primary)' : 'var(--cool-neutral-90)', color: '#fff', cursor: input.trim() ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <Icon name="arrow-right" size={22} />
        </button>
      </div>

      <style>{`@keyframes bounce { 0%,80%,100%{transform:translateY(0)} 40%{transform:translateY(-6px)} }`}</style>
    </div>
  );
}
