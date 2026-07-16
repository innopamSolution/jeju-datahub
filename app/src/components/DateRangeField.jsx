import { useState } from 'react';
import Icon from './Icon';

export default function DateRangeField({ defaultFrom, defaultTo }) {
  const [from, setFrom] = useState(defaultFrom);
  const [to, setTo] = useState(defaultTo);

  return (
    <div className="field__dates">
      <span className="field__date">
        {from}
        <Icon name="calendar" size={16} />
        <input
          type="date"
          className="field__date-input"
          value={from}
          max={to}
          aria-label="시작일"
          onChange={(e) => setFrom(e.target.value)}
        />
      </span>
      <span className="field__tilde">~</span>
      <span className="field__date">
        {to}
        <Icon name="calendar" size={16} />
        <input
          type="date"
          className="field__date-input"
          value={to}
          min={from}
          aria-label="종료일"
          onChange={(e) => setTo(e.target.value)}
        />
      </span>
    </div>
  );
}
