/* eslint-disable prettier/prettier */
import { Module } from '@nestjs/common';
import { JwtService } from './jwt.service';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule } from '@nestjs/config';
import { JwtStrategy } from 'src/strategies/jwt.strategy';

@Module({
  imports: [PassportModule, ConfigModule],
  providers: [JwtService, JwtStrategy],
  exports: [JwtService, JwtStrategy],
})
export class JwtModule {}
