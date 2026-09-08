import { useRef, useState } from 'react';
import Icon from './Icon';

/* 기간 선택 필드. type="month"를 주면 일 단위 대신 월 단위(YYYY-MM)로 선택한다.
   박스 어디를 클릭해도 달력 피커가 열리도록 showPicker()를 호출한다. */
export default function DateRangeField({ defaultFrom, defaultTo, type = 'date' }) {
  const [from, setFrom] = useState(defaultFrom);
  const [to, setTo] = useState(defaultTo);
  const fromRef = useRef(null);
  const toRef = useRef(null);
  const isMonth = type === 'month';

  const openPicker = (ref) => {
    try { ref.current?.showPicker(); } catch { ref.current?.focus(); }
  };

  return (
    <div className="field__dates">
      <span className="field__date" onClick={() => openPicker(fromRef)}>
        {from}
        <Icon name="calendar" size={16} />
        <input
          ref={fromRef}
          type={type}
          className="field__date-input"
          value={from}
          max={to}
          aria-label={isMonth ? '시작월' : '시작일'}
          onClick={() => openPicker(fromRef)}
          onChange={(e) => setFrom(e.target.value)}
        />
      </span>
      <span className="field__tilde">~</span>
      <span className="field__date" onClick={() => openPicker(toRef)}>
        {to}
        <Icon name="calendar" size={16} />
        <input
          ref={toRef}
          type={type}
          className="field__date-input"
          value={to}
          min={from}
          aria-label={isMonth ? '종료월' : '종료일'}
          onClick={() => openPicker(toRef)}
          onChange={(e) => setTo(e.target.value)}
        />
      </span>
    </div>
  );
}
