import { Link, useLocation } from 'react-router-dom';
import Icon from './Icon';
import logo from '../assets/logo.svg';

const ANALYSIS_ROUTES = [
  '/analysis/hotspot',
  '/analysis/policy-simulation',
  '/analysis/lifestyle-simulation',
  '/analysis/recommendation',
  '/analysis/investment-priority',
];

export default function Sidebar() {
  const { pathname } = useLocation();

  const isAnalysis = ANALYSIS_ROUTES.some(r => pathname.startsWith(r));

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
        <Link to="/" className={`nav__item${pathname === '/' ? ' nav__item--active' : ''}`}>
          <Icon name="home" size={22} /><span>대시보드</span>
          {pathname === '/' && <span className="nav__dot" />}
        </Link>

        <Link to="/complaints" className={`nav__item${pathname.startsWith('/complaints') ? ' nav__item--active' : ''}`}>
          <Icon name="location" size={22} /><span>민원현황</span>
          {pathname.startsWith('/complaints') && <span className="nav__dot" />}
        </Link>

        <div className="nav__group">
          <div className={`nav__item nav__item--parent${isAnalysis ? '' : ' nav__item--parent--collapsed'}`}>
            <Icon name="chart" size={22} /><span>분석·시뮬레이션</span>
          </div>
          <div className="nav__sub">
            <Link to="/analysis/hotspot" className={`nav__subitem${pathname.startsWith('/analysis/hotspot') ? ' nav__subitem--active' : ''}`}>
              집중 구역 분석{pathname.startsWith('/analysis/hotspot') && <span className="nav__dot" />}
            </Link>
            <Link to="/analysis/policy-simulation" className={`nav__subitem${pathname.startsWith('/analysis/policy-simulation') ? ' nav__subitem--active' : ''}`}>
              정책 효과 시뮬레이션{pathname.startsWith('/analysis/policy-simulation') && <span className="nav__dot" />}
            </Link>
            <Link to="/analysis/lifestyle-simulation" className={`nav__subitem${pathname.startsWith('/analysis/lifestyle-simulation') ? ' nav__subitem--active' : ''}`}>
              생활권 시뮬레이션{pathname.startsWith('/analysis/lifestyle-simulation') && <span className="nav__dot" />}
            </Link>
            <Link to="/analysis/recommendation" className={`nav__subitem${pathname.startsWith('/analysis/recommendation') ? ' nav__subitem--active' : ''}`}>
              구역추천{pathname.startsWith('/analysis/recommendation') && <span className="nav__dot" />}
            </Link>
            <Link to="/analysis/investment-priority" className={`nav__subitem${pathname.startsWith('/analysis/investment-priority') ? ' nav__subitem--active' : ''}`}>
              투자우선순위 보드{pathname.startsWith('/analysis/investment-priority') && <span className="nav__dot" />}
            </Link>
          </div>
        </div>

        <Link to="/reports" className={`nav__item${pathname.startsWith('/reports') ? ' nav__item--active' : ''}`}>
          <Icon name="document" size={22} /><span>보고서·알림</span>
          {pathname.startsWith('/reports') && <span className="nav__dot" />}
        </Link>

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
