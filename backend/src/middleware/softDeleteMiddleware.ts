import { Prisma } from '@prisma/client';

const filterDeleted = (args: any) => {
  if (!args) args = {};
  if (!args.where) args.where = {};
  if (args.where.deletedAt === undefined) {
    args.where.deletedAt = null;
  }
  return args;
};

export const softDeleteExtension = Prisma.defineExtension({
  name: 'softDelete',
  query: {
    user: {
      async findMany({ args, query }) {
        return query(filterDeleted(args));
      },
      async findFirst({ args, query }) {
        return query(filterDeleted(args));
      },
    },
    intern: {
      async findMany({ args, query }) {
        return query(filterDeleted(args));
      },
      async findFirst({ args, query }) {
        return query(filterDeleted(args));
      },
    },
    department: {
      async findMany({ args, query }) {
        return query(filterDeleted(args));
      },
      async findFirst({ args, query }) {
        return query(filterDeleted(args));
      },
    },
    task: {
      async findMany({ args, query }) {
        return query(filterDeleted(args));
      },
      async findFirst({ args, query }) {
        return query(filterDeleted(args));
      },
    },
  },
});

export default softDeleteExtension;
