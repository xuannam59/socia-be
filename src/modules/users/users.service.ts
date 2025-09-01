import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { IGoogleUser } from '@social/types/auths.type';
import { generateRandom } from '@social/utils/generateRandom';
import { hashPassword } from '@social/utils/hasPassword';
import mongoose, { Model } from 'mongoose';
import { RegisterDto } from './dto/register-user.dto';
import { User, UserDocument } from './schemas/user.schema';
import { convertSlug } from '@social/utils/common';

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
      googleId: null,
      slug: convertSlug(fullname),
    });
    return user.toObject();
  }

  async resetPassword(email: string, newPassword: string) {
    const hashedPassword = hashPassword(newPassword);
    const resetPassword = await this.userModel.updateOne({ email }, { password: hashedPassword });
    return resetPassword;
  }

  async findByEmail(email: string) {
    const user = await this.userModel.findOne({ email, isBlocked: false });

    if (!user) {
      throw new BadRequestException('Email or password is incorrect');
    }

    return user.toObject();
  }

  async findOrCreateGoogleUser(googleUser: IGoogleUser) {
    const { email, googleId, fullname, avatar } = googleUser;
    const existEmail = await this.userModel.findOne({ email });
    if (!existEmail) {
      const hashedPassword = hashPassword(generateRandom(12));
      const user = await this.userModel.create({
        fullname,
        email,
        password: hashedPassword,
        avatar,
        googleId,
        slug: convertSlug(fullname),
      });
      return user.toObject();
    }
    if (!existEmail.googleId) {
      await this.userModel.updateOne({ email }, { googleId });
    }
    return existEmail.toObject();
  }

  async findOne(_id: string) {
    if (!mongoose.Types.ObjectId.isValid(_id)) {
      throw new BadRequestException('Invalid user id');
    }
    const user = await this.userModel.findOne({
      _id,
      isBlocked: false,
    });
    if (!user) {
      throw new BadRequestException('User not found');
    }
    return user.toObject();
  }
}
