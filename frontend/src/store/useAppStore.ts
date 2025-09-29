import { create } from 'zustand';

export interface Vendor {
  id: number;
  name: string;
  timezone: string;
}

export interface TimeSlot {
  lagos_time: string;
  utc_time: string;
  is_available: boolean;
}

export interface Booking {
  id: string;
  vendor_id: number;
  vendor_name: string;
  start_time_utc: string;
  end_time_utc: string;
  status: 'pending' | 'paid' | 'cancelled';
  payment_reference?: string;
}

// Minimal state shape 
interface AppState {
  user: {
    id: number;
    role: 'buyer';
  };
  selectedVendorId: number | null;
  selectedDate: string; // 'YYYY-MM-DD' (Lagos)
  selectedSlotUtc: string | null; // ISO
  
  // Actions
  setSelectedVendorId: (vendorId: number | null) => void;
  setSelectedDate: (date: string) => void;
  setSelectedSlotUtc: (slotUtc: string | null) => void;
  clearSelection: () => void;
}

export const useAppStore = create<AppState>((set) => {
  // Get today's date in Lagos timezone (UTC+1)
  const getTodayInLagos = () => {
    const now = new Date();
    const lagosTime = new Date(now.getTime() + (1 * 60 * 60 * 1000)); // Add 1 hour for Lagos
    return lagosTime.toISOString().split('T')[0];
  };

  return {
    user: {
      id: 1,
      role: 'buyer',
    },
    selectedVendorId: null,
    selectedDate: getTodayInLagos(), // Today in Lagos timezone
    selectedSlotUtc: null,
    
    // Actions
    setSelectedVendorId: (vendorId) => set({ selectedVendorId: vendorId }),
    setSelectedDate: (date) => set({ selectedDate: date }),
    setSelectedSlotUtc: (slotUtc) => set({ selectedSlotUtc: slotUtc }),
    clearSelection: () => set({ 
      selectedVendorId: null,
      selectedSlotUtc: null 
    }),
  };
});
