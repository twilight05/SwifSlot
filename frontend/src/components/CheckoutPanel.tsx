import { useState, useEffect } from 'react';
import { useAppStore } from '../store/useAppStore';
import { apiService } from '../services/api';
import type { Vendor, TimeSlot } from '../store/useAppStore';

interface CheckoutPanelProps {
  onClose?: () => void;
  onBookingComplete?: () => void;
}

export const CheckoutPanel = ({ onClose, onBookingComplete }: CheckoutPanelProps) => {
  const {
    selectedVendorId,
    selectedDate,
    selectedSlotUtc,
    clearSelection,
  } = useAppStore();

  // Local state for component functionality
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [bookingStage, setBookingStage] = useState<'creating' | 'paying' | 'confirming' | 'completed' | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Load vendor and slot data when component mounts
  useEffect(() => {
    if (!selectedVendorId) return;

    const loadVendor = async () => {
      try {
        const vendorData = await apiService.fetchVendor(selectedVendorId);
        setVendor(vendorData);
      } catch (error) {
        console.error('Failed to load vendor:', error);
      }
    };

    loadVendor();
  }, [selectedVendorId]);

  // Load slot data
  useEffect(() => {
    if (!selectedVendorId || !selectedDate || !selectedSlotUtc) return;

    const loadSlotData = async () => {
      try {
        const availability = await apiService.fetchAvailability(selectedVendorId, selectedDate);
        const slot = availability.slots.find(s => s.utc_time === selectedSlotUtc);
        setSelectedSlot(slot || null);
      } catch (error) {
        console.error('Failed to load slot data:', error);
      }
    };

    loadSlotData();
  }, [selectedVendorId, selectedDate, selectedSlotUtc]);

  // Auto-dismiss toast
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        setToast(null);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  if (!vendor || !selectedSlot) return null;

  const mockPrice = 500.00; // Mock price in Naira (₦500.00)

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (timeStr: string) => {
    return new Date(`2000-01-01T${timeStr}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const formatUTCTime = (utcStr: string) => {
    const utcDate = new Date(utcStr);
    const hours = utcDate.getUTCHours();
    const minutes = utcDate.getUTCMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${ampm} UTC`;
  };

  const handleBooking = async () => {
    if (!vendor || !selectedSlot || !selectedVendorId || !selectedSlotUtc) return;
    
    setIsProcessing(true);
    setBookingStage('creating');
    
    try {
      // Step 1: Create booking with Idempotency-Key
      const bookingData = {
        vendorId: selectedVendorId,
        startISO: selectedSlotUtc,
        endISO: new Date(new Date(selectedSlotUtc).getTime() + 2 * 60 * 60 * 1000).toISOString() // Add 2 hours
      };

      console.log('Step 1: Creating booking with Idempotency-Key...', bookingData);
      const booking = await apiService.createBooking(bookingData);
      console.log('Booking created:', booking);
      
      // Give user time to see the "Creating Booking" stage
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Step 2: Initialize payment
      setBookingStage('paying');
      console.log('Step 2: Initializing payment...');
      const paymentResponse = await apiService.initializePayment(booking.booking_id);
      console.log('Payment initialized:', paymentResponse);

      // Step 3: Mock payment webhook (simulate successful payment)
      console.log('Step 3: Processing payment webhook (mock success)...');
      await apiService.processPayment(paymentResponse.ref);
      console.log('Payment webhook processed successfully');
      
      // Give user time to see the "Processing Payment" stage
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Step 4: Poll for payment confirmation
      setBookingStage('confirming');
      console.log('Step 4: Verifying booking status...');
      const confirmedBooking = await apiService.pollBookingStatus(booking.booking_id);
      console.log('Booking confirmed with status:', confirmedBooking.status);

      // Give user time to see the "Confirming" stage
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Show success state
      setBookingStage('completed');
      setIsSuccess(true);
      setToast({ 
        message: 'Booking confirmed successfully! Payment processed.', 
        type: 'success' 
      });

      // Call the onBookingComplete callback to refresh parent state
      if (onBookingComplete) {
        onBookingComplete();
      } else {
        // Fallback: Clear selection after a short delay to let user see the success state
        setTimeout(() => {
          clearSelection();
        }, 2000);
      }

    } catch (error: any) {
      console.error('Booking failed:', error);
      
      // Reset states on error
      setBookingStage(null);
      
      // Handle specific error types
      if (error.status === 409) {
        setToast({
          message: 'This time slot is no longer available. Please select another time.',
          type: 'error'
        });
      } else {
        setToast({
          message: error.message || 'Booking failed. Please try again.',
          type: 'error'
        });
      }
      
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    // Reset booking state
    setBookingStage(null);
    setIsProcessing(false);
    
    if (onClose) {
      onClose();
    } else {
      // Fallback to clearing selection
      if (isSuccess) {
        clearSelection();
        setIsSuccess(false);
      } else {
        clearSelection();
      }
    }
  };

  return (
    <>
      {toast && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-md shadow-lg ${
          toast.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
        }`}>
          {toast.message}
        </div>
      )}
      
      <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-zinc-700">
            {isSuccess ? 'Booking Confirmed' : 'Review & Checkout'}
          </h3>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 p-1"
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>

        {isSuccess ? (
          <div className="text-center">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <h4 className="text-lg font-semibold text-zinc-700 mb-2">Booking Confirmed!</h4>
            <p className="text-zinc-600 mb-4">Your appointment has been successfully booked.</p>
            <div className="text-left space-y-2 bg-gray-50 rounded-lg p-4">
              <div className="flex justify-between">
                <span className="text-zinc-600">Vendor:</span>
                <span className="font-medium text-zinc-700">{vendor.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-600">Date:</span>
                <span className="font-medium text-zinc-700">{formatDate(selectedDate)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-600">Time (Lagos):</span>
                <span className="font-medium text-zinc-700">{formatTime(selectedSlot.lagos_time)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-600">Amount Paid:</span>
                <span className="font-medium text-emerald-600">₦{mockPrice.toFixed(2)}</span>
              </div>
            </div>
          </div>
        ) : (
          <>
            <div className="space-y-4 mb-6">
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-zinc-600">Vendor</span>
                <span className="font-medium text-zinc-700">{vendor.name}</span>
              </div>
              
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-zinc-600">Date</span>
                <span className="font-medium text-zinc-700">{formatDate(selectedDate)}</span>
              </div>
              
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-zinc-600">Time (Lagos)</span>
                <span className="font-medium text-zinc-700">{formatTime(selectedSlot.lagos_time)}</span>
              </div>
              
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-zinc-600">Time (UTC)</span>
                <span className="font-medium text-zinc-700">{formatUTCTime(selectedSlot.utc_time)}</span>
              </div>
              
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-zinc-600">Price</span>
                <span className="font-bold text-zinc-700">₦{mockPrice.toFixed(2)}</span>
              </div>
            </div>

            {/* Progress Indicator */}
            {isProcessing && (
              <div className="mb-4 bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Booking Progress</span>
                  <span className="text-sm text-gray-500">
                    {bookingStage === 'creating' && '1/3'}
                    {bookingStage === 'paying' && '2/3'}
                    {(bookingStage === 'confirming' || bookingStage === 'completed') && '3/3'}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-sky-600 h-2 rounded-full transition-all duration-500 ease-out"
                    style={{
                      width: 
                        bookingStage === 'creating' ? '33%' :
                        bookingStage === 'paying' ? '66%' :
                        (bookingStage === 'confirming' || bookingStage === 'completed') ? '100%' : '0%'
                    }}
                  ></div>
                </div>
                <div className="flex justify-between mt-2 text-xs text-gray-500">
                  <span className={bookingStage === 'creating' ? 'text-sky-600 font-medium' : ''}>Create</span>
                  <span className={bookingStage === 'paying' ? 'text-sky-600 font-medium' : ''}>Pay</span>
                  <span className={(bookingStage === 'confirming' || bookingStage === 'completed') ? 'text-sky-600 font-medium' : ''}>Confirm</span>
                </div>
              </div>
            )}

            <button
              onClick={handleBooking}
              disabled={isProcessing}
              className="w-full bg-sky-600 text-white font-medium py-3 px-4 rounded-md hover:bg-sky-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {isProcessing ? (
                <>
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  {bookingStage === 'creating' && 'Creating Booking...'}
                  {bookingStage === 'paying' && 'Processing Payment...'}
                  {bookingStage === 'confirming' && 'Confirming Booking...'}
                  {bookingStage === 'completed' && 'Booking Complete!'}
                  {!bookingStage && 'Processing...'}
                </>
              ) : (
                'Book & Pay'
              )}
            </button>
          </>
        )}
      </div>
    </>
  );
};
