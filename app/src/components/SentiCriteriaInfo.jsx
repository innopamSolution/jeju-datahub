import { useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

/* 민원 감정 분류 기준 안내 — ⓘ 호버/포커스 시 팝오버.
   스크롤 컨테이너(side-col 등) overflow 에 잘리지 않도록 createPortal + position:fixed 로
   document.body 에 띄우고, 아래 공간이 부족하면 위로 뒤집어 표시한다.
   align: 'left'(아이콘 기준 왼쪽 정렬) | 'right'(오른쪽 정렬) */
export default function SentiCriteriaInfo({ size = 16, align = 'left' }) {
  const anchorRef = useRef(null);
  const popRef = useRef(null);
  const [hover, setHover] = useState(false);
  const [pinned, setPinned] = useState(false); // 클릭 시 고정 (마우스를 떼도 유지)
  const [pos, setPos] = useState({ top: -9999, left: -9999 });
  const open = hover || pinned;

  const place = () => {
    const a = anchorRef.current;
    const pop = popRef.current;
    if (!a) return;
    const r = a.getBoundingClientRect();
    const W = 340;
    const H = pop ? pop.offsetHeight : 360;
    const gap = 8;
    let left = align === 'right' ? r.right - W : r.left - 8;
    left = Math.max(12, Math.min(left, window.innerWidth - W - 12));
    let top = r.bottom + gap;
    if (top + H > window.innerHeight - 12) {
      const above = r.top - gap - H;
      top = above >= 12 ? above : Math.max(12, window.innerHeight - H - 12);
    }
    setPos({ top: Math.round(top), left: Math.round(left) });
  };

  useLayoutEffect(() => {
    if (!open) return;
    place();
    const onReflow = () => place();
    window.addEventListener('resize', onReflow);
    window.addEventListener('scroll', onReflow, true);
    return () => {
      window.removeEventListener('resize', onReflow);
      window.removeEventListener('scroll', onReflow, true);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // 고정(클릭)된 상태에서는 바깥 클릭 / ESC 로만 닫는다
  useLayoutEffect(() => {
    if (!pinned) return;
    const onDoc = (e) => {
      if (anchorRef.current && anchorRef.current.contains(e.target)) return;
      if (popRef.current && popRef.current.contains(e.target)) return;
      setPinned(false);
    };
    const onKey = (e) => { if (e.key === 'Escape') setPinned(false); };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [pinned]);

  return (
    <span
      ref={anchorRef}
      className="senti-info"
      tabIndex={0}
      aria-label="감정 분류 기준 안내"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
    >
      <svg viewBox="0 0 24 24" width={size} height={size} fill="none" aria-hidden="true">
        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
        <path d="M12 11v5.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <circle cx="12" cy="7.6" r="1.2" fill="currentColor" />
      </svg>
      {open && createPortal(
        <div
          className="senti-pop senti-pop--fixed"
          role="tooltip"
          ref={popRef}
          style={{ top: pos.top, left: pos.left }}
        >
          <div className="senti-pop__title">감정 분류 기준</div>
          <ul className="senti-pop__defs">
            <li><span className="senti-tag senti-tag--pos">긍정</span>불만 없음 (신고·문의·요청)</li>
            <li><span className="senti-tag senti-tag--neu">보통</span>불만은 있으나 감정이 실리지 않음 (사무적 지적, 가벼운 아쉬움)</li>
            <li><span className="senti-tag senti-tag--neg">부정</span>민원 처리 주체(기관·부서·시설 관리·제도와 처리 결과·응대)를 향한 불만이 감정으로 드러남</li>
          </ul>
          <div className="senti-pop__sec">
            <div className="senti-pop__sub">‘부정’으로 보는 신호 <span>(하나 이상)</span></div>
            <p className="senti-pop__txt">미조치·지연 항의, 응대 항의, 따지는 반문, 부정 감정어(완곡한 표현 포함), 불신·단념, 짜증 섞인 어미·말 끊기, 반말 힐난</p>
          </div>
          <div className="senti-pop__sec">
            <div className="senti-pop__sub">‘부정’으로 올리지 않는 경우</div>
            <ul className="senti-pop__list">
              <li>사연이 심각해도 감정 없이 사실만 설명한 경우</li>
              <li>제3자(차주·업자·이웃·다른 운전자)나 상황에 대한 불만</li>
              <li>무뚝뚝하거나 짧은 대답, 방언 어미</li>
              <li>사실 확인·경위 설명·절차 문의</li>
            </ul>
          </div>
          <div className="senti-pop__rule">
            욕설·성희롱 단어가 있으면 강도와 관계없이 <strong>‘부정’</strong>
          </div>
        </div>,
        document.body
      )}
    </span>
  );
}
