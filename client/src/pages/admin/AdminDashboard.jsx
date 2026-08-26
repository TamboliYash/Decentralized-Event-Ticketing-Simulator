import { useState } from 'react';
import AdminSidebar from '../../components/AdminSidebar';
import './admin.css';

const MOCK_FLAGGED = [
  {
    id: 1,
    title: 'Duplicate Scan Attempt @ Neon Nights',
    code: 'TXN_8829A • GATE 4',
    time: '2m ago',
    type: 'warning'
  },
  {
    id: 2,
    title: 'Invalid Signature Detected',
    code: 'TXN_9912B • API ENDPOINT',
    time: '15m ago',
    type: 'error'
  },
  {
    id: 3,
    title: 'Velocity Limit Reached (IP Blocked)',
    code: '192.168.1.45 • MAIN SYS',
    time: '42m ago',
    type: 'warning'
  },
  {
    id: 4,
    title: 'Suspicious Transfer Pattern',
    code: 'USR_7761X • SECONDARY MKT',
    time: '1h ago',
    type: 'warning'
  },
  {
    id: 5,
    title: 'Duplicate Scan Attempt @ Synthwave Fest',
    code: 'TXN_3321V • GATE 1',
    time: '2h ago',
    type: 'warning'
  }
];

const AdminDashboard = () => {
  const [activeFilter, setActiveFilter] = useState('24H');

  return (
    <div className="app-layout">
      <AdminSidebar />

      <main className="main-content">
        <div className="page-container" style={{ padding: '0 var(--space-2xl) var(--space-2xl) var(--space-2xl)' }}>
          
          {/* Header */}
          <header className="admin-header">
            <h1>Admin Control Center</h1>
            <div className="admin-header-actions">
              <button className="admin-icon-btn">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                  <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                </svg>
              </button>
              <button className="admin-icon-btn">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
                  <circle cx="12" cy="12" r="10"></circle>
                  <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
                  <line x1="12" y1="17" x2="12.01" y2="17"></line>
                </svg>
              </button>
              <div className="admin-avatar"></div>
            </div>
          </header>

          {/* Stats Grid */}
          <div className="admin-stats-grid">
            <div className="admin-stat-card">
              <h3>Total Tickets Sold</h3>
              <p className="admin-stat-value">1,245,892</p>
              <p className="admin-stat-subtext highlight">+12% vs last period</p>
            </div>
            
            <div className="admin-stat-card">
              <h3>Active Events</h3>
              <p className="admin-stat-value">342</p>
              <p className="admin-stat-subtext highlight">Live globally</p>
            </div>

            <div className="admin-stat-card">
              <h3>Entries Scanned</h3>
              <p className="admin-stat-value">89,234</p>
              <p className="admin-stat-subtext">Past 24h</p>
            </div>

            <div className="admin-stat-card">
              <h3>Fraud Attempts</h3>
              <p className="admin-stat-value warning">412</p>
              <p className="admin-stat-subtext">Blocked securely</p>
            </div>
          </div>

          {/* Main Grid */}
          <div className="admin-main-grid">
            {/* Chart Area */}
            <div className="admin-chart-card">
              <div className="admin-chart-header">
                <h2>Ticket Volume (24h)</h2>
                <div className="admin-chart-filters">
                  {['1H', '24H', '7D'].map(filter => (
                    <button 
                      key={filter} 
                      className={activeFilter === filter ? 'active' : ''}
                      onClick={() => setActiveFilter(filter)}
                    >
                      {filter}
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="admin-chart-area">
                <svg className="chart-svg-container" viewBox="0 0 1000 400" preserveAspectRatio="none">
                  {/* Grid lines */}
                  <line x1="0" y1="100" x2="1000" y2="100" className="chart-grid-line" />
                  <line x1="0" y1="200" x2="1000" y2="200" className="chart-grid-line" />
                  <line x1="0" y1="300" x2="1000" y2="300" className="chart-grid-line" />
                  
                  {/* Glowing curved line matching screenshot roughly */}
                  <path 
                    d="M 0 350 C 150 350, 150 380, 250 380 C 350 380, 400 150, 500 150 C 600 150, 650 380, 700 380 C 750 380, 800 50, 850 50 C 870 50, 880 200, 900 250"
                    className="chart-path"
                  />
                </svg>
              </div>
              
              <div className="admin-chart-x-axis">
                <span>00:00</span>
                <span>06:00</span>
                <span>12:00</span>
                <span>18:00</span>
                <span>24:00</span>
              </div>
            </div>

            {/* List Area */}
            <div className="admin-list-card">
              <h2>Recent Flagged Events</h2>
              <div className="flagged-list">
                {MOCK_FLAGGED.map(item => (
                  <div key={item.id} className="flagged-item">
                    <div className={`flagged-icon ${item.type}`}>
                      {item.type === 'warning' ? (
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
                          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                          <line x1="12" y1="9" x2="12" y2="13"></line>
                          <line x1="12" y1="17" x2="12.01" y2="17"></line>
                        </svg>
                      ) : (
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
                          <circle cx="12" cy="12" r="10"></circle>
                          <line x1="12" y1="8" x2="12" y2="12"></line>
                          <line x1="12" y1="16" x2="12.01" y2="16"></line>
                        </svg>
                      )}
                    </div>
                    <div className="flagged-content">
                      <h4 className="flagged-title">{item.title}</h4>
                      <span className="flagged-meta">{item.code}</span>
                    </div>
                    <div className="flagged-time">
                      {item.time}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
