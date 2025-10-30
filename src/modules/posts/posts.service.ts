import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { IUser } from '@social/types/users.type';
import { Model } from 'mongoose';
import { CreatePostDto, CreatePostLikeDto } from './dto/create-post.dto';
import { Post } from './schemas/post.schema';
import mongoose from 'mongoose';

@Injectable()
export class PostsService {
  constructor(@InjectModel(Post.name) private postModel: Model<Post>) {}

  async createPost(createPostDto: CreatePostDto, user: IUser) {
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

  async actionPostLike(createPostLikeDto: CreatePostLikeDto, user: IUser) {
    const { postId, type, isLike } = createPostLikeDto;

    if (isLike) {
      const result = await this.postModel.updateOne(
        { _id: postId, 'userLikes.userId': user._id },
        { $set: { 'userLikes.$.type': type } },
      );

      if (result.modifiedCount === 0) {
        await this.postModel.updateOne({ _id: postId }, { $push: { userLikes: { userId: user._id, type } } });
      }
    } else {
      await this.postModel.updateOne(
        { _id: postId, 'userLikes.userId': user._id },
        { $pull: { userLikes: { userId: user._id } } },
      );
    }

    return {
      type,
      isLike,
    };
  }

  async fetchPosts(query: any, user: IUser) {
    const { userId } = query;
    const pageNumber = query.page ? Number(query.page) : 1;
    const limitNumber = query.limit ? Number(query.limit) : 10;
    const skip = (pageNumber - 1) * limitNumber;

    const filter: any = {
      privacy: 'public',
    };
    if (userId) {
      filter.authorId = userId;
    }

    const [posts, total] = await Promise.all([
      this.postModel
        .find(filter)
        .populate({ path: 'authorId', select: 'fullname avatar' })
        .populate({ path: 'userTags', select: 'fullname avatar' })
        .skip(skip)
        .limit(limitNumber)
        .sort({ createdAt: -1 })
        .lean(),
      this.postModel.countDocuments(filter),
    ]);

    const newPosts = posts.map(post => {
      const userLiked = post.userLikes.find(like => like.userId === user._id);
      return {
        ...post,
        userLiked: userLiked ?? null,
      };
    });

    return {
      list: newPosts,
      meta: { total },
    };
  }

  async findPostById(postId: string, user: IUser) {
    if (!mongoose.Types.ObjectId.isValid(postId)) {
      throw new BadRequestException('Invalid post id');
    }
    const post = await this.postModel
      .findById(postId)
      .populate({ path: 'authorId', select: 'fullname avatar' })
      .populate({ path: 'userTags', select: 'fullname avatar' })
      .lean();
    if (!post) throw new BadRequestException('Post not found');

    const userLiked = post.userLikes.find(like => like.userId === user._id);

    return {
      ...post,
      userLiked: userLiked ?? null,
    };
  }
}
