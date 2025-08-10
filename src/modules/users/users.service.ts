import { BadRequestException, Injectable } from '@nestjs/common';
import { UpdateUserDto } from './dto/update-user.dto';
import { User, UserDocument } from './schemas/user.schema';
import { Model, ObjectId } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { hashPassword } from '@social/utils/hasPassword';
import { RegisterDto } from './dto/register-user.dto';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  async register(registerDto: RegisterDto) {
    const { fullname, email, password, confirmPassword } = registerDto;

    if (password !== confirmPassword) {
      throw new BadRequestException('Password and confirm password do not match');
    }

    const existEmail = await this.userModel.findOne({ email });
    if (existEmail) {
      throw new BadRequestException('Email already exists');
    }

    const hashedPassword = hashPassword(password);

    const user = await this.userModel.create({
      fullname,
      email,
      password: hashedPassword,
    });
    return user.toObject();
  }

  async findByEmail(email: string) {
    const user = await this.userModel.findOne({ email, isBlocked: false });

    if (!user) {
      throw new BadRequestException('Email or password is incorrect');
    }

    return user.toObject();
  }

  async resetPassword(email: string, newPassword: string) {
    const hashedPassword = hashPassword(newPassword);
    const resetPassword = await this.userModel.updateOne({ email }, { password: hashedPassword });
    return resetPassword;
  }

  async findAll() {
    return `This action returns all users`;
  }

  async findOne(id: number) {
    return `This action returns a #${id} user`;
  }

  async update(id: number, updateUserDto: UpdateUserDto) {
    console.log(updateUserDto);
    return `This action updates a #${id} user`;
  }

  async remove(id: number) {
    return `This action removes a #${id} user`;
  }
}
