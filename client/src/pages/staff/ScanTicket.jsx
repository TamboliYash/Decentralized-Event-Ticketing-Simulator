import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './staff.css';

export default function ScanTicket() {
  const navigate = useNavigate();
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const [scanResult, setScanResult] = useState(null); // null | 'valid' | 'invalid' | 'used'
  const [scannedToday, setScannedToday] = useState(142);
  const [isVerifying, setIsVerifying] = useState(false);

  const handleVerify = async (hash) => {
    if (!hash || !hash.trim()) return;
    setIsVerifying(true);

    try {
      const res = await fetch('/api/tickets/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hash: hash.trim() }),
      });

      if (res.ok) {
        const data = await res.json();
        // Backend should return { status: 'valid' | 'invalid' | 'used' }
        setScanResult(data.status || 'valid');
      } else {
        const data = await res.json().catch(() => ({}));
        if (data.status === 'used') {
          setScanResult('used');
        } else {
          setScanResult('invalid');
        }
      }
    } catch {
      // If backend is not available, simulate for demo
      setScanResult('invalid');
    }

    setScannedToday((prev) => prev + 1);
    setIsVerifying(false);
    setManualCode('');
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    handleVerify(manualCode);
  };

  const dismissResult = () => {
    setScanResult(null);
  };

  const handleClose = () => {
    navigate(-1);
  };

  return (
    <div className="scan-page">
      {/* ---- Header ---- */}
      <header className="scan-header">
        <button className="scan-header-close" onClick={handleClose} aria-label="Close">
          ✕
        </button>
        <h1 className="scan-header-title">Scan Ticket</h1>
      </header>

      {/* ---- Body ---- */}
      <div className="scan-body">
        {/* QR Viewfinder */}
        <div className="scan-viewfinder-wrapper">
          {/* This div provides the bottom corner brackets */}
          <div className="scan-viewfinder-inner" style={{ position: 'absolute', inset: 0 }} />

          <div className="scan-camera-area">
            <div className="scan-crosshair" />
            <svg className="scan-camera-icon" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="2" width="20" height="20" rx="5" />
              <rect x="7" y="7" width="10" height="10" rx="2" />
              <line x1="12" y1="2" x2="12" y2="7" />
              <line x1="12" y1="17" x2="12" y2="22" />
              <line x1="2" y1="12" x2="7" y2="12" />
              <line x1="17" y1="12" x2="22" y2="12" />
            </svg>
            <p className="scan-camera-text">
              Align ticket barcode/QR code within the frame
            </p>
          </div>
        </div>

        {/* Manual entry toggle */}
        {!showManualEntry ? (
          <button
            className="scan-manual-link"
            onClick={() => setShowManualEntry(true)}
          >
            Having trouble? Enter code manually
          </button>
        ) : (
          <form className="scan-manual-entry" onSubmit={handleManualSubmit}>
            <input
              type="text"
              className="scan-manual-input"
              placeholder="Enter ticket hash..."
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              autoFocus
            />
            <button
              type="submit"
              className="scan-verify-btn"
              disabled={!manualCode.trim() || isVerifying}
            >
              {isVerifying ? 'Verifying...' : 'Verify Ticket'}
            </button>
            <button
              type="button"
              className="scan-manual-link"
              onClick={() => {
                setShowManualEntry(false);
                setManualCode('');
              }}
            >
              Cancel manual entry
            </button>
          </form>
        )}

        {/* Reference States */}
        <div className="scan-reference-section">
          <p className="scan-reference-label">Reference States</p>
          <div className="scan-reference-cards">
            {/* VALID */}
            <div className="scan-ref-card valid">
              <svg className="ref-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <path d="M8 12l3 3 5-5" />
              </svg>
              VALID
            </div>

            {/* INVALID */}
            <div className="scan-ref-card invalid">
              <svg className="ref-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="15" y1="9" x2="9" y2="15" />
                <line x1="9" y1="9" x2="15" y2="15" />
              </svg>
              INVALID
            </div>

            {/* ALREADY USED */}
            <div className="scan-ref-card used">
              <svg className="ref-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
              ALREADY USED
            </div>
          </div>
        </div>
      </div>

      {/* ---- Footer Counter ---- */}
      <div className="scan-footer">
        <p className="scan-counter">
          Scanned today: <span>{scannedToday}</span>
        </p>
      </div>

      {/* ---- Result Overlay ---- */}
      {scanResult && (
        <div className="scan-result-overlay" onClick={dismissResult}>
          <div
            className={`scan-result-card ${scanResult}`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Icon */}
            {scanResult === 'valid' && (
              <svg className="scan-result-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <path d="M8 12l3 3 5-5" />
              </svg>
            )}
            {scanResult === 'invalid' && (
              <svg className="scan-result-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="15" y1="9" x2="9" y2="15" />
                <line x1="9" y1="9" x2="15" y2="15" />
              </svg>
            )}
            {scanResult === 'used' && (
              <svg className="scan-result-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            )}

            <h2 className="scan-result-title">
              {scanResult === 'valid' && 'Valid'}
              {scanResult === 'invalid' && 'Invalid'}
              {scanResult === 'used' && 'Already Used'}
            </h2>

            <p className="scan-result-msg">
              {scanResult === 'valid' && 'Ticket verified successfully. Entry granted.'}
              {scanResult === 'invalid' && 'This ticket could not be found. It may be forged or fabricated.'}
              {scanResult === 'used' && 'This ticket has already been scanned. Possible duplication attempt.'}
            </p>

            <button className="scan-result-dismiss" onClick={dismissResult}>
              Scan Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
