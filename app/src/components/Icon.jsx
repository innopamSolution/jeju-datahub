import { ICON_PATHS } from '../styles/iconPaths';

export default function Icon({ name, size = 20, className = '' }) {
  const paths = ICON_PATHS[name];
  if (!paths) return null;
  return (
    <svg
      className={`ic ${className}`.trim()}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      style={{ display: 'inline-block', flexShrink: 0 }}
    >
      {paths.map((p, i) => (
        <path
          key={i}
          d={p.d}
          transform={p.x || p.y ? `translate(${p.x ?? 0} ${p.y ?? 0})` : undefined}
          fill="currentColor"
          fillRule={p.r === 'evenodd' ? 'evenodd' : 'nonzero'}
          clipRule={p.r === 'evenodd' ? 'evenodd' : undefined}
        />
      ))}
    </svg>
  );
}
