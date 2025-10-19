module.exports = function privateMessageHandler(io, socket) {
  socket.on("submitExam", ({ to, message }) => {
    const msg = {
      from: socket.id,
      to,
      text: message,
      timestamp: Date.now(),
    };

    console.log("Exam Message: handler", message);
    // console.log("Exam Message:", msg);
    // io.to(to).emit("submitExam", msg); // Send directly to target socket ID
  });
};
