/* eslint-disable prettier/prettier */
import { Controller, Post, Body } from '@nestjs/common';
import { ResendService } from '../shared/mailer/resend.service';

@Controller('debug')
export class DebugController {
  constructor(private readonly resendService: ResendService) {}

  @Post('send-test-email')
  async sendTest(@Body('email') email: string) {
    await this.resendService.sendTestEmail(email);
    return { message: `Test email sent to ${email}` };
  }
}
