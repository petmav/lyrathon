import type { ZodSchema, ZodError } from 'zod';

export class RequestValidationError extends Error {
  constructor(public details: ReturnType<ZodError['flatten']>) {
    super('Invalid request body');
  }
}

export class ResponseValidationError extends Error {
  constructor(public details: ReturnType<ZodError['flatten']>) {
    super('Invalid response body');
  }
}

export function parseRequestPayload<T>(schema: ZodSchema<T>, payload: unknown): T {
  const result = schema.safeParse(payload);
  if (!result.success) {
    throw new RequestValidationError(result.error.flatten());
  }
  return result.data;
}

export function enforceResponseShape<T>(schema: ZodSchema<T>, payload: unknown): T {
  const result = schema.safeParse(payload);
  if (!result.success) {
    throw new ResponseValidationError(result.error.flatten());
  }
  return result.data;
}

export function isRequestValidationError(
  error: unknown,
): error is RequestValidationError {
  return error instanceof RequestValidationError;
}

export function isResponseValidationError(
  error: unknown,
): error is ResponseValidationError {
  return error instanceof ResponseValidationError;
}
