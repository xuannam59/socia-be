import { Controller, Get, Post, Body, Patch, Param, Delete, Req, Query } from '@nestjs/common';
import { StoriesService } from './stories.service';
import { CreateStoryDto } from './dto/create-story.dto';
import { UpdateStoryDto } from './dto/update-story.dto';
import type { IRequest } from '@social/types/cores.type';
import type { IStoryQuery } from '@social/types/stoies.type';

@Controller('stories')
export class StoriesController {
  constructor(private readonly storiesService: StoriesService) {}

  @Post()
  create(@Body() createStoryDto: CreateStoryDto, @Req() req: IRequest) {
    return this.storiesService.create(createStoryDto, req.user);
  }

  @Get()
  findAll(@Query() query: IStoryQuery, @Req() req: IRequest) {
    return this.storiesService.findAll(query, req.user);
  }

  @Get(':userId')
  findUserStory(@Param('userId') userId: string, @Req() req: IRequest) {
    return this.storiesService.findUserStory(userId, req.user);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateStoryDto: UpdateStoryDto) {
    return this.storiesService.update(+id, updateStoryDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.storiesService.remove(+id);
  }
}
