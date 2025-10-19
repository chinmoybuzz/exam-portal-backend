require("dotenv").config();
const jwt = require("jsonwebtoken");
module.exports = function socketAuthMiddleware(socket, next) {
  // For example, you can verify token from query
  const token = socket.handshake.auth?.token;
  console.log("data nei", token);
  if (!token) return next(new Error("Access token required"));
  try {
    console.log("working");
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.user = decoded; // attach user to socket
    next();
  } catch (err) {
    return next(new Error("Invalid or expired token"));
  }
};
