/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

@Injectable()
export class ResendService {
  private readonly logger = new Logger(ResendService.name);
  private resend: Resend;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('RESEND_API_KEY');

    if (!apiKey) {
      this.logger.error('RESEND_API_KEY is missing');
      throw new Error('RESEND_API_KEY is not set');
    }

    this.resend = new Resend(apiKey);
    this.logger.log('Resend service initialized');
  }

  async sendTestEmail(to: string): Promise<void> {
    try {
      await this.resend.emails.send({
        from: this.configService.get<string>(
          'EMAIL_FROM',
          'onboarding@resend.dev',
        ),
        to,
        subject: 'Academeet – Resend Test Email',
        html: `<p>This is a test email from <strong>Academeet</strong> using Resend.</p>`,
      });

      this.logger.log(`✅ Test email sent to ${to}`);
    } catch (error: any) {
      this.logger.error(
        `❌ Failed to send test email to ${to}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }
}
