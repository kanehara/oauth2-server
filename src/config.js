/**
 * This will read the file (expects JSON) defined at the path set in the CONFIG_PATH environment variable
 * CONFIG_PATH will be configured differently per envrionment
 *
 * Locally, this is set in the .env file via dotenv: https://github.com/motdotla/dotenv
 */
import fs from 'fs';
import logger from './logger';

const pathToProperties = process.env.CONFIG_PATH;

let config = {};
try {
  config = JSON.parse(fs.readFileSync(pathToProperties, 'utf8'));
} catch(err) {
  logger.error(`Could not parse file as JSON at path ${pathToProperties}. This means our app will fail! Killing the app...`, err);
  process.exit();
}

export default config;