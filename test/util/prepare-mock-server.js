import loadDemoClient from "./load-demo-client";
import logger from "../../src/logger";
import app from "../../src/app";
import http from "http";
import mongoose from "mongoose";
import { Mockgoose } from "mockgoose";

/**
 * Function to prep a mock Mongoose connection in integration tests
 * Should be called in the 'before' hook
 */
export default async function() {
  try {
    let mockgoose = new Mockgoose(mongoose);
    await mockgoose.prepareStorage();
    await mongoose.disconnect();
    await mongoose.connect('mongodb://foobar/baz');
    app.set('port', 3000);
    const server = http.createServer(app);
    await loadDemoClient();
    return server;
  } catch (err) {
    logger.error(`Error initiating Mockgoose connection`, err);
  }
}