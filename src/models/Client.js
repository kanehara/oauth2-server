import mongoose from 'mongoose';
const Schema = mongoose.Schema;

/**
 * An OAuth2 Client
 */
export const Client = mongoose.model('Client', new Schema({
  name: String,
  clientId: String,
  clientSecret: String,
  grants: [String],

  /**
   * If this Client supports client_credentials grant type,
   * this will hold the Client's User instance.
   * Otherwise, this will be undefined
   */
  user: {type: Schema.Types.ObjectId, ref: 'User'}
}));