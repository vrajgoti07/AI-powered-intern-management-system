import './config/env';
import http from 'http';
import createApp from './app';
import { config } from './config/env';
import { connectDatabase, disconnectDatabase } from './config/database';
import { logger } from './utils/logger';
import { initSocket } from './socket/socket';
import { initSimpleSocket } from './socket/index';
import './queues/notification.worker';
import './queues/workers/email.worker';
import { startScheduledJobs } from './jobs/scheduledJobs';
import { emailService } from './services/email.service';

/**
 * Start Server
 */
const startServer = async () => {
  try {
    // Connect to database
    await connectDatabase();

    // Create Express app
    const app = createApp();

    // Wrap app in HTTP server to support WebSockets
    const server = http.createServer(app);

    // Initialize Socket.IO server
    initSocket(server);

    // Initialize simple Socket.IO server
    initSimpleSocket(server);

    // Start scheduled background jobs
    startScheduledJobs();

    // Verify Email SMTP Connection
    emailService.verifyConnection();

    // Start listening
    server.listen(config.server.port, () => {
      const url = `http://localhost:${config.server.port}`;
      const health = `${url}/api/${config.server.apiVersion}/health`;
      
      logger.info(`
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║   🚀 AI-Powered Intern Management System API                  ║
║                                                               ║
║   Environment: ${config.server.env.padEnd(47)}║
║   Port:        ${config.server.port.toString().padEnd(47)}║
║   API Version: ${config.server.apiVersion.padEnd(47)}║
║   URL:         ${url.padEnd(47)}║
║                                                               ║
║   Health:      ${health.padEnd(47)}║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
      `);
    });

    // Graceful shutdown
    const gracefulShutdown = async (signal: string) => {
      logger.info(`\n${signal} received. Starting graceful shutdown...`);

      if (config.server.isDevelopment) {
        logger.info('Development mode: forcing immediate shutdown to free port');
        await disconnectDatabase().catch(() => {});
        process.exit(0);
      }

      server.close(async () => {
        logger.info('HTTP server closed');

        await disconnectDatabase();

        logger.info('Graceful shutdown completed');
        process.exit(0);
      });

      // Force shutdown after 10 seconds
      setTimeout(() => {
        logger.error('Forced shutdown after timeout');
        process.exit(1);
      }, 10000);
    };

    // Handle shutdown signals
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    // Handle uncaught errors
    process.on('uncaughtException', (error) => {
      logger.error('Uncaught Exception:', error);
      gracefulShutdown('UNCAUGHT_EXCEPTION');
    });

    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
      gracefulShutdown('UNHANDLED_REJECTION');
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Start the server
startServer(); // Auto-trigger server restart
