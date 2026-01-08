/* eslint-disable prettier/prettier */

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
  UploadedFiles,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/guards/jwt/jwtAuth.guard';
import { GroupsService } from './groups.service';
import { CreateGroupDto } from 'src/dto/create-group.dto';
import { UpdateGroupDto } from 'src/dto/update-group.dto';
import { JoinGroup } from 'src/dto/join-group.dto';
import { SendGroupMessageDto } from 'src/dto/send-message.dto';
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
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { CreateGroupResourceDto } from 'src/dto/create-group-resource.dto';
import { CommentGroupResourceDto } from 'src/dto/comment-group-resource.dto';
import { UpdateGroupResourceCommentDto } from 'src/dto/update-group-resource-comment.dto';
import { EditMessageDto } from 'src/dto/edit-message.dto';
import { MessageAttachment } from 'src/dto/message-attachment.dto';

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
  @UseInterceptors(FilesInterceptor('attachments'))
  async shareResource(
    @Req() req: RequestWithUser,
    @Param('id') id: string,
    @Body() dto: CreateGroupResourceDto,
    @UploadedFiles() files?: Express.Multer.File[],
  ) {
    let attachments: MessageAttachment[] | undefined;
  
    if (files && files.length > 0) {
      attachments = [];
  
      for (const file of files) {
        const isMedia =
          file.mimetype.startsWith('image/') ||
          file.mimetype.startsWith('video/');
  
        const result = isMedia
          ? await this.cloudinary.uploadMedia(
              file,
              AcademeetUploadType.RESOURCE_FILE,
            )
          : await this.cloudinary.uploadRaw(
              file,
              AcademeetUploadType.RESOURCE_FILE,
            );
  
        attachments.push({
          url: result.secure_url,
          type: result.resource_type,
          name: file.originalname,
          size: file.size,
        });
      }
    }
  
    return this.groupService.shareResource(
      id,
      req.user.id,
      dto,
      attachments,
    );
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
  // --------------------- Group Messaging ---------------------

  // Post a message (supports multiple attachments like DM)
  @Post(':id/messages')
  @UseInterceptors(FilesInterceptor('attachments'))
  async postMessage(
    @Req() req: RequestWithUser,
    @Param('id') id: string,
    @Body() dto: SendGroupMessageDto,
    @UploadedFiles() files?: Express.Multer.File[],
  ) {
    // Ensure groupId matches param
    dto.groupId = id;

    let attachments: MessageAttachment[] | null = null;

    if (files && files.length > 0) {
      attachments = [];

      for (const file of files) {
        const isMedia =
          file.mimetype.startsWith('image/') ||
          file.mimetype.startsWith('video/');
        const result = isMedia
          ? await this.cloudinary.uploadMedia(
              file,
              AcademeetUploadType.RESOURCE_FILE,
            )
          : await this.cloudinary.uploadRaw(
              file,
              AcademeetUploadType.RESOURCE_FILE,
            );

        attachments.push({
          url: result.secure_url,
          type: result.resource_type,
          name: file.originalname,
        });
      }
    }

    return this.groupService.sendMessage(req.user.id, {
      ...dto,
      attachments,
    });
  }

  // Edit a group message
  @Patch('messages/:id')
  @HttpCode(HttpStatus.OK)
  async editMessage(
    @Req() req: RequestWithUser,
    @Param('id') messageId: string,
    @Body() dto: EditMessageDto,
  ) {
    return this.groupService.editMessage(req.user.id, messageId, dto.content);
  }

  // Delete a group message
  @Delete('messages/:id')
  @HttpCode(HttpStatus.OK)
  async deleteMessage(
    @Req() req: RequestWithUser,
    @Param('id') messageId: string,
  ) {
    return this.groupService.deleteMessage(req.user.id, messageId);
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

  @Post(':groupId/feed/:postId/like')
  async likeFeed(
    @Req() req: RequestWithUser,
    @Param('groupId') groupId: string,
    @Param('postId') postId: string,
  ) {
    return this.groupService.likeResource(req.user.id, postId);
  }

  @Delete(':groupId/feed/:postId/like')
  async unlikeFeed(
    @Req() req: RequestWithUser,
    @Param('groupId') groupId: string,
    @Param('postId') postId: string,
  ) {
    return this.groupService.unlikeResource(req.user.id, postId);
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

  @Post('comments/:commentId/like')
  async likeComment(
    @Req() req: RequestWithUser,
    @Param('commentId') commentId: string,
  ) {
    return this.groupService.likeComment(req.user.id, commentId);
  }

  @Post('comments/:commentId/unlike')
  async unlikeComment(
    @Req() req: RequestWithUser,
    @Param('commentId') commentId: string,
  ) {
    return this.groupService.unlikeComment(req.user.id, commentId);
  }

  @Patch(':groupId/resources/:resourceId')
  @UseInterceptors(FileInterceptor('file'))
  async editResource(
    @Param('groupId') groupId: string,
    @Param('resourceId') resourceId: string,
    @Req() req: RequestWithUser,
    @Body() dto: { content?: string },
    @UploadedFile() file?: Express.Multer.File,
  ) {
    const userId = req.user.id;
    return await this.groupService.editResource(userId, resourceId, dto, file);
  }

  @Delete(':groupId/resources/:resourceId')
  async deleteResource(
    @Param('groupId') groupId: string,
    @Param('resourceId') resourceId: string,
    @Req() req: RequestWithUser,
  ) {
    const userId = req.user.id;
    return await this.groupService.deleteResource(userId, resourceId);
  }
}
