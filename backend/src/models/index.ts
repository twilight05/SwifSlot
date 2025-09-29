import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';

// vendors(id, name, timezone)
export interface VendorAttributes {
  id?: number;
  name: string;
  timezone: string;
}

export class Vendor extends Model<VendorAttributes> implements VendorAttributes {
  declare id: number;
  declare name: string;
  declare timezone: string;
}

Vendor.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  timezone: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'Africa/Lagos',
  },
}, {
  sequelize,
  modelName: 'Vendor',
  tableName: 'vendors',
  timestamps: false,
});

// bookings(id, vendor_id, buyer_id, start_time_utc, end_time_utc, status, created_at)
export interface BookingAttributes {
  id?: string;
  vendor_id: number;
  buyer_id: number;
  start_time_utc: Date;
  end_time_utc: Date;
  status: 'pending' | 'paid' | 'cancelled';
  created_at?: Date;
}

export class Booking extends Model<BookingAttributes> implements BookingAttributes {
  declare id: string;
  declare vendor_id: number;
  declare buyer_id: number;
  declare start_time_utc: Date;
  declare end_time_utc: Date;
  declare status: 'pending' | 'paid' | 'cancelled';
  declare created_at: Date;
}

Booking.init({
  id: {
    type: DataTypes.UUID,
    primaryKey: true,
    defaultValue: DataTypes.UUIDV4,
  },
  vendor_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Vendor,
      key: 'id',
    },
  },
  buyer_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
  },
  start_time_utc: {
    type: DataTypes.DATE(3), // DATETIME(3) for millisecond precision
    allowNull: false,
  },
  end_time_utc: {
    type: DataTypes.DATE(3), // DATETIME(3) for millisecond precision
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM('pending', 'paid', 'cancelled'),
    defaultValue: 'pending',
  },
  created_at: {
    type: DataTypes.DATE(3),
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
}, {
  sequelize,
  modelName: 'Booking',
  tableName: 'bookings',
  timestamps: false, // We handle created_at manually
});

// booking_slots(id, booking_id, vendor_id, slot_start_utc) with UNIQUE(vendor_id, slot_start_utc)
export interface BookingSlotAttributes {
  id?: number;
  booking_id: string;
  vendor_id: number;
  slot_start_utc: Date;
}

export class BookingSlot extends Model<BookingSlotAttributes> implements BookingSlotAttributes {
  declare id: number;
  declare booking_id: string;
  declare vendor_id: number;
  declare slot_start_utc: Date;
}

BookingSlot.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  booking_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: Booking,
      key: 'id',
    },
  },
  vendor_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Vendor,
      key: 'id',
    },
  },
  slot_start_utc: {
    type: DataTypes.DATE(3), // DATETIME(3) for millisecond precision
    allowNull: false,
  },
}, {
  sequelize,
  modelName: 'BookingSlot',
  tableName: 'booking_slots',
  timestamps: false,
  indexes: [
    {
      unique: true,
      fields: ['vendor_id', 'slot_start_utc'],
    },
  ],
});

// payments(id, booking_id, ref UNIQUE, status, raw_event_json)
export interface PaymentAttributes {
  id?: number;
  booking_id: string;
  ref: string;
  status: 'pending' | 'success' | 'failed';
  raw_event_json?: string;
}

export class Payment extends Model<PaymentAttributes> implements PaymentAttributes {
  declare id: number;
  declare booking_id: string;
  declare ref: string;
  declare status: 'pending' | 'success' | 'failed';
  declare raw_event_json: string;
}

Payment.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  booking_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: Booking,
      key: 'id',
    },
  },
  ref: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  status: {
    type: DataTypes.ENUM('pending', 'success', 'failed'),
    defaultValue: 'pending',
  },
  raw_event_json: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
}, {
  sequelize,
  modelName: 'Payment',
  tableName: 'payments',
  timestamps: false,
});

// idempotency_keys(key PRIMARY KEY, scope, response_hash, created_at)
export interface IdempotencyKeyAttributes {
  key: string;
  scope: string;
  response_hash: string;
  created_at?: Date;
}

export class IdempotencyKey extends Model<IdempotencyKeyAttributes> implements IdempotencyKeyAttributes {
  declare key: string;
  declare scope: string;
  declare response_hash: string;
  declare created_at: Date;
}

IdempotencyKey.init({
  key: {
    type: DataTypes.STRING,
    primaryKey: true,
  },
  scope: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  response_hash: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  created_at: {
    type: DataTypes.DATE(3),
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
}, {
  sequelize,
  modelName: 'IdempotencyKey',
  tableName: 'idempotency_keys',
  timestamps: false,
});

// Associations
Vendor.hasMany(Booking, { foreignKey: 'vendor_id' });
Booking.belongsTo(Vendor, { foreignKey: 'vendor_id' });

Vendor.hasMany(BookingSlot, { foreignKey: 'vendor_id' });
BookingSlot.belongsTo(Vendor, { foreignKey: 'vendor_id' });

Booking.hasMany(BookingSlot, { foreignKey: 'booking_id', sourceKey: 'id' });
BookingSlot.belongsTo(Booking, { foreignKey: 'booking_id', targetKey: 'id' });

Booking.hasMany(Payment, { foreignKey: 'booking_id', sourceKey: 'id' });
Payment.belongsTo(Booking, { foreignKey: 'booking_id', targetKey: 'id' });
