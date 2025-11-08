import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { IStoryQuery } from '@social/types/stoies.type';
import type { IUser } from '@social/types/users.type';
import { User, UserDocument } from '@social/users/schemas/user.schema';
import mongoose, { Model } from 'mongoose';
import { UploadsService } from '../uploads/uploads.service';
import { CreateStoryDto, CreateStoryLikeDto } from './dto/create-story.dto';
import { StoryViewer, StoryViewerDocument } from './schemas/story-viewer.schema';
import { Story, StoryDocument } from './schemas/story.schema';

@Injectable()
export class StoriesService {
  constructor(
    @InjectModel(Story.name) private storyModel: Model<StoryDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(StoryViewer.name) private storyViewerModel: Model<StoryViewerDocument>,
    private readonly uploadsService: UploadsService,
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
    const { page, limit } = query;
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
      this.storyModel
        .find(filterStory)
        .populate({ path: 'viewers', select: 'userId likedType' })
        .sort({ createdAt: 1 })
        .lean(),
      this.storyModel
        .find({
          authorId: user._id,
          expiresAt: { $gt: new Date() },
        })
        .populate({ path: 'viewers', select: 'userId likedType' })
        .sort({ createdAt: 1 })
        .lean(),
    ]);

    const userStories = usersHaveNewStories.map(user => {
      const stories = listStories.filter(story => story.authorId === user._id.toString());
      return {
        _id: user._id.toString(),
        fullname: user.fullname,
        avatar: user.avatar,
        endStoryAt: user.endStoryAt,
        stories,
      };
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
    const filteredUserStories = userStories.filter(user => user.stories.length > 0);
    return {
      list: filteredUserStories,
      meta: {
        page: pageNumber,
        limit: limitNumber,
        total: totalUserStories,
      },
    };
  }

  async getStoryViewers(storyId: string) {
    if (!mongoose.Types.ObjectId.isValid(storyId)) {
      throw new BadRequestException('Invalid story ID');
    }
    const [viewers, totalViewers] = await Promise.all([
      this.storyViewerModel
        .find({ storyId })
        .populate('userId', 'fullname avatar')
        .select('userId likedType')
        .sort({ updatedAt: -1 })
        .lean(),
      this.storyViewerModel.countDocuments({ storyId }),
    ]);
    return {
      list: viewers,
      meta: {
        total: totalViewers,
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

  async actionView(storyId: string, user: IUser) {
    if (!mongoose.Types.ObjectId.isValid(storyId)) {
      throw new BadRequestException('Invalid story ID');
    }

    const existingStory = await this.storyModel.findById(storyId);
    if (!existingStory) {
      throw new BadRequestException('Story not found');
    }

    const existingViewer = await this.storyViewerModel.findOne({ storyId, userId: user._id });
    if (existingViewer) {
      return;
    }
    const result = await this.storyViewerModel.create({ storyId, userId: user._id });

    await this.storyModel.updateOne({ _id: storyId }, { $addToSet: { viewers: result._id } });
    return 'success';
  }

  async actionLike(storyId: string, createStoryLikeDto: CreateStoryLikeDto, user: IUser) {
    const { type } = createStoryLikeDto;
    if (!mongoose.Types.ObjectId.isValid(storyId)) {
      throw new BadRequestException('Invalid story ID');
    }

    const [existingStory, existingViewer] = await Promise.all([
      this.storyModel.findById(storyId),
      this.storyViewerModel.findOne({ storyId, userId: user._id }).lean(),
    ]);
    if (!existingStory || !existingViewer) {
      throw new BadRequestException('Story not found');
    }

    if (existingViewer.likedType !== type) {
      await this.storyViewerModel.updateOne({ _id: existingViewer._id }, { $set: { likedType: type } });
    }

    return {
      action: 'updated',
      type,
    };
  }

  async removeStory(id: string, user: IUser) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid story ID');
    }

    const existingStory = await this.storyModel.findOne({ _id: id, authorId: user._id });
    if (!existingStory) {
      throw new BadRequestException('Story not found');
    }

    if (existingStory.type === 'image') {
      this.uploadsService.deleteFile(existingStory.media.keyS3);
    }
    await Promise.all([this.storyModel.deleteOne({ _id: id }), this.storyViewerModel.deleteMany({ storyId: id })]);
    return 'Story deleted successfully';
  }
}
