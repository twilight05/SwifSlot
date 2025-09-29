import 'dotenv/config';
import 'dotenv/config';
import express from 'express';
import { Vendor } from './models/index.js';
import sequelize from './config/database.js';
import routes from './routes/index.js';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// Basic CORS for development
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, Idempotency-Key');
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// Routes
app.use('/api', routes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Seed database with vendors
const seedVendors = async (): Promise<void> => {
  try {
    const existingVendors = await Vendor.count();
    if (existingVendors === 0) {
      await Vendor.bulkCreate([
        {
          name: 'Tech Solutions Pro',
          timezone: 'Africa/Lagos'
        },
        {
          name: 'Creative Design Studio',
          timezone: 'Africa/Lagos'
        },
        {
          name: 'Business Consulting Expert',
          timezone: 'Africa/Lagos'
        }
      ]);
      console.log(' Vendors seeded successfully');
    }
  } catch (error) {
    console.error('Error seeding vendors:', error);
  }
};

// Initialize database and start server
const startServer = async (): Promise<void> => {
  try {
    await sequelize.authenticate();
    console.log('Database connection established successfully');
    
    await sequelize.sync();
    console.log('Database models synchronized');

    await seedVendors();
    
    app.listen(PORT, () => {
      console.log(` Server running on http://localhost:${PORT}`);
      console.log(` Health check: http://localhost:${PORT}/health`);
      console.log(` API base: http://localhost:${PORT}/api`);
    });
  } catch (error) {
    console.error(' Unable to start server:', error);
    process.exit(1);
  }
};

// Only start server if this file is run directly (not imported for tests)
if (import.meta.url === `file://${process.argv[1]}`) {
  startServer();
}

// Export app for testing
export default app;
