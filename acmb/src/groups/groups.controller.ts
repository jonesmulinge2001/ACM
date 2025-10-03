/* eslint-disable prettier/prettier */
import { RequestWithUser } from './../interfaces/requestwithUser.interface';
/* eslint-disable prettier/prettier */

/* eslint-disable prettier/prettier */

/* eslint-disable prettier/prettier */
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
  ValidationPipe,
  UsePipes,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/guards/jwt/jwtAuth.guard';
import { GroupsService } from './groups.service';
import { CreateGroupDto } from 'src/dto/create-group.dto';
import { UpdateGroupDto } from 'src/dto/update-group.dto';
import { JoinGroup } from 'src/dto/join-group.dto';
import { SendMessageDto } from 'src/dto/send-message.dto';
import { GroupRole } from 'generated/prisma';
import {
  BulkAddMembersDto,
  BulkRemoveMembersDto,
  BulkRestoreMembersDto,
  BulkUpdateRolesDto,
} from 'src/dto/bulk-member-action.dto';
import {
  AcademeetCloudinaryService,
  AcademeetUploadType,
} from 'src/shared/cloudinary/cloudinary/cloudinary.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { CreateGroupResourceDto } from 'src/dto/create-group-resource.dto';
import { CommentGroupResourceDto } from 'src/dto/comment-group-resource.dto';
import { UpdateGroupResourceCommentDto } from 'src/dto/update-group-resource-comment.dto';

@Controller('groups')
@UseGuards(JwtAuthGuard)
export class GroupsController {
  constructor(
    private readonly groupService: GroupsService,
    private readonly cloudinary: AcademeetCloudinaryService,
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
      const upload = await this.cloudinary.uploadMedia(
        file,
        AcademeetUploadType.COURSE_BANNER,
      );
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
      const upload = await this.cloudinary.uploadMedia(
        file,
        AcademeetUploadType.COURSE_BANNER,
      );
      coverImageUrl = upload.secure_url;
    }

    return this.groupService.updateGroup(id, req.user.id, {
      ...body,
      coverImage: coverImageUrl ?? body.coverImage,
    });
  }

  @Post(':id/join')
  @HttpCode(HttpStatus.CREATED)
  async join(
    @Req() req: RequestWithUser,
    @Param('id') id: string,
    @Body() dto?: JoinGroup,
  ) {
    // allow joining with path param
    const parsed: JoinGroup = { groupId: id, ...(dto ?? {}) } as JoinGroup;
    return this.groupService.joinGroup(req.user.id, parsed);
  }

  @Post(':id/leave')
  @HttpCode(HttpStatus.OK)
  async leave(@Req() req: RequestWithUser, @Param('id') id: string) {
    return this.groupService.leaveGroup(req.user.id, id);
  }

  @Post(':id/resources')
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(FileInterceptor('file'))
  @UsePipes(new ValidationPipe({ transform: true })) // transforms form-data to DTO
  async shareResource(
    @Req() req: RequestWithUser,
    @Param('id') id: string,
    @Body() dto: CreateGroupResourceDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    // dto will now be parsed correctly
    return this.groupService.shareResource(id, req.user.id, dto, file);
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

  @Get(':id/resources')
  async getGroupResources(
    @Req() req: RequestWithUser,
    @Param('id') id: string,
  ) {
    return this.groupService.getGroupResources(id, req.user.id);
  }

  // Optionally: send message via REST (useful for bots or fallback)
  @Post(':id/messages')
  @HttpCode(HttpStatus.CREATED)
  async postMessage(
    @Req() req: RequestWithUser,
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

  @Post('resources/:id/like')
  async like(@Req() req: RequestWithUser, @Param('id') id: string) {
    return this.groupService.likeResource(req.user.id, id);
  }

  @Delete('resources/:id/like')
  async unlike(@Req() req: RequestWithUser, @Param('id') id: string) {
    return this.groupService.unlikeResource(req.user.id, id);
  }

  @Post('resources/:id/comment')
  async comment(
    @Req() req: RequestWithUser,
    @Param('id') id: string,
    @Body() dto: CommentGroupResourceDto,
  ) {
    return this.groupService.commentOnResource(req.user.id, {
      ...dto,
      resourceId: id,
    });
  }

  @Get(':groupId/feed')
  async getFeed(
    @Req() req: RequestWithUser,
    @Param('groupId') groupId: string,
  ) {
    return this.groupService.getGroupFeed(groupId, req.user.id);
  }

  @Patch('resources/comments/:commentId')
  async updateComment(
    @Req() req: RequestWithUser,
    @Param('commentId') commentId: string,
    @Body() dto: UpdateGroupResourceCommentDto,
  ) {
    return this.groupService.editComment(req.user.id, commentId, dto.content);
  }

  // delete comment
  @Delete('resources/comments/:commentId')
  async deleteComment(
    @Req() req: RequestWithUser,
    @Param('commentId') commentId: string,
  ) {
    return this.groupService.deleteComment(req.user.id, commentId);
  }
}
