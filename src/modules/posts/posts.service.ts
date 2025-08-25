import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { IUser } from '@social/types/users.type';
import { Model } from 'mongoose';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { PostLike } from './schemas/post-like.schema';
import { Post } from './schemas/post.schema';

@Injectable()
export class PostsService {
  constructor(
    @InjectModel(Post.name) private postModel: Model<Post>,
    @InjectModel(PostLike.name) private postLikeModel: Model<PostLike>,
  ) {}

  async create(createPostDto: CreatePostDto, user: IUser) {
    const { content, privacy, medias, userTags, feelings } = createPostDto;
    const payload = {
      content,
      privacy,
      medias,
      userTags,
      feelings,
      userId: user._id,
    };
    const result = await this.postModel.create(payload);
    return {
      _id: result._id,
    };
  }

  findAll() {
    return `This action returns all posts`;
  }

  findOne(id: number) {
    return `This action returns a #${id} post`;
  }

  update(id: number, updatePostDto: UpdatePostDto) {
    return `This action updates a #${id} post`;
  }

  remove(id: number) {
    return `This action removes a #${id} post`;
  }
}
