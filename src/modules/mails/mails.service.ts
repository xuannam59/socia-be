import { InjectQueue } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { Queue } from 'bullmq';
import { ISendMail } from '@social/types/mail.type';

@Injectable()
export class MailsService {
  constructor(@InjectQueue('mail-queue') private readonly mailQueue: Queue) {}

  async sendOtpEmail(infoMail: ISendMail): Promise<void> {
    await this.mailQueue.add('send-mail', { infoMail, template: 'send-otp' });
  }
}
