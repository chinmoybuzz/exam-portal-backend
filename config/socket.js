const socketIo = require("socket.io");

//auth
const socketAuthMiddleware = require("../socket/middlewares/auth");

//exam portal
const timer = require("../socket/handler/timer");
const timerHandler = require("../socket/handler/timer.handler");
const examHandler = require("../socket/handler/exam");

//Recover Running Timers After server restarts
const { recoverRunningTimers } = require("../socket/handler/timer.handler");
//handlers
const chatHandler = require("../socket/handler/chatHandler");
const notificationHandler = require("../socket/handler/notificationHandler");
const continueDataHandler = require("../socket/handler/continueData");

const _ = require("lodash");
let io;

async function initialize(server) {
  io = socketIo(server, {
    cors: {
      origin: "*", // Replace with the correct port
      methods: ["GET", "POST"],
      credentials: true,
    },
  });
  await recoverRunningTimers(getIo);
  // io.use(socketAuthMiddleware);

  io.on("connection", (socket) => {
    console.log("Client connected:", socket.id);
    timerHandler(io, socket);
    examHandler(io, socket);
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
