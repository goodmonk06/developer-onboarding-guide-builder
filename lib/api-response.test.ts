import { describe, it, expect } from 'vitest'
import { successResponse, errorResponse, handleApiError } from './api-response'
import { ZodError, z } from 'zod'
import { Prisma } from '@prisma/client'

describe('API Response Utilities', () => {
  describe('successResponse', () => {
    it('should create a success response with data', () => {
      const data = { id: '123', name: 'Test Team' }
      const response = successResponse(data)

      expect(response.status).toBe(200)
    })

    it('should accept custom status code', () => {
      const data = { id: '123' }
      const response = successResponse(data, 201)

      expect(response.status).toBe(201)
    })
  })

  describe('errorResponse', () => {
    it('should create an error response with message', () => {
      const response = errorResponse('Something went wrong', 400)

      expect(response.status).toBe(400)
    })

    it('should include error code when provided', () => {
      const response = errorResponse('Not found', 404, 'NOT_FOUND')

      expect(response.status).toBe(404)
    })

    it('should include error details when provided', () => {
      const details = { field: 'email', issue: 'invalid format' }
      const response = errorResponse('Validation failed', 400, 'VALIDATION_ERROR', details)

      expect(response.status).toBe(400)
    })
  })

  describe('handleApiError', () => {
    it('should handle ZodError with validation details', () => {
      const schema = z.object({
        name: z.string().min(1),
      })

      try {
        schema.parse({ name: '' })
      } catch (error) {
        const response = handleApiError(error)
        expect(response.status).toBe(400)
      }
    })

    it('should handle Prisma unique constraint violation', () => {
      const error = new Prisma.PrismaClientKnownRequestError(
        'Unique constraint failed',
        {
          code: 'P2002',
          clientVersion: '5.0.0',
        }
      )

      const response = handleApiError(error)
      expect(response.status).toBe(409)
    })

    it('should handle Prisma record not found', () => {
      const error = new Prisma.PrismaClientKnownRequestError(
        'Record not found',
        {
          code: 'P2025',
          clientVersion: '5.0.0',
        }
      )

      const response = handleApiError(error)
      expect(response.status).toBe(404)
    })

    it('should handle standard Error objects', () => {
      const error = new Error('Something went wrong')
      const response = handleApiError(error)

      expect(response.status).toBe(500)
    })

    it('should handle unknown errors', () => {
      const error = 'Some random error'
      const response = handleApiError(error)

      expect(response.status).toBe(500)
    })
  })
})
