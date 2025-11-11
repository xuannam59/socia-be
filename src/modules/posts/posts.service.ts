import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { IUser } from '@social/types/users.type';
import { Model } from 'mongoose';
import { CreatePostDto, CreatePostLikeDto, CreateSharePostDto } from './dto/create-post.dto';
import { Post } from './schemas/post.schema';
import mongoose from 'mongoose';
import { UpdatePostDto } from './dto/update-post.dto';
import { UploadsService } from '../uploads/uploads.service';
import { Comment } from '../comments/schemas/comment.schema';
import { Notification } from '../notifications/schemas/notification.schema';

@Injectable()
export class PostsService {
  constructor(
    @InjectModel(Post.name) private postModel: Model<Post>,
    @InjectModel(Comment.name) private commentModel: Model<Comment>,
    @InjectModel(Notification.name) private notificationModel: Model<Notification>,
    private readonly uploadsService: UploadsService,
  ) {}

  async createPost(createPostDto: CreatePostDto, user: IUser) {
    const { content, privacy, medias, userTags, feeling } = createPostDto;
    const payload = {
      content,
      privacy,
      medias,
      userTags,
      feeling,
      authorId: user._id,
    };
    const result = await this.postModel.create(payload);
    return result;
  }

  async createSharePost(createSharePostDto: CreateSharePostDto, user: IUser) {
    const { parentId, content, privacy } = createSharePostDto;
    const payload = {
      parentId,
      content,
      privacy,
      authorId: user._id,
    };
    await Promise.all([
      this.postModel.create(payload),
      this.postModel.updateOne({ _id: parentId }, { $inc: { shareCount: 1 } }),
    ]);
    return 'Shared successfully';
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
    const pageNumber = query.page ? Number(query.page) : 1;
    const limitNumber = query.limit ? Number(query.limit) : 10;
    const skip = (pageNumber - 1) * limitNumber;

    const filter: any = {
      $or: [{ privacy: 'public' }, { privacy: 'friends', authorId: { $in: [...user.friends, user._id] } }],
    };

    const [posts, total] = await Promise.all([
      this.postModel
        .find(filter)
        .populate({ path: 'authorId', select: 'fullname avatar' })
        .populate({ path: 'userTags', select: 'fullname avatar' })
        .populate({
          path: 'parentId',
          select: 'content authorId medias userTags feeling',
          populate: { path: 'authorId', select: 'fullname avatar' },
        })
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

  async fetchPostsByUserId(userId: string, user: IUser, query: any) {
    const pageNumber = query.page ? Number(query.page) : 1;
    const limitNumber = query.limit ? Number(query.limit) : 10;
    const skip = (pageNumber - 1) * limitNumber;

    const isMyProfile = userId === user._id;
    const isFriend = user.friends.includes(userId);

    let filter: any = {
      authorId: userId,
    };

    if (!isMyProfile) {
      if (isFriend) {
        filter = {
          privacy: { $ne: 'private' },
          authorId: userId,
        };
      } else {
        filter = {
          privacy: { $eq: 'public' },
          authorId: userId,
        };
      }
    }

    const [posts, total] = await Promise.all([
      this.postModel
        .find(filter)
        .populate({ path: 'authorId', select: 'fullname avatar' })
        .populate({ path: 'userTags', select: 'fullname avatar' })
        .populate({
          path: 'parentId',
          select: 'content authorId medias userTags feeling',
          populate: { path: 'authorId', select: 'fullname avatar' },
        })
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

  async updatePost(postId: string, updatePostDto: UpdatePostDto, user: IUser) {
    const { content, privacy, medias, userTags, feeling } = updatePostDto;
    if (!mongoose.Types.ObjectId.isValid(postId)) {
      throw new BadRequestException('Invalid post id');
    }
    const post = await this.postModel.findById(postId);
    if (!post) throw new BadRequestException('Post not found');
    if (post.authorId.toString() !== user._id.toString()) {
      throw new BadRequestException('You are not the author of this post');
    }
    let needDeleteMedias: string[] = [];
    const oldMedias = post.medias || [];

    if (medias && medias.length > 0) {
      for (const oldMedia of oldMedias) {
        if (!medias.find(media => media.keyS3 === oldMedia.keyS3)) {
          needDeleteMedias.push(oldMedia.keyS3);
        }
      }
    } else if (oldMedias.length > 0) {
      needDeleteMedias = oldMedias.map(media => media.keyS3);
    }

    await Promise.all([
      this.postModel.updateOne({ _id: postId }, { content, privacy, medias, userTags, feeling }),
      this.uploadsService.deleteFiles(needDeleteMedias),
    ]);

    return 'Updated successfully';
  }

  async deletePost(postId: string, user: IUser) {
    if (!mongoose.Types.ObjectId.isValid(postId)) {
      throw new BadRequestException('Invalid post id');
    }
    const [post, comments] = await Promise.all([
      this.postModel.findById(postId),
      this.commentModel.find({ postId: postId }).select('media'),
    ]);
    if (!post) throw new BadRequestException('Post not found');
    if (post.authorId.toString() !== user._id.toString()) {
      throw new BadRequestException('You are not the author of this post');
    }
    const keysS3 = post.medias.map(media => media.keyS3);
    keysS3.push(...comments.map(comment => comment.media.keyS3));
    await Promise.all([
      this.postModel.deleteOne({ _id: postId }),
      this.commentModel.deleteMany({ postId: postId }),
      this.notificationModel.deleteMany({ entityId: postId }),
      this.uploadsService.deleteFiles(keysS3),
    ]);
    return 'Post deleted successfully';
  }
}
