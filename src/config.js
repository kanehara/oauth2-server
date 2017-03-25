export default {
  mongo: {
    uri: 'localhost:32768',
    user: process.env.MONGO_USER || '',
    pass: process.env.MONGO_PASS || ''
  }
}