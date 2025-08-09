import { Body, Controller, Post, Req, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { AuthsService } from './auths.service';
import { RegisterDto } from '@social/users/dto/register-user.dto';
import { Public, ResponseMessage } from '@social/decorators/customize';
import { LocalAuthGuard } from '@social/guards/local-auth.guard';
import type { IRequest } from '@social/types/cores.type';

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
}
