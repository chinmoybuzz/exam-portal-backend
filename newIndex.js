const express = require("express");
require("dotenv").config();
const connectDB = require("./config/mongoDB");
const cors = require("cors");
const apiRoute = require("./routes/api.v1.route");
const { initialize } = require("./config/socket");
// const { default: helmet } = require("helmet");
const PORT = process.env.PORT;

async function start() {
  try {
    const app = express();
    app.use(cors());
    // app.use(helmet())
    //     app.use(
    //   helmet({
    //     contentSecurityPolicy: {
    //       directives: {
    //         defaultSrc: ["'self'"],
    //         scriptSrc: [
    //           "'self'",
    //           "'unsafe-inline'", // Optional: Needed if you're using inline scripts or Vue/React dev tools
    //           "https://cdn.socket.io", // Allow Socket.IO if served from CDN
    //           "http://localhost:3000", // Adjust based on your backend
    //         ],
    //         connectSrc: [
    //           "'self'",
    //           "ws://localhost:3000", // For WebSocket connection
    //           "http://localhost:3000",
    //         ],
    //         styleSrc: ["'self'", "'unsafe-inline'"],
    //         imgSrc: ["'self'", "data:"],
    //         fontSrc: ["'self'"],
    //         objectSrc: ["'none'"],
    //         upgradeInsecureRequests: [],
    //       },
    //     },
    //   })
    // );
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));
    app.use(express.static("public"));
    app.use("/api/v1", apiRoute);
    const server = require("http").createServer(app);
    initialize(server); // for socket
    await connectDB();
    server.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });

    // Catch server errors (e.g., port in use)
    server.on("error", (err) => {
      console.error(`Server failed: ${err.message}`);
      process.exit(1); // Optional: force exit on startup failure
    });
  } catch (error) {
    console.error(`Startup error: ${error.message}`);
    process.exit(1);
  }
}

// Global error handlers (best practice)
process.on("uncaughtException", (err) => {
  console.error("🔥 Uncaught Exception:", err);
  process.exit(1);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("🔥 Unhandled Rejection:", reason);
  process.exit(1);
});

start();
