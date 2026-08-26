import { useState } from 'react';
import AdminSidebar from '../../components/AdminSidebar';
import './admin.css';

const MOCK_USERS = [
  { id: 1, name: 'Alice Freeman', email: 'alice.f@example.com', role: 'Admin', status: 'Active' },
  { id: 2, name: 'Bob Chen', email: 'bob.c@events.io', role: 'Organizer', status: 'Active' },
  { id: 3, name: 'Charlie Davis', email: 'charlie.d@mail.com', role: 'Buyer', status: 'Inactive' },
  { id: 4, name: 'Diana Park', email: 'diana.p@example.com', role: 'Organizer', status: 'Active' },
  { id: 5, name: 'Ethan Moore', email: 'ethan.m@events.io', role: 'Buyer', status: 'Active' },
];

const MOCK_EVENTS = [
  { id: 1, name: 'Neon Nights Festival', organizer: 'Bob Chen', date: 'Oct 24, 2024', status: 'Active' },
  { id: 2, name: 'Tech Summit 2024', organizer: 'Diana Park', date: 'Nov 12, 2024', status: 'Active' },
  { id: 3, name: 'Summer Solstice Party', organizer: 'Bob Chen', date: 'Jun 21, 2024', status: 'Past' },
];

const PlatformManagement = () => {
  const [activeTab, setActiveTab] = useState('users');
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [confirmModalOpen, setConfirmModalOpen] = useState(true); // Open by default to match screenshot

  const getRoleBadgeClass = (role) => {
    switch (role.toLowerCase()) {
      case 'admin': return 'role-badge admin';
      case 'organizer': return 'role-badge organizer';
      case 'buyer': return 'role-badge buyer';
      default: return 'role-badge';
    }
  };

  const totalItems = 42; // Mock total
  const totalPages = Math.ceil(totalItems / 3);

  return (
    <div className="app-layout">
      <AdminSidebar />

      <main className="main-content">
        <div className="page-container" style={{ padding: '0 var(--space-2xl) var(--space-2xl) var(--space-2xl)' }}>

          {/* Page Title */}
          <div className="pm-header">
            <h1>Platform Management</h1>
          </div>

          {/* Tabs */}
          <div className="pm-tabs">
            <button
              className={`pm-tab ${activeTab === 'users' ? 'active' : ''}`}
              onClick={() => setActiveTab('users')}
            >
              Users
            </button>
            <button
              className={`pm-tab ${activeTab === 'events' ? 'active' : ''}`}
              onClick={() => setActiveTab('events')}
            >
              Events
            </button>
          </div>

          {/* Filters */}
          <div className="pm-filters">
            <div className="pm-search-wrapper">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
              <input
                type="text"
                placeholder={activeTab === 'users' ? 'Search users by name or email...' : 'Search events...'}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="pm-filter-select-wrapper">
              <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
                <option value="all">All Roles</option>
                <option value="admin">Admin</option>
                <option value="organizer">Organizer</option>
                <option value="buyer">Buyer</option>
              </select>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="select-chevron">
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </div>
            <div className="pm-filter-select-wrapper">
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="all">All Statuses</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="select-chevron">
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </div>
          </div>

          {/* Table */}
          {activeTab === 'users' ? (
            <div className="pm-table-wrapper">
              <table className="pm-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {MOCK_USERS.slice(0, 3).map(user => (
                    <tr key={user.id}>
                      <td className="pm-name-cell">{user.name}</td>
                      <td className="pm-email-cell">{user.email}</td>
                      <td>
                        <span className={getRoleBadgeClass(user.role)}>{user.role}</span>
                      </td>
                      <td className={`pm-status ${user.status.toLowerCase()}`}>{user.status}</td>
                      <td>
                        <div className="pm-actions">
                          <button className="pm-action-btn" title="Edit">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="14" height="14">
                              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                            </svg>
                          </button>
                          <button className="pm-action-btn danger" title="Remove" onClick={() => setConfirmModalOpen(true)}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="14" height="14">
                              <polyline points="3 6 5 6 21 6"></polyline>
                              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Pagination */}
              <div className="pm-pagination">
                <span className="pm-pagination-info">Showing 1 to 3 of 42 entries</span>
                <div className="pm-pagination-controls">
                  <button className="pm-page-btn" disabled>&lt;</button>
                  <button className="pm-page-btn active">1</button>
                  <button className="pm-page-btn">2</button>
                  <button className="pm-page-btn">3</button>
                  <span className="pm-page-dots">...</span>
                  <button className="pm-page-btn">&gt;</button>
                </div>
              </div>
            </div>
          ) : (
            <div className="pm-table-wrapper">
              <table className="pm-table">
                <thead>
                  <tr>
                    <th>Event Name</th>
                    <th>Organizer</th>
                    <th>Date</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {MOCK_EVENTS.map(event => (
                    <tr key={event.id}>
                      <td className="pm-name-cell">{event.name}</td>
                      <td className="pm-email-cell">{event.organizer}</td>
                      <td>{event.date}</td>
                      <td className={`pm-status ${event.status.toLowerCase()}`}>{event.status}</td>
                      <td>
                        <div className="pm-actions">
                          <button className="pm-action-btn danger" title="Remove" onClick={() => setConfirmModalOpen(true)}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="14" height="14">
                              <polyline points="3 6 5 6 21 6"></polyline>
                              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Confirm Delete Modal */}
        {confirmModalOpen && (
          <div className="modal-overlay">
            <div className="confirm-modal">
              <div className="confirm-modal-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="28" height="28">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                  <line x1="12" y1="9" x2="12" y2="13"></line>
                  <line x1="12" y1="17" x2="12.01" y2="17"></line>
                </svg>
              </div>
              <h2>Remove this event?</h2>
              <p>This cannot be undone. All associated ticket data will be permanently deleted.</p>
              <div className="confirm-modal-actions">
                <button className="btn-confirm-cancel" onClick={() => setConfirmModalOpen(false)}>Cancel</button>
                <button className="btn-confirm-delete" onClick={() => setConfirmModalOpen(false)}>Confirm</button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default PlatformManagement;
