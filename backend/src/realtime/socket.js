function initRealtime(io) {
  io.of('/realtime').on('connection', (socket) => {
    socket.on('join-device', (deviceId) => {
      socket.join(`device:${deviceId}`);
    });
  });
}

module.exports = { initRealtime };
