import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateStoryDto } from './dto/create-story.dto';
import { UpdateStoryDto } from './dto/update-story.dto';
import type { IUser } from '@social/types/users.type';
import { Model } from 'mongoose';
import { Story, StoryDocument } from './schemas/story.schema';
import { InjectModel } from '@nestjs/mongoose';

@Injectable()
export class StoriesService {
  constructor(@InjectModel(Story.name) private storyModel: Model<StoryDocument>) {}

  async create(createStoryDto: CreateStoryDto, user: IUser) {
    const { content, media, type, privacy, backgroundColor } = createStoryDto;

    if (!media && content === '') {
      throw new BadRequestException('Content is not empty');
    }

    const result = await this.storyModel.create({
      content,
      media,
      type,
      privacy,
      backgroundColor,
      authorId: user._id,
    });

    return {
      _id: result._id,
    };
  }

  findAll() {
    return `This action returns all stories`;
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
