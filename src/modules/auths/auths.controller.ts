import { Body, Controller, Post } from '@nestjs/common';
import { AuthsService } from './auths.service';
import { ResponseMessage } from '@social/decorators/customize';
import { RegisterDto } from '@social/users/dto/register-user.dto';
import { LoginDto } from './dto/auths.dto';

@Controller('auths')
export class AuthsController {
  constructor(private readonly authsService: AuthsService) {}

  @Post('login')
  @ResponseMessage('Login a user')
  login(@Body() loginDto: LoginDto) {
    return this.authsService.login(loginDto);
  }

  @Post('register')
  @ResponseMessage('Register a new user')
  register(@Body() registerDto: RegisterDto) {
    return this.authsService.register(registerDto);
  }
}
