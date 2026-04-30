import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

interface ErrorResponse {
  statusCode: number;
  message: string | string[];
  error:      string;
  path:       string;
  timestamp:  string;
}

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: HttpException, host: ArgumentsHost): void {
    const ctx      = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request  = ctx.getRequest<Request>();
    const status   = exception.getStatus();
    const exceptionResponse = exception.getResponse();

    const message =
      typeof exceptionResponse === 'string'
        ? exceptionResponse
        : (exceptionResponse as Record<string, unknown>).message ?? exception.message;

    const errorBody: ErrorResponse = {
      statusCode: status,
      message:    message as string | string[],
      error:      HttpStatus[status] ?? 'Error',
      path:       request.url,
      timestamp:  new Date().toISOString(),
    };

    if (status >= 500) {
      this.logger.error(`[${request.method}] ${request.url} → ${status}`, exception.stack);
    } else {
      this.logger.warn(`[${request.method}] ${request.url} → ${status}: ${JSON.stringify(message)}`);
    }

    response.status(status).json(errorBody);
  }
}
