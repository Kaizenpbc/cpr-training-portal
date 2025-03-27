import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { InstructorPortal } from '../InstructorPortal';

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn()
} as Storage;

global.localStorage = localStorageMock;

describe('InstructorPortal - Availability Management', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    vi.clearAllMocks();
    
    // Reset localStorage mock
    localStorageMock.getItem.mockImplementation((key) => {
      if (key === 'currentInstructor') {
        return JSON.stringify({
          id: 'test_instructor_1',
          name: 'Test Instructor',
          role: 'instructor'
        });
      }
      if (key === 'instructorAvailability') {
        return JSON.stringify([]);
      }
      return null;
    });
  });

  it('should allow instructor to set availability for a date', async () => {
    // Render the instructor portal
    render(<InstructorPortal />);

    // Find and click the "Set Availability" button
    const setAvailabilityButton = screen.getByText('Set Availability');
    fireEvent.click(setAvailabilityButton);

    // Wait for the availability modal to appear
    await waitFor(() => {
      expect(screen.getByText('Set Your Availability')).toBeInTheDocument();
    });

    // Set a date (using tomorrow's date)
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateInput = screen.getByLabelText('Date:');
    fireEvent.change(dateInput, { target: { value: tomorrow.toISOString().split('T')[0] } });

    // Set status to available
    const statusSelect = screen.getByLabelText('Status:');
    fireEvent.change(statusSelect, { target: { value: 'AVAILABLE' } });

    // Save the availability
    const saveButton = screen.getByText('Save Availability');
    fireEvent.click(saveButton);

    // Verify that localStorage was updated
    await waitFor(() => {
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'instructorAvailability',
        expect.stringContaining('AVAILABLE')
      );
    });

    // Verify success message
    expect(screen.getByText('Availability saved successfully')).toBeInTheDocument();
  });

  it('should allow instructor to remove availability for a date', async () => {
    // Set up initial availability data
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const initialAvailability = [{
      id: 'test_availability_1',
      instructorId: 'test_instructor_1',
      date: tomorrow.toISOString().split('T')[0],
      status: 'AVAILABLE'
    }];
    
    localStorageMock.getItem.mockImplementation((key) => {
      if (key === 'instructorAvailability') {
        return JSON.stringify(initialAvailability);
      }
      return null;
    });

    // Render the instructor portal
    render(<InstructorPortal />);

    // Wait for the availability table to load
    await waitFor(() => {
      expect(screen.getByText(tomorrow.toISOString().split('T')[0])).toBeInTheDocument();
    });

    // Find and click the remove availability button
    const removeButton = screen.getByText('Remove Availability');
    fireEvent.click(removeButton);

    // Confirm removal in the modal
    const confirmButton = screen.getByText('Yes, Remove');
    fireEvent.click(confirmButton);

    // Verify that localStorage was updated
    await waitFor(() => {
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'instructorAvailability',
        expect.not.stringContaining('test_availability_1')
      );
    });

    // Verify success message
    expect(screen.getByText('Availability removed successfully')).toBeInTheDocument();
  });

  it('should prevent setting availability for past dates', async () => {
    // Render the instructor portal
    render(<InstructorPortal />);

    // Find and click the "Set Availability" button
    const setAvailabilityButton = screen.getByText('Set Availability');
    fireEvent.click(setAvailabilityButton);

    // Wait for the availability modal to appear
    await waitFor(() => {
      expect(screen.getByText('Set Your Availability')).toBeInTheDocument();
    });

    // Try to set a past date
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const dateInput = screen.getByLabelText('Date:');
    fireEvent.change(dateInput, { target: { value: yesterday.toISOString().split('T')[0] } });

    // Verify that the save button is disabled
    const saveButton = screen.getByText('Save Availability');
    expect(saveButton).toBeDisabled();

    // Verify error message
    expect(screen.getByText('Cannot set availability for past dates')).toBeInTheDocument();
  });

  it('should show current availability in the table view', async () => {
    // Set up initial availability data
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const initialAvailability = [{
      id: 'test_availability_1',
      instructorId: 'test_instructor_1',
      date: tomorrow.toISOString().split('T')[0],
      status: 'AVAILABLE'
    }];
    
    localStorageMock.getItem.mockImplementation((key) => {
      if (key === 'instructorAvailability') {
        return JSON.stringify(initialAvailability);
      }
      return null;
    });

    // Render the instructor portal
    render(<InstructorPortal />);

    // Wait for the availability table to load and verify the available date is shown
    await waitFor(() => {
      expect(screen.getByText(tomorrow.toISOString().split('T')[0])).toBeInTheDocument();
      expect(screen.getByText('AVAILABLE')).toBeInTheDocument();
    });
  });
}); 