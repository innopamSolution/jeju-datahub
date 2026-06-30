import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import Icon from './Icon';
import logo from '../assets/logo.svg';

const ANALYSIS_ROUTES = ['/analysis/hotspot', '/analysis/policy-simulation', '/analysis/lifestyle-simulation', '/analysis/recommendation', '/analysis/investment-priority'];
const REPORT_ROUTES = ['/reports', '/alerts/inquiry', '/alerts/management'];

function NavGroup({ label, icon, routes, children, pathname }) {
  const active = routes.some((r) => pathname.startsWith(r));
  const [open, setOpen] = useState(active);
  return (
    <>
      <button
        className={`nav__item ${active ? 'nav__item--parent' : ''}`}
        onClick={() => setOpen((o) => !o)}
        style={{ background: 'none', border: 'none', width: '100%', cursor: 'pointer', textAlign: 'left' }}
      >
        <Icon name={icon} size={22} />
        <span>{label}</span>
      </button>
      {open && <div className="nav__sub">{children}</div>}
    </>
  );
}

function Sub({ to, label, pathname }) {
  const active = pathname.startsWith(to);
  return (
    <Link to={to} className={`nav__subitem ${active ? 'nav__subitem--active' : ''}`}>
      {label}
      {active && <span className="nav__dot" />}
    </Link>
  );
}

export default function Sidebar() {
  const { pathname } = useLocation();

  return (
    <aside className="sidebar">
      <div className="sidebar__brand">
        <div className="brand__logo">
          <img className="brand__img" src={logo} alt="Jeju" />
          <div className="brand__text" style={{ fontWeight: 600, fontSize: 15, color: 'rgba(255,255,255,0.92)' }}>
            주차민원분석 솔루션
          </div>
        </div>
      </div>

      <nav className="sidebar__nav">
        <Link to="/" className={`nav__item ${pathname === '/' ? 'nav__item--active' : ''}`}>
          <Icon name="home" size={22} /><span>대시보드</span>
          {pathname === '/' && <span className="nav__dot" />}
        </Link>

        <Link to="/complaints" className={`nav__item ${pathname.startsWith('/complaints') ? 'nav__item--active' : ''}`}>
          <Icon name="location" size={22} /><span>민원현황</span>
          {pathname.startsWith('/complaints') && <span className="nav__dot" />}
        </Link>

        <NavGroup label="분석·시뮬레이션" icon="chart" routes={ANALYSIS_ROUTES} pathname={pathname}>
          <Sub to="/analysis/hotspot" label="집중 구역 분석" pathname={pathname} />
          <Sub to="/analysis/policy-simulation" label="정책 효과 시뮬레이션" pathname={pathname} />
          <Sub to="/analysis/lifestyle-simulation" label="생활권 시뮬레이션" pathname={pathname} />
          <Sub to="/analysis/recommendation" label="구역추천" pathname={pathname} />
          <Sub to="/analysis/investment-priority" label="투자우선순위 보드" pathname={pathname} />
        </NavGroup>

        <Link to="/reports" className={`nav__item ${pathname.startsWith('/reports') ? 'nav__item--active' : ''}`}>
          <Icon name="document" size={22} /><span>보고서·알림</span>
          {pathname.startsWith('/reports') && <span className="nav__dot" />}
        </Link>

        <Link to="/ai-assistant" className={`nav__item ${pathname.startsWith('/ai-assistant') ? 'nav__item--active' : ''}`}>
          <Icon name="sparkle" size={22} /><span>AI 어시스턴트</span>
          {pathname.startsWith('/ai-assistant') && <span className="nav__dot" />}
        </Link>
      </nav>

      <div className="sidebar__foot">
        <Link to="/settings" className={`nav__item ${pathname.startsWith('/settings') ? 'nav__item--active' : ''}`}>
          <Icon name="setting" size={22} /><span>설정</span>
          {pathname.startsWith('/settings') && <span className="nav__dot" />}
        </Link>
        <button className="nav__item" style={{ background: 'none', border: 'none', width: '100%', cursor: 'pointer', textAlign: 'left' }}>
          <Icon name="arrow-right" size={22} /><span>로그아웃</span>
        </button>
      </div>
    </aside>
  );
}
