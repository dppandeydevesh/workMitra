const errorHandler = (err, req, res, next) => {
  console.error(`[Error Handler] ${err.name}: ${err.message}`);
  
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map(val => val.message);
    return res.status(400).json({ error: 'Validation Error', details: messages });
  }
  
  if (err.name === 'CastError') {
    return res.status(400).json({ error: 'Invalid Resource ID Format' });
  }
  
  if (err.code === 11000) {
    return res.status(409).json({ error: 'Duplicate field value entered.' });
  }

  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    return res.status(401).json({ error: 'Invalid or expired token.' });
  }

  const statusCode = err.statusCode || 500;
  const message = err.isOperational ? err.message : 'Internal Server Error';

  res.status(statusCode).json({ error: message });
};

module.exports = errorHandler;
