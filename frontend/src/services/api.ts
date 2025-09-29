const API_BASE_URL = 'http://localhost:3000/api';

export interface ApiVendor {
  id: number;
  name: string;
  timezone: string;
}

export interface ApiTimeSlot {
  lagos_time: string;
  utc_time: string;

  is_available: boolean;
}

export interface ApiAvailabilityResponse {
  date: string;
  vendor_id: string;
  slots: ApiTimeSlot[];
  available_slots: ApiTimeSlot[];
}

export interface ApiBookingRequest {
  vendorId: number;
  startISO: string;
  endISO: string;
}

export interface ApiBookingResponse {
  booking_id: string;
  vendor: string;
  date: string;
  time: string;
  utc_time: string;
  status: 'pending' | 'paid' | 'cancelled';
  payment_reference: string;
}

class ApiService {
  private generateIdempotencyKey(): string {
    return `booking-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  async fetchVendors(): Promise<ApiVendor[]> {
    const response = await fetch(`${API_BASE_URL}/vendors`);
    if (!response.ok) {
      throw new Error('Failed to fetch vendors');
    }
    return response.json();
  }

  async fetchVendor(id: number): Promise<ApiVendor> {
    const response = await fetch(`${API_BASE_URL}/vendors/${id}`);
    if (!response.ok) {
      throw new Error('Failed to fetch vendor');
    }
    return response.json();
  }

  async fetchAvailability(vendorId: number, date: string): Promise<ApiAvailabilityResponse> {
    const response = await fetch(`${API_BASE_URL}/vendors/${vendorId}/availability?date=${date}`);
    if (!response.ok) {
      throw new Error('Failed to fetch availability');
    }
    return response.json();
  }

  async createBooking(bookingData: ApiBookingRequest): Promise<ApiBookingResponse> {
    const idempotencyKey = this.generateIdempotencyKey();
    
    const response = await fetch(`${API_BASE_URL}/bookings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Idempotency-Key': idempotencyKey,
      },
      body: JSON.stringify(bookingData),
    });

    if (!response.ok) {
      const error = await response.json();
      // Create a custom error with status code for better handling
      const customError = new Error(error.error || 'Failed to create booking') as Error & { status?: number };
      customError.status = response.status;
      throw customError;
    }

    return response.json();
  }

  async initializePayment(bookingId: string): Promise<{ ref: string }> {
    const response = await fetch(`${API_BASE_URL}/payments/initialize`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ bookingId }),
    });

    if (!response.ok) {
      throw new Error('Failed to initialize payment');
    }

    return response.json();
  }

  async fetchBooking(id: string): Promise<ApiBookingResponse> {
    const response = await fetch(`${API_BASE_URL}/bookings/${id}`);
    if (!response.ok) {
      throw new Error('Failed to fetch booking');
    }
    return response.json();
  }

  async processPayment(paymentReference: string): Promise<void> {
    // Mock payment webhook call
    const response = await fetch(`${API_BASE_URL}/payments/webhook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        event: 'charge.success',
        data: {
          reference: paymentReference,
        },
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to process payment');
    }
  }

  // Poll booking status until paid
  async pollBookingStatus(bookingId: string): Promise<ApiBookingResponse> {
    const maxAttempts = 10;
    const pollInterval = 1000; // 1 second

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const booking = await this.fetchBooking(bookingId);
      
      if (booking.status === 'paid') {
        return booking;
      }
      
      if (attempt < maxAttempts - 1) {
        await new Promise(resolve => setTimeout(resolve, pollInterval));
      }
    }
    
    throw new Error('Booking payment timeout');
  }
}

export const apiService = new ApiService();
