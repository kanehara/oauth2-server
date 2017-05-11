import logger from './logger';
import { Client, Token, User } from './models';
import _ from 'underscore';

/**
 * Factory function to generate the model object to be passed into oAuth2 middleware
 *
 * @param expireToken - Injected expireToken() method when testing
 * @param revokeToken - Injected revokeToken() method when testing
 * @returns {*} The oAuth2 model object
 *              See the node-oauth2-server wiki for details:
 *              https://github.com/oauthjs/node-oauth2-server/wiki/Model-specification
 *
 * NOTE!
 *   This auth server currently only supports the client_credentials grant type
 *   To implement other grant types, refer to the wiki
 */
export default function(expireToken = defaultExpireTokenFactory(), revokeToken = defaultRevokeTokenFactory()) {
  return {
    /**
     * Validates a token in request auth header
     *
     * @param {string} bearerToken - The token to be checked
     * @returns {Promise.<Token>} - Retrieved token on success, falsey value on failure
     */
    getAccessToken(bearerToken) {
      logger.debug(`in getAccessToken (bearerToken: ${bearerToken})`);
      return Token.findOne({accessToken: bearerToken})
          .then(token => {
            if (!token) {
              logger.info(`Could not find token of value: ${bearerToken}`);
            } else if (!token.accessTokenExpiresAt) {
              logger.info(`Token with value: ${bearerToken} does not have an expiration date`);
            } else if (new Date() > token.accessTokenExpiresAt) {
              logger.info(`Token with value: ${bearerToken} has expired`);
            } else {
              return token;
            }
            return false;
          })
          .catch(err => {
            logger.info(`Error trying to retrieve Token with value: ${bearerToken}`, err);
          });
    },

    /**
     * Validates client credentials
     *
     * @param {string} clientId
     * @param {string} clientSecret
     * @returns {Promise.<Client>} - Retrieved Client on success, falsey on failure
     */
    getClient(clientId, clientSecret) {
      logger.debug(`in getClient (clientId: ${clientId}, clientSecret: ${clientSecret})`);
      return Client.findOne({clientId: clientId, clientSecret: clientSecret})
          .catch(err => {
            logger.info(`Error trying to retrieve Client with client id ${clientId}`, err);
          });
    },

    /**
     * Gets the User associated with a Client
     *
     * @param {Client} client - The Client associated with User
     * @returns {Promise.<T>|Promise}
     */
    getUserFromClient(client) {
      logger.debug(`in getUserFromClient (clientId: ${client.clientId}, clientSecret: ${client.clientSecret})`);
      let {clientId, clientSecret} = client;
      return Client.findOne({clientId, clientSecret})
          .populate('user')
          .then(client => {
            return (client && client.user) ?
                client.user :
                false;
          })
          .catch(err => {
            logger.info(`Error trying to retrieve User instance for Client with client id: ${clientId}`, err);
          })
    },

    /**
     * Executes saving a token after authentication
     *
     * @param {Token} token - The token to save
     * @param {Client} client - The Client instance associated with token
     * @param {User} user - The User instance associated with token
     * @returns {Promise.<Token>} - Saved token on success, falsey value on failure
     */
    async saveToken(token, client, user) {
      logger.debug('in saveToken (token: ' + token + ')');

      const accessToken = new Token({
        accessToken: token.accessToken,
        accessTokenExpiresAt: token.accessTokenExpiresAt,
        scope: token.scope,
        client: client._id,
        user: user._id
      });

      // Save token
      try {
        await expireToken(client, user, revokeToken);
        const savedToken = await accessToken.save();
        if (!savedToken) {
          return false;
        }
        return savedToken;
      } catch (err) {
        logger.info(`Error trying to save token for client with client id: ${client.clientId} 
                        for user ${user.username}`, err);
      }
    },

    /**
     * {@injectedDoc}
     */
    revokeToken,

    /**
     * Validates a User's scope
     *
     * @param {User} user - User requesting access
     * @param {Client} client - Client associated with user
     * @param {String} scope - A CSV of scopes required for requested resource
     * @returns {Promise.<Array[string]>} - Validated scopes after successful validation, falsey otherwise
     */
    validateScope(user, client, scope) {
      logger.debug(`in validateScope (user: ${user}, client: ${client}, scope: ${scope}`);
      if (!user) {
        return false;
      }

      // Cast to empty array if no scope requested
      const requiredScopes = (scope && scope.length) ? scope.split(',') : [];
      return User.findOne({username: user.username})
          .then(user => {
            if (user && _.difference(requiredScopes, user.scope).length === 0) {
              return requiredScopes;
            } else {
              return false;
            }
          })
          .catch(err => {
            logger.info(`Error trying to find user with user id: ${user.userId}`, err);
          });
    }
  }
};

/**
 * Expires the token for the given Client and User
 *
 * @param client
 * @param user
 * @param revokeToken - Injected revokeToken method
 * @returns {Promise.<void>}
 * @throws if expiring tokens fails
 */
async function expireToken(client, user, revokeToken) {
  // Expire existing valid tokens
  try {
    const existingTokens = await Token.find({
      client: client._id,
      user: user._id,
      accessTokenExpiresAt: {$gt: new Date()}
    });
    if (existingTokens) {
      // Map tokens to promises returned from `revokeToken` and run run them concurrently
      await Promise.all(existingTokens.map(t => revokeToken(t)));
    }
  } catch (err) {
    logger.info(`Error trying to retrieve token for client with id ${client._id} and user with id ${user._id}`, err);
    throw err;
  }
}
function defaultExpireTokenFactory() {
  return expireToken;
}

/**
 * Revokes (i.e. expires) the given token object
 *
 * @param {Token} token - The token to expire
 * @returns {Promise.<Token>} - The revoked token if successful, falsey otherwise
 */
async function revokeToken(token) {
  logger.debug(`in revokeToken (token: ${token})`);
  try {
    // Expire token by setting expiration date to 1 second prior
    const expireDate = new Date();
    expireDate.setSeconds(expireDate.getSeconds() - 1);
    token.accessTokenExpiresAt = expireDate;
    const updatedToken = await token.save();
    if (!updatedToken) {
      return false;
    }
    return updatedToken;
  } catch(err) {
    logger.info(`Error trying to expire token ${token}`, err);
  }
}
function defaultRevokeTokenFactory() {
  return revokeToken;
}
