import { Client, User, Token } from '../../src/models';
import logger from '../../src/logger';

export const clientCredentials = {
  clientId: '12345',
  clientSecret: '12345'
};

export const userCredentials = {
  username: 'user',
  password: 'pass!'
};

/**
 * Loads a demo client into the DB
 */
export default async function() {
  try {
    await Promise.all([
      Client.find().remove(),
      User.find().remove(),
      Token.find().remove()
    ]);
    logger.debug('Finished deleting demo data');

    const demoUser = await User.create({
      username: userCredentials.username,
      password: userCredentials.password,
      scope: ["all"]
    });
    logger.debug('Finished loading demo User', demoUser);

    const demoClient = await Client.create({
      "name" : "oauth2 Client",
      "clientId" : clientCredentials.clientId,
      "clientSecret" : clientCredentials.clientSecret,
      "grants" : ["client_credentials"],
      "user": demoUser._id
    });
    logger.debug('Finished loading demo client', demoClient);
  } catch(err) {
    logger.debug('Error loading demo client', err);
  }
}