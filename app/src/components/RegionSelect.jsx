import Icon from './Icon';
import { DONGS_BY_CITY } from '../data/regions';

export default function RegionSelect({ city, dong, onCityChange, onDongChange }) {
  const dongOptions = DONGS_BY_CITY[city] || [];

  return (
    <div className="field__region-row">
      <div className="field__select-wrap">
        <select
          className="field__select-native"
          value={city}
          onChange={(e) => {
            onCityChange(e.target.value);
            onDongChange('전체');
          }}
        >
          <option value="전체">전체</option>
          <option value="제주시">제주시</option>
          <option value="서귀포시">서귀포시</option>
        </select>
        <Icon name="chevron-down" size={18} />
      </div>
      <div className="field__select-wrap">
        <select
          className="field__select-native"
          value={dong}
          onChange={(e) => onDongChange(e.target.value)}
          disabled={city === '전체'}
        >
          <option value="전체">전체</option>
          {dongOptions.map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>
        <Icon name="chevron-down" size={18} />
      </div>
    </div>
  );
}
