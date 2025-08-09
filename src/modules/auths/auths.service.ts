import { Injectable } from '@nestjs/common';
import { UsersService } from '@social/users/users.service';
import { RegisterDto } from '@social/users/dto/register-user.dto';
import { comparePassword } from '@social/utils/hash/hasPassword';
import { IUser, IUserPayload } from '@social/types/users.type';
import { Response } from 'express';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import ms, { StringValue } from 'ms';

@Injectable()
export class AuthsService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.usersService.findByEmail(email);
    if (user) {
      const isPasswordValid = comparePassword(password, user.password);
      if (isPasswordValid) {
        return user;
      }
    }
    return null;
  }

  async login(user: IUser, res: Response) {
    const payload: IUserPayload = {
      _id: user._id,
      email: user.email,
      fullname: user.fullname,
      role: user.role,
    };

    const access_token = this.jwtService.sign(payload);
    const refresh_token = this.createRefreshToken(payload);

    res.cookie('refresh_token', refresh_token, {
      httpOnly: true,
      maxAge: ms(this.configService.get<StringValue>('JWT_REFRESH_EXPIRE', '7d')),
    });

    const data = {
      _id: user._id,
      email: user.email,
      fullname: user.fullname,
      role: user.role,
      avatar: user.avatar,
      phone: user.phone,
      address: user.address,
      status: user.status,
      access_token,
    };
    return data;
  }

  createRefreshToken(payload: IUserPayload) {
    const refresh_token = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_REFRESH_TOKEN_SECRET'),
      expiresIn: this.configService.get<string>('JWT_REFRESH_EXPIRE'),
    });
    return refresh_token;
  }

  async register(registerDto: RegisterDto) {
    const newUser = await this.usersService.register(registerDto);
    return {
      _id: newUser._id,
    };
  }
}
