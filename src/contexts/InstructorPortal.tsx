import React, { useState, useEffect } from 'react';

interface Availability {
  id: string;
  instructorId: string;
  date: string;
  status: 'AVAILABLE' | 'UNAVAILABLE';
}

export const InstructorPortal: React.FC = () => {
  const [showAvailabilityModal, setShowAvailabilityModal] = useState(false);
  const [showRemoveModal, setShowRemoveModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<'AVAILABLE' | 'UNAVAILABLE'>('AVAILABLE');
  const [availability, setAvailability] = useState<Availability[]>([]);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    loadAvailability();
  }, []);

  const loadAvailability = () => {
    const storedAvailability = localStorage.getItem('instructorAvailability');
    if (storedAvailability) {
      setAvailability(JSON.parse(storedAvailability));
    }
  };

  const handleSetAvailability = () => {
    const selectedDateObj = new Date(selectedDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (selectedDateObj < today) {
      setMessage({ text: 'Cannot set availability for past dates', type: 'error' });
      return;
    }

    const newAvailability: Availability = {
      id: `availability_${Date.now()}`,
      instructorId: JSON.parse(localStorage.getItem('currentInstructor') || '{}').id,
      date: selectedDate,
      status: selectedStatus
    };

    const updatedAvailability = [...availability, newAvailability];
    setAvailability(updatedAvailability);
    localStorage.setItem('instructorAvailability', JSON.stringify(updatedAvailability));
    setShowAvailabilityModal(false);
    setMessage({ text: 'Availability saved successfully', type: 'success' });
  };

  const handleRemoveAvailability = (date: string) => {
    const updatedAvailability = availability.filter(a => a.date !== date);
    setAvailability(updatedAvailability);
    localStorage.setItem('instructorAvailability', JSON.stringify(updatedAvailability));
    setShowRemoveModal(false);
    setMessage({ text: 'Availability removed successfully', type: 'success' });
  };

  return (
    <div className="instructor-portal">
      <h1>Instructor Portal</h1>
      
      {/* Availability Management Section */}
      <section className="availability-section">
        <h2>Availability Management</h2>
        <button 
          className="btn btn-primary"
          onClick={() => setShowAvailabilityModal(true)}
        >
          Set Availability
        </button>

        {/* Availability Table */}
        <table className="availability-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {availability.map(avail => (
              <tr key={avail.id}>
                <td>{avail.date}</td>
                <td>{avail.status}</td>
                <td>
                  <button 
                    className="btn btn-danger"
                    onClick={() => {
                      setSelectedDate(avail.date);
                      setShowRemoveModal(true);
                    }}
                  >
                    Remove Availability
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* Set Availability Modal */}
      {showAvailabilityModal && (
        <div className="modal">
          <div className="modal-content">
            <h2>Set Your Availability</h2>
            <div className="form-group">
              <label htmlFor="date">Date:</label>
              <input
                type="date"
                id="date"
                value={selectedDate}
                onChange={(e) => {
                  setSelectedDate(e.target.value);
                  const selectedDateObj = new Date(e.target.value);
                  const today = new Date(new Date().toISOString().split('T')[0]);
                  if (selectedDateObj < today) {
                    setMessage({ text: 'Cannot set availability for past dates', type: 'error' });
                  } else {
                    setMessage(null);
                  }
                }}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
            <div className="form-group">
              <label htmlFor="status">Status:</label>
              <select
                id="status"
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value as 'AVAILABLE' | 'UNAVAILABLE')}
              >
                <option value="AVAILABLE">Available</option>
                <option value="UNAVAILABLE">Unavailable</option>
              </select>
            </div>
            <div className="modal-actions">
              <button 
                className="btn btn-primary"
                onClick={handleSetAvailability}
                disabled={!selectedDate || new Date(selectedDate) < new Date(new Date().toISOString().split('T')[0])}
              >
                Save Availability
              </button>
              <button 
                className="btn btn-secondary"
                onClick={() => setShowAvailabilityModal(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Remove Availability Confirmation Modal */}
      {showRemoveModal && (
        <div className="modal">
          <div className="modal-content">
            <h2>Confirm Remove Availability</h2>
            <p>Are you sure you want to remove availability for {selectedDate}?</p>
            <div className="modal-actions">
              <button 
                className="btn btn-danger"
                onClick={() => handleRemoveAvailability(selectedDate)}
              >
                Yes, Remove
              </button>
              <button 
                className="btn btn-secondary"
                onClick={() => setShowRemoveModal(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Message Display */}
      {message && (
        <div className={`message ${message.type}`}>
          {message.text}
        </div>
      )}
    </div>
  );
}; 