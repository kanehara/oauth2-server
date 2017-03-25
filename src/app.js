import express from "express";
import morgan from "morgan";
import bodyParser from "body-parser";
import OAuth2Server from 'express-oauth-server';
import logger from './logger';
import model from './model';

const app = express();
const oauth2 = new OAuth2Server({
  debug: true,
  model
});

app.use(morgan('combined', {stream: logger.stream}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

// Unprotected
app.get('/', (req, res) => {
  res.send('hello world');
});

// Health check
app.get('/healthz', (req, res) => {
  res.send('Healthy as a horse');
});

// Protected route
app.get('/secret', oauth2.authenticate(), (req, res) => {
  res.send('Ooh I hope nobody gets their hands on me Strawberry Smiggles');
});

export default app;
