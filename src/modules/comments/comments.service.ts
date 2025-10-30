import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ICommentQuery } from '@social/types/comment.type';
import { IUser } from '@social/types/users.type';
import mongoose, { Model } from 'mongoose';
import pLimit from 'p-limit';
import { Post, PostDocument } from '../posts/schemas/post.schema';
import { UploadsService } from '../uploads/uploads.service';
import { CreateCommentDto, CreateCommentLikeDto } from './dto/create-comment.dto';
import { Comment, CommentDocument } from './schemas/comment.schema';

@Injectable()
export class CommentsService {
  constructor(
    @InjectModel(Comment.name) private commentModel: Model<CommentDocument>,
    @InjectModel(Post.name) private postModel: Model<PostDocument>,
    private readonly uploadsService: UploadsService,
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

  async getComments(postId: string, query: ICommentQuery) {
    const pageNumber = query.page ? Number(query.page) : 1;
    const limitNumber = query.limit ? Number(query.limit) : 10;
    const skip = (pageNumber - 1) * limitNumber;
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

    const [comments, total] = await Promise.all([
      this.commentModel.find(filter).populate('authorId', 'fullname avatar').limit(limitNumber).skip(skip).lean(),
      this.commentModel.countDocuments(filter),
    ]);
    return { list: comments, meta: { total } };
  }

  async actionLike(createCommentLikeDto: CreateCommentLikeDto, user: IUser) {
    const { commentId, type, isLike } = createCommentLikeDto;
    if (!mongoose.Types.ObjectId.isValid(commentId)) {
      throw new BadRequestException('Comment not found');
    }
    if (isLike) {
      const result = await this.commentModel.updateOne(
        { _id: commentId, 'userLikes.userId': user._id },
        { $set: { 'userLikes.$.type': type } },
      );

      if (result.modifiedCount === 0) {
        await this.commentModel.updateOne({ _id: commentId }, { $push: { userLikes: { userId: user._id, type } } });
      }
    } else {
      await this.commentModel.updateOne({ _id: commentId }, { $pull: { userLikes: { userId: user._id } } });
    }

    return {
      type,
      isLike,
    };
  }

  async deleteComment(commentId: string, user: IUser) {
    if (!mongoose.Types.ObjectId.isValid(commentId)) {
      throw new BadRequestException('Comment not found');
    }

    const [existingComment, childrenOfComment] = await Promise.all([
      this.commentModel.findOne({ _id: commentId, authorId: user._id }),
      this.commentModel.find({ parentId: commentId }),
    ]);
    if (!existingComment) {
      throw new BadRequestException('Comment not found');
    }

    const keysS3: string[] = [];
    if (existingComment.media && existingComment.media.keyS3) {
      keysS3.push(existingComment.media.keyS3);
    }

    const level = existingComment.level;
    const parentId = existingComment.parentId;
    const limit = pLimit(10);
    const findTasks: any[] = [];
    const commentIds = [commentId];
    for (const child of childrenOfComment) {
      const findTask = limit(async () => {
        if (child.media && child.media.keyS3) {
          keysS3.push(child.media.keyS3);
        }
        commentIds.push(child._id.toString());
        const childrenOfChild = await this.commentModel.find({ parentId: child._id.toString() }, { _id: 1, medias: 1 });
        childrenOfChild.forEach(c => {
          commentIds.push(c._id.toString());
          if (c.media && c.media.keyS3) {
            keysS3.push(c.media.keyS3);
          }
        });
      });
      findTasks.push(findTask);
    }
    await Promise.all(findTasks);
    const promises: any[] = [
      this.commentModel.deleteMany({ _id: { $in: commentIds } }),
      this.postModel.updateOne({ _id: existingComment.postId }, { $inc: { commentCount: -commentIds.length } }),
      this.uploadsService.deleteFiles(keysS3),
    ];
    if (level > 0) {
      promises.push(this.commentModel.updateOne({ _id: parentId }, { $inc: { replyCount: -1 } }));
    }

    await Promise.all(promises);

    return {
      countDeleted: commentIds.length,
      postId: existingComment.postId,
      commentId,
    };
  }
}
