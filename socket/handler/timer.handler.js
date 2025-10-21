// const roomModel = require("../../modal/Room.model");
// const { roomTimerStatus } = require("../../helper/typeconfig");
// // --- In-Memory Timer Storage ---
// /**
//  * Structure:
//  * roomTimers = {
//  *   [roomId]: {
//  *     endTime: number,
//  *     durationSeconds: number,
//  *     status: 'running'|'finished'|'paused',
//  *     timeout: NodeJS.Timeout,
//  *     lastSnapshotSecond: number
//  *   }
//  * }
//  */
// const roomTimers = {};

// // --- Utility Function ---
// function calculateRemainingTime(ms) {
//   const totalMs = Math.max(0, ms);
//   const totalSeconds = Math.floor(totalMs / 1000);
//   const seconds = totalSeconds % 60;
//   const minutes = Math.floor(totalSeconds / 60) % 60;
//   const hours = Math.floor(totalSeconds / 3600);
//   return { hours, minutes, seconds, totalMs };
// }

// // --- Start Timer for a Room ---
// async function startRoomTimer(io, roomId, durationSeconds) {
//   if (!roomTimers[roomId]) {
//     roomTimers[roomId] = {
//       timeout: null,
//       endTime: Date.now() + durationSeconds * 1000,
//       durationSeconds,
//       status: roomTimerStatus.RUNNING,
//       lastSnapshotSecond: null,
//     };
//   }

//   const roomState = roomTimers[roomId];
//   roomState.endTime = Date.now() + durationSeconds * 1000;
//   roomState.durationSeconds = durationSeconds;
//   roomState.status = roomTimerStatus.RUNNING;

//   // Clear existing timeout
//   if (roomState.timeout) clearTimeout(roomState.timeout);

//   // Recursive tick function
//   const tick = async () => {
//     const remainingMs = roomState.endTime - Date.now();
//     const totalSeconds = Math.floor(remainingMs / 1000);

//     if (remainingMs <= 0) {
//       roomState.status = roomTimerStatus.FINISHED;
//       io.to(roomId).emit("timer:update", {
//         roomId,
//         remainingMs: 0,
//         formatted: calculateRemainingTime(0),
//         status: roomTimerStatus.FINISHED,
//       });

//       await roomModel.updateOne({ roomId }, { status: roomTimerStatus.FINISHED, remainingTime: 0 });

//       // Cleanup
//       clearTimeout(roomState.timeout);
//       delete roomTimers[roomId];
//       return;
//     }

//     // Emit remaining time
//     io.to(roomId).emit("timer:update", {
//       roomId,
//       remainingMs,
//       formatted: calculateRemainingTime(remainingMs),
//       status: roomState.status,
//     });

//     // Snapshot to DB every 30 seconds safely
//     if (totalSeconds % 30 === 0 && totalSeconds !== roomState.lastSnapshotSecond) {
//       roomState.lastSnapshotSecond = totalSeconds;
//       await roomModel.updateOne({ roomId }, { remainingTime: totalSeconds });
//     }

//     // Schedule next tick
//     roomState.timeout = setTimeout(tick, 1000);
//   };

//   tick();
// }

// // --- Socket.IO Timer Handler ---
// async function timerHandler(io, socket) {
//   console.log(`[Timer Handler] Initialized for socket: ${socket.id}`);

//   // --- Client joins a room ---
//   socket.on("timer:join", async ({ roomId }) => {
//     socket.join(roomId);

//     const room = await roomModel.findOne({ roomId });
//     if (!room) return;

//     const elapsed = Math.floor((Date.now() - room.startedAt.getTime()) / 1000);
//     const remaining = Math.max(room.duration - elapsed, 0);

//     if (!roomTimers[roomId] && room.status === roomTimerStatus.RUNNING && remaining > 0) {
//       startRoomTimer(io, roomId, remaining);
//     }

//     socket.emit("timer:update", {
//       roomId,
//       remainingMs: remaining * 1000,
//       formatted: calculateRemainingTime(remaining * 1000),
//       status: room.status,
//     });
//   });

//   // --- Start a new timer for a room ---
//   socket.on("timer:start", async ({ roomId, duration }) => {
//     socket.join(roomId);

//     const durationSeconds = parseInt(duration, 10);
//     if (isNaN(durationSeconds) || durationSeconds <= 0) {
//       socket.emit("error", "Invalid duration");
//       return;
//     }

//     let room = await roomModel.findOne({ roomId });
//     if (!room) {
//       room = await roomModel.create({
//         roomId,
//         duration: durationSeconds,
//         startedAt: new Date(),
//         remainingTime: durationSeconds,
//         status: roomTimerStatus.RUNNING,
//       });
//       await room.save();
//     } else {
//       // Update existing room if restarting
//       await roomModel.updateOne(
//         { roomId },
//         {
//           duration: durationSeconds,
//           startedAt: new Date(),
//           remainingTime: durationSeconds,
//           status: roomTimerStatus.RUNNING,
//         }
//       );
//     }

//     startRoomTimer(io, roomId, durationSeconds);
//   });
// }

// // --- Recovery on Server Start ---
// async function recoverRunningTimers(io) {
//   const runningRooms = await roomModel.find({ status: roomTimerStatus.RUNNING });
//   for (const room of runningRooms) {
//     const elapsed = Math.floor((Date.now() - room.startedAt.getTime()) / 1000);
//     const remaining = Math.max(room.duration - elapsed, 0);
//     if (remaining > 0) startRoomTimer(io, room.roomId, remaining);
//     else await roomModel.updateOne({ roomId: room.roomId }, { status: "finished", remainingTime: 0 });
//   }
// }

// module.exports = timerHandler;
// module.exports.recoverRunningTimers = recoverRunningTimers;
// module.exports.startRoomTimer = startRoomTimer;

// ---------------------------------------------      V1  -----------------------------------------------------------
const roomModel = require("../../modal/Room.model");
const { roomTimerStatus } = require("../../helper/typeconfig");

// --- In-Memory Timer Storage ---
// Structure:
// roomTimers = {
//   [roomId]: {
//     endTime: number,
//     durationSeconds: number,
//     status: 'running'|'finished'|'paused',
//     timeout: NodeJS.Timeout,
//     lastSnapshotSecond: number
//   }
// }
const roomTimers = {};

// --- Utility Function ---
function calculateRemainingTime(ms) {
  const totalMs = Math.max(0, ms);
  const totalSeconds = Math.floor(totalMs / 1000);
  const seconds = totalSeconds % 60;
  const minutes = Math.floor(totalSeconds / 60) % 60;
  const hours = Math.floor(totalSeconds / 3600);
  return { hours, minutes, seconds, totalMs };
}

// --- Start Timer for a Room ---
function startRoomTimer(io, roomId, durationSeconds) {
  if (!roomTimers[roomId]) {
    roomTimers[roomId] = {
      timeout: null,
      endTime: Date.now() + durationSeconds * 1000,
      durationSeconds,
      status: roomTimerStatus.RUNNING,
      lastSnapshotSecond: null,
    };
  }

  const roomState = roomTimers[roomId];
  roomState.endTime = Date.now() + durationSeconds * 1000;
  roomState.durationSeconds = durationSeconds;
  roomState.status = roomTimerStatus.RUNNING;

  // Clear any existing timeout
  if (roomState.timeout) clearTimeout(roomState.timeout);

  const tick = () => {
    const now = Date.now();
    const remainingMs = roomState.endTime - now;

    if (remainingMs <= 0) {
      roomState.status = roomTimerStatus.FINISHED;
      io.to(roomId).emit("timer:update", {
        roomId,
        remainingMs: 0,
        formatted: calculateRemainingTime(0),
        status: roomTimerStatus.FINISHED,
      });

      // Non-blocking DB update
      roomModel.updateOne({ roomId }, { status: roomTimerStatus.FINISHED, remainingTime: 0 }).catch(console.error);

      clearTimeout(roomState.timeout);
      delete roomTimers[roomId];
      return;
    }

    // Emit remaining time
    io.to(roomId).emit("timer:update", {
      roomId,
      remainingMs,
      formatted: calculateRemainingTime(remainingMs),
      status: roomState.status,
    });

    // Snapshot DB every 30 seconds (non-blocking)
    const totalSeconds = Math.floor(remainingMs / 1000);
    if (totalSeconds % 30 === 0 && totalSeconds !== roomState.lastSnapshotSecond) {
      roomState.lastSnapshotSecond = totalSeconds;
      roomModel.updateOne({ roomId }, { remainingTime: totalSeconds }).catch(console.error);
    }

    // Drift correction: ensures consistent 1-second interval
    const drift = Date.now() - now;
    const nextTick = Math.max(0, 1000 - drift);
    roomState.timeout = setTimeout(tick, nextTick);
  };

  tick();
}

// --- Socket.IO Timer Handler ---
async function timerHandler(io, socket) {
  console.log(`[Timer Handler] Initialized for socket: ${socket.id}`);

  // --- Client joins a room ---
  socket.on("timer:join", async ({ roomId }) => {
    socket.join(roomId);

    const room = await roomModel.findOne({ roomId });
    if (!room) return;

    const elapsed = Math.floor((Date.now() - room.startedAt.getTime()) / 1000);
    const remaining = Math.max(room.duration - elapsed, 0);

    if (!roomTimers[roomId] && room.status === roomTimerStatus.RUNNING && remaining > 0) {
      startRoomTimer(io, roomId, remaining);
    }

    socket.emit("timer:update", {
      roomId,
      remainingMs: remaining * 1000,
      formatted: calculateRemainingTime(remaining * 1000),
      status: room.status,
    });
  });

  // --- Start a new timer for a room ---
  socket.on("timer:start", async ({ roomId, duration }) => {
    socket.join(roomId);

    const durationSeconds = parseInt(duration, 10);
    if (isNaN(durationSeconds) || durationSeconds <= 0) {
      socket.emit("error", "Invalid duration");
      return;
    }

    let room = await roomModel.findOne({ roomId });
    if (!room) {
      room = await roomModel.create({
        roomId,
        duration: durationSeconds,
        startedAt: new Date(),
        remainingTime: durationSeconds,
        status: roomTimerStatus.RUNNING,
      });
    } else {
      await roomModel.updateOne(
        { roomId },
        {
          duration: durationSeconds,
          startedAt: new Date(),
          remainingTime: durationSeconds,
          status: roomTimerStatus.RUNNING,
        }
      );
    }

    startRoomTimer(io, roomId, durationSeconds);
  });
}

// --- Recovery on Server Start ---
async function recoverRunningTimers(io) {
  const runningRooms = await roomModel.find({ status: roomTimerStatus.RUNNING });
  for (const room of runningRooms) {
    const elapsed = Math.floor((Date.now() - room.startedAt.getTime()) / 1000);
    const remaining = Math.max(room.duration - elapsed, 0);
    if (remaining > 0) startRoomTimer(io, room.roomId, remaining);
    else await roomModel.updateOne({ roomId: room.roomId }, { status: roomTimerStatus.FINISHED, remainingTime: 0 });
  }
}

module.exports = timerHandler;
module.exports.recoverRunningTimers = recoverRunningTimers;
module.exports.startRoomTimer = startRoomTimer;
