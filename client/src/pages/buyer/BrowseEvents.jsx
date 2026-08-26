import { useState } from 'react';
import BuyerSidebar from '../../components/BuyerSidebar';
import TopNav from '../../components/TopNav';
import '../../buyer.css';

const MOCK_EVENTS = [
  {
    _id: '1',
    title: 'Modular Synth Workshop',
    date: 'Oct 15, 2024 \u2022 19:00',
    venue: 'Kraftwerk Berlin',
    price: '\u20AC45.00',
    image: 'https://images.unsplash.com/photo-1598653222000-6b7b7a552625?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    badge: null
  },
  {
    _id: '2',
    title: "Digital Art Expo '24",
    date: 'Nov 02 - Nov 05',
    venue: 'Tate Modern, London',
    price: '\u00A325.00',
    image: 'https://images.unsplash.com/photo-1547658719-da2b51169166?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    badge: null
  },
  {
    _id: '3',
    title: 'Fintech Disruptors Summit',
    date: 'Dec 10, 2024 \u2022 09:00',
    venue: 'Javits Center, NY',
    price: '$299.00',
    image: 'https://images.unsplash.com/photo-1551818255-e6e10975bc17?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    badge: 'Selling Fast'
  },
  {
    _id: '4',
    title: 'Algorithmic Trading Symposium',
    date: 'Jan 15, 2025 \u2022 10:00',
    venue: 'Virtual Event',
    price: 'Free',
    image: 'https://images.unsplash.com/photo-1642790106117-e829e1497956?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    badge: null
  }
];

const BrowseEvents = () => {
  const [events, setEvents] = useState(MOCK_EVENTS);
  const [search, setSearch] = useState('');

  return (
    <div className="app-layout">
      <BuyerSidebar />

      <main className="main-content">
        <TopNav />

        <div className="page-container-buyer">
          {/* Filter Bar */}
          <div className="filter-bar">
            <div className="filter-input-wrapper" style={{ flex: 2 }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
              <input
                type="text"
                placeholder="Search events..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div className="filter-input-wrapper">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="16" y1="2" x2="16" y2="6"></line>
                <line x1="8" y1="2" x2="8" y2="6"></line>
                <line x1="3" y1="10" x2="21" y2="10"></line>
              </svg>
              <input type="text" placeholder="Select dates" />
            </div>

            <div className="filter-input-wrapper">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                <circle cx="12" cy="10" r="3"></circle>
              </svg>
              <select defaultValue="">
                <option value="" disabled hidden>Venue/City</option>
                <option value="berlin">Berlin</option>
                <option value="london">London</option>
                <option value="ny">New York</option>
                <option value="virtual">Virtual</option>
              </select>
              <svg style={{ position: 'absolute', right: '1rem' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </div>
          </div>

          {/* Events Grid */}
          <div className="events-grid">
            {events.map(event => (
              <div key={event._id} className="event-card">
                <div className="event-card-image">
                  <img src={event.image} alt={event.title} />
                  {event.badge && (
                    <span className="event-card-badge">{event.badge}</span>
                  )}
                </div>
                <div className="event-card-content">
                  <h3 className="event-card-title">{event.title}</h3>
                  <div className="event-card-info">
                    <div className="event-card-info-row">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                        <line x1="16" y1="2" x2="16" y2="6"></line>
                        <line x1="8" y1="2" x2="8" y2="6"></line>
                        <line x1="3" y1="10" x2="21" y2="10"></line>
                      </svg>
                      <span>{event.date}</span>
                    </div>
                    <div className="event-card-info-row">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                        <circle cx="12" cy="10" r="3"></circle>
                      </svg>
                      <span>{event.venue}</span>
                    </div>
                  </div>
                  <div className="event-card-footer">
                    <span className="event-price">{event.price}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default BrowseEvents;
