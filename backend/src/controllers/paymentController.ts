import { Request, Response } from 'express';
import { Booking, Payment } from '../models/index.js';

// Store for idempotent webhook processing
const webhookStore = new Map<string, boolean>();

export const initializePayment = async (req: Request, res: Response): Promise<void> => {
  try {
    const { bookingId } = req.body;
    
    if (!bookingId) {
      res.status(400).json({ error: 'bookingId is required' });
      return;
    }

    // Find the booking
    const booking = await Booking.findByPk(bookingId);
    
    if (!booking) {
      res.status(404).json({ error: 'Booking not found' });
      return;
    }

    // Find existing payment or create new one
    let payment = await Payment.findOne({ where: { booking_id: bookingId } });
    
    if (!payment) {
      const paymentReference = `PAY_${booking.id}_${Date.now()}`;
      payment = await Payment.create({
        booking_id: bookingId,
        ref: paymentReference,
        status: 'pending',
      });
    }

    res.status(200).json({ 
      ref: payment.ref,
      booking_id: booking.id,
      amount: 45.00 // Mock amount
    });
  } catch (error) {
    console.error('Error initializing payment:', error);
    res.status(500).json({ error: 'Failed to initialize payment' });
  }
};

export const handlePaymentWebhook = async (req: Request, res: Response): Promise<void> => {
  try {
    const { event, data } = req.body;

    if (event !== 'charge.success') {
      res.status(400).json({ error: 'Unsupported event type' });
      return;
    }

    const { reference } = data;
    
    if (!reference) {
      res.status(400).json({ error: 'Payment reference is required' });
      return;
    }

    // Check if we've already processed this webhook (idempotent)
    if (webhookStore.has(reference)) {
      res.status(200).json({ message: 'Webhook already processed' });
      return;
    }

    // Find payment by reference
    const payment = await Payment.findOne({
      where: { ref: reference },
      include: [{ model: Booking }]
    });

    if (!payment) {
      res.status(404).json({ error: 'Payment not found for this reference' });
      return;
    }

    // Update payment status and store raw event
    await payment.update({ 
      status: 'success',
      raw_event_json: JSON.stringify(req.body)
    });

    // Update booking status to paid (idempotent)
    const booking = await Booking.findByPk(payment.booking_id);
    if (booking) {
      await booking.update({ status: 'paid' });
    }

    // Mark webhook as processed
    webhookStore.set(reference, true);

    res.status(200).json({ 
      message: 'Payment processed successfully',
      booking_id: payment.booking_id,
      status: 'paid'
    });
  } catch (error) {
    console.error('Error processing payment webhook:', error);
    res.status(500).json({ error: 'Failed to process payment webhook' });
  }
};
