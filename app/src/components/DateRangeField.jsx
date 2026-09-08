import { useState } from 'react';
import Icon from './Icon';

/* 기간 선택 필드. type="month"를 주면 일 단위 대신 월 단위(YYYY-MM)로 선택한다. */
export default function DateRangeField({ defaultFrom, defaultTo, type = 'date' }) {
  const [from, setFrom] = useState(defaultFrom);
  const [to, setTo] = useState(defaultTo);
  const isMonth = type === 'month';

  return (
    <div className="field__dates">
      <span className="field__date">
        {from}
        <Icon name="calendar" size={16} />
        <input
          type={type}
          className="field__date-input"
          value={from}
          max={to}
          aria-label={isMonth ? '시작월' : '시작일'}
          onChange={(e) => setFrom(e.target.value)}
        />
      </span>
      <span className="field__tilde">~</span>
      <span className="field__date">
        {to}
        <Icon name="calendar" size={16} />
        <input
          type={type}
          className="field__date-input"
          value={to}
          min={from}
          aria-label={isMonth ? '종료월' : '종료일'}
          onChange={(e) => setTo(e.target.value)}
        />
      </span>
    </div>
  );
}
