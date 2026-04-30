import { ArgumentsHost, Catch, ExceptionFilter, HttpStatus, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Request, Response } from 'express';

@Catch(Prisma.PrismaClientKnownRequestError, Prisma.PrismaClientUnknownRequestError)
export class PrismaExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(PrismaExceptionFilter.name);

  catch(
    exception: Prisma.PrismaClientKnownRequestError | Prisma.PrismaClientUnknownRequestError,
    host: ArgumentsHost,
  ): void {
    const ctx      = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request  = ctx.getRequest<Request>();

    let status  = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Database error';

    if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      switch (exception.code) {
        case 'P2002': {
          // Unique constraint violation
          const fields = (exception.meta?.target as string[])?.join(', ') ?? 'field';
          status  = HttpStatus.CONFLICT;
          message = `A record with this ${fields} already exists`;
          break;
        }
        case 'P2025':
          // Record not found
          status  = HttpStatus.NOT_FOUND;
          message = 'Record not found';
          break;
        case 'P2003':
          // Foreign key constraint
          status  = HttpStatus.BAD_REQUEST;
          message = 'Referenced record does not exist';
          break;
        case 'P2014':
          // Required relation violation
          status  = HttpStatus.BAD_REQUEST;
          message = 'Relation constraint violation';
          break;
        default:
          this.logger.error(`Unhandled Prisma error ${exception.code}`, exception.stack);
      }
    } else {
      this.logger.error('Unknown Prisma error', exception.stack);
    }

    response.status(status).json({
      statusCode: status,
      message,
      error:     HttpStatus[status],
      path:      request.url,
      timestamp: new Date().toISOString(),
    });
  }
}
