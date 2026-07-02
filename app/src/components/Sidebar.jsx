import { Link, useLocation } from 'react-router-dom';
import Icon from './Icon';
import logo from '../assets/logo.svg';

const ANALYSIS_SUB = [
  { to: '/analysis/hotspot', label: '집중 구역 분석' },
  { to: '/analysis/policy-simulation', label: '정책 효과 시뮬레이션' },
  { to: '/analysis/lifestyle-simulation', label: '생활권 시뮬레이션' },
  { to: '/analysis/recommendation', label: '구역추천' },
  { to: '/analysis/investment-priority', label: '투자우선순위 보드' },
];

const REPORT_SUB = [
  { to: '/reports', label: '보고서 관리' },
  { to: '/alerts/inquiry', label: '위험단계 알림 조회' },
  { to: '/alerts/management', label: '위험단계 알림 관리' },
];

// 그룹: 해당 페이지에 있으면 파란 parent + 서브메뉴 펼침, 아니면 평범한 링크
function NavGroup({ icon, label, items, pathname }) {
  const isIn = items.some((it) => pathname.startsWith(it.to));

  if (!isIn) {
    return (
      <Link to={items[0].to} className="nav__item">
        <Icon name={icon} size={22} /><span>{label}</span>
      </Link>
    );
  }

  return (
    <div className="nav__group">
      <div className="nav__item nav__item--parent">
        <Icon name={icon} size={22} /><span>{label}</span>
      </div>
      <div className="nav__sub">
        {items.map((it) => {
          const active = pathname.startsWith(it.to);
          return (
            <Link key={it.to} to={it.to} className={`nav__subitem${active ? ' nav__subitem--active' : ''}`}>
              {it.label}{active && <span className="nav__dot" />}
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export default function Sidebar() {
  const { pathname } = useLocation();

  return (
    <aside className="sidebar">
      <div className="sidebar__brand">
        <Link to="/" className="brand__logo" aria-label="대시보드로 이동">
          <img className="brand__img" src={logo} alt="Jeju" />
          <div className="brand__text" style={{ fontWeight: 600, fontSize: 15, color: 'rgba(255,255,255,0.92)' }}>
            주차민원분석 솔루션
          </div>
        </Link>
      </div>

      <nav className="sidebar__nav">
        <Link to="/" className={`nav__item${pathname === '/' ? ' nav__item--active' : ''}`}>
          <Icon name="home" size={22} /><span>대시보드</span>
          {pathname === '/' && <span className="nav__dot" />}
        </Link>

        <Link to="/complaints" className={`nav__item${pathname.startsWith('/complaints') ? ' nav__item--active' : ''}`}>
          <Icon name="location" size={22} /><span>민원현황</span>
          {pathname.startsWith('/complaints') && <span className="nav__dot" />}
        </Link>

        <NavGroup icon="chart" label="분석·시뮬레이션" items={ANALYSIS_SUB} pathname={pathname} />

        <NavGroup icon="document" label="보고서·알림" items={REPORT_SUB} pathname={pathname} />

        <Link to="/ai-assistant" className={`nav__item${pathname.startsWith('/ai-assistant') ? ' nav__item--active' : ''}`}>
          <Icon name="sparkle" size={22} /><span>AI 어시스턴트</span>
          {pathname.startsWith('/ai-assistant') && <span className="nav__dot" />}
        </Link>
      </nav>

      <div className="sidebar__foot">
        <Link to="/settings" className={`nav__item${pathname.startsWith('/settings') ? ' nav__item--active' : ''}`}>
          <Icon name="setting" size={22} /><span>설정</span>
        </Link>
        <button className="nav__item" style={{ border: 'none', width: '100%', cursor: 'pointer', textAlign: 'left' }}>
          <Icon name="arrow-right" size={22} /><span>로그아웃</span>
        </button>
      </div>
    </aside>
  );
}
