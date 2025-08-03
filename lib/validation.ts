import { z } from 'zod'

// Common validation schemas
export const emailSchema = z.string().email('Please enter a valid email address')
export const passwordSchema = z.string().min(8, 'Password must be at least 8 characters')
export const pointsSchema = z.number().positive('Points must be a positive number')
export const uuidSchema = z.string().uuid('Invalid ID format')

// Panelist profile validation
export const panelistProfileSchema = z.object({
  age: z.number().min(13, 'Must be at least 13 years old').max(120, 'Invalid age'),
  gender: z.enum(['male', 'female', 'other', 'prefer_not_to_say'], {
    errorMap: () => ({ message: 'Please select a valid gender option' })
  }),
  location: z.object({
    country: z.string().min(1, 'Country is required'),
    state: z.string().optional(),
    city: z.string().min(1, 'City is required'),
    postal_code: z.string().optional(),
  }),
  interests: z.array(z.string()).min(1, 'Please select at least one interest'),
  demographics: z.record(z.any()).optional(),
})

// Survey validation
export const surveySchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
  description: z.string().max(1000, 'Description too long').optional(),
  points_reward: z.number().positive('Points reward must be positive'),
  estimated_completion_time: z.number().positive('Completion time must be positive'),
  status: z.enum(['draft', 'active', 'paused', 'completed']),
  survey_url: z.string().url('Invalid survey URL').optional(),
  qualifications: z.record(z.boolean()).optional(),
})

// Redemption validation
export const redemptionSchema = z.object({
  offer_id: uuidSchema,
  points_spent: pointsSchema,
})

// Offer validation
export const offerSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
  description: z.string().max(1000, 'Description too long').optional(),
  merchant_name: z.string().min(1, 'Merchant name is required'),
  points_required: z.number().positive('Points required must be positive'),
  status: z.enum(['active', 'inactive', 'expired']),
  expiry_date: z.string().datetime().optional(),
})

// API request validation
export const apiRequestSchema = z.object({
  method: z.enum(['GET', 'POST', 'PUT', 'DELETE', 'PATCH']),
  url: z.string().url('Invalid URL'),
  headers: z.record(z.string()).optional(),
  body: z.any().optional(),
})

// Validation utilities
export class ValidationHelper {
  static validateEmail(email: string): { isValid: boolean; error?: string } {
    try {
      emailSchema.parse(email)
      return { isValid: true }
    } catch (error) {
      return { isValid: false, error: error instanceof z.ZodError ? error.errors[0].message : 'Invalid email' }
    }
  }

  static validatePassword(password: string): { isValid: boolean; error?: string } {
    try {
      passwordSchema.parse(password)
      return { isValid: true }
    } catch (error) {
      return { isValid: false, error: error instanceof z.ZodError ? error.errors[0].message : 'Invalid password' }
    }
  }

  static validatePoints(points: number): { isValid: boolean; error?: string } {
    try {
      pointsSchema.parse(points)
      return { isValid: true }
    } catch (error) {
      return { isValid: false, error: error instanceof z.ZodError ? error.errors[0].message : 'Invalid points amount' }
    }
  }

  static validatePanelistProfile(data: any): { isValid: boolean; errors?: Record<string, string> } {
    try {
      panelistProfileSchema.parse(data)
      return { isValid: true }
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors: Record<string, string> = {}
        error.errors.forEach(err => {
          const path = err.path.join('.')
          errors[path] = err.message
        })
        return { isValid: false, errors }
      }
      return { isValid: false, errors: { general: 'Invalid profile data' } }
    }
  }

  static validateSurvey(data: any): { isValid: boolean; errors?: Record<string, string> } {
    try {
      surveySchema.parse(data)
      return { isValid: true }
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors: Record<string, string> = {}
        error.errors.forEach(err => {
          const path = err.path.join('.')
          errors[path] = err.message
        })
        return { isValid: false, errors }
      }
      return { isValid: false, errors: { general: 'Invalid survey data' } }
    }
  }

  static validateRedemption(data: any): { isValid: boolean; errors?: Record<string, string> } {
    try {
      redemptionSchema.parse(data)
      return { isValid: true }
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors: Record<string, string> = {}
        error.errors.forEach(err => {
          const path = err.path.join('.')
          errors[path] = err.message
        })
        return { isValid: false, errors }
      }
      return { isValid: false, errors: { general: 'Invalid redemption data' } }
    }
  }

  static validateOffer(data: any): { isValid: boolean; errors?: Record<string, string> } {
    try {
      offerSchema.parse(data)
      return { isValid: true }
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors: Record<string, string> = {}
        error.errors.forEach(err => {
          const path = err.path.join('.')
          errors[path] = err.message
        })
        return { isValid: false, errors }
      }
      return { isValid: false, errors: { general: 'Invalid offer data' } }
    }
  }

  static sanitizeInput(input: string): string {
    return input
      .trim()
      .replace(/[<>]/g, '') // Remove potential HTML tags
      .replace(/\s+/g, ' ') // Normalize whitespace
  }

  static validateUrl(url: string): boolean {
    try {
      new URL(url)
      return true
    } catch {
      return false
    }
  }

  static validateAge(age: number): boolean {
    return age >= 13 && age <= 120
  }

  static validatePointsRange(points: number, min: number = 1, max: number = 10000): boolean {
    return points >= min && points <= max
  }

  static validateCompletionTime(minutes: number): boolean {
    return minutes >= 1 && minutes <= 480 // 1 minute to 8 hours
  }
} 