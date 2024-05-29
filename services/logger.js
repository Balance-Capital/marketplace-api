/* eslint-disable import/no-extraneous-dependencies */
require('dotenv').config();

const Rollbar = require("rollbar");

// const winston = require("winston");

// const RollbarTransport = require('winston-transport-rollbar-3');

const rollbarConfig = {
  accessToken: process.env?.ROLLBAR_TOKEN || null,
  captureUncaught: process.env?.APP_ENV !== 'development',
  captureUnhandledRejections: process.env?.APP_ENV !== 'development'
};

// const { Logtail } = require("@logtail/node");

// const { LogtailTransport } = require("@logtail/winston");

// Create a Logtail client
// const logtail = new Logtail(process.env?.LOGTAIL_TOKEN || null);

// Create a Rollbar client
// eslint-disable-next-line no-unused-vars
const rollbar = new Rollbar(rollbarConfig);

// Create a Winston logger - passing in the Logtail transport
// const winstonLogger = winston.createLogger({
//   transports: [new RollbarTransport({rollbarConfig, level: 'warn'})]
// });

// const intervalTime = 10000;
// setInterval(()=>{logtail.flush()},intervalTime);

const logger = {
  error : (message, context={}) => {
    // winstonLogger.error(message);
    rollbar.error(message, context);
  },
  debug : (message, context={}) => {
    // winstonLogger.debug(message);
    rollbar.debug(message, context);
  },
  warning : (message, context={}) => {
    // winstonLogger.warn(message);
    rollbar.warn(message, context);
  },
  warn: (message, context={}) => {
    // winstonLogger.warn(message);
    rollbar.warn(message, context);
  },
  info : (message, context={}) => {
    // winstonLogger.info(message);
    rollbar.info(message, context);
  },
  critical: (message, context={}) => {
    // winstonLogger.emerg(message);
    rollbar.critical(message, context);
  },
  log: (message, context={}) => {
    // winstonLogger.log(message);
    rollbar.log(message, context);
  }
};

module.exports = logger;