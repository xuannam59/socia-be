import { Module } from '@nestjs/common';
import { AuthsService } from './auths.service';
import { AuthsController } from './auths.controller';
import { PassportModule } from '@nestjs/passport';
import { LocalStrategy } from '@social/authentication/local.strategy';
import { UsersModule } from '@social/users/users.module';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { JwtStrategy } from '@social/authentication/jwt.strategy';

@Module({
  imports: [
    JwtModule.registerAsync({
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_ACCESS_TOKEN_SECRET'),
        signOptions: { expiresIn: configService.get<string>('JWT_ACCESS_EXPIRE') },
      }),
      inject: [ConfigService],
    }),
    UsersModule,
    PassportModule,
  ],
  controllers: [AuthsController],
  providers: [AuthsService, LocalStrategy, JwtStrategy],
})
export class AuthsModule {}
