import { Body, Controller, Post, Req, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { AuthsService } from './auths.service';
import { RegisterDto } from '@social/users/dto/register-user.dto';
import { Public, ResponseMessage } from '@social/decorators/customize';
import { LocalAuthGuard } from '@social/guards/local-auth.guard';
import type { IRequest } from '@social/types/cores.type';
import { ResetPasswordDto, VerifyOtpDto } from './dto/auths.dto';

@Controller('auths')
export class AuthsController {
  constructor(private readonly authsService: AuthsService) {}

  @Public()
  @UseGuards(LocalAuthGuard)
  @Post('login')
  @ResponseMessage('Login a user')
  login(@Req() req: IRequest, @Res({ passthrough: true }) res: Response) {
    const user = req.user;
    return this.authsService.login(user, res);
  }

  @Public()
  @Post('register')
  @ResponseMessage('Register a new user')
  register(@Body() registerDto: RegisterDto) {
    return this.authsService.register(registerDto);
  }

  @Public()
  @Post('forgot-password')
  @ResponseMessage('Forgot password')
  forgotPassword(@Body('email') email: string) {
    return this.authsService.forgotPassword(email);
  }

  @Public()
  @Post('verify-otp')
  @ResponseMessage('Verify OTP')
  verifyOtp(@Body() verifyOtpDto: VerifyOtpDto) {
    return this.authsService.verifyOtp(verifyOtpDto);
  }

  @Public()
  @Post('reset-password')
  @ResponseMessage('Reset password')
  resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    return this.authsService.resetPassword(resetPasswordDto);
  }

  @Post('get-account')
  @ResponseMessage('Get account')
  getAccount(@Req() req: IRequest) {
    return this.authsService.getAccount(req.user);
  }

  @Post('refresh-token')
  @ResponseMessage('Refresh token')
  refreshToken(@Req() req: IRequest, @Res({ passthrough: true }) res: Response) {
    const refreshToken = req.cookies['refresh_token'];
    return this.authsService.processRefreshToken(refreshToken, res);
  }
}
