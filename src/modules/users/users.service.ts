import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { IGoogleUser } from '@social/types/auths.type';
import { generateRandom } from '@social/utils/generateRandom';
import { hashPassword } from '@social/utils/hasPassword';
import mongoose, { Model } from 'mongoose';
import { RegisterDto } from './dto/register-user.dto';
import { User, UserDocument } from './schemas/user.schema';
import { convertSlug } from '@social/utils/common';
import { IFriendListQuery, IUser } from '@social/types/users.type';
import { Conversation, ConversationDocument } from '../conversations/schemas/conversation.schema';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Conversation.name) private conversationModel: Model<ConversationDocument>,
  ) {}

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
    const { email, googleId, fullname } = googleUser;
    const existEmail = await this.userModel.findOne({ email });
    if (!existEmail) {
      const hashedPassword = hashPassword(generateRandom(12));
      const user = await this.userModel.create({
        fullname,
        email,
        password: hashedPassword,
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

  async findUserInfo(_id: string) {
    if (!mongoose.Types.ObjectId.isValid(_id)) {
      throw new BadRequestException('Invalid user id');
    }
    const user = await this.userModel.findOne({ _id, isBlocked: false }).select('-password -googleId').lean();
    if (!user) {
      throw new BadRequestException('User not found');
    }
    return user;
  }

  async findOne(_id: string) {
    if (!mongoose.Types.ObjectId.isValid(_id)) {
      throw new BadRequestException('Invalid user id');
    }
    const user = await this.userModel
      .findOne({
        _id,
        isBlocked: false,
      })
      .select('-password -googleId');
    if (!user) {
      throw new BadRequestException('User not found');
    }
    return user.toObject();
  }

  async fetchUserFriendList(user: IUser, query: IFriendListQuery) {
    const { page, limit, search } = query;
    const pageNumber = page ? Number(page) : 1;
    const limitNumber = limit ? Number(limit) : 10;
    const skip = (pageNumber - 1) * limitNumber;

    const filter: any = {
      _id: { $in: user.friends },
    };

    if (search) {
      filter.slug = new RegExp(search, 'i');
    }

    const friends = await this.userModel
      .find(filter)
      .skip(skip)
      .limit(limitNumber)
      .select('-password -googleId')
      .lean();
    return { friends: friends, total: user.friends.length };
  }

  async getConversationFriendList(user: IUser) {
    const filter: any = {
      _id: { $in: user.friends },
    };

    const friends = await this.userModel
      .find(filter)
      .limit(10)
      .select('_id fullname avatar isOnline lastActive')
      .sort({ isOnline: -1 })
      .lean();

    const conversationList = await Promise.all(
      friends.map(async friend => {
        const conversation = await this.conversationModel
          .findOne({
            users: {
              $all: [user._id, friend._id],
            },
          })
          .select('_id usersState lastMessage')
          .populate('lastMessage', 'content type sender')
          .lean();

        return {
          ...friend,
          conversationId: conversation ? conversation._id : null,
          isGroup: false,
          isExist: conversation ? true : false,
          usersState: conversation ? conversation.usersState : [],
          lastMessage: conversation ? conversation.lastMessage : '',
        };
      }),
    );
    return conversationList;
  }

  async updateUserOnlineStatus(userId: string, isOnline: boolean) {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('Invalid user id');
    }
    await this.userModel.updateOne({ _id: userId }, { isOnline, lastActive: new Date() });
  }
}
