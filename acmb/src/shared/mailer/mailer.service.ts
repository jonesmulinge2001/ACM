/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unused-vars */
 
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable prettier/prettier */
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import * as path from 'path';
import * as fs from 'fs';
import * as ejs from 'ejs';
import { text } from 'stream/consumers';
/* eslint-disable prettier/prettier */
export interface EmailOptions {
  to: string;
  subject: string;
  template?: string;
  context?: Record<string, any>;
  html?: string;
  text?: string;
}

export interface WelcomeEmailContext {
    username: string;
    email: string;
    academeetName?: string;
    supportEmail?: string;
    loginUrl?: string;
}

@Injectable()
export class MailerService {
    private readonly logger = new Logger(MailerService.name);
    private transporter: nodemailer.Transporter;
    private templatesPath: string;

    constructor(private configService: ConfigService) {
        this.templatesPath = path.join(process.cwd(), 'src', 'templates');
        this.initializeTransportner();
    }

    private initializeTransportner(): void {
        const smtConfig = {
            host: this.configService.get<string>('SMT_HOST','smtp.gmail.com'),
            port: this.configService.get<number>('SMTP_PORT', 587),
            secure: this.configService.get<boolean>('SMTP_SECURE', false),
            auth: {
                user: this.configService.get<string>('SMTP_USER'),
                pass: this.configService.get<string>('SMTP_PASS'),
            },
        };
        this.transporter = nodemailer.createTransport(smtConfig);
        this.logger.log('Email transporter initialized');
    }

    async sendEmail(options: EmailOptions): Promise<void> {
        try{
            let html = options.html;
            if(options.template && options.context) {
                html = await this.renderTemplate(options.template, options.context);
            }
            const mailOptions = {
                from: this.configService.get<string>('SMTP_FROM', 'jonathanmulingemwandi@gmail.com'),
                to: options.to,
                subject: options.subject,
                html,
                text: options.text,
            }
            const result = await this.transporter.sendMail(mailOptions);
            this.logger.log(`Email sent to ${options.to} with id ${result.messageId} successfully`);
        } catch (error) {
            this.logger.log(`Error sending email to ${options.to}: ${error.message}`);
        }
    }

    async sendWelcomeEmail(to: string, context: WelcomeEmailContext): Promise<void> {
        const emailOptions: EmailOptions = {
            to,
            subject: `Welcome to Academeet`,
            template: 'email/welcome',
            context: {
                ...context,
                name: context.username,
                storeName: context.academeetName,
                loginUrl: context.supportEmail || `${this.configService.get<string>('FRONTEND_URL', 'http://localhost:3000/auth/login')}`,
                supportEmail: context.supportEmail || this.configService.get<string>('SUPPORT_EMAIL','jonathanmulingemwandi@gmail.com'),
                academeetName: context.academeetName || 'Academeet',
                currentYear: new Date().getFullYear(),
            }
        }
        await this.sendEmail(emailOptions);
    }

    private async renderTemplate(templateName: string, context: Record<string, any>): Promise<string> {
        try{
            const templatePath = path.join(this.templatesPath, `${templateName}.ejs`);
            if(!fs.existsSync(templatePath)) {
                throw new Error(`template ${templateName} not found at ${templatePath}`);
            }
            const templateOptions = {
                filename: templatePath,
                cache: process.env.NODE_ENV === 'production',
                compileDebug: process.env.NODE_ENV !== 'production',
            };
            const html = await ejs.renderFile(templatePath, context, templateOptions);
            return html;
        } catch (error) {
            this.logger.error(`Error rendering template ${templateName}: ${error.message}`);
            throw error;
        }
    }
}
