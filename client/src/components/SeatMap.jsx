import { useState } from 'react';

const SeatMap = ({ rows = 8, cols = 10, onSeatSelect, selectedSeats = [] }) => {
  // Mock some sold out seats randomly for visual effect
  // In a real app, this data would come from the backend
  const [soldOutSeats] = useState(new Set(['0-0', '0-7', '1-3', '1-8', '2-1', '2-7', '3-5', '3-8', '4-2', '4-9', '5-4', '5-7', '6-1', '6-6', '7-8', '7-9']));

  const handleSeatClick = (row, col) => {
    const seatId = `${row}-${col}`;
    if (soldOutSeats.has(seatId)) return;
    
    // Using simple letters for rows and 1-based index for columns (e.g. A1, B2)
    const rowChar = String.fromCharCode(65 + row);
    const seatLabel = `${rowChar}${col + 1}`;
    
    onSeatSelect(seatId, seatLabel);
  };

  return (
    <div className="seat-map-container">
      <h3 className="seat-map-title">Select Your Seat</h3>
      
      <div className="seat-grid">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div key={`row-${rowIndex}`} className="seat-row">
            {Array.from({ length: cols }).map((_, colIndex) => {
              const seatId = `${rowIndex}-${colIndex}`;
              const isSoldOut = soldOutSeats.has(seatId);
              const isSelected = selectedSeats.some(s => s.id === seatId);
              
              let seatClass = 'seat';
              if (isSoldOut) seatClass += ' sold-out';
              else if (isSelected) seatClass += ' selected';
              else seatClass += ' available';

              return (
                <button
                  key={seatId}
                  className={seatClass}
                  disabled={isSoldOut}
                  onClick={() => handleSeatClick(rowIndex, colIndex)}
                  aria-label={`Seat row ${rowIndex + 1} column ${colIndex + 1}`}
                />
              );
            })}
          </div>
        ))}
      </div>

      <div className="seat-legend">
        <div className="legend-item">
          <div className="seat available legend-box"></div>
          <span>Available</span>
        </div>
        <div className="legend-item">
          <div className="seat selected legend-box"></div>
          <span>Selected</span>
        </div>
        <div className="legend-item">
          <div className="seat sold-out legend-box"></div>
          <span>Sold Out</span>
        </div>
      </div>
    </div>
  );
};

export default SeatMap;
