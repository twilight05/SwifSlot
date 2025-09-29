import { Request, Response } from 'express';
import { Op } from 'sequelize';
import { BookingSlot } from '../models/index.js';

// Generate 30-minute slots between 9 AM and 5 PM Lagos time
const generateTimeSlots = (dateStr: string): string[] => {
  const slots: string[] = [];
  const startHour = 9;
  const endHour = 17;
  
  for (let hour = startHour; hour < endHour; hour++) {
    slots.push(`${hour.toString().padStart(2, '0')}:00`);
    slots.push(`${hour.toString().padStart(2, '0')}:30`);
  }
  
  return slots;
};

// Convert Lagos time to UTC
const lagosToUTC = (dateStr: string, timeStr: string): Date => {
  // Lagos is UTC+1
  const lagosDateTime = new Date(`${dateStr}T${timeStr}:00+01:00`);
  return new Date(lagosDateTime.toISOString());
};

export const getAvailableSlots = async (req: Request, res: Response): Promise<void> => {
  try {
    const { vendorId } = req.params;
    const { date } = req.query as { date: string };

    if (!date) {
      res.status(400).json({ error: 'Date parameter is required' });
      return;
    }

    // Generate all possible slots
    const allSlots = generateTimeSlots(date);

    // Find booked slots for this vendor and date
    const bookedSlots = await BookingSlot.findAll({
      where: {
        vendor_id: vendorId,
        slot_start_utc: {
          [Op.gte]: lagosToUTC(date, '09:00'),
          [Op.lt]: lagosToUTC(date, '17:00'),
        },
      },
    });

    // Convert booked slots back to Lagos time for comparison
    const bookedTimes = bookedSlots.map(slot => {
      // Convert UTC to Lagos (UTC+1) properly
      const utcTime = new Date(slot.slot_start_utc);
      const lagosTime = new Date(utcTime.getTime() + (1 * 60 * 60 * 1000));
      // Format as HH:MM using UTC methods to avoid local timezone issues
      const hours = lagosTime.getUTCHours().toString().padStart(2, '0');
      const minutes = lagosTime.getUTCMinutes().toString().padStart(2, '0');
      return `${hours}:${minutes}`;
    });

    console.log(`[${new Date().toISOString()}] Found ${bookedSlots.length} booked slots for vendor ${vendorId} on ${date}:`, bookedTimes);

    // Filter out booked slots and create response with status
    const slotsWithStatus = allSlots.map(slot => {
      const isBooked = bookedTimes.includes(slot);
      return {
        lagos_time: slot,
        utc_time: lagosToUTC(date, slot).toISOString(),
        is_available: !isBooked,
      };
    });

    res.json({
      date,
      vendor_id: vendorId,
      slots: slotsWithStatus,
      available_slots: slotsWithStatus.filter(slot => slot.is_available), // Keep backward compatibility
    });
  } catch (error) {
    console.error('Error fetching available slots:', error);
    res.status(500).json({ error: 'Failed to fetch available slots' });
  }
};
