import { ExecutionContext, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthGuard } from '@nestjs/passport';
import { Observable } from 'rxjs';

@Injectable()
export class GoogleOAuthGuard extends AuthGuard('google') {
  constructor(private configService: ConfigService) {
    super({
      accessType: 'offline',
    });
  }

  canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest();
    const error = request.query.error;
    if (error) {
      request.res.redirect(`${this.configService.get<string>('FRONTEND_URL')}/login?status=false`);
      return false;
    }
    return super.canActivate(context);
  }
}
