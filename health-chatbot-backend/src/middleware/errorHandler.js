const pino = require('pino');

const logger = pino();

const errorHandler = (err, req, res, next) => {
  // Log the error
  logger.error({
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  }, 'Error occurred');

  // Default error response
  let statusCode = 500;
  let message = 'Internal Server Error';
  let details = null;

  // Handle different types of errors
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation Error';
    details = err.message;
  } else if (err.name === 'CastError') {
    statusCode = 400;
    message = 'Invalid data format';
    details = err.message;
  } else if (err.code === 'ENOTFOUND') {
    statusCode = 503;
    message = 'Service Unavailable';
    details = 'External service is currently unavailable';
  } else if (err.code === 'ETIMEDOUT') {
    statusCode = 504;
    message = 'Gateway Timeout';
    details = 'Request timed out';
  } else if (err.status) {
    statusCode = err.status;
    message = err.message || 'Error occurred';
  }

  // Don't expose internal error details in production
  const isProduction = process.env.NODE_ENV === 'production';
  
  const errorResponse = {
    error: message,
    status: statusCode,
    timestamp: new Date().toISOString(),
    path: req.url
  };

  // Add details only in development or for client errors (4xx)
  if (!isProduction || (statusCode >= 400 && statusCode < 500)) {
    if (details) {
      errorResponse.details = details;
    }
    
    // Add stack trace in development
    if (!isProduction) {
      errorResponse.stack = err.stack;
    }
  }

  res.status(statusCode).json(errorResponse);
};

// Async error handler wrapper
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Custom error classes
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

class ValidationError extends AppError {
  constructor(message) {
    super(message, 400);
    this.name = 'ValidationError';
  }
}

class ServiceUnavailableError extends AppError {
  constructor(service) {
    super(`${service} service is currently unavailable`, 503);
    this.name = 'ServiceUnavailableError';
  }
}

class RateLimitError extends AppError {
  constructor() {
    super('Too many requests, please try again later', 429);
    this.name = 'RateLimitError';
  }
}

module.exports = {
  errorHandler,
  asyncHandler,
  AppError,
  ValidationError,
  ServiceUnavailableError,
  RateLimitError
};
