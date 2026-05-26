import pinoHttp from 'pino-http';
import logger from '../config/logger';

export const requestLogger = pinoHttp({
  logger,
  customLogLevel(req, res, err) {
    if (res.statusCode >= 500 || err) return 'error';
    if (res.statusCode >= 400) return 'warn';
      return 'info';
  },
  customSuccessMessage(req, res) {
    return `${req.method} ${req.url} — ${res.statusCode}`;
  },
});