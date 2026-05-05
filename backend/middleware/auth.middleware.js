const jwt = require('jsonwebtoken');

const protect = (req, res, next) => {
  // 1. Get the token from the headers (Usually sent as 'Bearer <token>')
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1]; // Extract just the token part
  }

  // 2. If no token, deny access
  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token provided' });
  }

  try {
    // 3. Verify the token using our secret key
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // 4. Attach the decoded user ID to the request object for the next functions to use
    req.adminId = decoded.id;
    next(); // Move on to the actual route handler
  } catch (error) {
    // If token is invalid or expired
    res.status(401).json({ message: 'Not authorized, token failed' });
  }
};

module.exports = { protect };