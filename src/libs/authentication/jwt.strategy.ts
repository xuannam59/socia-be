import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IUserPayload } from '@social/types/users.type';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly configService: ConfigService) {
    const jwtSecret = configService.get<string>('JWT_ACCESS_TOKEN_SECRET');
    if (!jwtSecret) {
      throw new Error('JWT_ACCESS_TOKEN_SECRET is not defined');
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtSecret,
    });
  }

  async validate(payload: IUserPayload) {
    return {
      _id: payload._id,
      email: payload.email,
      fullname: payload.fullname,
      role: payload.role,
    };
  }
}
