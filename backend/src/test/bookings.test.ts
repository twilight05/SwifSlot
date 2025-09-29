import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../index.js';

describe('Booking API Tests', () => {
  const testSlot = {
    vendorId: 1,
    startISO: '2025-10-01T10:00:00.000Z',
    endISO: '2025-10-01T10:30:00.000Z',
    customerName: 'Test User',
    customerEmail: 'test@example.com',
    customerPhone: '+2348012345678'
  };

  describe('Overlap Detection', () => {
    it('should handle parallel POST requests for same vendor+slot: one 201, one 409', async () => {
      // Make two parallel requests for the same slot
      const [response1, response2] = await Promise.all([
        request(app)
          .post('/api/bookings')
          .set('Idempotency-Key', 'test-overlap-1')
          .send(testSlot),
        request(app)
          .post('/api/bookings')
          .set('Idempotency-Key', 'test-overlap-2')
          .send(testSlot)
      ]);

      // One should succeed (201), one should fail (409)
      const responses = [response1, response2];
      const successResponse = responses.find(r => r.status === 201);
      const conflictResponse = responses.find(r => r.status === 409);

      expect(successResponse).toBeDefined();
      expect(conflictResponse).toBeDefined();
      
      // Verify success response structure
      expect(successResponse?.body).toHaveProperty('booking_id');
      expect(successResponse?.body).toHaveProperty('vendor');
      expect(successResponse?.body).toHaveProperty('status', 'pending');
      
      // Verify conflict response
      expect(conflictResponse?.body).toHaveProperty('error');
      expect(conflictResponse?.body.error).toContain('no longer available');
    });
  });

  describe('Idempotency', () => {
    it('should return identical responses for same payload + same Idempotency-Key', async () => {
      const idempotencyKey = 'test-idempotency-123';
      const payload = {
        vendorId: 2,
        startISO: '2025-10-01T11:00:00.000Z',
        endISO: '2025-10-01T11:30:00.000Z',
        customerName: 'Idempotency Test',
        customerEmail: 'idempotency@example.com',
        customerPhone: '+2348012345679'
      };

      // First request
      const response1 = await request(app)
        .post('/api/bookings')
        .set('Idempotency-Key', idempotencyKey)
        .send(payload);

      // Second request with same idempotency key
      const response2 = await request(app)
        .post('/api/bookings')
        .set('Idempotency-Key', idempotencyKey)
        .send(payload);

      // Both should return 201 (or same status)
      expect(response1.status).toBe(201);
      expect(response2.status).toBe(201);

      // Bodies should be identical
      expect(response1.body).toEqual(response2.body);
      
      // Specifically check the booking_id is the same
      expect(response1.body.booking_id).toBe(response2.body.booking_id);
      expect(response1.body.payment_reference).toBe(response2.body.payment_reference);
    });

    it('should reject requests without Idempotency-Key header', async () => {
      const response = await request(app)
        .post('/api/bookings')
        .send(testSlot);

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Idempotency-Key header is required');
    });
  });
});