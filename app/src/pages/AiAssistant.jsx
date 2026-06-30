import { useState, useRef, useEffect } from 'react';
import Icon from '../components/Icon';

const AI_AVATAR = (
  <svg viewBox="0 0 36 36" fill="none" width="36" height="36" aria-hidden="true">
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

const INIT_MESSAGES = [
  {
    role: 'ai',
    text: '안녕하세요! 저는 주차 민원 분석 AI 어시스턴트입니다.\n정책 문서·조례를 검색하거나 민원 현황을 분석해 드릴 수 있어요.',
    cite: null,
    chips: ['민원 현황 요약 →', '리포트 생성 →'],
  },
  { role: 'user', text: '연동 지역 불법주차 집중 구역 알려줘', cite: null, chips: null },
  {
    role: 'ai',
    text: '연동 지역의 불법주차 집중 구역 분석 결과입니다. 최근 3개월 기준 연동 대로변이 월평균 52건으로 1위를 기록하고 있습니다.',
    cite: { title: '주차장 설치 및 관리 조례 제7조', body: '시장은 불법주차 다발 지역을 집중 관리 구역으로 지정하고 단속 및 계도 활동을 강화하여야 한다.' },
    chips: ['집중 구역 분석 열기 →', '리포트 생성 →'],
  },
];

const RECENT_CONVERSATIONS = [
  { title: '주차장 요금 및 운영 조례 제7조', date: '2026.06.22 14:30' },
  { title: '2025년 주차장 운영 개선 계획', date: '2026.06.21 10:15' },
  { title: '연동 불법주차 집중 구역 분석', date: '2026.06.20 16:40' },
  { title: '공영주차장 운영 관리 지침', date: '2026.06.18 09:22' },
  { title: '노형동 주차 수요 예측 분석', date: '2026.06.15 13:55' },
  { title: '거주자 우선주차 신청 현황', date: '2026.06.12 11:30' },
  { title: '전기차 충전구역 단속 기준', date: '2026.06.10 08:50' },
];

const RECENT_REPORTS = [
  { name: '2026년 3월 민원 요약', date: '2026.04.01' },
  { name: '2026년 2월 민원 요약', date: '2026.03.01' },
  { name: '2026년 1월 민원 요약', date: '2026.02.01' },
];

const FAQ = [
  '이번 달 민원 현황 요약해줘',
  '불법주차 단속 관련 행정 절차는?',
  '공유주차제 도입 요건 알려줘',
];

export default function AiAssistant() {
  const [messages, setMessages] = useState(INIT_MESSAGES);
  const [input, setInput] = useState('');
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const send = (text) => {
    const t = text || input.trim();
    if (!t) return;
    setInput('');
    const userMsg = { role: 'user', text: t, cite: null, chips: null };
    const aiMsg = { role: 'ai', text: `"${t}"에 대한 분석 결과를 검색 중입니다. 잠시 후 결과를 알려드리겠습니다.`, cite: null, chips: ['민원 현황 요약 →', '리포트 생성 →'] };
    setMessages((m) => [...m, userMsg, aiMsg]);
  };

  return (
    <>
      <header className="topbar">
        <div>
          <h1 className="page-title">AI 어시스턴트</h1>
          <p className="page-sub">sLLM 기반 — RAG 정책 문서·조례 검색</p>
        </div>
        <div className="topbar__actions">
          <button className="bell" type="button" aria-label="알림"><Icon name="bell" size={22} /><span className="bell__badge">3</span></button>
        </div>
      </header>

      <div className="content" style={{ paddingTop: 24 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 20, alignItems: 'start' }}>

          {/* 채팅 카드 */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', height: 'calc(100vh - 180px)', minHeight: 500 }}>
            {/* 채팅 스크롤 */}
            <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: 20 }}>
              {messages.map((msg, i) => (
                <div key={i} style={{ display: 'flex', flexDirection: msg.role === 'user' ? 'row-reverse' : 'row', gap: 10, alignItems: 'flex-start' }}>
                  {msg.role === 'ai' && <div style={{ flexShrink: 0, marginTop: 2 }}>{AI_AVATAR}</div>}
                  <div style={{ maxWidth: '80%', display: 'flex', flexDirection: 'column', gap: 8, alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
                    <div style={{
                      padding: '14px 18px',
                      borderRadius: msg.role === 'user' ? '18px 4px 18px 18px' : '4px 18px 18px 18px',
                      background: msg.role === 'user' ? 'var(--primary)' : 'var(--fill-normal)',
                      color: msg.role === 'user' ? '#fff' : 'var(--text-strong)',
                      fontSize: 14,
                      lineHeight: 1.6,
                      whiteSpace: 'pre-wrap',
                    }}>
                      {msg.cite && (
                        <div style={{ padding: '10px 14px', borderRadius: 8, background: 'var(--blue-99)', border: '1px solid var(--blue-90)', marginBottom: 10, fontSize: 13 }}>
                          <div style={{ fontWeight: 700, color: 'var(--primary)', marginBottom: 4 }}>{msg.cite.title}</div>
                          <div style={{ color: 'var(--text-neutral)', lineHeight: 1.5 }}>{msg.cite.body}</div>
                          <button type="button" style={{ marginTop: 6, fontSize: 12, color: 'var(--primary)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, textDecoration: 'underline' }}>조례 원문 보기 →</button>
                        </div>
                      )}
                      {msg.text}
                    </div>
                    {msg.chips && (
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        {msg.chips.map((c) => (
                          <button key={c} type="button" onClick={() => send(c)} style={{ height: 32, padding: '0 14px', borderRadius: 16, border: '1px solid var(--line-normal)', background: '#fff', fontSize: 13, cursor: 'pointer', color: 'var(--text-neutral)', fontWeight: 600 }}>{c}</button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* 입력창 */}
            <div style={{ borderTop: '1px solid var(--line-alternative)', padding: '16px 20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', borderRadius: 24, border: '1.5px solid var(--line-normal)', background: 'var(--fill-normal)' }}>
                <button type="button" style={{ width: 28, height: 28, borderRadius: '50%', border: '1.5px solid var(--line-normal)', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0, fontSize: 18, color: 'var(--text-alternative)', fontWeight: 700, lineHeight: 1 }}>+</button>
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && send()}
                  placeholder="행정 정보를 검색하거나 민원 분석을 요청하세요."
                  style={{ flex: 1, border: 'none', background: 'transparent', fontSize: 14, outline: 'none', color: 'var(--text-strong)', fontFamily: 'inherit' }}
                />
                <button type="button" onClick={() => send()} style={{ width: 34, height: 34, borderRadius: '50%', border: 'none', background: input.trim() ? 'var(--primary)' : 'var(--cool-neutral-80)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0, transition: 'background 0.2s' }}>
                  <svg viewBox="0 0 24 24" fill="none" width="18" height="18"><path d="M12 4l0 16M12 4l-4 4M12 4l4 4" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                </button>
              </div>
            </div>
          </div>

          {/* 우측 사이드 패널 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* 최근 대화 */}
            <div className="card" style={{ padding: '20px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
              <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: 'var(--text-strong)' }}>최근 대화</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {RECENT_CONVERSATIONS.map((c, i) => (
                  <button key={i} type="button" style={{ display: 'flex', flexDirection: 'column', gap: 2, padding: '8px 10px', borderRadius: 8, border: 'none', background: 'none', cursor: 'pointer', textAlign: 'left', transition: 'background 0.15s' }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'var(--fill-normal)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'none'}>
                    <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-strong)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '100%' }}>{c.title}</span>
                    <span style={{ fontSize: 11, color: 'var(--text-assistive)' }}>{c.date}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* 최근 리포트 */}
            <div className="card" style={{ padding: '20px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
              <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: 'var(--text-strong)' }}>최근 리포트</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {RECENT_REPORTS.map((r, i) => (
                  <button key={i} type="button" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 8, border: 'none', background: 'none', cursor: 'pointer', textAlign: 'left' }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'var(--fill-normal)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'none'}>
                    <div style={{ width: 28, height: 28, borderRadius: 6, background: 'var(--red-95)', color: 'var(--red-40)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 11, fontWeight: 800 }}>P</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-strong)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-assistive)' }}>{r.date}</div>
                    </div>
                    <Icon name="download" size={14} />
                  </button>
                ))}
              </div>
            </div>

            {/* 자주 하는 질문 */}
            <div className="card" style={{ padding: '20px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
              <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: 'var(--text-strong)' }}>자주 하는 질문</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {FAQ.map((q, i) => (
                  <button key={i} type="button" onClick={() => send(q)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 8, border: '1px solid var(--line-alternative)', background: 'var(--fill-normal)', cursor: 'pointer', textAlign: 'left', fontSize: 13, color: 'var(--text-neutral)', fontFamily: 'inherit', transition: 'border-color 0.15s' }}
                    onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--primary)'}
                    onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--line-alternative)'}>
                    <Icon name="sparkle" size={14} />
                    {q}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
