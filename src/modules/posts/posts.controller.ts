import { Body, Controller, Get, Param, Post, Query, Req } from '@nestjs/common';
import type { IRequest } from '@social/types/cores.type';
import { CreatePostDto, CreatePostLikeDto } from './dto/create-post.dto';
import { PostsService } from './posts.service';

@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Post()
  create(@Body() createPostDto: CreatePostDto, @Req() req: IRequest) {
    return this.postsService.create(createPostDto, req.user);
  }

  @Post('likes')
  actionLike(@Body() createPostLikeDto: CreatePostLikeDto, @Req() req: IRequest) {
    return this.postsService.actionLike(createPostLikeDto, req.user);
  }

  @Get('likes/:postId')
  findUserLike(@Param('postId') postId: string, @Req() req: IRequest) {
    return this.postsService.findUserLike(postId, req.user);
  }

  @Get()
  findAll(@Query() query, @Req() req: IRequest) {
    return this.postsService.findAll(query, req.user);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Req() req: IRequest) {
    return this.postsService.findOne(id, req.user);
  }
}
