import mongoose from 'mongoose';
const Schema = mongoose.Schema;

/**
 * Schema definitions.
 */
const OAuthTokensModel = mongoose.model('OAuthTokens', new Schema({
  accessToken: { type: String },
  accessTokenExpiresOn: { type: Date },
  clientId: { type: String },
  refreshToken: { type: String },
  refreshTokenExpiresOn: { type: Date },
  userId: { type: String }
}));

const OAuthClientsModel = mongoose.model('OAuthClients', new Schema({
  clientId: { type: String },
  clientSecret: { type: String },
  redirectUris: { type: Array }
}));

const OAuthUsersModel = mongoose.model('OAuthUsers', new Schema({
  email: { type: String, default: '' },
  firstname: { type: String },
  lastname: { type: String },
  password: { type: String },
  username: { type: String }
}));

export default {
  /**
  * Get access token.
  */
  getAccessToken(bearerToken) {
    console.log('in getAccessToken (bearerToken: ' + bearerToken + ')');
    return OAuthTokensModel.findOne({ accessToken: bearerToken });
  },

  /**
   * Get client.
   */
  getClient(clientId, clientSecret) {
    console.log('in getClient (clientId: ' + clientId + ', clientSecret: ' + clientSecret + ')');
    return OAuthClientsModel.findOne({ clientId: clientId, clientSecret: clientSecret });
  },

  /**
   * Get refresh token.
   */
  getRefreshToken(refreshToken) {
    console.log('in getRefreshToken (refreshToken: ' + refreshToken + ')');
    return OAuthTokensModel.findOne({ refreshToken: refreshToken });
  },

  /**
   * Get user.
   */
  getUser(username, password) {
    console.log('in getUser (username: ' + username + ', password: ' + password + ')');
    return OAuthUsersModel.findOne({ username: username, password: password });
  },

  /**
   * Save token.
   */
  saveToken(token, client, user) {
    console.log('in saveToken (token: ' + token + ')');
    const accessToken = new OAuthTokensModel({
      accessToken: token.accessToken,
      accessTokenExpiresOn: token.accessTokenExpiresOn,
      clientId: client.id,
      refreshToken: token.refreshToken,
      refreshTokenExpiresOn: token.refreshTokenExpiresOn,
      userId: user.id
    });
    return accessToken.save();
  }
}