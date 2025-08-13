import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback, Profile } from 'passport-google-oauth20';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthsService } from '@social/auths/auths.service';
import { IGoogleUser } from '@social/types/auths.type';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(
    private readonly configService: ConfigService,
    private readonly authsService: AuthsService,
  ) {
    super({
      clientID: configService.get<string>('GOOGLE_CLIENT_ID', ''),
      clientSecret: configService.get<string>('GOOGLE_CLIENT_SECRET', ''),
      callbackURL: configService.get<string>('GOOGLE_CALLBACK_URL', ''),
      scope: ['email', 'profile'],
      passReqToCallback: true,
    });
  }
  async validate(
    req: Request,
    accessToken: string,
    refreshToken: string,
    profile: Profile,
    done: VerifyCallback,
  ): Promise<any> {
    try {
      const { emails, photos, id, displayName } = profile;
      const payload: IGoogleUser = {
        googleId: id,
        email: emails?.[0]?.value || '',
        fullname: displayName || '',
        avatar: photos?.[0]?.value || '',
      };
      const validateUser = await this.authsService.validateGoogleUser(payload);
      done(null, validateUser);
    } catch (error) {
      done(error, undefined);
    }
  }
}
