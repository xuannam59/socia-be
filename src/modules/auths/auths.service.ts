import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { UsersService } from '@social/users/users.service';
import { RegisterDto } from '@social/users/dto/register-user.dto';
import { comparePassword, hashPassword } from '@social/utils/hasPassword';
import { IUser, IUserPayload } from '@social/types/users.type';
import { Response } from 'express';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import ms, { StringValue } from 'ms';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ForgotPassword, ForgotPasswordDocument } from './schemas/forgot-password.schema';
import { ResetPasswordDto, VerifyOtpDto } from './dto/auths.dto';
import { generateRandom } from '@social/utils/generateRandom';
import { MailsService } from '@social/mails/mails.service';
import { ISendMail } from '@social/types/mail.type';

@Injectable()
export class AuthsService {
  constructor(
    @InjectModel(ForgotPassword.name) private forgotPasswordModel: Model<ForgotPasswordDocument>,
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly mailsService: MailsService,
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

  async forgotPassword(email: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new NotFoundException('User not found!');
    }

    await this.forgotPasswordModel.deleteOne({ email });

    const otp = generateRandom(6);

    const infoMail: ISendMail = {
      email,
      data: otp,
      subject: `Mã OTP là: ${otp}`,
      name: user.fullname,
    };

    await Promise.all([
      this.mailsService.sendMailForgotPassword(infoMail),
      this.forgotPasswordModel.create({ email, otp }),
    ]);

    return {
      email,
    };
  }

  async verifyOtp(verifyOtpDto: VerifyOtpDto) {
    const { email, otp } = verifyOtpDto;
    const otpExpired = await this.forgotPasswordModel.findOne({ email, otp });
    if (!otpExpired) {
      throw new NotFoundException('OTP is invalid! or expired!');
    }
    return {
      email,
    };
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto) {
    const { email, newPassword, otp, confirmPassword } = resetPasswordDto;
    const [user, otpExpired] = await Promise.all([
      this.usersService.findByEmail(email),
      this.forgotPasswordModel.findOne({ email, otp }),
    ]);

    if (!user || !otpExpired) {
      throw new NotFoundException('User not found or OTP is expired!');
    }
    if (newPassword !== confirmPassword) {
      throw new BadRequestException('New password and confirm password do not match!');
    }
    const [resetPassword] = await Promise.all([
      this.usersService.resetPassword(email, newPassword),
      this.forgotPasswordModel.deleteOne({ email: email }),
    ]);

    if (resetPassword.modifiedCount === 0) {
      throw new BadRequestException('Password reset failed!');
    }

    return {
      email,
    };
  }
}
