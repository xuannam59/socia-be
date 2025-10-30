import { Body, Controller, Get, Param, Post, Query, Req } from '@nestjs/common';
import type { IRequest } from '@social/types/cores.type';
import { CreatePostDto, CreatePostLikeDto } from './dto/create-post.dto';
import { PostsService } from './posts.service';

@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Post()
  createPost(@Body() createPostDto: CreatePostDto, @Req() req: IRequest) {
    return this.postsService.createPost(createPostDto, req.user);
  }

  @Post('likes')
  actionPostLike(@Body() createPostLikeDto: CreatePostLikeDto, @Req() req: IRequest) {
    return this.postsService.actionPostLike(createPostLikeDto, req.user);
  }

  @Get()
  fetchPosts(@Query() query, @Req() req: IRequest) {
    return this.postsService.fetchPosts(query, req.user);
  }

  @Get(':id')
  findPostById(@Param('id') id: string, @Req() req: IRequest) {
    return this.postsService.findPostById(id, req.user);
  }
}
