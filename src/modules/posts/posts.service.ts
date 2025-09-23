import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { IUser } from '@social/types/users.type';
import { Model } from 'mongoose';
import { CreatePostDto, CreatePostLikeDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { PostLike } from './schemas/post-like.schema';
import { Post } from './schemas/post.schema';
import mongoose from 'mongoose';

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
      authorId: user._id,
    };
    const result = await this.postModel.create(payload);
    return {
      _id: result._id,
    };
  }

  async actionLike(createPostLikeDto: CreatePostLikeDto, user: IUser) {
    const { postId, type, isLike } = createPostLikeDto;

    const existingPostLike = await this.postLikeModel.findOne({
      authorId: user._id,
      postId,
    });

    if (!existingPostLike && !isLike) return;

    if (isLike) {
      if (existingPostLike) {
        if (existingPostLike.type !== type) {
          await this.postLikeModel.updateOne({ _id: existingPostLike._id }, { type });
        }
      } else {
        // socket emit
        await Promise.all([
          this.postLikeModel.create({ authorId: user._id, postId, type }),
          this.postModel.updateOne({ _id: postId }, { $inc: { likeCount: 1 } }),
        ]);
      }
    } else {
      if (existingPostLike) {
        await Promise.all([
          this.postLikeModel.deleteOne({ _id: existingPostLike._id }),
          this.postModel.updateOne({ _id: postId }, { $inc: { likeCount: -1 } }),
        ]);
      }
    }

    return {
      type,
      isLike,
    };
  }

  async findUserLike(postId: string, user: IUser) {
    const existPostLike = await this.postLikeModel.findOne({ authorId: user._id, postId });
    return {
      _id: existPostLike?._id,
      type: existPostLike?.type,
    };
  }

  async findAll(query: any, user: IUser) {
    const { page = 1, limit = 10, userId } = query;
    const skip = (page - 1) * limit;

    const filter: any = {};
    if (userId) {
      filter.authorId = userId;
    }

    const posts = await this.postModel
      .find(filter)
      .populate({ path: 'authorId', select: 'fullname avatar' })
      .populate({ path: 'userTags', select: 'fullname avatar' })
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 })
      .lean();

    // Map qua posts để thêm thông tin like của user hiện tại
    const postsWithLikeStatus = await Promise.all(
      posts.map(async post => {
        const userLike = await this.postLikeModel.findOne({
          authorId: user._id,
          postId: post._id.toString(),
        });

        const liked = {
          isLiked: userLike ? true : false,
          type: userLike ? userLike.type : null,
        };

        return {
          ...post,
          userLiked: liked,
        };
      }),
    );

    return postsWithLikeStatus;
  }

  async findOne(id: string) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid post id');
    }
    const post = await this.postModel.findOne({ _id: id });
    if (!post) {
      throw new BadRequestException('Post not found');
    }
    return post.toObject();
  }

  update(id: number, updatePostDto: UpdatePostDto) {
    return `This action updates a #${id} post`;
  }

  remove(id: number) {
    return `This action removes a #${id} post`;
  }
}
