import { Link, useLocation } from 'react-router-dom';
import Icon from './Icon';
import logo from '../assets/logo.svg';
import { CURRENT_USER } from '../data/currentUser';

const ANALYSIS_SUB = [
  { to: '/analysis/hotspot', label: '집중 구역 분석' },
  { to: '/analysis/policy-simulation', label: '정책 효과 시뮬레이션' },
  { to: '/analysis/lifestyle-simulation', label: '생활권 시뮬레이션' },
  { to: '/analysis/recommendation', label: '구역추천' },
  { to: '/analysis/investment-priority', label: '투자우선순위 보드' },
];

const REPORT_SUB = [
  { to: '/reports', label: '보고서 목록' },
  { to: '/reports/management', label: '보고서 관리' },
  { to: '/alerts/inquiry', label: '위험단계 알림 조회' },
  { to: '/alerts/management', label: '위험단계 알림 관리' },
];

/* 가장 구체적인(긴) to 경로를 가진 항목을 활성화한다.
   (예: '/reports/management'가 '/reports'보다 우선 매칭되어야 함) */
function findActiveItem(items, pathname) {
  let best = null;
  for (const it of items) {
    if (pathname === it.to || pathname.startsWith(`${it.to}/`)) {
      if (!best || it.to.length > best.to.length) best = it;
    }
  }
  return best;
}

// 그룹: 해당 페이지에 있으면 파란 parent + 서브메뉴 펼침, 아니면 평범한 링크
function NavGroup({ icon, label, items, pathname }) {
  const activeItem = findActiveItem(items, pathname);

  if (!activeItem) {
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
          const active = it === activeItem;
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
