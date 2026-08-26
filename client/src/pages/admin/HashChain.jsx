import { useState } from 'react';
import AdminSidebar from '../../components/AdminSidebar';
import './admin.css';

const MOCK_BLOCKS = [
  {
    index: 1021,
    hash: '0x2a...f91',
    fullHash: '0x2a4d8a1c9e22f0b7c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f91',
    prevHash: '0x1b3c7d6e5f4a3b2c1d0e9f8a7b6c5d4e3f2a1b0c9d8e7f6a5b4c3d2e1f0a',
    status: 'valid',
    timestamp: '2023-10-27 14:30:12 UTC',
    event: 'Neon Nights Festival',
    seat: 'GA-201'
  },
  {
    index: 1022,
    hash: '0x8c...b34',
    fullHash: '0x8c7b6a5d4e3f2a1b0c9d8e7f6a5b4c3d2e1f0a9b8c7d6e5f4a3b2c1db34',
    prevHash: '0x2a4d8a1c9e22f0b7c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f91',
    status: 'valid',
    timestamp: '2023-10-27 14:31:28 UTC',
    event: 'Neon Nights Festival',
    seat: 'GA-202'
  },
  {
    index: 1023,
    hash: '0x4d8a1c9e22f0b7c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7',
    fullHash: '0x4d8a1c9e22f0b7c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7',
    prevHash: '0x8c7b6a5d4e3f2a1b0c9d8e7f6a5b4c3d2e1f0a9b8c7d6e5f4a3b2c1d0e9f8a7',
    status: 'tampered',
    mismatch: true,
    timestamp: '2023-10-27 14:32:45 UTC',
    event: 'CyberSec Summit 2024',
    seat: 'VIP-A12'
  }
];

const HashChain = () => {
  const [selectedBlock, setSelectedBlock] = useState(MOCK_BLOCKS[2]); // Block #1023 selected by default
  const [detailsOpen, setDetailsOpen] = useState(true);

  return (
    <div className="app-layout">
      <AdminSidebar />

      <main className="main-content">
        <div className="page-container" style={{ padding: '0 var(--space-2xl) var(--space-2xl) var(--space-2xl)', height: '100vh', display: 'flex', flexDirection: 'column' }}>
          
          {/* Header */}
          <div className="chain-header">
            <div>
              <h1>Hash Chain</h1>
              <p>Live verification stream of ticket transactions.</p>
            </div>
            <div className="chain-header-actions">
              <button className="chain-btn-outline">
                <span>EXPORT LOG</span>
              </button>
              <button className="chain-btn-outline">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="14" height="14">
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
                <span>Filter</span>
              </button>
            </div>
          </div>

          {/* Main Content */}
          <div className="chain-main">
            {/* Visualization Area */}
            <div className="chain-viz-area">
              <div className="chain-blocks-row">
                {MOCK_BLOCKS.slice(0, 2).map((block, i) => (
                  <div key={block.index} className="chain-block-group">
                    <div 
                      className={`chain-block ${selectedBlock?.index === block.index ? 'selected' : ''} ${block.status}`}
                      onClick={() => { setSelectedBlock(block); setDetailsOpen(true); }}
                    >
                      <div className="chain-block-header">
                        <span className="chain-block-id">#{block.index}</span>
                        <span className={`chain-block-dot ${block.status}`}></span>
                      </div>
                      <div className="chain-block-body">
                        <span className="chain-block-label">Hash</span>
                        <span className="chain-block-hash">{block.hash}</span>
                      </div>
                    </div>
                    {i < 1 && (
                      <div className="chain-connector">
                        <svg width="60" height="2" viewBox="0 0 60 2">
                          <line x1="0" y1="1" x2="60" y2="1" stroke="#34D399" strokeWidth="2" strokeDasharray="4 4" />
                        </svg>
                        <svg width="8" height="8" viewBox="0 0 8 8" style={{ marginLeft: '-2px' }}>
                          <polygon points="0,0 8,4 0,8" fill="#34D399" />
                        </svg>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Details Panel */}
            {detailsOpen && selectedBlock && (
              <div className="chain-details-panel">
                <div className="chain-details-header">
                  <h2>Block Details</h2>
                  <button className="chain-details-close" onClick={() => setDetailsOpen(false)}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
                      <line x1="18" y1="6" x2="6" y2="18"></line>
                      <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                  </button>
                </div>

                <div className="chain-details-body">
                  {/* Status Badge */}
                  <div className="chain-detail-badge-row">
                    <span className={`chain-status-badge ${selectedBlock.status}`}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="12" height="12">
                        {selectedBlock.status === 'tampered' ? (
                          <>
                            <circle cx="12" cy="12" r="10"></circle>
                            <line x1="12" y1="8" x2="12" y2="12"></line>
                            <line x1="12" y1="16" x2="12.01" y2="16"></line>
                          </>
                        ) : (
                          <polyline points="20 6 9 17 4 12"></polyline>
                        )}
                      </svg>
                      {selectedBlock.status.toUpperCase()}
                    </span>
                  </div>

                  {/* Block Index */}
                  <div className="chain-detail-section">
                    <label>Block Index</label>
                    <p className="chain-detail-value-large">#{selectedBlock.index}</p>
                  </div>

                  {/* Full Hash */}
                  <div className="chain-detail-section">
                    <label>Full Hash</label>
                    <div className="chain-hash-box">
                      {selectedBlock.fullHash}
                    </div>
                  </div>

                  {/* Previous Hash */}
                  <div className="chain-detail-section">
                    <label>Previous Hash</label>
                    <div className="chain-hash-box">
                      {selectedBlock.prevHash}
                    </div>
                    {selectedBlock.mismatch && (
                      <div className="chain-mismatch-warning">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="14" height="14">
                          <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                          <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                        </svg>
                        Mismatch detected
                      </div>
                    )}
                  </div>

                  {/* Timestamp */}
                  <div className="chain-detail-section">
                    <label>Timestamp</label>
                    <p className="chain-detail-value">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="14" height="14">
                        <circle cx="12" cy="12" r="10"></circle>
                        <polyline points="12 6 12 12 16 14"></polyline>
                      </svg>
                      {selectedBlock.timestamp}
                    </p>
                  </div>

                  {/* Ticket Reference */}
                  <div className="chain-detail-section">
                    <label>Ticket Reference</label>
                    <div className="chain-ticket-ref">
                      <div className="chain-ticket-ref-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
                          <rect x="3" y="10" width="18" height="10" rx="2" ry="2" />
                          <path d="M5 10V6a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v4" />
                        </svg>
                      </div>
                      <div>
                        <p className="chain-ticket-ref-title">{selectedBlock.event}</p>
                        <p className="chain-ticket-ref-seat">Seat {selectedBlock.seat}</p>
                      </div>
                    </div>
                  </div>

                  {/* Invalidate Button */}
                  {selectedBlock.status === 'tampered' && (
                    <button className="chain-invalidate-btn">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
                        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                        <line x1="12" y1="9" x2="12" y2="13"></line>
                        <line x1="12" y1="17" x2="12.01" y2="17"></line>
                      </svg>
                      INVALIDATE CHAIN
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default HashChain;
