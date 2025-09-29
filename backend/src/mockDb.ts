// Simple in-memory mock database for testing without MySQL

interface MockVendor {
  id: number;
  name: string;
  description: string;
}

interface MockBooking {
  id: string;
  vendor_id: number;
  buyer_id: number;
  booking_date_lagos: string;
  start_time_lagos: string;
  start_time_utc: string;
  status: 'pending' | 'paid' | 'cancelled';
  payment_reference?: string;
}

interface MockBookingSlot {
  id: number;
  vendor_id: number;
  slot_start_utc: string;
  slot_end_utc: string;
  booking_id: string;
  buyer_id: number;
}

export const mockVendors: MockVendor[] = [
  {
    id: 1,
    name: 'Tech Solutions Pro',
    description: 'Professional IT consulting and software development services'
  },
  {
    id: 2,
    name: 'Creative Design Studio',
    description: 'Modern graphic design and branding solutions for your business'
  },
  {
    id: 3,
    name: 'Business Consulting Expert',
    description: 'Strategic business consulting and growth optimization services'
  }
];

export const mockBookings: MockBooking[] = [];
export const mockBookingSlots: MockBookingSlot[] = [];
