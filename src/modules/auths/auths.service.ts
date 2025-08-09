import { Injectable } from '@nestjs/common';
import { UsersService } from '@social/users/users.service';
import { LoginDto } from '@social/auths/dto/auths.dto';
import { RegisterDto } from '@social/users/dto/register-user.dto';

@Injectable()
export class AuthsService {
  constructor(private readonly usersService: UsersService) {}

  async login(loginDto: LoginDto) {
    return 'login';
  }

  async register(registerDto: RegisterDto) {
    const newUser = await this.usersService.register(registerDto);
    return {
      _id: newUser._id,
    };
  }
}
