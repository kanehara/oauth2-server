import mongoose from 'mongoose';
import logger from './logger';
import config from './config';

const db = mongoose.connection;

db.on('error', error => {
  logger.error('Error in Mongo connection', error);
  mongoose.disconnect();
});

db.on('connected', () => {
  logger.info('MongoDB connected!');
});

db.once('open', () => {
  logger.info('MongoDB connection opened!');
});

db.on('reconnected', () => {
  logger.info('MongoDB reconnected!');
});

db.on('disconnected', () => {
  logger.info('MongoDB disconnected!');
});

export default function connect() {
  const { uri, user, pass } = config.mongo;

  // Makes connection asynchronously. Mongoose will queue up database
  // operations and release them when the connection is complete.
  return mongoose.connect(uri, { user, pass });
}
