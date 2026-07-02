import { useState, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Icon from '../components/Icon';
import NotificationBell from '../components/NotificationBell';

const AV = (
  <svg viewBox="0 0 36 36" fill="none" width="30" height="30" aria-hidden="true">
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

const RECENT = [
  { name: '주차장 요금 및 운영 조례 제7조', time: '2026.03.24 13:26' },
  { name: '2025년 주차장 운영 개선 계획',    time: '2025.04.12 14:13' },
  { name: '연동 불법주차 집중 구역 분석',    time: '2025.02.19 10:05' },
  { name: '공영주차장 운영 관리 지침',       time: '2024.01.02 12:34' },
  { name: '노형동 주차 수요 예측 분석',      time: '2023.11.15 09:48' },
  { name: '거주자 우선주차 신청 현황',       time: '2023.09.27 16:02' },
  { name: '전기차 충전구역 단속 기준',       time: '2023.08.03 11:19' },
];

const REPORTS = [
  { name: '2026년 3월 민원 요약', time: '2026.04.01 12:25' },
  { name: '2026년 2월 민원 요약', time: '2026.03.01 12:25' },
  { name: '2026년 1월 민원 요약', time: '2026.02.01 12:25' },
];

const FAQ = [
  '이번 달 민원 현황 요약해줘',
  '불법주차 단속 관련 행정 절차는?',
  '공유주차제 도입 요건 알려줘',
];

const REPORT_DL = (
  <svg viewBox="0 0 24 24" fill="none" width="18" height="18"><path d="M12 4v10m0 0 4-4m-4 4-4-4M5 19h14" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" /></svg>
);

const INITIAL_MSGS = [
  { role: 'ai', text: '안녕하세요! 주차민원 관련 행정 정보 검색, 조례 확인, 민원 요약 등을 도와드립니다.' },
  { role: 'user', text: '연동 불법주차 관련 제주시 조례를 알려줘' },
  { role: 'ai', cite: true },
];

let msgId = 100;

export default function AiAssistant() {
  const location = useLocation();
  const [messages, setMessages] = useState(INITIAL_MSGS);
  const [input, setInput] = useState(location.state?.prefill ?? '');
  const [plusOpen, setPlusOpen] = useState(false);
  const scrollRef = useRef(null);
  const plusRef = useRef(null);
  const fileRef = useRef(null);
  const fieldRef = useRef(null);
  const timers = useRef([]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  useEffect(() => {
    if (location.state?.focus || location.state?.prefill) {
      fieldRef.current?.focus();
      window.history.replaceState({}, '');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  useEffect(() => {
    if (!plusOpen) return;
    const onDoc = (e) => { if (plusRef.current && !plusRef.current.contains(e.target)) setPlusOpen(false); };
    const onKey = (e) => { if (e.key === 'Escape') setPlusOpen(false); };
    document.addEventListener('click', onDoc);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('click', onDoc); document.removeEventListener('keydown', onKey); };
  }, [plusOpen]);

  const respond = (aiText) => {
    const typingId = ++msgId;
    setMessages((m) => [...m, { role: 'ai', typing: true, id: typingId }]);
    const t = setTimeout(() => {
      setMessages((m) => m.filter((x) => x.id !== typingId).concat({ role: 'ai', text: aiText, id: ++msgId }));
    }, 900);
    timers.current.push(t);
  };

  const submit = (text) => {
    const v = (text ?? input).trim();
    if (!v) return;
    setMessages((m) => [...m, { role: 'user', text: v, id: ++msgId }]);
    setInput('');
    respond('요청하신 내용을 분석하고 있습니다. 관련 조례·민원 데이터를 검색해 결과를 정리해 드릴게요.');
  };

  const onFile = (e) => {
    const f = e.target.files && e.target.files[0];
    if (!f) return;
    setMessages((m) => [...m, { role: 'user', text: '📎 ' + f.name, id: ++msgId }]);
    respond('첨부하신 파일을 확인했습니다. 내용을 분석해 드릴까요?');
    e.target.value = '';
  };

  return (
    <>
      <header className="topbar">
        <div>
          <h1 className="page-title">AI 어시스턴트</h1>
          <p className="page-sub">sLLM 기반 — RAG 정책 문서·조례 검색</p>
        </div>
        <div className="topbar__actions">
          <NotificationBell />
        </div>
      </header>

      <div className="content content--ai">
        <section className="ai-row">
          {/* 채팅 컬럼 */}
          <div className="card chat-card">
            <div className="chat-scroll" ref={scrollRef}>
              {messages.map((m, i) => {
                if (m.role === 'user') {
                  return (
                    <div key={m.id ?? i} className="msg msg--user">
                      <div className="bubble bubble--user">{m.text}</div>
                    </div>
                  );
                }
                return (
                  <div key={m.id ?? i} className="msg msg--ai">
                    <span className="av">{AV}</span>
                    <div className="bubble">
                      {m.typing ? (
                        <span className="typing"><i /><i /><i /></span>
                      ) : m.cite ? (
                        <>
                          <div className="cite">
                            <div className="cite__title"><span className="cite__mark" />제주특별자치도 주차장 설치 및 관리 조례</div>
                            <p className="cite__body">제7조(불법주정차 단속) ① 도로에서의 주차 또는 정차는 「도로교통법」 제32조에 따라 금지구역에서 행하지 아니한다…</p>
                            <a className="cite__link">조례 원문 보기 <span aria-hidden="true">→</span></a>
                          </div>
                          <p className="bubble__p">연동은 상업지역으로 단속 우선 지역에 해당합니다.</p>
                          <div className="chip-row">
                            <button className="chip" onClick={() => submit('민원 현황 요약')}>민원 현황 요약 <span aria-hidden="true">→</span></button>
                            <button className="chip" onClick={() => submit('리포트 생성')}>리포트 생성 <span aria-hidden="true">→</span></button>
                          </div>
                        </>
                      ) : (
                        m.text
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="chat-input">
              <div className="composer">
                <div className="composer__pill" ref={plusRef}>
                  <button className="composer__plus" aria-label="추가" aria-haspopup="true" aria-expanded={plusOpen}
                    onClick={(e) => { e.stopPropagation(); setPlusOpen((o) => !o); }}>
                    <svg viewBox="0 0 24 24" fill="none" width="22" height="22"><path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
                  </button>
                  <input ref={fieldRef} className="composer__field" type="text" placeholder="행정 정보를 검색하거나 민원 분석을 요청하세요." autoComplete="off"
                    value={input} onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); submit(); } }} />
                  {plusOpen && (
                    <div className="plus-menu">
                      <button className="plus-menu__item" type="button" onClick={() => { setPlusOpen(false); fileRef.current?.click(); }}>
                        <svg viewBox="0 0 24 24" fill="none" width="18" height="18"><path d="M16.6 6.4 9 14a2.1 2.1 0 0 0 3 3l7.6-7.6a4 4 0 0 0-5.7-5.7L6.4 11.3a6 6 0 0 0 8.5 8.5l5.7-5.7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg> 파일 추가
                      </button>
                    </div>
                  )}
                </div>
                <button className="composer__send" aria-label="전송" onClick={() => submit()}>
                  <svg viewBox="0 0 24 24" fill="none" width="22" height="22"><path d="M3.6 20.3 21 12 3.6 3.7 3.6 10.2 14.5 12 3.6 13.8 3.6 20.3Z" fill="currentColor" /></svg>
                </button>
              </div>
              <input type="file" ref={fileRef} hidden onChange={onFile} />
            </div>
          </div>

          {/* 사이드 패널 */}
          <div className="ai-side">
            <div className="card ai-card">
              <h2 className="ai-card__title">최근 대화</h2>
              <div className="recent">
                {RECENT.map((r, i) => (
                  <button key={i} className="recent__row">
                    <div className="recent__name">{r.name}</div>
                    <div className="recent__time">{r.time}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="card ai-card">
              <h2 className="ai-card__title">최근 리포트</h2>
              <div className="report">
                {REPORTS.map((r, i) => (
                  <button key={i} className="report__row">
                    <span className="report__ic">P</span>
                    <div className="report__main">
                      <div className="report__name">{r.name}</div>
                      <div className="report__time">{r.time}</div>
                    </div>
                    <span className="report__dl">{REPORT_DL}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="card ai-card">
              <h2 className="ai-card__title">자주 하는 질문</h2>
              <div className="faq">
                {FAQ.map((q, i) => (
                  <button key={i} className="faq__row" onClick={() => submit(q)}>
                    <span className="faq__ic">{AV}</span>
                    <span className="faq__text">{q}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
