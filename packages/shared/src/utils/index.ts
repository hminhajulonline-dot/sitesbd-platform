import type { ApiResponse } from '../types';

export function formatDate(date: Date): string {
  return date.toISOString();
}

export function formatError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return 'An unexpected error occurred';
}

export function createSuccessResponse<T>(data: T): ApiResponse<T> {
  return { data };
}

export function createErrorResponse(error: string): ApiResponse {
  return { error };
}
