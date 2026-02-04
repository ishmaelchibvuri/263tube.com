import { z, ZodError } from "zod";

export class ValidationError extends Error {
  constructor(public issues: z.ZodIssue[]) {
    super("Validation error");
    this.name = "ValidationError";
  }
}

export function validateRequest<T extends z.ZodType<any, any>>(
  schema: T,
  data: unknown
): z.infer<T> {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof ZodError) {
      throw new ValidationError(error.issues);
    }
    throw error;
  }
}
