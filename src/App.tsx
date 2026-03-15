import { BrowserRouter as Router, Routes, Route, NavLink, useLocation } from 'react-router-dom';
import { Camera, Settings, Upload, Activity } from 'lucide-react';
import { LiveFeed } from './pages/LiveFeed';
import { Demo } from './pages/Demo';
import { Settings as SettingsPage } from './pages/Settings';
import { TrafficProvider } from './context/TrafficContext';
import styles from './App.module.css';

const Sidebar = () => {
  const location = useLocation();

  return (
    <nav className={styles.sidebar}>
      <div className={styles.logo}>
        <Activity size={28} className="text-blue-500" />
        <span className="font-bold text-lg tracking-wider">YOLO<span className="text-blue-500"> ANALYTICS</span></span>
      </div>

      <ul className={styles.navItems}>
        <li>
          <NavLink
            to="/"
            className={`${styles.navItem} ${location.pathname === '/' ? styles.active : ''}`}
          >
            <Camera size={20} />
            <span>Live Feed</span>
          </NavLink>
        </li>
        <li>
          <NavLink
            to="/demo"
            className={`${styles.navItem} ${location.pathname === '/demo' ? styles.active : ''}`}
          >
            <Upload size={20} />
            <span>Demo Mode</span>
          </NavLink>
        </li>
        <li>
          <NavLink
            to="/settings"
            className={`${styles.navItem} ${location.pathname === '/settings' ? styles.active : ''}`}
          >
            <Settings size={20} />
            <span>Settings</span>
          </NavLink>
        </li>
      </ul>

      <div className={styles.footer}>
        <p className="text-xs text-gray-500">v1.0.0 Alpha</p>
      </div>
    </nav>
  );
};

export default function App() {
  return (
    <TrafficProvider>
      <Router>
        <div className={styles.layout}>
          <Sidebar />
          <main className={styles.mainContent}>
            <Routes>
              <Route path="/" element={<LiveFeed />} />
              <Route path="/demo" element={<Demo />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Routes>
          </main>
        </div>
      </Router>
    </TrafficProvider>
  );
}
