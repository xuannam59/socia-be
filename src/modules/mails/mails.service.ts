import { InjectQueue } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { ISendMail } from '@social/types/mail.type';
import { Queue } from 'bullmq';

@Injectable()
export class MailsService {
  constructor(@InjectQueue('mail-queue') private mailQueue: Queue) {}

  async sendMailForgotPassword(infoMail: ISendMail) {
    await this.mailQueue.add(
      'send-mail',
      { infoMail, template: 'send-otp' },
      {
        removeOnComplete: true,
        removeOnFail: true,
      },
    );
    console.log(`Email queued for ${infoMail.email}`);
  }
}
