import { Processor, WorkerHost } from '@nestjs/bullmq';
import { ConfigService } from '@nestjs/config';
import { Job } from 'bullmq';
import { ISendMail } from '@social/types/mail.type';
import sgMail from '@sendgrid/mail';
import * as fs from 'fs';
import * as path from 'path';
import Handlebars from 'handlebars';

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

    const templateFilePath = path.join(__dirname, './templates', `${template}.hbs`);
    const templateSource = fs.readFileSync(templateFilePath, 'utf8');
    const compileTemplate = Handlebars.compile(templateSource);
    const html = compileTemplate({
      otp: infoMail.data,
      name: infoMail.name ?? 'bạn',
    });

    await sgMail.send({
      to: infoMail.email,
      from,
      subject: infoMail.subject,
      html,
    });
  }
}
