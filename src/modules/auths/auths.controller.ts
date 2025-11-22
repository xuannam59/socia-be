import { Body, Controller, Get, Patch, Post, Req, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { AuthsService } from './auths.service';
import { RegisterDto } from '@social/users/dto/register-user.dto';
import { Public, ResponseMessage } from '@social/decorators/customize';
import { LocalAuthGuard } from '@social/guards/local-auth.guard';
import type { IRequest } from '@social/types/cores.type';
import { ChangePasswordDto, ResetPasswordDto, VerifyOtpDto } from './dto/auths.dto';
import { GoogleOAuthGuard } from '@social/guards/google-oauth.guard';

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
  @Get('google-login')
  @UseGuards(GoogleOAuthGuard)
  async googleAuth(@Req() req) {}

  @Public()
  @Get('google-redirect')
  @UseGuards(GoogleOAuthGuard)
  googleAuthRedirect(@Req() req: IRequest, @Res({ passthrough: false }) res: Response) {
    return this.authsService.googleLogin(req, res);
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

  @Public()
  @Post('refresh-token')
  @ResponseMessage('Refresh token')
  refreshToken(@Req() req: IRequest, @Res({ passthrough: true }) res: Response) {
    const refreshToken = req.cookies['refresh_token'];
    return this.authsService.processRefreshToken(refreshToken, res);
  }

  @Post('logout')
  @ResponseMessage('Logout')
  logout(@Res({ passthrough: true }) res: Response) {
    return this.authsService.logout(res);
  }

  @Patch('change-password')
  @ResponseMessage('Change password')
  changePassword(@Body() changePasswordDto: ChangePasswordDto, @Req() req: IRequest) {
    return this.authsService.changePassword(changePasswordDto, req.user);
  }
}
