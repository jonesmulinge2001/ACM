/* eslint-disable prettier/prettier */
import { IsEnum, IsOptional, IsUUID } from 'class-validator';
import { GroupRole } from 'generated/prisma';

export class JoinGroup {
  @IsUUID()
  groupId: string;

  // optional client hint(server assigns MEMBER by default)
  @IsOptional()
  @IsEnum(GroupRole)
  role?: GroupRole;
}
