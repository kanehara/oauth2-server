/**
 * Module dependencies.
 */
import app from './app';
import http from 'http';
import logger from './logger';
import config from './config';
import connect from './db';
import mongoose from 'mongoose';

const Raven = require('raven');

// Initialize Mongo connection
connect();

mongoose.connection.once('open', () => {
  if (process.env.NODE_ENV === 'production') {
    configureRaven();
  }

  /**
   * Get port from environment and store in Express.
   */
  const port = process.env.PORT || '3000';
  app.set('port', port);

  /**
   * Create HTTP server.
   */
  const server = http.createServer(app);

  /**
   * Listen on provided port, on all network interfaces.
   */
  server.listen(port, () => logger.info('Express server listening on %d', port))
});

function configureRaven() {
  if (!config.sentry) {
    logger.error("Configuration json is missing 'sentry' key! Killing the app...");
    process.exit();
  } else if (!config.sentry.dsn) {
    logger.error("Configuration json is missing 'sentry.dsn' key! Killing the app...");
    process.exit();
  }

  Raven.config(config.sentry.dsn).install();
  app.use(Raven.requestHandler());
  app.use(Raven.errorHandler());
}

// log uncaught exceptions
process.on('uncaughtException', err => logger.error('uncaught exception:', err));
process.on('unhandledRejection', error => logger.error('unhandled rejection:', error));