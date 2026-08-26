import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Sidebar from '../../components/Sidebar';

// Mock data — replace with API calls when backend is wired up
const MOCK_STATS = {
  totalEvents: 12,
  ticketsSold: 1240,
  totalRevenue: 45820,
};

const MOCK_EVENTS = [
  {
    _id: '1',
    title: 'Neon Nights Festival',
    date: '2024-10-24',
    ticketsSold: 850,
    capacity: 1000,
    status: 'upcoming',
  },
  {
    _id: '2',
    title: 'Tech Summit 2024',
    date: '2024-11-12',
    ticketsSold: 240,
    capacity: 500,
    status: 'upcoming',
  },
  {
    _id: '3',
    title: 'Summer Solstice Party',
    date: '2024-06-21',
    ticketsSold: 150,
    capacity: 150,
    status: 'past',
  },
];

const OrganizerDashboard = () => {
  const [stats, setStats] = useState(MOCK_STATS);
  const [events, setEvents] = useState(MOCK_EVENTS);
  const [loading, setLoading] = useState(false);

  // Will replace with actual API call
  // useEffect(() => {
  //   fetchOrganizerData();
  // }, []);

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatCurrency = (amount) => {
    return `€${amount.toLocaleString()}`;
  };

  const getPercentage = (sold, capacity) => {
    return Math.round((sold / capacity) * 100);
  };

  return (
    <div className="app-layout">
      <Sidebar />

      <main className="main-content">
        <div className="page-container">
          {/* Page Header */}
          <div className="page-header">
            <h1 className="page-title">My Events</h1>
            <Link to="/organizer/create-event" className="btn-create">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Create Event
            </Link>
          </div>

          {/* Stats Cards */}
          <div className="stats-grid">
            <div className="stat-card">
              <p className="stat-label">Total Events</p>
              <p className="stat-value">{stats.totalEvents}</p>
            </div>
            <div className="stat-card">
              <p className="stat-label">Tickets Sold</p>
              <p className="stat-value">{stats.ticketsSold.toLocaleString()}</p>
            </div>
            <div className="stat-card revenue">
              <p className="stat-label">Total Revenue</p>
              <p className="stat-value">{formatCurrency(stats.totalRevenue)}</p>
            </div>
          </div>

          {/* Events Table */}
          <div className="events-table-wrapper">
            <table className="events-table">
              <thead>
                <tr>
                  <th>Event Name</th>
                  <th>Date</th>
                  <th>Tickets Sold / Capacity</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {events.map((event) => {
                  const percent = getPercentage(event.ticketsSold, event.capacity);
                  const isFull = percent >= 100;

                  return (
                    <tr key={event._id}>
                      <td>
                        <span className="event-name">{event.title}</span>
                      </td>
                      <td>
                        <span className="event-date">{formatDate(event.date)}</span>
                      </td>
                      <td>
                        <div className="ticket-progress">
                          <div className="progress-bar-wrapper">
                            <span className="progress-text">
                              {event.ticketsSold}/{event.capacity}
                            </span>
                            <div className="progress-bar-track">
                              <div
                                className={`progress-bar-fill ${isFull ? 'full' : ''}`}
                                style={{ width: `${Math.min(percent, 100)}%` }}
                              />
                            </div>
                          </div>
                          <span className="progress-percent">{percent}%</span>
                        </div>
                      </td>
                      <td>
                        <span className={`status-badge ${event.status}`}>
                          {event.status.charAt(0).toUpperCase() + event.status.slice(1)}
                        </span>
                      </td>
                      <td>
                        <div className="action-buttons">
                          {event.status !== 'past' && (
                            <Link
                              to={`/organizer/events/${event._id}/edit`}
                              className="action-btn edit-btn"
                              title="Edit Event"
                            >
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                              </svg>
                            </Link>
                          )}
                          <Link
                            to={`/organizer/events/${event._id}/analytics`}
                            className="action-btn analytics-btn"
                            title="View Analytics"
                          >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <line x1="18" y1="20" x2="18" y2="10" />
                              <line x1="12" y1="20" x2="12" y2="4" />
                              <line x1="6" y1="20" x2="6" y2="14" />
                            </svg>
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
};

export default OrganizerDashboard;
