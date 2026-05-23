import { User, UserRole } from '@prisma/client';

/**
 * User without sensitive data
 */
export type SafeUser = Omit<User, 'password' | 'refreshToken' | 'resetPasswordToken' | 'resetPasswordTokenExpiry'>;

/**
 * Auth Response
 */
export interface AuthResponse {
  user: SafeUser;
  accessToken: string;
  refreshToken: string;
}

/**
 * Pagination Query
 */
export interface PaginationQuery {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/**
 * Paginated Response
 */
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

/**
 * Filter Options
 */
export interface FilterOptions {
  search?: string;
  status?: string;
  department?: string;
  role?: UserRole;
  startDate?: Date;
  endDate?: Date;
}

export { UserRole };
