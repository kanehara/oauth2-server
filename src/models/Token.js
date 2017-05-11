import mongoose from 'mongoose';
const Schema = mongoose.Schema;

/**
 * An OAuth2 Token
 */
export const Token = mongoose.model('Token', new Schema({
  accessToken: String,
  accessTokenExpiresAt: Date,
  scope: [String],

  /**
   * The Client associated with the Token
   */
  client: {type: Schema.Types.ObjectId, ref: 'Client'},

  /**
   * The User associated with the Token
   */
  user: {type: Schema.Types.ObjectId, ref: 'User'}
}));