import { Prisma } from '@prisma/client';
import { tenantLocalStorage } from './tenant.middleware';

// All database models that contain an organizationId field
const tenantScopedModels = [
  'user',
  'department',
  'intern',
  'mentor',
  'task',
  'feedback',
  'announcement',
  'attendance',
  'leave',
  'leaveRequest',
  'holiday',
  'attendanceSettings',
  'conversation',
  'message',
  'notification',
  'jobPosting',
  'candidate',
  'interview',
  'chatrooms', // Maps to ChatRoom model
  'chatroom',
  'project',
  'auditLog',
  'parsedresume', // ParsedResume model
  'parsedResumes',
  'placement',
  'actionItem',
  'emailLog',
  'internDocument',
  'aiRecommendation',
  'pushSubscription',
  'pushsubscriptions',
  'internpoints',
  'xptransaction',
  'internbadge',
  'dailystandup',
  'dailyStandup',
  'standupsettings',
  'standupSettings',
  'goal',
  'goals',
  'mockinterview',
  'mockInterview',
  'mockinterviewquestion',
  'mockInterviewQuestion',
  'videocall',
  'videoCall',
  'submissionvector',
  'submissionVector',
  'skillgapanalysis',
  'skillGapAnalysis',
  'internshipbatch',
  'internshipBatch',
  'savedreport',
  'savedReport',
  'mentoreffectivenesshistory',
  'mentorEffectivenessHistory',
  'dataexportrequest',
  'dataExportRequest',
  'erasurerequest',
  'erasureRequest',
];

export const tenantExtension = Prisma.defineExtension((client) => {
  return client.$extends({
    name: 'tenantFilter',
    query: {
      $allModels: {
        async findUnique({ model, args, query }) {
          const orgId = tenantLocalStorage.getStore();
          const modelName = model.toLowerCase();
          
          if (!orgId || !tenantScopedModels.includes(modelName)) {
            return query(args);
          }

          // Convert findUnique to findFirst to allow filtering by organizationId
          const context = Prisma.getExtensionContext(this);
          const anyArgs = args as any;
          return (context as any).findFirst({
            ...args,
            where: {
              ...anyArgs.where,
              organizationId: orgId,
            },
          });
        },

        async findFirst({ model, args, query }) {
          const orgId = tenantLocalStorage.getStore();
          const modelName = model.toLowerCase();

          if (orgId && tenantScopedModels.includes(modelName)) {
            const anyArgs = args as any;
            anyArgs.where = {
              ...anyArgs.where,
              organizationId: orgId,
            };
          }
          return query(args);
        },

        async findMany({ model, args, query }) {
          const orgId = tenantLocalStorage.getStore();
          const modelName = model.toLowerCase();

          if (orgId && tenantScopedModels.includes(modelName)) {
            const anyArgs = args as any;
            anyArgs.where = {
              ...anyArgs.where,
              organizationId: orgId,
            };
          }
          return query(args);
        },

        async count({ model, args, query }) {
          const orgId = tenantLocalStorage.getStore();
          const modelName = model.toLowerCase();

          if (orgId && tenantScopedModels.includes(modelName)) {
            const anyArgs = args as any;
            anyArgs.where = {
              ...anyArgs.where,
              organizationId: orgId,
            };
          }
          return query(args);
        },

        async aggregate({ model, args, query }) {
          const orgId = tenantLocalStorage.getStore();
          const modelName = model.toLowerCase();

          if (orgId && tenantScopedModels.includes(modelName)) {
            const anyArgs = args as any;
            anyArgs.where = {
              ...anyArgs.where,
              organizationId: orgId,
            };
          }
          return query(args);
        },

        async groupBy({ model, args, query }) {
          const orgId = tenantLocalStorage.getStore();
          const modelName = model.toLowerCase();

          if (orgId && tenantScopedModels.includes(modelName)) {
            const anyArgs = args as any;
            anyArgs.where = {
              ...anyArgs.where,
              organizationId: orgId,
            };
          }
          return query(args);
        },

        async create({ model, args, query }) {
          const orgId = tenantLocalStorage.getStore();
          const modelName = model.toLowerCase();

          if (orgId && tenantScopedModels.includes(modelName)) {
            const anyArgs = args as any;
            anyArgs.data = {
              ...anyArgs.data,
              organizationId: orgId,
            };
          }
          return query(args);
        },

        async createMany({ model, args, query }) {
          const orgId = tenantLocalStorage.getStore();
          const modelName = model.toLowerCase();

          if (orgId && tenantScopedModels.includes(modelName)) {
            const anyArgs = args as any;
            if (Array.isArray(anyArgs.data)) {
              anyArgs.data = anyArgs.data.map((item: any) => ({
                ...item,
                organizationId: orgId,
              }));
            } else if (anyArgs.data) {
              anyArgs.data.organizationId = orgId;
            }
          }
          return query(args);
        },

        async update({ model, args, query }) {
          const orgId = tenantLocalStorage.getStore();
          const modelName = model.toLowerCase();

          if (orgId && tenantScopedModels.includes(modelName)) {
            const anyArgs = args as any;
            anyArgs.where = {
              ...anyArgs.where,
              organizationId: orgId,
            };
          }
          return query(args);
        },

        async updateMany({ model, args, query }) {
          const orgId = tenantLocalStorage.getStore();
          const modelName = model.toLowerCase();

          if (orgId && tenantScopedModels.includes(modelName)) {
            const anyArgs = args as any;
            anyArgs.where = {
              ...anyArgs.where,
              organizationId: orgId,
            };
          }
          return query(args);
        },

        async delete({ model, args, query }) {
          const orgId = tenantLocalStorage.getStore();
          const modelName = model.toLowerCase();

          if (orgId && tenantScopedModels.includes(modelName)) {
            const anyArgs = args as any;
            anyArgs.where = {
              ...anyArgs.where,
              organizationId: orgId,
            };
          }
          return query(args);
        },

        async deleteMany({ model, args, query }) {
          const orgId = tenantLocalStorage.getStore();
          const modelName = model.toLowerCase();

          if (orgId && tenantScopedModels.includes(modelName)) {
            const anyArgs = args as any;
            anyArgs.where = {
              ...anyArgs.where,
              organizationId: orgId,
            };
          }
          return query(args);
        },

        async upsert({ model, args, query }) {
          const orgId = tenantLocalStorage.getStore();
          const modelName = model.toLowerCase();

          if (orgId && tenantScopedModels.includes(modelName)) {
            const anyArgs = args as any;
            anyArgs.where = {
              ...anyArgs.where,
              organizationId: orgId,
            };
            anyArgs.create = {
              ...anyArgs.create,
              organizationId: orgId,
            };
            anyArgs.update = {
              ...anyArgs.update,
              organizationId: orgId,
            };
          }
          return query(args);
        },
      },
    },
  });
});
