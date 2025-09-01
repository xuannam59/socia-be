import { Controller, Req, Post, Body, Param, Get, Query } from '@nestjs/common';
import { CommentsService } from './comments.service';
import { CreateCommentDto, CreateCommentLikeDto } from './dto/create-comment.dto';
import type { IRequest } from '@social/types/cores.type';
import type { ICommentQuery } from '@social/types/comment.type';

@Controller('comments')
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Post()
  create(@Body() createCommentDto: CreateCommentDto, @Req() req: IRequest) {
    return this.commentsService.create(createCommentDto, req.user);
  }

  @Get(':id')
  getComments(@Param('id') postId: string, @Req() req: IRequest, @Query() query: ICommentQuery) {
    return this.commentsService.getComments(postId, req.user, query);
  }

  @Post('likes')
  actionLike(@Body() createCommentLikeDto: CreateCommentLikeDto, @Req() req: IRequest) {
    return this.commentsService.actionLike(createCommentLikeDto, req.user);
  }
}
