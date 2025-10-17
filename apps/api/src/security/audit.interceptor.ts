
import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable, tap } from 'rxjs';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest();
    const user = req.user;
    const method = req.method;
    const url = req.originalUrl;
    const now = Date.now();
    return next.handle().pipe(
      tap(() => {
        console.log(`[AUDIT] user=${user?.email || 'anon'} method=${method} url=${url} ms=${Date.now() - now}`);
      }),
    );
  }
}
