const logger = require('../utils/logger');

function mapError(err) {
  if (err.code === 'VALIDATION_ERROR') {
    return { status: 422, code: 'VALIDATION_ERROR', message: err.message || 'Validation failed' };
  }

  if (err.name === 'CastError') {
    return { status: 400, code: 'BAD_ID', message: 'Invalid identifier' };
  }

  if (err.name === 'ValidationError') {
    return {
      status: 422,
      code: 'VALIDATION_ERROR',
      message: err.message || 'Validation failed',
    };
  }

  if (err.code === 11000) {
    return { status: 409, code: 'CONFLICT', message: 'Duplicate key violation' };
  }

  if (err.status) {
    return {
      status: err.status,
      code: err.code || 'ERROR',
      message: err.message || 'Error',
    };
  }

  return {
    status: 500,
    code: err.code || 'INTERNAL_ERROR',
    message: err.message || 'Unexpected error',
  };
}

function errorHandler(err, _req, res, _next) {
  logger.error(err);
  const mapped = mapError(err);
  const isProd = process.env.NODE_ENV === 'production';

  return res.status(mapped.status).json({
    error: {
      code: mapped.code,
      message: mapped.message,
      details: isProd ? undefined : err.details || err.stack,
    },
  });
}

module.exports = errorHandler;
