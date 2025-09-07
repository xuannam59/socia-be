import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { MailsService } from './mails.service';
import { MailsController } from './mails.controller';
import { MailProcessorService } from './mail.processor';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'mail-queue',
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 5000,
        },
        removeOnComplete: true,
        removeOnFail: true,
      },
    }),
  ],
  controllers: [MailsController],
  providers: [MailsService, MailProcessorService],
  exports: [MailsService],
})
export class MailsModule {}
