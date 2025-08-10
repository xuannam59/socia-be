import { MailerService } from '@nestjs-modules/mailer';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { ConfigService } from '@nestjs/config';
import { Job } from 'bullmq';
import { ISendMail } from '@social/types/mail.type';

@Processor('mail-queue')
export class MailProcessorService extends WorkerHost {
  constructor(
    private mailerService: MailerService,
    private configService: ConfigService,
  ) {
    super();
  }

  async process(job: Job<{ infoMail: ISendMail; template: string }>): Promise<void> {
    const { infoMail, template } = job.data;
    try {
      await this.mailerService.sendMail({
        to: infoMail.email,
        from: this.configService.get<string>('EMAIL_AUTH_USER'),
        subject: infoMail.subject,
        template: template,
        context: {
          otp: infoMail.data,
          name: infoMail.name ?? 'bạn',
        },
      });
      console.log(`Email sent to ${infoMail.email}`);
    } catch (error) {
      console.error(`Failed to send email to ${infoMail.email}:`, error.message);
      throw error; // Ném lỗi để BullMQ đánh dấu job thất bại và retry
    }
  }
}
