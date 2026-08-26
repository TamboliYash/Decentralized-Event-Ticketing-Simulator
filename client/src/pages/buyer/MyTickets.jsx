import { useState } from 'react';
import BuyerSidebar from '../../components/BuyerSidebar';

const MOCK_TICKETS = [
  {
    _id: '1',
    eventTitle: 'CyberSec Summit 2024',
    date: 'Oct 15, 2024',
    time: '09:00 AM PST',
    venue: 'Moscone Center, SF',
    hall: 'Hall D',
    seat: 'VIP-A12',
    status: 'valid',
    hash: '0x4a2f...9c1',
    qrImage: 'https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=0x4a2f'
  },
  {
    _id: '2',
    eventTitle: 'Web3 Developer Conference',
    date: 'Sep 20, 2024',
    time: '10:00 AM EST',
    venue: 'Javits Center, NY',
    hall: 'Main Stage',
    seat: 'Gen Admission',
    status: 'valid',
    hash: '0xb91e...4f2',
    qrImage: 'https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=0xb91e'
  },
  {
    _id: '3',
    eventTitle: 'ETH Global Hackathon',
    date: 'Aug 10, 2024',
    time: '08:00 AM EST',
    venue: 'Online Event',
    seat: 'N/A',
    status: 'used',
    hash: '0x768a...2d5',
    qrImage: 'https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=0x768a',
    isDimmed: true
  },
  {
    _id: '4',
    eventTitle: 'Fintech Disruptors Panel',
    date: 'Sep 05, 2024',
    time: '06:00 PM GMT',
    venue: 'The Shard, London',
    hall: 'Lvl 42',
    seat: 'Reserved',
    status: 'transferred',
    transferredTo: '0x1f2...a9c',
    hash: null,
    qrImage: null,
    isDimmed: true
  }
];

const MyTickets = () => {
  const [tickets] = useState(MOCK_TICKETS);
  const [transferModalOpen, setTransferModalOpen] = useState(true); // Default open to match screenshot

  const handleOptionsClick = (ticketId) => {
    // In a real app, this would open a dropdown menu.
    // For now, we'll just open the transfer modal if the ticket is valid.
    const ticket = tickets.find(t => t._id === ticketId);
    if (ticket && ticket.status === 'valid') {
      setTransferModalOpen(true);
    }
  };

  return (
    <div className="app-layout">
      <BuyerSidebar />

      <main className="main-content">
        <div className="page-container">
          
          <div className="page-header-tickets">
            <div className="tickets-title-section">
              <h1>My Tickets</h1>
              <p>Manage and transfer your upcoming events.</p>
            </div>
            <div className="tickets-action-section">
              <div className="search-input-wrapper">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8"></circle>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
                <input type="text" placeholder="Search hash, event, or venue" />
              </div>
              <button className="btn-filter">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
                  <line x1="4" y1="21" x2="4" y2="14"></line>
                  <line x1="4" y1="10" x2="4" y2="3"></line>
                  <line x1="12" y1="21" x2="12" y2="12"></line>
                  <line x1="12" y1="8" x2="12" y2="3"></line>
                  <line x1="20" y1="21" x2="20" y2="16"></line>
                  <line x1="20" y1="12" x2="20" y2="3"></line>
                  <line x1="1" y1="14" x2="7" y2="14"></line>
                  <line x1="9" y1="8" x2="15" y2="8"></line>
                  <line x1="17" y1="16" x2="23" y2="16"></line>
                </svg>
                Filter
              </button>
            </div>
          </div>

          <div className="tickets-list">
            {tickets.map(ticket => (
              <div key={ticket._id} className={`ticket-card ${ticket.isDimmed ? 'disabled' : ''}`}>
                
                {/* QR Code Section */}
                <div className="ticket-qr-section">
                  {ticket.status === 'transferred' ? (
                    <div className="ticket-qr-box transferred">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="32" height="32" style={{color: 'var(--text-muted)'}}>
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                        <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                      </svg>
                    </div>
                  ) : ticket.qrImage ? (
                    <div className="ticket-qr-box">
                      <img src={ticket.qrImage} alt="Ticket QR" />
                    </div>
                  ) : (
                    <div className="ticket-qr-box placeholder"></div>
                  )}
                  {ticket.hash ? (
                    <span className="ticket-hash">{ticket.hash}</span>
                  ) : (
                    <span className="ticket-hash" style={{color: 'var(--bg-tertiary)'}}>Transferred</span>
                  )}
                </div>

                {/* Info Section */}
                <div className="ticket-info-section">
                  <h3 className="ticket-title">{ticket.eventTitle}</h3>
                  <div className="ticket-meta-row">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                      <line x1="16" y1="2" x2="16" y2="6"></line>
                      <line x1="8" y1="2" x2="8" y2="6"></line>
                      <line x1="3" y1="10" x2="21" y2="10"></line>
                    </svg>
                    {ticket.date} &bull; {ticket.time}
                  </div>
                  <div className="ticket-meta-row">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                      <circle cx="12" cy="10" r="3"></circle>
                    </svg>
                    {ticket.venue} {ticket.hall ? `• ${ticket.hall}` : ''}
                  </div>
                  
                  {ticket.seat && (
                    <div className="ticket-seat-badge">
                      Seat: {ticket.seat}
                    </div>
                  )}

                  {ticket.status === 'transferred' && ticket.transferredTo && (
                    <div className="ticket-transferred-to">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="12" height="12">
                        <line x1="5" y1="12" x2="19" y2="12"></line>
                        <polyline points="12 5 19 12 12 19"></polyline>
                      </svg>
                      Sent to {ticket.transferredTo}
                    </div>
                  )}
                </div>

                {/* Status & Options */}
                <span className={`ticket-status ${ticket.status}`}>
                  {ticket.status}
                </span>
                
                <button className="ticket-options-btn" onClick={() => handleOptionsClick(ticket._id)}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
                    <circle cx="12" cy="12" r="1"></circle>
                    <circle cx="12" cy="5" r="1"></circle>
                    <circle cx="12" cy="19" r="1"></circle>
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Transfer Modal overlaying everything */}
        {transferModalOpen && (
          <div className="modal-overlay">
            <div className="modal-content">
              <div className="modal-header">
                <h2>Transfer Ticket</h2>
                <button className="modal-close" onClick={() => setTransferModalOpen(false)}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              </div>
              <div className="modal-body">
                <p>Enter the recipient's wallet address or verified email to securely transfer 0xb91e...4f2.</p>
                <div className="modal-input-group">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                    <circle cx="12" cy="7" r="4"></circle>
                  </svg>
                  <input type="text" placeholder="Recipient Email / Address" />
                </div>
                <div className="modal-actions">
                  <button className="btn-cancel" onClick={() => setTransferModalOpen(false)}>Cancel</button>
                  <button className="btn-transfer" onClick={() => setTransferModalOpen(false)}>
                    Send Transfer
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="14" height="14">
                      <line x1="22" y1="2" x2="11" y2="13"></line>
                      <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default MyTickets;
