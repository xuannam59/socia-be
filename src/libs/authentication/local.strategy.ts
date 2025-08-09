import { Strategy } from 'passport-local';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException, Dependencies } from '@nestjs/common';
import { AuthsService } from '@social/auths/auths.service';

@Injectable()
@Dependencies(AuthsService)
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly authsService: AuthsService) {
    super({
      usernameField: 'email',
    });
  }

  async validate(email: string, password: string): Promise<any> {
    const user = await this.authsService.validateUser(email, password);
    if (!user) {
      throw new UnauthorizedException('Email or password is incorrect');
    }
    return user;
  }
}
