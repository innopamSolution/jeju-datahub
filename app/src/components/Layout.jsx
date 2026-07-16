import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import { useTheme } from '../hooks/useTheme';

export default function Layout() {
  useTheme();

  return (
    <div className="app">
      <Sidebar />
      <main className="main">
        <Outlet />
      </main>
    </div>
  );
}
