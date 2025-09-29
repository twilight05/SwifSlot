import { beforeAll, afterAll, beforeEach } from 'vitest';
import sequelize from '../config/database.js';
import { Vendor, Booking, BookingSlot, Payment, IdempotencyKey } from '../models/index.js';

beforeAll(async () => {
  // Force sync database for tests (drops and recreates tables)
  await sequelize.sync({ force: true });
  
  // Seed test vendors
  await Vendor.bulkCreate([
    { id: 1, name: 'Test Vendor 1', timezone: 'Africa/Lagos' },
    { id: 2, name: 'Test Vendor 2', timezone: 'Africa/Lagos' },
  ]);
});

beforeEach(async () => {
  // Clean up between tests
  await BookingSlot.destroy({ where: {} });
  await Payment.destroy({ where: {} });
  await Booking.destroy({ where: {} });
  await IdempotencyKey.destroy({ where: {} });
});

afterAll(async () => {
  await sequelize.close();
});