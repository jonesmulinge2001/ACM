/* eslint-disable prettier/prettier */
import { IsNotEmpty, IsString } from 'class-validator';

export class UpdateGroupResourceCommentDto {
  @IsNotEmpty()
  @IsString()
  content: string;
}
