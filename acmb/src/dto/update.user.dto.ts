/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable prettier/prettier */
 
import { RegisterUserDto } from './register.user.dto';
import { PartialType } from '@nestjs/mapped-types';
export class UpdateUserDto extends PartialType(RegisterUserDto) {}
