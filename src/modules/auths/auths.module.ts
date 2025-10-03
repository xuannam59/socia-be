import { Module } from '@nestjs/common';
import { AuthsService } from './auths.service';
import { AuthsController } from './auths.controller';
import { PassportModule } from '@nestjs/passport';
import { LocalStrategy } from '@social/authentication/local.strategy';
import { UsersModule } from '@social/users/users.module';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { JwtStrategy } from '@social/authentication/jwt.strategy';
import { MailsModule } from '@social/mails/mails.module';
import { ForgotPassword, ForgotPasswordSchema } from './schemas/forgot-password.schema';
import { MongooseModule } from '@nestjs/mongoose';
import { GoogleStrategy } from '@social/authentication/google.strategy';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: ForgotPassword.name, schema: ForgotPasswordSchema }]),
    JwtModule.registerAsync({
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_ACCESS_TOKEN_SECRET'),
        signOptions: { expiresIn: configService.get<string>('JWT_ACCESS_EXPIRE') },
      }),
      inject: [ConfigService],
    }),
    UsersModule,
    PassportModule,
    MailsModule,
  ],
  controllers: [AuthsController],
  providers: [AuthsService, LocalStrategy, JwtStrategy, GoogleStrategy],
  exports: [AuthsService],
})
export class AuthsModule {}
