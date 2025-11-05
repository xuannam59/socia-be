import { Processor, WorkerHost } from '@nestjs/bullmq';
import { ConfigService } from '@nestjs/config';
import sgMail from '@sendgrid/mail';
import { ISendMail } from '@social/types/mail.type';
import { Job } from 'bullmq';
import { mailTemplateSendOtp } from './templates/mail-template';

@Processor('mail-queue')
export class MailProcessorService extends WorkerHost {
  constructor(private readonly configService: ConfigService) {
    super();
    const apiKey = this.configService.get<string>('SENDGRID_API_KEY');
    if (apiKey) {
      sgMail.setApiKey(apiKey);
    }
  }

  async process(job: Job<{ infoMail: ISendMail; template: string }>): Promise<void> {
    const { infoMail, template } = job.data;

    const from = this.configService.get<string>('SENDGRID_FROM');
    if (!from) {
      throw new Error('SENDGRID_FROM is not configured');
    }

    let html = '';
    if (template === 'send-otp') {
      html = mailTemplateSendOtp(infoMail.name ?? 'bạn', infoMail.data);
    }

    await sgMail.send({
      to: infoMail.email,
      from,
      subject: infoMail.subject,
      html,
    });
  }
}
