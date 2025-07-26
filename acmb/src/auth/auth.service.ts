/* eslint-disable prettier/prettier */

/* eslint-disable prettier/prettier */

/* eslint-disable prettier/prettier */

/* eslint-disable prettier/prettier */
import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaClient } from 'generated/prisma';
import { MailerService } from 'src/shared/mailer/mailer.service';
import * as bcrypt from 'bcryptjs';
import { LoginUserDto } from 'src/dto/login.user';
import { RegisterUserDto } from 'src/dto/register.user.dto';

@Injectable()
export class AuthService {
  private prisma: PrismaClient;
  constructor(
    private readonly jwtService: JwtService,
    private readonly mailerService: MailerService,
  ) {
    this.prisma = new PrismaClient();
  }

  async register(data: RegisterUserDto) {
    const existing = await this.prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existing) {
      throw new ConflictException('User already exists');
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);
    const verificationCode = Math.floor(
      10000 + Math.random() * 90000,
    ).toString();

    const expiresAt = new Date();
    expiresAt.setSeconds(expiresAt.getSeconds() + 60);

    const user = await this.prisma.user.create({
      data: {
        email: data.email,
        password: hashedPassword,
        name: data.name,
        role: data.role,
        verifyToken: verificationCode,
        verifyTokenExpiresAt: expiresAt,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        isVerified: true,
        createdAt: true,
        updatedAt: true,
        deletedAt: true,
      },
    });

    try {
      await this.mailerService.sendEmail({
        to: user.email,
        subject: 'Verify Your Email - Academeet',
        html: `<p>Hi ${user.name},</p>
               <p>Your Email verification code is:</p>
               <h2>${verificationCode}</h2>
               <p>Please enter this code on the verification page to activate your account.</p>`,
      });
    } catch (emailError) {
      console.warn(`Failed to send verification email: ${emailError}`);
    }

    return user;
  }

  async verifyEmail(email: string, code: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) throw new Error('User not found');
    if (user.isVerified) throw new Error('User already verified');

    if (!user.verifyTokenExpiresAt || new Date() > user.verifyTokenExpiresAt) {
      throw new Error(
        'Verification code has expired. Please request a new one',
      );
    }

    if (user.verifyToken !== code) {
      throw new Error('Invalid verification code');
    }

    await this.prisma.user.update({
      where: { email },
      data: {
        isVerified: true,
        verifyToken: '',
        verifyTokenExpiresAt: null,
      },
    });

    return { message: 'Email verified successfully' };
  }

  async requestNewVerificationCode(email: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });
    if (!user) {
      throw new Error('User not found');
    }
    if (user.isVerified) {
      throw new ConflictException('User already verified');
    }

    const newCode = Math.floor(10000 + Math.random() * 90000).toString();
    const expiresAt = new Date();
    expiresAt.setSeconds(expiresAt.getSeconds() + 60);

    await this.prisma.user.update({
      where: { email },
      data: {
        verifyToken: newCode,
        verifyTokenExpiresAt: expiresAt,
      },
    });
    await this.mailerService.sendEmail({
      to: email,
      subject: 'New Email Verification Code - Academeet',
      html: `<p>Hi ${user.name},</p>
      <p>Your new verification code is:</p>
      <h2>${newCode}</h2>
      <p>This code expires in 60s`,
    });
    return { message: 'New verification code sent successfully' };
  }

  async login(data: LoginUserDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: data.email, isDeleted: false },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    if (!user.isVerified) {
      throw new Error('Please verify your email before logging in.');
    }

    const isValidPasword = await bcrypt.compare(data.password, user.password);
    if (!isValidPasword) {
      throw new Error('Invalid password');
    }

    const token = this.jwtService.sign({
      sub: user.id,
      email: user.email,
      role: user.role,
    });

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
    };
  }

  // forgot password
  async forgotPassword(email: string) {
    const user = await this.prisma.user.findUnique({
      where: { email, isVerified: true },
    });
    if (!user) {
      throw new NotFoundException(`User with email (${email}) does not exist`);
    }

    const restCode = Math.floor(10000 + Math.random() * 90000).toString();
    const expiresAt = new Date();
    expiresAt.setSeconds(expiresAt.getSeconds() + 60);

    await this.prisma.user.update({
      where: { email },
      data: {
        resetToken: restCode,
        resetTokenExpiresAt: expiresAt,
      },
    });

    await this.mailerService.sendEmail({
      to: email,
      subject: 'Reset Your Password - Academeet',
      html: `Your reset code is></p><h2>${restCode}</h2><p>This code expires in 60s </p>`,
    });

    return { message: 'Reset code sent to your email.' };
  }

  // resend reset code
  async resendResetCode(email: string) {
    {
      const user = await this.prisma.user.findUnique({
        where: { email },
      });
      if (!user) {
        throw new Error(`User with email (${email}) not found`);
      }
      const resetCode = Math.floor(10000 + Math.random() * 90000).toString();
      const expiresAt = new Date();
      expiresAt.setSeconds(expiresAt.getSeconds() + 60);

      await this.prisma.user.update({
        where: { email },
        data: {
          resetToken: resetCode,
          resetTokenExpiresAt: expiresAt,
        },
      });

      await this.mailerService.sendEmail({
        to: email,
        subject: 'Reset Your Password - Academeet',
        html: `<p>Your new password reset code is:</p><h2>${resetCode}</h2>
        <p>This code expires in 60s</p>`,
      });

      return { message: 'Reset code sent to your email.' };
    }
  }

  // reset password
  async resetPassword(email: string, code: string, newPassword: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });
    if (!user) return { message: 'Check reset code sent to your email.' };

    if (
      !user.resetToken ||
      !user.resetTokenExpiresAt ||
      new Date() > user.resetTokenExpiresAt
    ) {
      throw new Error('Reset code expired. Please request a new one');
    }

    if (user.resetToken !== code) {
      throw new NotFoundException('Invalid reset code');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await this.prisma.user.update({
      where: { email },
      data: {
        password: hashedPassword,
        resetToken: '',
        resetTokenExpiresAt: null,
      },
    });

    return { message: 'password reset successfully.' };
  }
}
