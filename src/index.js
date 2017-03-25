#!/usr/bin/env node

/**
 * Module dependencies.
 */
import app from './app';
import http from 'http';
import logger from './logger';
import connect from './db';
import mongoose from 'mongoose';

// Initialize Mongo connection
connect();
mongoose.connection.once('open', () => {
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

// log uncaught exceptions
process.on('uncaughtException', err => logger.error('uncaught exception:', err));
process.on('unhandledRejection', error => logger.error('unhandled rejection:', error));