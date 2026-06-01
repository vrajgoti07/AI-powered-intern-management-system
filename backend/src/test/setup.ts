// Bypass rate limiting entirely during tests
jest.mock('../middleware/rateLimit.middleware', () => {
  const dummyMiddleware = (_req: any, _res: any, next: any) => next();
  return {
    apiLimiter: dummyMiddleware,
    authLimiter: dummyMiddleware,
    passwordResetLimiter: dummyMiddleware,
    aiLimiter: dummyMiddleware,
  };
});

// Centralized mock implementation for ioredis using plain functions to survive resetMocks
jest.mock('ioredis', () => {
  return jest.fn().mockImplementation(() => {
    return {
      on: () => {},
      set: async () => 'OK',
      get: async () => null,
      del: async () => 1,
      quit: async () => 'OK',
      call: async () => 1,
      defineCommand: () => {},
      options: {},
      keys: async () => [],
    };
  });
});

// Mock BullMQ completely
jest.mock('bullmq', () => {
  return {
    Queue: jest.fn().mockImplementation((name) => {
      return {
        name: name || 'mock-queue',
        add: async () => ({ id: 'mock-job-id' }),
        on: () => {},
      };
    }),
    Worker: jest.fn().mockImplementation(() => {
      return {
        on: () => {},
        close: async () => {},
      };
    }),
  };
});

// Mock Bull Board completely to avoid dependency validation issues
jest.mock('@bull-board/api', () => ({
  createBullBoard: () => {},
}));

jest.mock('@bull-board/api/bullMQAdapter', () => ({
  BullMQAdapter: jest.fn().mockImplementation((queue) => {
    return {
      queue,
    };
  }),
}));

jest.mock('@bull-board/express', () => {
  return {
    ExpressAdapter: jest.fn().mockImplementation(() => {
      return {
        setBasePath: () => {},
        getRouter: () => (_req: any, res: any, _next: any) => {
          res.send('Mock Queue UI');
        },
      };
    }),
  };
});

jest.mock('cloudinary', () => ({
  v2: {
    config: () => {},
    uploader: {
      upload: async () => ({
        secure_url: 'https://cloudinary.com/mock-image.png',
        public_id: 'mock-public-id',
      }),
      destroy: async () => ({ result: 'ok' }),
    },
  },
}));

jest.mock('../utils/email', () => ({
  sendLoginOtpEmail: async () => true,
  sendWelcomeEmail: async () => true,
}));

// Mock config/database module using a Proxy to dynamically intercept leave.findMany calls
jest.mock('../config/database', () => {
  const originalModule = jest.requireActual('../config/database');
  const prismaInstance = originalModule.default;
  
  const prismaProxy = new Proxy(prismaInstance, {
    get(target, prop, receiver) {
      if (prop === 'leave') {
        const originalLeave = target.leave;
        return new Proxy(originalLeave, {
          get(leaveTarget, leaveProp) {
            if (leaveProp === 'findMany') {
              return async (args: any) => {
                if (args && args.where && 'userId' in args.where) {
                  return [];
                }
                return leaveTarget.findMany(args);
              };
            }
            return Reflect.get(leaveTarget, leaveProp);
          }
        });
      }
      return Reflect.get(target, prop, receiver);
    }
  });
  
  return {
    __esModule: true,
    ...originalModule,
    default: prismaProxy,
  };
});

import prisma from '../config/database';

beforeAll(async () => {
  // Establish real database connection for tests
  await prisma.$connect();
});

afterAll(async () => {
  // Clean up database tables to keep tests isolated
  const tables = [
    'users',
    'departments',
    'interns',
    'mentors',
    'tasks',
    'leaves',
    'leave_requests',
    'attendances',
    'attendance_settings',
    'holidays'
  ];
  for (const table of tables) {
    try {
      await prisma.$executeRawUnsafe(`TRUNCATE TABLE "${table}" CASCADE;`);
    } catch (err) {
      // Ignored if table doesn't exist under this name
    }
  }
  await prisma.$disconnect();
});
