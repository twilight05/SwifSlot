import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { Booking, BookingSlot, Vendor, IdempotencyKey, Payment } from '../models/index.js';
import sequelize from '../config/database.js';

// Store for idempotency keys
const idempotencyStore = new Map<string, any>();

export const createBooking = async (req: Request, res: Response): Promise<void> => {
  const idempotencyKey = req.headers['idempotency-key'] as string;
  
  if (!idempotencyKey) {
    res.status(400).json({ error: 'Idempotency-Key header is required' });
    return;
  }

  // Check if we've seen this idempotency key before
  if (idempotencyStore.has(idempotencyKey)) {
    const previousResponse = idempotencyStore.get(idempotencyKey);
    res.status(previousResponse.status).json(previousResponse.data);
    return;
  }

  const transaction = await sequelize.transaction();

  try {
    const { vendorId, startISO, endISO } = req.body;
    console.log(`[${new Date().toISOString()}] Booking request - Vendor: ${vendorId}, Start: ${startISO}, End: ${endISO}`);

    if (!vendorId || !startISO || !endISO) {
      const errorResponse = { error: 'vendorId, startISO, and endISO are required' };
      idempotencyStore.set(idempotencyKey, { status: 400, data: errorResponse });
      await transaction.rollback();
      res.status(400).json(errorResponse);
      return;
    }

    // Parse and validate ISO dates
    const startTime = new Date(startISO);
    const endTime = new Date(endISO);
    
    if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
      const errorResponse = { error: 'Invalid ISO date format' };
      idempotencyStore.set(idempotencyKey, { status: 400, data: errorResponse });
      await transaction.rollback();
      res.status(400).json(errorResponse);
      return;
    }

    // Validate vendor exists
    const vendor = await Vendor.findByPk(vendorId);
    if (!vendor) {
      const errorResponse = { error: 'Vendor not found' };
      idempotencyStore.set(idempotencyKey, { status: 404, data: errorResponse });
      await transaction.rollback();
      res.status(404).json(errorResponse);
      return;
    }

    // Validate booking time (2-hour buffer for today in Lagos)
    const now = new Date();
    const lagosNow = new Date(now.getTime() + (1 * 60 * 60 * 1000));
    const todayLagos = lagosNow.toISOString().split('T')[0];
    const bookingDateLagos = new Date(startTime.getTime() + (1 * 60 * 60 * 1000)).toISOString().split('T')[0];
    
    if (bookingDateLagos === todayLagos) {
      const twoHoursFromNow = new Date(now.getTime() + (2 * 60 * 60 * 1000));
      if (startTime < twoHoursFromNow) {
        const errorResponse = { error: 'Bookings for today must be at least 2 hours in advance' };
        idempotencyStore.set(idempotencyKey, { status: 400, data: errorResponse });
        await transaction.rollback();
        res.status(400).json(errorResponse);
        return;
      }
    }

    console.log(`[${new Date().toISOString()}] Booking time validation passed for ${startISO}`);

    // Create booking
    const booking = await Booking.create({
      vendor_id: vendorId,
      buyer_id: 1,
      start_time_utc: startTime,
      end_time_utc: endTime,
      status: 'pending',
    }, { transaction });

    console.log('Created booking with ID:', booking.id);

    if (!booking.id) {
      throw new Error('Failed to generate booking ID');
    }

    // Create booking slot (this will fail if slot already exists due to unique index)
    try {
      const bookingSlot = await BookingSlot.create({
        booking_id: booking.id,
        vendor_id: vendorId,
        slot_start_utc: startTime,
      }, { transaction });
      console.log('Created booking slot:', bookingSlot.toJSON());
    } catch (error: any) {
      if (error.name === 'SequelizeUniqueConstraintError') {
        const conflictResponse = { error: 'This time slot is no longer available' };
        idempotencyStore.set(idempotencyKey, { status: 409, data: conflictResponse });
        await transaction.rollback();
        res.status(409).json(conflictResponse);
        return;
      }
      throw error;
    }

    await transaction.commit();

    // Generate payment reference (will be moved to payment initialization)
    const paymentReference = `PAY_${booking.id}_${Date.now()}`;
    
    // Create initial payment record
    await Payment.create({
      booking_id: booking.id,
      ref: paymentReference,
      status: 'pending',
    });

    const successResponse = {
      booking_id: booking.id,
      vendor: vendor.name,
      start_time_utc: startTime.toISOString(),
      end_time_utc: endTime.toISOString(),
      status: 'pending',
      payment_reference: paymentReference,
    };

    idempotencyStore.set(idempotencyKey, { status: 201, data: successResponse });
    res.status(201).json(successResponse);
  } catch (error) {
    await transaction.rollback();
    console.error('Error creating booking:', error);
    const errorResponse = { error: 'Failed to create booking' };
    idempotencyStore.set(idempotencyKey, { status: 500, data: errorResponse });
    res.status(500).json(errorResponse);
  }
};

export const getBooking = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    const booking = await Booking.findByPk(id, {
      include: [{ model: Vendor }],
    });

    if (!booking) {
      res.status(404).json({ error: 'Booking not found' });
      return;
    }

    res.json(booking);
  } catch (error) {
    console.error('Error fetching booking:', error);
    res.status(500).json({ error: 'Failed to fetch booking' });
  }
};
