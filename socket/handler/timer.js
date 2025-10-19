// --- Global Timer State (Shared within this module) ---
/**
 * @type {{
 * endTime: number,     // Unix timestamp (ms) when the timer should stop
 * durationSeconds: number, // The total length of the timer in seconds
 * status: string       // 'idle', 'running', or 'finished'
 * }}
 */
let timerState = {
  endTime: 0,
  durationSeconds: 0,
  status: "idle",
};

// --- Server-Side Timer Interval ---
let timerInterval = null;

// --- Utility Function ---
function calculateRemainingTime(ms) {
  let totalMs = Math.max(0, ms);
  const totalSeconds = Math.floor(totalMs / 1000);

  const seconds = totalSeconds % 60;
  const minutes = Math.floor(totalSeconds / 60) % 60;
  const hours = Math.floor(totalSeconds / 3600);

  return { hours, minutes, seconds, totalMs };
}

/**
 * Runs every second to check the timer state and broadcast the remaining time
 * to all clients connected via the Socket.IO instance (io).
 * @param {object} io - The main Socket.IO server instance.
 */
function broadcastTime(io) {
  const timeRemainingMs = timerState.endTime - Date.now();
  const formattedTime = calculateRemainingTime(timeRemainingMs);

  // Update status based on remaining time
  if (timeRemainingMs <= 0 && timerState.status === "running") {
    timerState.status = "finished";
    // Stop the server interval if the timer finishes
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
      console.log("[Timer Finished] Broadcast interval stopped.");
    }
  } else if (timerState.endTime === 0) {
    timerState.status = "idle";
  }

  // Send the updated time state to all connected clients
  io.sockets.emit("timer:update", {
    timeRemainingMs: formattedTime.totalMs,
    formattedTime: {
      hours: formattedTime.hours,
      minutes: formattedTime.minutes,
      seconds: formattedTime.seconds,
    },
    status: timerState.status,
    endTime: timerState.endTime,
  });
}

/**
 * Starts a new timer, updates state, and ensures the broadcast interval is running.
 * @param {object} io - The main Socket.IO server instance.
 * @param {number} durationSeconds - The duration to set.
 */
function startNewTimer(io, durationSeconds) {
  const newEndTime = Date.now() + durationSeconds * 1000;

  timerState.endTime = newEndTime;
  timerState.durationSeconds = durationSeconds;
  timerState.status = "running";

  console.log(`[Timer Started] Duration: ${durationSeconds}s. End Time: ${new Date(newEndTime).toLocaleTimeString()}`);

  // Ensure the broadcasting interval is running
  if (!timerInterval) {
    // Run immediately, then every 1000ms
    broadcastTime(io);
    // Pass io to broadcastTime so it can emit updates
    timerInterval = setInterval(() => broadcastTime(io), 1000);
  } else {
    // Broadcast immediately to update clients with the new time
    broadcastTime(io);
  }
}

/**
 * Socket handler for timer events.
 * This function is called on every new client connection.
 * @param {object} io - The main Socket.IO server instance.
 * @param {object} socket - The specific client socket instance.
 */
module.exports = function timerHandler(io, socket) {
  console.log(`[Timer Handler] Initializing for socket: ${socket.id}`);

  // 1. Send the current timer state to the newly connected client immediately
  const timeRemainingMs = timerState.endTime - Date.now();
  const formattedTime = calculateRemainingTime(timeRemainingMs);

  socket.emit("timer:update", {
    timeRemainingMs: formattedTime.totalMs,
    formattedTime: formattedTime,
    // Calculate status correctly for the new client (might be finished)
    status: timeRemainingMs > 0 ? "running" : timerState.status,
    endTime: timerState.endTime,
  });

  // 2. Handle client request to start a new timer
  socket.on("timer:start", (data) => {
    console.log(data);
    const durationSeconds = parseInt(data.duration, 10);

    if (isNaN(durationSeconds) || durationSeconds <= 0) {
      socket.emit("error", "Invalid duration provided. Must be a positive integer in seconds.");
      return;
    }

    // Start the timer and broadcast the new state to ALL clients
    startNewTimer(io, durationSeconds);
  });

  // You can add chat or other events here if needed, but they are currently commented out
  // socket.on("chat:message", (data) => { ... });
};
