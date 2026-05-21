import { Server, Socket } from 'socket.io';
import { verifyAccessToken } from '../utils/jwt';
import { logger } from '../utils/logger';

export function setupSocketIO(io: Server) {
  // Authentication Middleware
  io.use((socket: Socket, next) => {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(' ')[1];
      
      if (!token) {
        return next(new Error('Authentication error: Token is required'));
      }

      const decoded = verifyAccessToken(token);
      socket.data.user = decoded;
      next();
    } catch (error) {
      logger.error('Socket authentication failed:', error);
      next(new Error('Authentication error: Invalid or expired token'));
    }
  });

  io.on('connection', (socket: Socket) => {
    const user = socket.data.user;
    logger.info(`Socket client connected: ${socket.id} (User: ${user.name}, ID: ${user.id})`);

    // Join personal notification room
    socket.join(`user:${user.id}`);

    // Join project room for collaborative tasks updates
    socket.on('join-project', ({ projectId }) => {
      if (projectId) {
        socket.join(projectId);
        logger.info(`Socket ${socket.id} joined project room: ${projectId}`);
      }
    });

    // Leave project room
    socket.on('leave-project', ({ projectId }) => {
      if (projectId) {
        socket.leave(projectId);
        logger.info(`Socket ${socket.id} left project room: ${projectId}`);
      }
    });

    socket.on('disconnect', () => {
      logger.info(`Socket client disconnected: ${socket.id}`);
    });
  });
}
