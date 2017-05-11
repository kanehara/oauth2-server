/**
 * DB loading script that will load a client instance for client_credentials grants
 * DB connection configuration must be valid in local-properties.json if running locally
 *
 * This creates a {@link Client} with a random 8 byte Client ID and random 16 byte Client secret
 * associated with a {@link User} also with a random 8 byte username and 16 byte password
 *
 * Example:
 *  - npm run db:create:client <client-name>
 *      REQUIRED: `client-name` - A canonical name associated with client
 */
import connect from '../../db';
import logger from '../../logger';
import crypto from 'crypto';
import { User, Client } from '../../models';
import mongoose from 'mongoose';
const connection = mongoose.connection;

// The first two elements of process.argv are 'node' and the js file path being executed respectively
const [clientName] = process.argv.slice(2);

if (!clientName) {
  logger.error("A client name must be supplied to this command as the first argument! Example: `npm run db:create:client ADD`");
  process.exit();
}

connect();
connection.once('open', () => {
  loadClient(clientName)
      .then(() => {
        logger.info("Successfully loaded new Client");
        process.exit();
      })
      .catch(err => {
        logger.error("Error loading new Client: ", err);
        process.exit();
      });
});
connection.on('error', (err) => {
  logger.error('Error in Mongo connection:', err);
  process.exit();
});

async function loadClient(clientName) {
  const clientCredentials = {
    name: clientName,
    clientId: crypto.randomBytes(8).toString('hex'),
    clientSecret: crypto.randomBytes(16).toString('hex')
  };

  const userCredentials = {
    username: crypto.randomBytes(8).toString('hex'),
    password: crypto.randomBytes(16).toString('hex')
  };

  const newUser = await User.create({
    username: userCredentials.username,
    password: userCredentials.password,
    // TODO: update script to take in scopes as an arg once scopes are implemented
    scope: null
  });
  logger.info('Finished loading new User', newUser);

  const newClient = await
      Client.create({
        "name": clientCredentials.name,
        "clientId": clientCredentials.clientId,
        "clientSecret": clientCredentials.clientSecret,
        "grants": ["client_credentials"],
        "user": newUser._id
      });
  logger.info('Finished loading new client', newClient);
}