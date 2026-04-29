function errorHandler(err, req, res, next) {
  const isDevelopment = process.env.NODE_ENV === 'development';

  let statusCode = 500;
  let message = 'Something went wrong';
  let errors;

  if (err.isOperational) {
    statusCode = err.statusCode;
    message = err.message;
  } else if (err.name === 'ValidationError' && Array.isArray(err.details)) {
    statusCode = 400;
    message = 'Validation failed';
    errors = err.details.map((detail) => ({
      field: detail.path.join('.'),
      message: detail.message,
    }));
  } else if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
  } else if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Session expired, please login';
  } else if (err.code === '23505') {
    statusCode = 409;
    message = 'Record already exists';
  } else if (err.code === '23503') {
    statusCode = 400;
    message = 'Referenced record not found';
  } else if (err.code === '23502') {
    statusCode = 400;
    message = 'Required field missing';
  }

  const response = {
    success: false,
    message,
  };

  if (errors) {
    response.errors = errors;
  }

  if (isDevelopment) {
    response.stack = err.stack;
  }

  res.status(statusCode).json(response);
}

module.exports = errorHandler;
