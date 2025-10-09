/* eslint-disable prettier/prettier */
// src/auth/auth.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from '../strategies/jwt.strategy';
import { PermissionModule } from 'src/permissions/permission.module';
import { MailerModule } from 'src/shared/mailer/mailer.module';
import { MailerService } from 'src/shared/mailer/mailer.service';
@Module({
  imports: [
    PermissionModule,
    MailerModule,
    ConfigModule.forRoot({ isGlobal: true }), 
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'defaultSecret',
      signOptions: { expiresIn: '1d' },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, MailerService, JwtStrategy], 
  exports: [JwtModule],
})
export class AuthModule {}
