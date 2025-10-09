/* eslint-disable prettier/prettier */
import { GroupRole } from 'generated/prisma';
import { IsArray, IsEnum,  IsNotEmpty,  IsString } from 'class-validator';

export class BulkAddMembersDto {
  @IsArray()
  @IsString({ each: true })
  userIds: string[];

  @IsEnum(GroupRole)
  role: GroupRole = GroupRole.MEMBER;
}

export class BulkRemoveMembersDto {
  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty()
  userIds: string[];
}

export class BulkRestoreMembersDto {
  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty()
  userIds: string[];
}

export class BulkUpdateRolesDto {
  @IsArray()
  @IsString({ each: true })
  userIds: string[];

  @IsEnum(GroupRole)
  role: GroupRole;
}
