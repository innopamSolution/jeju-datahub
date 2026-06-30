import Icon from './Icon';

/**
 * DS Select — native <select> with custom chevron positioned at right end.
 * Matches the HTML .select / .ds-select style from the design system.
 *
 * Usage:
 *   <DsSelect value={v} onChange={e => setV(e.target.value)}>
 *     <option>A</option>
 *   </DsSelect>
 */
export default function DsSelect({ children, style, ...props }) {
  return (
    <div className="ds-select" style={style}>
      <select {...props}>{children}</select>
      <span className="ds-select__ic">
        <Icon name="chevron-down" size={16} />
      </span>
    </div>
  );
}
