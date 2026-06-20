import { io } from 'socket.io-client';

let socket = null;

export const connectSocket = (token) => {
  if (socket) {
    if (socket.connected) return socket;
    socket.connect();
    return socket;
  }

  socket = io('http://localhost:5000', {
    auth: { token },
    autoConnect: true,
    reconnection: true
  });

  socket.on('connect', () => {
    console.log('Socket.io connected:', socket.id);
  });

  socket.on('disconnect', (reason) => {
    console.log('Socket.io disconnected:', reason);
  });

  return socket;
};

export const getSocket = () => socket;

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export const joinCase = (caseId) => {
  if (socket) {
    socket.emit('joinCase', caseId);
  }
};

export const leaveCase = (caseId) => {
  if (socket) {
    socket.emit('leaveCase', caseId);
  }
};

export const emitFieldEdit = (caseId, officerName, field, value) => {
  if (socket) {
    socket.emit('fieldEdit', { caseId, officerName, field, value });
  }
};

export const emitNotification = (caseId, message, type = 'info') => {
  if (socket) {
    socket.emit('notify', { caseId, message, type });
  }
};

export const subscribeToFieldEdited = (callback) => {
  if (!socket) return;
  socket.on('fieldEdited', callback);
  return () => {
    socket.off('fieldEdited', callback);
  };
};

export const subscribeToNotificationReceived = (callback) => {
  if (!socket) return;
  socket.on('notificationReceived', callback);
  return () => {
    socket.off('notificationReceived', callback);
  };
};
