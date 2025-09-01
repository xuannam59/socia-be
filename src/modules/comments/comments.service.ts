import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { CommentLike, CommentLikeDocument } from './schemas/comment-like.schema';
import { Comment, CommentDocument } from './schemas/comment.schema';
import mongoose, { Model } from 'mongoose';
import { CreateCommentDto, CreateCommentLikeDto } from './dto/create-comment.dto';
import { IUser } from '@social/types/users.type';
import { PostsService } from '../posts/posts.service';
import { Post, PostDocument } from '../posts/schemas/post.schema';
import { ICommentQuery } from '@social/types/comment.type';

@Injectable()
export class CommentsService {
  constructor(
    @InjectModel(Comment.name) private commentModel: Model<CommentDocument>,
    @InjectModel(CommentLike.name) private commentLikeModel: Model<CommentLikeDocument>,
    @InjectModel(Post.name) private postModel: Model<PostDocument>,
  ) {}

  async create(createCommentDto: CreateCommentDto, user: IUser) {
    const { content, postId, parentId, media, mentions, level } = createCommentDto;
    const existingPost = await this.postModel.findById(postId);
    if (!existingPost) {
      throw new BadRequestException('Post not exist');
    }

    const payload: any = {
      content,
      postId,
      parentId,
      media,
      mentions,
      authorId: user._id,
      level,
    };

    if (parentId) {
      const existingParentComment = await this.commentModel.findById(parentId);
      if (!existingParentComment) {
        throw new BadRequestException('Parent comment not exists');
      }
      payload.parentId = existingParentComment._id.toString();
    }

    const promises: any[] = [
      this.commentModel.create(payload),
      this.postModel.updateOne({ _id: postId }, { $inc: { commentCount: 1 } }),
    ];

    if (parentId) {
      promises.push(this.commentModel.updateOne({ _id: parentId }, { $inc: { replyCount: 1 } }));
    }

    const [comment] = await Promise.all(promises);

    return {
      _id: comment._id,
    };
  }

  async getComments(postId: string, user: IUser, query: ICommentQuery) {
    const existingPost = await this.postModel.findById(postId);
    if (!existingPost) {
      throw new BadRequestException('Post not found');
    }
    const filter: any = {
      postId,
      level: 0,
    };

    if (query.level) {
      filter.level = query.level;
    }
    if (query.parentId) {
      filter.parentId = query.parentId;
    }

    const comments = await this.commentModel
      .find(filter)
      .populate('authorId', 'fullname avatar')
      .limit(10)
      .sort({ createdAt: -1 })
      .lean();

    const commentsWithLikeStatus = await Promise.all(
      comments.map(async comment => {
        const userLike = await this.commentLikeModel.findOne({
          commentId: comment._id.toString(),
          authorId: user._id,
        });
        const liked = {
          isLiked: userLike ? true : false,
          type: userLike ? userLike.type : null,
        };
        return {
          ...comment,
          userLiked: liked,
        };
      }),
    );
    return commentsWithLikeStatus;
  }

  async actionLike(createCommentLikeDto: CreateCommentLikeDto, user: IUser) {
    const { commentId, type, isLike } = createCommentLikeDto;
    if (!mongoose.Types.ObjectId.isValid(commentId)) {
      throw new BadRequestException('Comment not found');
    }
    const existingCommentLike = await this.commentLikeModel.findOne({
      commentId,
      authorId: user._id,
    });
    if (!existingCommentLike && !isLike) return;

    if (isLike) {
      if (existingCommentLike) {
        if (existingCommentLike.type !== type) {
          await this.commentLikeModel.updateOne({ _id: existingCommentLike._id }, { type });
        }
      } else {
        await Promise.all([
          this.commentLikeModel.create({ commentId, authorId: user._id, type }),
          this.commentModel.updateOne({ _id: commentId }, { $inc: { likeCount: 1 } }),
        ]);
      }
    } else {
      if (existingCommentLike) {
        await Promise.all([
          this.commentLikeModel.deleteOne({ _id: existingCommentLike._id }),
          this.commentModel.updateOne({ _id: commentId }, { $inc: { likeCount: -1 } }),
        ]);
      }
    }

    return {
      type,
      isLike,
    };
  }
}
