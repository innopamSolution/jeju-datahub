import { useEffect, useRef, useState } from 'react';

/* 스크롤 가능한 목록 래퍼.
   macOS 오버레이 스크롤바는 스크롤 전엔 보이지 않으므로,
   내용이 넘칠 때 항상 보이는 얇은 커스텀 썸(thumb)을 직접 그린다. */
export default function ScrollList({ className, children }) {
  const ref = useRef(null);
  const [bar, setBar] = useState(null); // { t: top%, h: height% }

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => {
      if (el.scrollHeight <= el.clientHeight + 1) { setBar(null); return; }
      setBar({
        t: (el.scrollTop / el.scrollHeight) * 100,
        h: (el.clientHeight / el.scrollHeight) * 100,
      });
    };
    update();
    el.addEventListener('scroll', update, { passive: true });
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => { el.removeEventListener('scroll', update); ro.disconnect(); };
  }, []);

  return (
    <div className="scroll-wrap">
      <div className={className} ref={ref}>{children}</div>
      {bar && (
        <div className="scroll-wrap__thumb" style={{ top: `${bar.t}%`, height: `${bar.h}%` }} aria-hidden="true" />
      )}
    </div>
  );
}
