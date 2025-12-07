import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req } from '@nestjs/common';
import type { IRequest } from '@social/types/cores.type';
import { CreatePostDto, CreatePostLikeDto, CreateSharePostDto } from './dto/create-post.dto';
import { PostsService } from './posts.service';
import { UpdatePostDto } from './dto/update-post.dto';

@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Post()
  createPost(@Body() createPostDto: CreatePostDto, @Req() req: IRequest) {
    return this.postsService.createPost(createPostDto, req.user);
  }

  @Post('share')
  createSharePost(@Body() createSharePostDto: CreateSharePostDto, @Req() req: IRequest) {
    return this.postsService.createSharePost(createSharePostDto, req.user);
  }

  @Post('likes')
  actionPostLike(@Body() createPostLikeDto: CreatePostLikeDto, @Req() req: IRequest) {
    return this.postsService.actionPostLike(createPostLikeDto, req.user);
  }

  @Post('save')
  actionPostSave(@Body('postId') postId: string, @Req() req: IRequest) {
    return this.postsService.actionPostSave(postId, req.user);
  }

  @Get('user/:userId')
  fetchPostsByUserId(@Param('userId') userId: string, @Query() query: any, @Req() req: IRequest) {
    return this.postsService.fetchPostsByUserId(userId, req.user, query);
  }

  @Get()
  fetchPosts(@Query() query, @Req() req: IRequest) {
    return this.postsService.fetchPosts(query, req.user);
  }

  @Get('saved')
  fetchPostSave(@Query() query: any, @Req() req: IRequest) {
    return this.postsService.fetchPostSave(req.user, query);
  }

  @Get(':id')
  findPostById(@Param('id') id: string, @Req() req: IRequest) {
    return this.postsService.findPostById(id, req.user);
  }

  @Get('watch/videos')
  fetchPostVideos(@Query() query, @Req() req: IRequest) {
    return this.postsService.fetchPostVideos(query, req.user);
  }

  @Patch(':id')
  updatePost(@Param('id') id: string, @Body() updatePostDto: UpdatePostDto, @Req() req: IRequest) {
    return this.postsService.updatePost(id, updatePostDto, req.user);
  }

  @Delete('unsave/:postId')
  deletePostSave(@Param('postId') postId: string, @Req() req: IRequest) {
    return this.postsService.deletePostSave(postId, req.user);
  }

  @Delete(':id')
  deletePost(@Param('id') id: string, @Req() req: IRequest) {
    return this.postsService.deletePost(id, req.user);
  }
}
