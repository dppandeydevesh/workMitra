const jwt = require('jsonwebtoken');

const authenticateToken = (req, res, next) => {
  let token = req.cookies && req.cookies.token;
  
  if (!token) {
    const authHeader = req.headers['authorization'];
    token = authHeader && authHeader.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ error: "Access token is missing." });
  }

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: "Access token is invalid or expired." });
    }
    req.user = user;
    next();
  });
};

module.exports = authenticateToken;
