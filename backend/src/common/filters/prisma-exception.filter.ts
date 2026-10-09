import { ArgumentsHost, Catch, HttpStatus } from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';
import { Response } from 'express';
import { Prisma as CentralPrisma } from '../../../generated/central';
import { Prisma as TenantPrisma } from '../../../generated/tenant';

type KnownRequestError =
  | CentralPrisma.PrismaClientKnownRequestError
  | TenantPrisma.PrismaClientKnownRequestError;

// Maps common Prisma errors to HTTP responses instead of 500s.
// Each generated client bundles its own runtime, so their error classes are
// distinct and both must be listed.
@Catch(
  CentralPrisma.PrismaClientKnownRequestError,
  TenantPrisma.PrismaClientKnownRequestError,
)
export class PrismaExceptionFilter extends BaseExceptionFilter {
  catch(exception: KnownRequestError, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse<Response>();

    switch (exception.code) {
      case 'P2002': // unique constraint
        response.status(HttpStatus.CONFLICT).json({
          statusCode: HttpStatus.CONFLICT,
          message: 'Record already exists',
          error: 'Conflict',
        });
        return;
      case 'P2025': // record not found
        response.status(HttpStatus.NOT_FOUND).json({
          statusCode: HttpStatus.NOT_FOUND,
          message: 'Record not found',
          error: 'Not Found',
        });
        return;
      default:
        super.catch(exception, host);
    }
  }
}
