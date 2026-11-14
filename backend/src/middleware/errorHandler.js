function errorHandler(err, req, res, next) {
  console.error(err);

  const status = err.status || 500;

  res.status(status).json({
    error:
      process.env.NODE_ENV === 'production' && status === 500
        ? 'Internal Server Error'
        : err.message || 'Internal Server Error',
  });
}

module.exports = errorHandler;