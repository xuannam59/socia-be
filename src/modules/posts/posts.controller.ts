import { Controller, Get, Post, Body, Patch, Param, Delete, Req, Query } from '@nestjs/common';
import { PostsService } from './posts.service';
import { CreatePostDto, CreatePostLikeDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import type { IRequest } from '@social/types/cores.type';
import { Throttle } from '@nestjs/throttler';

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
  findOne(@Param('id') id: string) {
    return this.postsService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updatePostDto: UpdatePostDto) {
    return this.postsService.update(+id, updatePostDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.postsService.remove(+id);
  }
}
