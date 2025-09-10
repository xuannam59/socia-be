import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateStoryDto } from './dto/create-story.dto';
import { UpdateStoryDto } from './dto/update-story.dto';
import type { IUser } from '@social/types/users.type';
import { Model } from 'mongoose';
import { Story, StoryDocument } from './schemas/story.schema';
import { InjectModel } from '@nestjs/mongoose';
import { IStoryQuery } from '@social/types/stoies.type';
import { User, UserDocument } from '@social/users/schemas/user.schema';

@Injectable()
export class StoriesService {
  constructor(
    @InjectModel(Story.name) private storyModel: Model<StoryDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  async create(createStoryDto: CreateStoryDto, user: IUser) {
    const { content, media, type, privacy, backgroundColor } = createStoryDto;

    if (!media && content === '') {
      throw new BadRequestException('Content is not empty');
    }

    const endStoryAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const [result] = await Promise.all([
      this.storyModel.create({
        content,
        media,
        type,
        privacy,
        backgroundColor,
        authorId: user._id,
        expiresAt: endStoryAt,
      }),
      this.userModel.updateOne({ _id: user._id }, { endStoryAt }),
    ]);

    return {
      _id: result._id,
    };
  }

  async findAll(query: IStoryQuery, user: IUser) {
    const { page, limit } = query;
    const pageNumber = page ? Number(page) : 1;
    const limitNumber = limit ? Number(limit) : 10;
    const skip = (pageNumber - 1) * limitNumber;

    const filterUser = {
      _id: { $in: user.following },
      endStoryAt: { $gt: new Date() },
    };

    const [usersHaveNewStories, totalUserStories] = await Promise.all([
      this.userModel.find(filterUser).select('fullname avatar').limit(limitNumber).skip(skip),
      this.userModel.countDocuments(filterUser),
    ]);

    const userId = usersHaveNewStories.map(user => user._id.toString());

    const filterStory: any = {
      authorId: { $in: userId },
      expiresAt: { $gt: new Date() },
      privacy: { $ne: 'private' },
    };

    const [listStories, myStories] = await Promise.all([
      this.storyModel.find(filterStory).lean(),
      this.storyModel
        .find({
          authorId: user._id,
          expiresAt: { $gt: new Date() },
        })
        .lean(),
    ]);

    const userStories = usersHaveNewStories.map(user => {
      const stories = listStories.filter(story => story.authorId === user._id.toString());
      return {
        _id: user._id.toString(),
        fullname: user.fullname,
        avatar: user.avatar,
        stories,
      };
    });

    if (myStories.length > 0) {
      userStories.unshift({
        _id: user._id.toString(),
        fullname: user.fullname,
        avatar: user.avatar,
        stories: myStories,
      });
    }
    return {
      list: userStories,
      meta: {
        page: pageNumber,
        limit: limitNumber,
        total: totalUserStories,
      },
    };
  }

  findOne(id: number) {
    return `This action returns a #${id} story`;
  }

  update(id: number, updateStoryDto: UpdateStoryDto) {
    return `This action updates a #${id} story`;
  }

  remove(id: number) {
    return `This action removes a #${id} story`;
  }
}
