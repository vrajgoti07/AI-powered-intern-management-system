interface PaginateOptions {
  page?: number | string;
  limit?: number | string;
  where?: any;
  orderBy?: any;
  include?: any;
  select?: any;
  prismaModel: {
    count: (args: { where?: any }) => Promise<number>;
    findMany: (args: {
      where?: any;
      orderBy?: any;
      include?: any;
      select?: any;
      skip?: number;
      take?: number;
    }) => Promise<any[]>;
  };
}

export interface PaginatedResult<T = any> {
  data: T[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
}

/**
 * Reusable helper function that performs database-level offset pagination.
 * Accepts { page, limit, where, orderBy, include, select, prismaModel } and
 * returns { data, totalCount, totalPages, currentPage }.
 */
export const paginate = async <T = any>({
  page = 1,
  limit = 20,
  where = {},
  orderBy,
  include,
  select,
  prismaModel
}: PaginateOptions): Promise<PaginatedResult<T>> => {
  const pageNum = Math.max(1, typeof page === 'string' ? parseInt(page, 10) : page || 1);
  const limitNum = Math.max(1, typeof limit === 'string' ? parseInt(limit, 10) : limit || 20);
  const skip = (pageNum - 1) * limitNum;

  // Build model query options dynamically
  const findOptions: any = {
    where,
    skip,
    take: limitNum
  };

  if (orderBy) findOptions.orderBy = orderBy;
  if (include) findOptions.include = include;
  if (select) findOptions.select = select;

  const [totalCount, data] = await Promise.all([
    prismaModel.count({ where }),
    prismaModel.findMany(findOptions)
  ]);

  const totalPages = Math.ceil(totalCount / limitNum);

  return {
    data,
    totalCount,
    totalPages,
    currentPage: pageNum
  };
};

export default paginate;
