import winston from 'winston';

const level =
    process.env.NODE_ENV === 'test' ? 'error' :
    (process.env.NODE_ENV === 'prod' ? 'info' : 'debug');

const logger = new winston.Logger({
  transports: [
    new winston.transports.Console({
      level: level,
      colorize: true,
      timestamp: true,
      prettyPrint: true,
      label: 'oauth2-server',
    }),
  ],
});

// create stream for morgan
logger.stream = {
  write: message => logger.info(message),
};

export default logger;