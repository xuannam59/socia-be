import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateStoryDto, CreateStoryLikeDto } from './dto/create-story.dto';
import { UpdateStoryDto } from './dto/update-story.dto';
import type { IUser } from '@social/types/users.type';
import mongoose, { Model } from 'mongoose';
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
      _id: user._id,
      fullname: user.fullname,
      avatar: user.avatar,
      endStoryAt,
      stories: [result],
    };
  }

  async findAll(query: IStoryQuery, user: IUser) {
    const { page, limit, viewUserId } = query;
    const pageNumber = page ? Number(page) : 1;
    const limitNumber = limit ? Number(limit) : 10;
    const skip = (pageNumber - 1) * limitNumber;

    const filterUser = {
      _id: { $in: user.following },
      endStoryAt: { $gt: new Date() },
    };

    const [usersHaveNewStories, totalUserStories] = await Promise.all([
      this.userModel
        .find(filterUser)
        .select('fullname avatar endStoryAt')
        .limit(limitNumber)
        .skip(skip)
        .sort({ endStoryAt: -1 })
        .lean(),
      this.userModel.countDocuments(filterUser),
    ]);

    const userId = usersHaveNewStories.map(user => user._id.toString());

    const filterStory: any = {
      authorId: { $in: userId },
      expiresAt: { $gt: new Date() },
      privacy: { $ne: 'private' },
    };

    const [listStories, myStories] = await Promise.all([
      this.storyModel.find(filterStory).sort({ createdAt: 1 }).lean(),
      this.storyModel
        .find({
          authorId: user._id,
          expiresAt: { $gt: new Date() },
        })
        .sort({ createdAt: 1 })
        .lean(),
    ]);

    const userStories = usersHaveNewStories
      .map(user => {
        const stories = listStories.filter(story => story.authorId === user._id.toString());
        return {
          _id: user._id.toString(),
          fullname: user.fullname,
          avatar: user.avatar,
          endStoryAt: user.endStoryAt,
          stories,
        };
      })
      .sort((a, b) => {
        if (a._id === viewUserId) return -1;
        if (b._id === viewUserId) return 1;
        return 0;
      });

    if (myStories.length > 0) {
      userStories.unshift({
        _id: user._id.toString(),
        fullname: user.fullname,
        avatar: user.avatar,
        endStoryAt: user.endStoryAt,
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

  async findUserStory(userId: string, user: IUser) {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('Invalid user id');
    }

    const [stories, userInfo] = await Promise.all([
      this.storyModel
        .find({
          authorId: userId,
          expiresAt: { $gt: new Date() },
          privacy: { $ne: 'private' },
        })
        .sort({ createdAt: 1 })
        .lean(),
      this.userModel.findOne({ _id: userId }).select('fullname avatar endStoryAt').lean(),
    ]);

    if (!userInfo) {
      throw new BadRequestException('User not found');
    }

    return {
      _id: userInfo._id,
      fullname: userInfo.fullname,
      avatar: userInfo.avatar,
      endStoryAt: userInfo.endStoryAt,
      stories,
    };
  }

  async actionLike(storyId: string, createStoryLikeDto: CreateStoryLikeDto, user: IUser) {
    const { type } = createStoryLikeDto;
    if (!mongoose.Types.ObjectId.isValid(storyId)) {
      throw new BadRequestException('Invalid story ID');
    }

    const existingStory = await this.storyModel.findById(storyId);
    if (!existingStory) {
      throw new BadRequestException('Story not found');
    }

    const result = await this.storyModel.updateOne(
      { _id: storyId, 'userLikes.userId': user._id },
      { $set: { 'userLikes.$.type': type } },
    );

    if (result.modifiedCount === 0) {
      await this.storyModel.updateOne({ _id: storyId }, { $push: { userLikes: { userId: user._id, type } } });
      return {
        action: 'created',
        type,
      };
    }

    return {
      action: 'updated',
      type,
    };
  }

  update(id: number, updateStoryDto: UpdateStoryDto) {
    return `This action updates a #${id} story`;
  }

  remove(id: number) {
    return `This action removes a #${id} story`;
  }
}
