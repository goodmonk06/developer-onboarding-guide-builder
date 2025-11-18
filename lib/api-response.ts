import { NextResponse } from 'next/server'
import { ZodError } from 'zod'
import { Prisma } from '@prisma/client'

export interface ApiSuccessResponse<T = unknown> {
  success: true
  data: T
}

export interface ApiErrorResponse {
  success: false
  error: {
    message: string
    code?: string
    details?: unknown
  }
}

export type ApiResponse<T = unknown> = ApiSuccessResponse<T> | ApiErrorResponse

/**
 * Create a successful API response
 */
export function successResponse<T>(data: T, status: number = 200) {
  return NextResponse.json<ApiSuccessResponse<T>>(
    {
      success: true,
      data,
    },
    { status }
  )
}

/**
 * Create an error API response
 */
export function errorResponse(
  message: string,
  status: number = 500,
  code?: string,
  details?: unknown
) {
  return NextResponse.json<ApiErrorResponse>(
    {
      success: false,
      error: {
        message,
        code,
        details,
      },
    },
    { status }
  )
}

/**
 * Handle errors and return appropriate API response
 */
export function handleApiError(error: unknown) {
  console.error('API Error:', error)

  // Zod validation errors
  if (error instanceof ZodError) {
    return errorResponse(
      'Validation failed',
      400,
      'VALIDATION_ERROR',
      error.errors
    )
  }

  // Prisma errors
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    switch (error.code) {
      case 'P2002':
        return errorResponse(
          'A record with this unique field already exists',
          409,
          'UNIQUE_CONSTRAINT_VIOLATION'
        )
      case 'P2025':
        return errorResponse(
          'Record not found',
          404,
          'NOT_FOUND'
        )
      case 'P2003':
        return errorResponse(
          'Foreign key constraint failed',
          400,
          'FOREIGN_KEY_VIOLATION'
        )
      default:
        return errorResponse(
          'Database error occurred',
          500,
          'DATABASE_ERROR',
          { code: error.code }
        )
    }
  }

  // Standard Error objects
  if (error instanceof Error) {
    return errorResponse(error.message, 500, 'INTERNAL_ERROR')
  }

  // Unknown errors
  return errorResponse(
    'An unexpected error occurred',
    500,
    'UNKNOWN_ERROR'
  )
}

/**
 * Wrapper for API route handlers with automatic error handling
 */
export function withErrorHandler<T>(
  handler: () => Promise<NextResponse<T>>
): Promise<NextResponse> {
  return handler().catch(handleApiError)
}
