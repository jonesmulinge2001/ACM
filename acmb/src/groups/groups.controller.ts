/* eslint-disable prettier/prettier */

/* eslint-disable prettier/prettier */

/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unsafe-argument */

/* eslint-disable @typescript-eslint/no-unsafe-member-access */

import { RequestWithUser } from 'src/interfaces/requestwithUser.interface';
/* eslint-disable prettier/prettier */
import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
  Get,
  Query,
  Delete,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/guards/jwt/jwtAuth.guard';
import { GroupsService } from './groups.service';
import { CreateGroupDto } from 'src/dto/create-group.dto';
import { UpdateGroupDto } from 'src/dto/update-group.dto';
import { JoinGroup } from 'src/dto/join-group.dto';
import { ShareResourceDto } from 'src/dto/share-resource.dto';
import { SendMessageDto } from 'src/dto/send-message.dto';
import { GroupRole } from 'generated/prisma';
import {
  BulkAddMembersDto,
  BulkRemoveMembersDto,
  BulkRestoreMembersDto,
  BulkUpdateRolesDto,
} from 'src/dto/bulk-member-action.dto';
import { AcademeetCloudinaryService, AcademeetUploadType } from 'src/shared/cloudinary/cloudinary/cloudinary.service';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('groups')
@UseGuards(JwtAuthGuard)
export class GroupsController {
  constructor(
    private readonly groupService: GroupsService,
    private readonly cloudinary: AcademeetCloudinaryService
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(FileInterceptor('coverImage'))
  async create(
    @Req() req: RequestWithUser,
    @Body() body: CreateGroupDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    let coverImageUrl: string | undefined;

    if (file) {
      const upload = await this.cloudinary.uploadMedia(file, AcademeetUploadType.COURSE_BANNER);
      coverImageUrl = upload.secure_url;
    }

    return this.groupService.createGroup(req.user.id, {
      ...body,
      coverImage: coverImageUrl,
    });
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(FileInterceptor('coverImage'))
  async update(
    @Req() req: RequestWithUser,
    @Param('id') id: string,
    @Body() body: UpdateGroupDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    let coverImageUrl: string | undefined;

    if (file) {
      const upload = await this.cloudinary.uploadMedia(file, AcademeetUploadType.COURSE_BANNER);
      coverImageUrl = upload.secure_url;
    }

    return this.groupService.updateGroup(id, req.user.id, {
      ...body,
      coverImage: coverImageUrl ?? body.coverImage,
    });
  }


  @Post(':id/join')
  @HttpCode(HttpStatus.CREATED)
  async join(@Req() req, @Param('id') id: string, @Body() dto?: JoinGroup) {
    // allow joining with path param
    const parsed: JoinGroup = { groupId: id, ...(dto ?? {}) } as JoinGroup;
    return this.groupService.joinGroup(req.user.id, parsed);
  }

  @Post(':id/leave')
  @HttpCode(HttpStatus.OK)
  async leave(@Req() req, @Param('id') id: string) {
    return this.groupService.leaveGroup(req.user.id, id);
  }

  @Post(':id/resources')
  @HttpCode(HttpStatus.CREATED)
  async shareResource(
    @Req() req,
    @Param('id') id: string,
    @Body() dto: ShareResourceDto,
  ) {
    // enforce groupId matches path
    if (dto.groupId !== id) dto.groupId = id;
    return this.groupService.shareResource(req.user.id, dto);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  async getGroup(@Param('id') id: string) {
    return this.groupService.getGroupById(id);
  }

  @Get(':id/messages')
  @HttpCode(HttpStatus.OK)
  async getMessages(
    @Param('id') id: string,
    @Query('limit') limit = '50',
    @Query('cursor') cursor?: string,
  ) {
    const l = Math.min(Number(limit) || 50, 200);
    return this.groupService.getGroupMessages(id, l, cursor);
  }

  // Optionally: send message via REST (useful for bots or fallback)
  @Post(':id/messages')
  @HttpCode(HttpStatus.CREATED)
  async postMessage(
    @Req() req,
    @Param('id') id: string,
    @Body() dto: SendMessageDto,
  ) {
    // ensure groupId matches param
    if (dto.groupId !== id) dto.groupId = id;
    return this.groupService.sendMessage(req.user.id, dto);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  async getAllGroups() {
    return this.groupService.getAllGroups();
  }

  @Post(':id/members/:userId')
  @HttpCode(HttpStatus.CREATED)
  async addMemberAsAdmin(
    @Param('id') groupId: string,
    @Param('userId') userId: string,
    @Body('role') role?: GroupRole,
  ) {
    return this.groupService.addMemberAsAdmin(
      groupId,
      userId,
      role ?? GroupRole.MEMBER,
    );
  }

  @Delete(':id/members/:userId/remove')
  @HttpCode(HttpStatus.OK)
  async removeMemberAsAdmin(
    @Param('id') groupId: string,
    @Param('userId') userId: string,
  ) {
    return this.groupService.removeMemberAsAdmin(groupId, userId);
  }

  @Post(':groupId/members/bulk-add')
  async bulkAddMembers(
    @Param('groupId') groupId: string,
    @Body() dto: BulkAddMembersDto,
    @Req() req: RequestWithUser,
  ) {
    return this.groupService.bulkAddMembers(groupId, req.user.id, dto);
  }

  @Post(':groupId/members/bulk-remove')
  async bulkRemoveMembers(
    @Param('groupId') groupId: string,
    @Body() dto: BulkRemoveMembersDto,
    @Req() req: RequestWithUser,
  ) {
    return this.groupService.bulkRemoveMembers(groupId, req.user.id, dto);
  }

  @Post(':groupId/members/bulk-restore')
  async bulkRestoreMembers(
    @Param('groupId') groupId: string,
    @Body() dto: BulkRestoreMembersDto,
    @Req() req: RequestWithUser,
  ) {
    return this.groupService.bulkRestoreMembers(groupId, req.user.id, dto);
  }


  @Post(':groupId/members/bulk-update-roles')
  async bulkUpdateRoles(
    @Param('groupId') groupId: string,
    @Body() dto: BulkUpdateRolesDto,
    @Req() req: RequestWithUser,
  ) {
    return this.groupService.bulkUpdateRoles(groupId, req.user.id, dto);
  }
}
