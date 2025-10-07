const socketIo = require("socket.io");

//auth
const socketAuthMiddleware = require("../socket/middlewares/auth");

//handlers
const chatHandler = require("../socket/handler/chatHandler");
const timerHandler = require("../socket/handler/timer");
const notificationHandler = require("../socket/handler/notificationHandler");
const continueDataHandler = require("../socket/handler/continueData");

const _ = require("lodash");
let io;

function initialize(server) {
  io = socketIo(server, {
    cors: {
      origin: "*", // Replace with the correct port
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  // io.use(socketAuthMiddleware);

  io.on("connection", (socket) => {
    // console.log("Client connected:", socket.id);
    timerHandler(io, socket);
    // Delegate events
    // continueDataHandler(io, socket);
    // chatHandler(io, socket);
    // notificationHandler(io, socket);
    socket.on("disconnect", () => {
      console.log("Client disconnected:", socket.id);
    });
  });
}

function getIo() {
  if (!io) {
    throw new Error("Socket.io not initialized! Call initialize(server) first.");
  }
  return io;
}

module.exports = { initialize, getIo };
