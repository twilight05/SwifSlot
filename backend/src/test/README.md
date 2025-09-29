## Minimal Test Suite

This test suite covers the two critical scenarios specified:

### 1. Overlap Detection Test

- **Purpose**: Verify double-booking prevention
- **Test**: Two parallel POST requests for the same vendor+slot
- **Expected**: One 201 (success), one 409 (conflict)
- **Mechanism**: UNIQUE constraint on `(vendor_id, slot_start_utc)`

### 2. Idempotency Test

- **Purpose**: Verify identical responses for duplicate requests
- **Test**: Same payload + same Idempotency-Key sent twice
- **Expected**: Identical response bodies (same booking_id, payment_reference)
- **Mechanism**: In-memory idempotency store

### 3. Validation Test

- **Purpose**: Verify required headers
- **Test**: POST without Idempotency-Key header
- **Expected**: 400 error with clear message

## Running Tests

```bash
# Run all tests once
npm test

# Run tests in watch mode
npm run test:watch
```

## Test Database

Tests use an in-memory SQLite database that:

- Syncs with `force: true` (drops/recreates tables)
- Seeds test vendors (ID 1, 2)
- Cleans up between tests (bookings, slots, payments, idempotency keys)
