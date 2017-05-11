import express from "express";
import morgan from "morgan";
import bodyParser from "body-parser";
import OAuth2Server from 'express-oauth-server';
import logger from './logger';
import modelFactory from './oauth2-model-factory';
const model = modelFactory();

const app = express();
const oauth2 = new OAuth2Server({ model });

app.use(morgan('combined', {stream: logger.stream}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

/**
 * Health check endpoint
 */
app.get('/healthz', (req, res) => {
  res.send('Healthy as a horse');
});

/**
 * Retrieve tokens through OAuth2 authentication
 */
app.post('/auth/token', oauth2.token(), (res, req) => {
  res.send(res.locals.oauth);
});

/**
 * Authenticate a request
 */
app.get('/auth/authenticate', oauth2.authenticate(), (req, res) => {
  res.sendStatus(200);
});

export default app;
