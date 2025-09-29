import 'dotenv/config';
import { Sequelize } from 'sequelize';

// Force SQLite for development to avoid MySQL connection issues
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: './development.db',
  logging: console.log, // Enable logging to see what's happening
});

export default sequelize;
