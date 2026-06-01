// Socket.IO instance manager
// This allows controllers to emit events without passing io around

let io = null;

const setIO = (ioInstance) => {
  io = ioInstance;
};

const getIO = () => {
  if (!io) {
    console.warn('⚠️ Socket.IO not initialized yet');
  }
  return io;
};

// Emit to admin room
const emitToAdmin = (event, data) => {
  if (io) {
    io.to('admin').emit(event, data);
    console.log(`📡 Emitted "${event}" to admin room`);
  }
};

module.exports = { setIO, getIO, emitToAdmin };
