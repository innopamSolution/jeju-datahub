import { useState, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Icon from '../components/Icon';
import NotificationBell from '../components/NotificationBell';
import AiReportPreview from '../components/AiReportPreview';
import ScrollList from '../components/ScrollList';

const AV = (
  <svg viewBox="0 0 36 36" fill="none" width="30" height="30" aria-hidden="true">
    <path d="M18.6 8.4c0-2.6 2.1-4.6 4.7-4.6 0 2.6-2.1 4.6-4.7 4.6Z" fill="#3DA35D" />
    <circle cx="18" cy="21" r="12.5" fill="#F79009" />
    <circle cx="13.6" cy="19.6" r="1.4" fill="#4A3415" opacity="0.85" />
    <circle cx="22.4" cy="19.6" r="1.4" fill="#4A3415" opacity="0.85" />
    <path d="M14.9 24.2a3.9 3.9 0 0 0 6.2 0" stroke="#4A3415" strokeWidth="1.3" strokeLinecap="round" fill="none" opacity="0.85" />
  </svg>
);

const RECENT = [
  {
    name: '5월달 민원현황 요약', time: '2026.06.01 09:12',
    convo: [
      { role: 'user', text: '5월달 민원현황 요약해줘' },
      { role: 'ai', kind: 'summary' },
    ],
  },
  {
    name: '화재·과열 이벤트 상관 분석', time: '2026.06.01 09:40',
    convo: [
      { role: 'user', text: '최근 3개월간 화재·과열 이벤트가 많았던 공영주차장에서 주차 민원도 함께 늘었는지 분석해줘' },
      { role: 'ai', kind: 'fire' },
    ],
  },
  {
    name: '주차장 요금 및 운영 조례 제7조', time: '2026.03.24 13:26',
    convo: [
      { role: 'user', text: '연동 불법주차 관련 제주시 조례를 알려줘' },
      { role: 'ai', cite: true },
    ],
  },
  {
    name: '2025년 주차장 운영 개선 계획', time: '2025.04.12 14:13',
    convo: [
      { role: 'user', text: '2025년 주차장 운영 개선 계획 알려줘' },
      { role: 'ai', text: '2025년 주차장 운영 개선 계획은 노후 주차장 시설 개선, 스마트 주차관제 시스템 확대, 공유주차제 시범 도입을 주요 골자로 합니다.' },
    ],
  },
  {
    name: '연동 불법주차 집중 구역 분석', time: '2025.02.19 10:05',
    convo: [
      { role: 'user', text: '연동 불법주차 집중 구역 분석해줘' },
      { role: 'ai', text: '연동 지역은 상업시설 밀집 구간(연동로 일대)을 중심으로 불법주차 신고가 집중되고 있으며, 특히 퇴근 시간대(18~19시)에 발생 빈도가 높습니다.' },
    ],
  },
  {
    name: '공영주차장 운영 관리 지침', time: '2024.01.02 12:34',
    convo: [
      { role: 'user', text: '공영주차장 운영 관리 지침 알려줘' },
      { role: 'ai', text: '공영주차장은 운영시간 준수, 정기 시설 점검, 요금 정산 투명성 확보를 기본 원칙으로 관리하도록 지침에 명시되어 있습니다.' },
    ],
  },
  {
    name: '노형동 주차 수요 예측 분석', time: '2023.11.15 09:48',
    convo: [
      { role: 'user', text: '노형동 주차 수요 예측 분석해줘' },
      { role: 'ai', text: '노형동은 상업·업무시설 밀집으로 주중 낮 시간대 주차 수요가 공급을 초과하는 것으로 예측되며, 인근 공영주차장 확충이 필요합니다.' },
    ],
  },
  {
    name: '거주자 우선주차 신청 현황', time: '2023.09.27 16:02',
    convo: [
      { role: 'user', text: '거주자 우선주차 신청 현황 알려줘' },
      { role: 'ai', text: '거주자 우선주차 신청은 최근 분기 대비 증가 추세이며, 주거밀집지역을 중심으로 신청이 몰리고 있습니다.' },
    ],
  },
  {
    name: '전기차 충전구역 단속 기준', time: '2023.08.03 11:19',
    convo: [
      { role: 'user', text: '전기차 충전구역 단속 기준 알려줘' },
      { role: 'ai', text: '전기차 충전구역에 일반 차량이 주차할 경우 「친환경자동차법」에 따라 과태료가 부과되며, 충전 완료 후 장시간 방치 차량도 단속 대상입니다.' },
    ],
  },
];

const REPORTS = [
  { name: '2026년 3월 민원 요약', time: '2026.04.01 12:25' },
  { name: '2026년 2월 민원 요약', time: '2026.03.01 12:25' },
  { name: '2026년 1월 민원 요약', time: '2026.02.01 12:25' },
];

const FAQ = [
  '5월달 민원현황 요약해줘',
  '최근 3개월간 화재·과열 이벤트가 많았던 공영주차장에서 주차 민원도 함께 늘었는지 분석해줘',
  '불법주차 단속 관련 행정 절차는?',
  '공유주차제 도입 요건 알려줘',
];

/* 민원 요약 리포트 (UI-PAR-005_AI어시스턴트_보고서 / ReportPreview_Overlay 설계 반영) */
const SUMMARY_REPORT = {
  title: '2026년 5월 주차민원 분석 리포트',
  meta: '분석기간 2026.05.01 ~ 2026.05.31  ·  생성일 2026.06.01  ·  생성자 홍길동',
  kpis: [
    { label: '총 민원 건수',   value: '247', delta: '▲ 전월 대비 +12%' },
    { label: '불법주차 발생', value: '183', delta: '▲ 전월 대비 +6%' },
    { label: '위험단계 발생', value: '3',   delta: '경보 1 · 경고 2' },
  ],
  summary: '2026년 5월 한 달간 주차민원은 총 247건으로 전월 대비 12% 증가했습니다. 유형별로는 불법주차가 183건(74%)으로 가장 큰 비중을 차지했으며, 이중주차·시설점거가 뒤를 이었습니다. 지역별로는 연동·노형동 등 상업지역을 중심으로 민원이 집중되어 단속 우선 관리가 필요합니다. 시간대별로는 출퇴근 시간(08~09시, 18~19시)에 민원이 집중되는 경향을 보였습니다.',
  chartTitle: '읍·면·동별 민원 건수 (Top 5)',
  chart: [
    { label: '연동',   value: 52 },
    { label: '노형동', value: 38 },
    { label: '이도동', value: 29 },
    { label: '아라동', value: 21 },
    { label: '삼도동', value: 10 },
  ],
};

/* 화재·과열 이벤트 × 주차 민원 상관 분석 리포트 (실시간감시솔루션 연계 시나리오) */
const FIRE_REPORT = {
  title: '화재·과열 이벤트 × 주차민원 상관 분석 리포트',
  meta: '분석기간 2026.03.01 ~ 2026.05.31  ·  생성일 2026.06.01  ·  생성자 홍길동',
  kpis: [
    { label: '상관계수',   value: '0.71', delta: '양(+)의 상관관계' },
    { label: '최다 발생',  value: '노형',  delta: '이벤트 62 · 민원 48' },
    { label: '예외 지역',  value: '애월',  delta: '이벤트 24 · 민원 6' },
  ],
  summary: '최근 3개월(2026.03~05) 화재·과열 이벤트가 많았던 공영주차장과 주차 민원을 교차 분석한 결과, 두 지표가 함께 증가하는 양(+)의 상관관계(상관계수 0.71)를 보였습니다. 노형공영주차장이 이벤트 62건·민원 48건으로 모두 최다였고, 이도(이벤트 41·민원 33), 연동(이벤트 28·민원 25) 순입니다. 다만 애월공영주차장은 이벤트(24건) 대비 민원(6건)이 적어 예외로, 이용량보다 시설 노후가 원인으로 추정됩니다.',
  chartTitle: '주차장별 화재·과열 이벤트 (Top 4)',
  chartUnit: '건',
  chart: [
    { label: '노형', value: 62 },
    { label: '이도', value: 41 },
    { label: '연동', value: 28 },
    { label: '애월', value: 24 },
  ],
};

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
  const scrollRef = useRef(null);
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

  const [reportPreview, setReportPreview] = useState(null);

  const respond = (aiMsg) => {
    const typingId = ++msgId;
    setMessages((m) => [...m, { role: 'ai', typing: true, id: typingId }]);
    const t = setTimeout(() => {
      setMessages((m) => m.filter((x) => x.id !== typingId).concat({ role: 'ai', id: ++msgId, ...aiMsg }));
    }, 900);
    timers.current.push(t);
  };

  const submit = (text) => {
    const v = (text ?? input).trim();
    if (!v) return;
    setMessages((m) => [...m, { role: 'user', text: v, id: ++msgId }]);
    setInput('');

    if (v.includes('민원현황') || v.includes('민원 현황')) {
      respond({ kind: 'summary' });
    } else if (v.includes('화재') || v.includes('과열')) {
      respond({ kind: 'fire' });
    } else {
      respond({ text: '요청하신 내용을 분석하고 있습니다. 관련 조례·민원 데이터를 검색해 결과를 정리해 드릴게요.' });
    }
  };

  const onFile = (e) => {
    const f = e.target.files && e.target.files[0];
    if (!f) return;
    setMessages((m) => [...m, { role: 'user', text: '📎 ' + f.name, id: ++msgId }]);
    respond({ text: '첨부하신 파일을 확인했습니다. 내용을 분석해 드릴까요?' });
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
                            <button type="button" className="cite__link">조례 원문 보기 <span aria-hidden="true">→</span></button>
                          </div>
                          <p className="bubble__p">연동은 상업지역으로 단속 우선 지역에 해당합니다.</p>
                        </>
                      ) : m.kind === 'summary' ? (
                        <>
                          <div className="cite">
                            <div className="cite__title"><span className="cite__mark" />2026년 5월 민원 요약</div>
                            <p className="cite__body">2026년 5월 총 민원 247건이 접수되어 전월 대비 12% 증가했습니다. 이 중 불법주차가 183건(74%)으로 가장 많았고, 위험단계 발생은 3건입니다. 읍·면·동별로는 연동 52건, 노형동 38건, 이도동 29건 순으로 민원이 집중되었습니다.</p>
                          </div>
                          <p className="bubble__p">연동·노형동이 상업지역을 중심으로 민원이 집중되어 단속 우선 관리가 필요합니다.</p>
                          <div className="chip-row">
                            <button className="chip" onClick={() => setReportPreview(SUMMARY_REPORT)}>리포트 생성 <span aria-hidden="true">→</span></button>
                          </div>
                        </>
                      ) : m.kind === 'fire' ? (
                        <>
                          <div className="cite">
                            <div className="cite__title"><span className="cite__mark" />최근 3개월 화재·과열 이벤트 × 주차 민원 상관 분석</div>
                            <p className="cite__body">최근 3개월(2026.03~05) 화재·과열 이벤트가 많았던 공영주차장과 주차 민원을 교차 분석한 결과, 두 지표가 함께 증가하는 양(+)의 상관관계(상관계수 0.71)를 보였습니다. 노형공영주차장이 이벤트 62건·민원 48건으로 모두 최다였고, 이도(이벤트 41·민원 33), 연동(이벤트 28·민원 25) 순입니다. 다만 애월공영주차장은 이벤트(24건) 대비 민원(6건)이 적어 예외로, 이용량보다 시설 노후가 원인으로 추정됩니다.</p>
                          </div>
                          <p className="bubble__p">화재·과열과 민원이 함께 증가한 노형·이도 주차장은 안전 보강·주차 관리를 우선 검토해야 합니다.</p>
                          <div className="chip-row">
                            <button className="chip" onClick={() => setReportPreview(FIRE_REPORT)}>리포트 생성 <span aria-hidden="true">→</span></button>
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
              <ScrollList className="recent">
                {RECENT.map((r, i) => (
                  <button
                    key={i}
                    className="recent__row"
                    onClick={() => setMessages(r.convo.map((m) => ({ ...m, id: ++msgId })))}
                  >
                    <div className="recent__name">{r.name}</div>
                    <div className="recent__time">{r.time}</div>
                  </button>
                ))}
              </ScrollList>
            </div>

            <div className="card ai-card">
              <h2 className="ai-card__title">최근 리포트</h2>
              <ScrollList className="report">
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
              </ScrollList>
            </div>

            <div className="card ai-card">
              <h2 className="ai-card__title">자주 하는 질문</h2>
              <ScrollList className="faq">
                {FAQ.map((q, i) => (
                  <button key={i} className="faq__row" onClick={() => submit(q)}>
                    <span className="faq__ic">{AV}</span>
                    <span className="faq__text">{q}</span>
                  </button>
                ))}
              </ScrollList>
            </div>
          </div>
        </section>
      </div>

      {reportPreview && (
        <AiReportPreview report={reportPreview} onClose={() => setReportPreview(null)} />
      )}
    </>
  );
}
