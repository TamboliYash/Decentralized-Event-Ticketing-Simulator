import { useState } from 'react';
import { useParams } from 'react-router-dom';
import BuyerSidebar from '../../components/BuyerSidebar';
import TopNav from '../../components/TopNav';
import SeatMap from '../../components/SeatMap';

// Mock event for now
const EVENT = {
  _id: '1',
  title: 'Modular Synth Workshop',
  date: 'Oct 15, 2024',
  time: '19:00',
  venue: 'Kraftwerk Berlin',
  badge: 'Signal Logic',
  pricePerSeat: 45.00,
  image: 'https://images.unsplash.com/photo-1598653222000-6b7b7a552625?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
  description: 'Join us for an immersive workshop on modular synthesis, focusing on signal flow, patch design, and rhythmic sequencing. No prior experience required.'
};

const EventDetails = () => {
  const { id } = useParams();
  const [selectedSeats, setSelectedSeats] = useState([]);

  const handleSeatSelect = (seatId, seatLabel) => {
    setSelectedSeats(prev => {
      const exists = prev.find(s => s.id === seatId);
      if (exists) {
        return prev.filter(s => s.id !== seatId);
      } else {
        return [...prev, { id: seatId, label: seatLabel }];
      }
    });
  };

  const subtotal = selectedSeats.length * EVENT.pricePerSeat;

  return (
    <div className="app-layout">
      <BuyerSidebar />

      <main className="main-content">
        <TopNav />

        <div className="page-container-buyer">
          <div className="event-details-layout">
            
            {/* Main Left Content */}
            <div className="event-details-main">
              <div className="event-hero-image">
                <img src={EVENT.image} alt={EVENT.title} />
              </div>
              
              <span className="event-badge">{EVENT.badge}</span>
              <h1 className="event-title">{EVENT.title}</h1>
              
              <div className="event-meta">
                <span>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                    <line x1="16" y1="2" x2="16" y2="6"></line>
                    <line x1="8" y1="2" x2="8" y2="6"></line>
                    <line x1="3" y1="10" x2="21" y2="10"></line>
                  </svg>
                  {EVENT.date}
                </span>
                <span>•</span>
                <span>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <polyline points="12 6 12 12 16 14"></polyline>
                  </svg>
                  {EVENT.time}
                </span>
                <span>•</span>
                <span>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                    <circle cx="12" cy="10" r="3"></circle>
                  </svg>
                  {EVENT.venue}
                </span>
              </div>

              <p className="event-description">{EVENT.description}</p>

              <SeatMap 
                rows={8} 
                cols={10} 
                onSeatSelect={handleSeatSelect} 
                selectedSeats={selectedSeats} 
              />
            </div>

            {/* Right Sidebar - Order Summary */}
            <div className="event-details-sidebar">
              <div className="order-summary-card">
                <h3>Order Summary</h3>
                
                <div className="summary-row">
                  <span>Selected Seats</span>
                  <span>{selectedSeats.length > 0 ? selectedSeats.map(s => s.label).join(', ') : '-'}</span>
                </div>
                <div className="summary-row">
                  <span>Quantity</span>
                  <span>{selectedSeats.length}</span>
                </div>
                
                <div className="summary-subtotal">
                  <span>Subtotal</span>
                  <span>€{subtotal.toFixed(2)}</span>
                </div>

                <button 
                  className="btn-checkout"
                  disabled={selectedSeats.length === 0}
                  onClick={() => alert('Proceed to payment mocked!')}
                >
                  Proceed to Payment
                </button>
              </div>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
};

export default EventDetails;
