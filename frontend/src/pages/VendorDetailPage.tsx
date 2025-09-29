import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore';
import { apiService } from '../services/api';
import { TimeSlotButton } from '../components/TimeSlotButton';
import { CheckoutPanel } from '../components/CheckoutPanel';
import type { Vendor, TimeSlot } from '../store/useAppStore';

export const VendorDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const {
    selectedDate,
    selectedSlotUtc,
    setSelectedVendorId,
    setSelectedDate,
    setSelectedSlotUtc,
  } = useAppStore();

  // Local state for component-specific data
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [allSlots, setAllSlots] = useState<TimeSlot[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Load vendor details
  useEffect(() => {
    if (!id) return;

    const loadVendor = async () => {
      try {
        setIsLoading(true);
        const vendorData = await apiService.fetchVendor(parseInt(id));
        setVendor(vendorData);
        setSelectedVendorId(vendorData.id);
      } catch (error) {
        console.error('Failed to load vendor:', error);
        setToast({ message: 'Failed to load vendor details', type: 'error' });
      } finally {
        setIsLoading(false);
      }
    };

    loadVendor();
  }, [id, setSelectedVendorId]);

  // Load availability when vendor or date changes
  useEffect(() => {
    if (!vendor || !selectedDate) return;

    const loadAvailability = async () => {
      setLoadingSlots(true);
      try {
        const availability = await apiService.fetchAvailability(vendor.id, selectedDate);
        console.log('Availability response:', availability);
        console.log('Slots details:', availability.slots.map(slot => ({ time: slot.lagos_time, available: slot.is_available })));
        setAllSlots(availability.slots);
        setSelectedSlotUtc(null); // Clear selection when date changes
      } catch (error) {
        console.error('Failed to load availability:', error);
        setToast({ message: 'Failed to load availability', type: 'error' });
        setAllSlots([]);
      } finally {
        setLoadingSlots(false);
      }
    };

    loadAvailability();
  }, [vendor, selectedDate, setSelectedSlotUtc]);

  // Auto-dismiss toast
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        setToast(null);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const handleDateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedDate(event.target.value);
  };

  const handleSlotSelect = (slot: { lagos_time: string; utc_time: string; is_available: boolean }) => {
    if (slot.is_available) {
      setSelectedSlotUtc(slot.utc_time);
    }
  };

  const selectedSlot = selectedSlotUtc ? allSlots.find(slot => slot.utc_time === selectedSlotUtc) : null;
  const showCheckout = !!selectedSlot;

  if (isLoading && !vendor) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center gap-3">
          <svg className="animate-spin h-6 w-6 text-sky-600" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <span className="text-zinc-600">Loading vendor...</span>
        </div>
      </div>
    );
  }

  if (!vendor) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-medium text-zinc-700 mb-2">Vendor not found</h2>
          <Link to="/" className="text-sky-600 hover:text-sky-700">
            ← Back to vendors
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 right-4 z-50">
          <div className={`px-4 py-3 rounded-lg shadow-lg text-white ${
            toast.type === 'success' ? 'bg-emerald-500' : 'bg-red-500'
          }`}>
            <p className="text-sm font-medium">{toast.message}</p>
          </div>
        </div>
      )}

      <div className="container mx-auto px-4 py-8">
        {/* Back Button */}
        <div className="mb-6">
          <Link
            to="/"
            className="inline-flex items-center text-sky-600 hover:text-sky-700 font-medium"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to vendors
          </Link>
        </div>

        {/* Desktop Layout */}
        <div className="lg:grid lg:grid-cols-3 lg:gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Header Row */}
            <div className="flex items-center gap-4 mb-6">
              <h1 className="text-2xl font-bold text-zinc-700">{vendor.name}</h1>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
                <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                </svg>
                {vendor.timezone}
              </span>
            </div>

            {/* Controls Row */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <input
                  type="date"
                  value={selectedDate}
                  onChange={handleDateChange}
                  min={new Date().toISOString().split('T')[0]}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                />
              </div>
              <p className="text-sm text-zinc-600">Times shown in Africa/Lagos</p>
            </div>

            {/* Slots Grid */}
            {loadingSlots ? (
              <div className="flex items-center justify-center py-12">
                <div className="flex items-center gap-3">
                  <svg className="animate-spin h-5 w-5 text-sky-600" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span className="text-zinc-600">Loading slots...</span>
                </div>
              </div>
            ) : allSlots.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-zinc-700 mb-2">No free slots</h3>
                <p className="text-zinc-600">No free slots for this date. Pick another day.</p>
              </div>
            ) : (
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="font-semibold text-zinc-700 mb-4">Available Times</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                  {allSlots.map((slot: TimeSlot) => (
                    <TimeSlotButton
                      key={slot.lagos_time}
                      slot={slot}
                      isSelected={selectedSlot?.lagos_time === slot.lagos_time}
                      isAvailable={slot.is_available}
                      isBooking={false} // Simplified for minimal state
                      onClick={handleSlotSelect}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Desktop Checkout Panel */}
          <div className="hidden lg:block">
            {showCheckout && (
              <CheckoutPanel onClose={() => setSelectedSlotUtc(null)} onBookingComplete={() => {
                // Refresh availability after booking
                if (vendor && selectedDate) {
                  const loadAvailability = async () => {
                    try {
                      const availability = await apiService.fetchAvailability(vendor.id, selectedDate);
                      setAllSlots(availability.slots);
                    } catch (error) {
                      console.error('Failed to refresh availability:', error);
                    }
                  };
                  loadAvailability();
                }
                setSelectedSlotUtc(null);
              }} />
            )}
          </div>
        </div>

        {/* Mobile Checkout Modal */}
        {showCheckout && (
          <div className="lg:hidden fixed inset-0 z-50 flex items-end">
            <div 
              className="fixed inset-0 bg-black bg-opacity-30 transition-opacity" 
              onClick={() => setSelectedSlotUtc(null)} 
            />
            <div className="relative w-full bg-white rounded-t-2xl shadow-2xl max-h-[85vh] overflow-y-auto animate-slide-up">
              {/* Mobile handle */}
              <div className="flex justify-center pt-3 pb-2">
                <div className="w-10 h-1 bg-gray-300 rounded-full"></div>
              </div>
              <CheckoutPanel onClose={() => setSelectedSlotUtc(null)} onBookingComplete={() => {
                // Refresh availability after booking
                if (vendor && selectedDate) {
                  const loadAvailability = async () => {
                    try {
                      const availability = await apiService.fetchAvailability(vendor.id, selectedDate);
                      setAllSlots(availability.slots);
                    } catch (error) {
                      console.error('Failed to refresh availability:', error);
                    }
                  };
                  loadAvailability();
                }
                setSelectedSlotUtc(null);
              }} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
