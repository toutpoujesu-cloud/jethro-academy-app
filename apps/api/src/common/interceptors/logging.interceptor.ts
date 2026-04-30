import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { Request } from 'express';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req    = context.switchToHttp().getRequest<Request>();
    const method = req.method;
    const url    = req.url;
    const now    = Date.now();

    return next.handle().pipe(
      tap(() => {
        const elapsed = Date.now() - now;
        const status  = context.switchToHttp().getResponse<{ statusCode: number }>().statusCode;
        this.logger.log(`${method} ${url} ${status} — ${elapsed}ms`);
      }),
    );
  }
}
