/* eslint-disable prettier/prettier */
import { IsEmail, IsString } from 'class-validator';

/* eslint-disable prettier/prettier */
export class LoginUserDto {

    @IsEmail()
    @IsString()
    email: string;

    @IsString()
    password: string;
  }