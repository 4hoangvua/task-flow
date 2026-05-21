/// <reference path="./types/express.d.ts" />
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables before importing other modules
dotenv.config({ path: path.join(__dirname, '../.env') });
dotenv.config({ path: path.join(__dirname, '../.env.development'), override: true });

import { logger } from './utils/logger';
import router from './routes';
import { errorHandler } from './middlewares/errorHandler';
import { setupSocketIO } from './sockets/socketHandler';

const app = express();
const httpServer = createServer(app);

// CORS configuration
const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
const allowedOrigins = [clientUrl];

const corsOrigin = (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
  if (!origin) {
    callback(null, true);
    return;
  }
  if (
    allowedOrigins.includes(origin) ||
    /^http:\/\/localhost:\d+$/.test(origin) ||
    /^http:\/\/127\.0\.0\.1:\d+$/.test(origin)
  ) {
    callback(null, true);
  } else {
    callback(new Error('Not allowed by CORS'));
  }
};

app.use(
  cors({
    origin: corsOrigin,
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Socket.io Server Setup
const io = new Server(httpServer, {
  cors: {
    origin: corsOrigin,
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Store io instance on app for use in controllers
app.set('io', io);

// Initialize socket handler
setupSocketIO(io);

// Mount main routing
app.use('/api', router);

// Error Handler Middleware (must be after routes)
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
  logger.info(`Server is running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});

export { app, httpServer, io };
