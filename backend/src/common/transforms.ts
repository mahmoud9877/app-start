import { TransformFnParams } from 'class-transformer';

// For @Transform(normalizeEmail): emails are stored and compared lowercased and trimmed.
export const normalizeEmail = ({ value }: TransformFnParams): unknown =>
  typeof value === 'string' ? value.trim().toLowerCase() : value;

export const trim = ({ value }: TransformFnParams): unknown =>
  typeof value === 'string' ? value.trim() : value;
