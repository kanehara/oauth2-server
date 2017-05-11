import mongoose from 'mongoose';
const Schema = mongoose.Schema;

/**
 * An OAuth2 User
 */
export const User = mongoose.model('User', new Schema({
  username: String,
  password: String,
  scope: [String]
}));