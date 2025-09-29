import { Router } from 'express';
import { getVendors, getVendor } from '../controllers/vendorController.js';
import { getAvailableSlots } from '../controllers/availabilityController.js';
import { createBooking, getBooking } from '../controllers/bookingController.js';
import { initializePayment, handlePaymentWebhook } from '../controllers/paymentController.js';

const router = Router();

// Vendor routes
router.get('/vendors', getVendors);
router.get('/vendors/:id', getVendor);

// Availability routes
router.get('/vendors/:vendorId/availability', getAvailableSlots);

// Booking routes
router.post('/bookings', createBooking);
router.get('/bookings/:id', getBooking);

// Payment routes
router.post('/payments/initialize', initializePayment);
router.post('/payments/webhook', handlePaymentWebhook);

export default router;
