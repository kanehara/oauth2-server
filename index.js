/**
 * This file is only executed locally
 * Non locally, we will pre-compile src/ with Babel and build it to a lib/ directory and execute that instead
 *
 * See package.json for details of the scripts
 */

const assert = require('assert');

assert(process.env.NODE_ENV !== 'production');

// Read in environment variables from .env
require('dotenv').config();

// Babel hook
require('babel-core/register');

// Server
require('./src');