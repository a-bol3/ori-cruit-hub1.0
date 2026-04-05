import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AuditService } from '../../audit/audit.service';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  private readonly logger = new Logger(AuditInterceptor.name);

  constructor(private readonly auditService: AuditService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url, body, user, ip } = request;
    const userAgent = request.get('user-agent');

    // Only audit mutating requests (POST, PATCH, DELETE)
    // and skip sensitive ones like login
    const isMutating = ['POST', 'PATCH', 'DELETE', 'PUT'].includes(method);
    const isSensitive = url.includes('/auth/login') || url.includes('/auth/register');

    if (!isMutating || isSensitive) {
      return next.handle();
    }

    return next.handle().pipe(
      tap(async (response) => {
        try {
          const entityType = this.extractEntityType(url);
          const entityId = this.extractEntityId(url, response);

          if (entityType && entityId) {
            await this.auditService.createLog({
              userId: user?.id,
              action: method,
              entityType,
              entityId,
              newValue: body,
              ipAddress: ip,
              userAgent,
            });
          }
        } catch (error) {
          this.logger.error(`Audit logging failed: ${error.message}`);
        }
      }),
    );
  }

  private extractEntityType(url: string): string {
    const parts = url.split('/');
    // Assumes standard REST structure: /candidates, /job-orders, etc.
    return parts[1]?.toUpperCase() || 'UNKNOWN';
  }

  private extractEntityId(url: string, response: any): string {
    const parts = url.split('/');
    // If it's a POST, the ID is usually in the response
    // If it's PATCH/DELETE, the ID is usually the last part of the URL
    if (response?.id) return response.id;
    return parts[2] || 'UNKNOWN';
  }
}
