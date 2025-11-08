import { Module } from '@nestjs/common';
import { StoriesService } from './stories.service';
import { StoriesController } from './stories.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Story, StorySchema } from './schemas/story.schema';
import { StoryViewer, StoryViewerSchema } from './schemas/story-viewer.schema';
import { User, UserSchema } from '@social/users/schemas/user.schema';
import { UploadsModule } from '../uploads/uploads.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Story.name, schema: StorySchema },
      { name: StoryViewer.name, schema: StoryViewerSchema },
    ]),
    UploadsModule,
  ],
  controllers: [StoriesController],
  providers: [StoriesService],
})
export class StoriesModule {}
