/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable prettier/prettier */

/* eslint-disable prettier/prettier */

/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable prettier/prettier */
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { GroupRole, PrismaClient } from 'generated/prisma';
import {
  BulkAddMembersDto,
  BulkRemoveMembersDto,
  BulkRestoreMembersDto,
  BulkUpdateRolesDto,
} from 'src/dto/bulk-member-action.dto';
import { CommentGroupResourceDto } from 'src/dto/comment-group-resource.dto';
import { CreateGroupResourceDto } from 'src/dto/create-group-resource.dto';
import { CreateGroupDto } from 'src/dto/create-group.dto';
import { JoinGroup } from 'src/dto/join-group.dto';
import { SendMessageDto } from 'src/dto/send-message.dto';
import { UpdateGroupDto } from 'src/dto/update-group.dto';
import {
  AcademeetCloudinaryService,
  AcademeetUploadType,
} from 'src/shared/cloudinary/cloudinary/cloudinary.service';

@Injectable()
export class GroupsService {
  private prisma = new PrismaClient();
  constructor(private cloudinary: AcademeetCloudinaryService) {}

  private readonly logger = new Logger(GroupsService.name);

  // create a group and add creator as OWNER in a transaction
  async createGroup(
    userId: string,
    dto: CreateGroupDto & { coverImage?: string },
  ) {
    return this.prisma.group.create({
      data: {
        name: dto.name,
        description: dto.description,
        visibility: dto.visibility,
        coverImage: dto.coverImage,
        creatorId: userId,
        members: {
          create: {
            userId,
            role: 'OWNER',
          },
        },
      },
      include: {
        members: {
          where: { isDeleted: false },
          include: {
            user: { select: { id: true, name: true, profile: true } },
          },
        },
        resources: true,
      },
    });
  }

  async updateGroup(
    groupId: string,
    userId: string,
    dto: UpdateGroupDto & { coverImage?: string },
  ) {
    await this.ensureGroupExists(groupId);
    await this.ensureGroupRole(groupId, userId, ['OWNER', 'ADMIN']);

    return this.prisma.group.update({
      where: { id: groupId },
      data: {
        name: dto.name,
        description: dto.description,
        visibility: dto.visibility,
        coverImage: dto.coverImage,
      },
      include: {
        members: {
          where: { isDeleted: false },
          include: {
            user: { select: { id: true, name: true, profile: true } },
          },
        },
        resources: true,
      },
    });
  }

  // helper function to determine whether group exists
  private async ensureGroupExists(groupId: string) {
    const group = await this.prisma.group.findUnique({
      where: { id: groupId },
    });
    if (!group) throw new NotFoundException('Group not found');
    return group;
  }

  // allow a user to join a group
  async joinGroup(userId: string, dto: JoinGroup) {
    const { groupId, role } = dto;
    await this.ensureGroupExists(groupId);

    try {
      const membership = await this.prisma.groupMember.create({
        data: {
          groupId,
          userId,
          role: role ?? GroupRole.MEMBER,
        },
      });
      return membership;
    } catch (err: any) {
      // unique constraint violation => already a member ensure no multiple joining in a single group
      if (err.code === 'p2002') {
        throw new BadRequestException('Already a member of the group');
      }
      throw err;
    }
  }

  // allow the member to leave the group. Owner cannot leave unless transfer ownership first.
  async leaveGroup(userId: string, groupId: string) {
    const memebrship = await this.prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId, userId } },
    });
    if (!memebrship) throw new NotFoundException('Not a group member');

    // prevent the owner from leaving without transfer (business choice)
    if (memebrship.role === GroupRole.OWNER) {
      // check if other admins exist => transfer automatically? For now, block and request transfer
      throw new ForbiddenException(
        'Owner cannot leave group until ownership is transfered',
      );
    }
    await this.prisma.groupMember.delete({
      where: { groupId_userId: { groupId, userId } },
    });

    return { success: true };
  }

  // add/remove member( admin- only actions )
  async addMemberAsAdmin(
    groupId: string,
    userToAdd: string,
    role: GroupRole = GroupRole.MEMBER,
  ) {
    await this.ensureGroupExists(groupId);
    try {
      return await this.prisma.groupMember.create({
        data: { groupId, userId: userToAdd, role },
      });
    } catch (err: any) {
      if (err.code === 'p2002')
        throw new BadRequestException('User already a member');
      throw err;
    }
  }

  async removeMemberAsAdmin(groupId: string, userIdToRemove: string) {
    // ensure exists
    const membership = await this.prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId, userId: userIdToRemove } },
    });
    if (!membership) throw new NotFoundException('Member not found');
    // don't allow removing owner thro admin action
    if (membership.role === GroupRole.ADMIN) {
      throw new ForbiddenException('Cannot remove owner');
    }

    // soft delete
    return this.prisma.groupMember.update({
      where: { groupId_userId: { groupId, userId: userIdToRemove } },
      data: { isDeleted: true, deletedAt: new Date() },
    });
  }

  // share a resource in a group (verify membership)
  async shareResource(
    groupId: string,
    userId: string,
    dto: CreateGroupResourceDto,
    file?: Express.Multer.File,
  ) {
    //  Ensure user is group member
    const isMember = await this.prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId, userId } },
    });
    if (!isMember) throw new ForbiddenException('You are not a group member');

    // Upload file if provided
    let resourceUrl: string | null = null;
    let originalName: string | null = null;
    let fileType: string | null = null;

    if (file) {
      const uploadResult = await this.cloudinary.uploadRaw(
        file,
        AcademeetUploadType.RESOURCE_FILE,
      );
      resourceUrl = uploadResult.secure_url;
      originalName = file.originalname;
      const parts = file.originalname.split('.');
      fileType = parts.length > 1 ? parts.pop()!.toLowerCase() : null;
    }

    // Create resource
    const resource = await this.prisma.groupResource.create({
      data: {
        groupId,
        sharedById: userId,
        content: dto.content,
        resourceUrl,
        originalName,
        fileType,
      },
      include: {
        sharedBy: {
          select: {
            id: true,
            name: true,
            profile: {
              select: {
                profileImage: true,
                institution: { select: { id: true, name: true } },
              },
            },
          },
        },
      },
    });

    // Return formatted response
    return {
      id: resource.id,
      content: resource.content,
      resourceUrl: resource.resourceUrl,
      originalName: resource.originalName,
      fileType: resource.fileType,
      createdAt: resource.createdAt,
      groupId: resource.groupId,
      likesCount: resource.likesCount,
      commentsCount: resource.commentsCount,
      sharedBy: {
        id: resource.sharedBy.id,
        name: resource.sharedBy.name,
        profileImage: resource.sharedBy.profile?.profileImage ?? null,
        institution: resource.sharedBy.profile?.institution
          ? {
              id: resource.sharedBy.profile.institution.id,
              name: resource.sharedBy.profile.institution.name,
            }
          : null,
      },
    };
  }

  /** Persist a group message and return saved message */
  async sendMessage(userId: string, dto: SendMessageDto) {
    // ensure membership
    const membership = await this.prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId: dto.groupId, userId } },
    });
    if (!membership) throw new ForbiddenException('Not a group member');

    const message = await this.prisma.groupMessage.create({
      data: {
        content: dto.content,
        groupId: dto.groupId,
        userId,
      },
    });

    return message;
  }

  async editMessage(userId: string, messageId: string, newContent: string) {
    // 1️⃣ Find the message
    const message = await this.prisma.groupMessage.findUnique({
      where: { id: messageId },
    });

    if (!message) {
      throw new NotFoundException('Message not found');
    }

    // 2️⃣ Ensure the user is the sender
    if (message.userId !== userId) {
      throw new ForbiddenException('You can only edit your own message');
    }

    // 3️⃣ Optional: prevent editing deleted messages
    if ((message as any).isDeleted) {
      throw new BadRequestException('Cannot edit a deleted message');
    }

    // 4️⃣ Update message
    return this.prisma.groupMessage.update({
      where: { id: messageId },
      data: {
        content: newContent,
        updatedAt: new Date(),
      },
    });
  }

  async deleteMessage(userId: string, messageId: string) {
    const message = await this.prisma.groupMessage.findUnique({
      where: { id: messageId },
    });

    if (!message) {
      throw new NotFoundException('Message not found');
    }

    if (message.userId !== userId) {
      throw new ForbiddenException('You can only delete your own message');
    }

    return this.prisma.groupMessage.update({
      where: { id: messageId },
      data: {
        isDeleted: true,
        content: '[message deleted]',
        updatedAt: new Date(),
      },
    });
  }

  /** Useful retrieval helpers with pagination (cursor-based or offset as you like) */
  async getGroupMessages(groupId: string, limit = 50, cursor?: string) {
    const where = { groupId };
    const messages = await this.prisma.groupMessage.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
      include: {
        user: {
          select: {
            id: true,
            name: true,
            profile: { select: { profileImage: true } },
          },
        },
      },
    });

    // Flatten the profileImage so frontend gets what it expects
    return messages.map((m) => ({
      ...m,
      user: {
        id: m.user.id,
        name: m.user.name,
        profileImage: m.user.profile?.profileImage || null,
      },
    }));
  }

  async getGroupById(groupId: string) {
    return this.prisma.group.findUnique({
      where: { id: groupId },
      include: {
        members: {
          where: { isDeleted: false },
          include: {
            user: {
              select: { id: true, name: true, profile: true },
            },
          },
        },
        resources: true,
      },
    });
  }

  async getAllGroups() {
    return this.prisma.group.findMany({
      include: {
        members: {
          where: { isDeleted: false },
          include: {
            user: { select: { id: true, name: true, profile: true } },
          },
        },
        resources: true,
        _count: {
          select: { members: true, resources: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async restoreMemberAsAdmin(groupId: string, userId: string) {
    return this.prisma.groupMember.update({
      where: { groupId_userId: { groupId, userId } },
      data: {
        isDeleted: false,
        deletedAt: null,
      },
    });
  }

  /**  Central helper: ensure user has one of the allowed roles in a group */
  private async ensureGroupRole(
    groupId: string,
    userId: string,
    allowedRoles: GroupRole[],
  ) {
    const membership = await this.prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId, userId } },
    });

    if (!membership || membership.isDeleted) {
      throw new ForbiddenException('You are not a member of this group');
    }

    if (!allowedRoles.includes(membership.role)) {
      throw new ForbiddenException(
        `Required roles: ${allowedRoles.join(', ')} — You are ${membership.role}`,
      );
    }

    return membership;
  }

  // Bulk add members (Admin/Owner only)
  async bulkAddMembers(
    groupId: string,
    currentUserId: string,
    dto: BulkAddMembersDto,
  ) {
    await this.ensureGroupRole(groupId, currentUserId, [
      GroupRole.OWNER,
      GroupRole.ADMIN,
    ]);

    const results = await this.prisma.$transaction(
      dto.userIds.map((userId) =>
        this.prisma.groupMember.upsert({
          where: { groupId_userId: { groupId, userId } },
          update: { isDeleted: false, deletedAt: null, role: dto.role },
          create: { groupId, userId, role: dto.role },
        }),
      ),
    );

    return { count: results.length, members: results };
  }

  // Bulk remove (soft delete)
  async bulkRemoveMembers(
    groupId: string,
    currentUserId: string,
    dto: BulkRemoveMembersDto,
  ) {
    await this.ensureGroupRole(groupId, currentUserId, [
      GroupRole.OWNER,
      GroupRole.ADMIN,
    ]);

    const results = await this.prisma.$transaction(
      dto.userIds.map((userId) =>
        this.prisma.groupMember.updateMany({
          where: { groupId, userId, role: { not: GroupRole.OWNER } },
          data: { isDeleted: true, deletedAt: new Date() },
        }),
      ),
    );
    return { count: results.reduce((acc, r) => acc + r.count, 0) };
  }

  // Bulk restore
  async bulkRestoreMembers(
    groupId: string,
    currentUserId: string,
    dto: BulkRestoreMembersDto,
  ) {
    await this.ensureGroupRole(groupId, currentUserId, [
      GroupRole.OWNER,
      GroupRole.ADMIN,
    ]);

    const results = await this.prisma.$transaction(
      dto.userIds.map((userId) =>
        this.prisma.groupMember.updateMany({
          where: { groupId, userId },
          data: { isDeleted: false, deletedAt: null },
        }),
      ),
    );
    return { count: results.reduce((acc, r) => acc + r.count, 0) };
  }

  // Bulk update roles
  async bulkUpdateRoles(
    groupId: string,
    currentUserId: string,
    dto: BulkUpdateRolesDto,
  ) {
    await this.ensureGroupRole(groupId, currentUserId, [GroupRole.OWNER]);

    const results = await this.prisma.$transaction(
      dto.userIds.map((userId) =>
        this.prisma.groupMember.updateMany({
          where: { groupId, userId, isDeleted: false },
          data: { role: dto.role },
        }),
      ),
    );
    return { count: results.reduce((acc, r) => acc + r.count, 0) };
  }

  // Like / Unlike
  async likeResource(userId: string, resourceId: string) {
    const resource = await this.prisma.groupResource.findUnique({
      where: { id: resourceId },
      include: { likes: true },
    });
    if (!resource) throw new NotFoundException('Resource not found');

    const membership = await this.prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId: resource.groupId, userId } },
    });
    if (!membership) throw new ForbiddenException('Not a group member');

    try {
      await this.prisma.groupResourceLike.create({
        data: { userId, resourceId },
      });
    } catch (err: any) {
      if (err.code === 'P2002') {
        throw new BadRequestException('Already liked');
      }
      throw err;
    }

    // Return updated like data
    const updatedLikes = await this.prisma.groupResourceLike.count({
      where: { resourceId },
    });

    return {
      message: 'Resource liked successfully',
      resourceId,
      likesCount: updatedLikes,
      isLiked: true,
    };
  }

  async unlikeResource(userId: string, resourceId: string) {
    const deleted = await this.prisma.groupResourceLike.deleteMany({
      where: { userId, resourceId },
    });

    const updatedLikes = await this.prisma.groupResourceLike.count({
      where: { resourceId },
    });

    return {
      message: deleted.count > 0 ? 'Resource unliked' : 'Not previously liked',
      resourceId,
      likesCount: updatedLikes,
      isLiked: false,
    };
  }

  // Comment on Resource
  async commentOnResource(userId: string, dto: CommentGroupResourceDto) {
    const resource = await this.prisma.groupResource.findUnique({
      where: { id: dto.resourceId },
    });
    if (!resource) throw new NotFoundException('Resource not found');

    const membership = await this.prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId: resource.groupId, userId } },
    });
    if (!membership) throw new ForbiddenException('Not a group member');

    return this.prisma.groupResourceComment.create({
      data: {
        userId,
        resourceId: dto.resourceId,
        content: dto.content,
      },
    });
  }

  // edit comment
  async editComment(userId: string, commentId: string, newContent: string) {
    // Fetch comment
    const comment = await this.prisma.groupResourceComment.findUnique({
      where: { id: commentId },
    });

    // Validate
    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    if (comment.userId !== userId) {
      throw new ForbiddenException('You can only edit your own comment');
    }

    // Update content
    return this.prisma.groupResourceComment.update({
      where: { id: commentId },
      data: { content: newContent },
    });
  }

  async deleteComment(userId: string, commentId: string) {
    // Find the comment
    const comment = await this.prisma.groupResourceComment.findUnique({
      where: { id: commentId },
    });

    // Validate existence
    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    // Check ownership
    if (comment.userId !== userId) {
      throw new ForbiddenException('You can only delete your own comment');
    }

    //  Delete comment
    return this.prisma.groupResourceComment.delete({
      where: { id: commentId },
    });
  }  

  // Like a comment
  async likeComment(userId: string, commentId: string) {
    const comment = await this.prisma.groupResourceComment.findUnique({
      where: { id: commentId },
      include: { likes: true, resource: true },
    });

    if (!comment) throw new NotFoundException('Comment not found');

    // Ensure user is a group member
    const membership = await this.prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId: comment.resource.groupId, userId } },
    });
    if (!membership) throw new ForbiddenException('Not a group member');

    try {
      await this.prisma.groupResourceCommentLike.create({
        data: { userId, commentId },
      });
    } catch (err: any) {
      if (err.code === 'P2002') throw new BadRequestException('Already liked');
      throw err;
    }

    const updatedLikes = await this.prisma.groupResourceCommentLike.count({
      where: { commentId },
    });

    return {
      message: 'Comment liked successfully',
      commentId,
      likesCount: updatedLikes,
      isLiked: true,
    };
  }

  // Unlike a comment
  async unlikeComment(userId: string, commentId: string) {
    const deleted = await this.prisma.groupResourceCommentLike.deleteMany({
      where: { userId, commentId },
    });

    const updatedLikes = await this.prisma.groupResourceCommentLike.count({
      where: { commentId },
    });

    return {
      message: deleted.count > 0 ? 'Comment unliked' : 'Not previously liked',
      commentId,
      likesCount: updatedLikes,
      isLiked: false,
    };
  }

  // Get Group Feed
  async getGroupFeed(groupId: string, userId: string, limit = 20) {
    await this.ensureGroupExists(groupId);

    const resources = await this.prisma.groupResource.findMany({
      where: { groupId, isDeleted: false },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        sharedBy: {
          select: {
            id: true,
            name: true,
            profile: { select: { profileImage: true } },
          },
        },
        likes: {
          select: { userId: true }, // only get userIds
        },
        comments: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                profile: { select: { profileImage: true } },
              },
            },
          },
        },
      },
    });

    return resources.map((r) => ({
      id: r.id,
      content: r.content,
      createdAt: r.createdAt,
      groupId: r.groupId,
      resourceUrl: r.resourceUrl,
      originalName: r.originalName,
      fileType: r.fileType,
      sharedBy: r.sharedBy,
      likesCount: r.likes.length,
      commentsCount: r.comments.length,
      isLiked: r.likes.some((like) => like.userId === userId),
      comments: r.comments,
    }));
  }

  //  Fetch only posts with files (resources)
  async getGroupResources(groupId: string, userId: string, limit = 20) {
    await this.ensureGroupExists(groupId);

    const resources = await this.prisma.groupResource.findMany({
      where: {
        groupId,
        resourceUrl: { not: null }, // Only file posts
        isDeleted: false,
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        sharedBy: {
          select: {
            id: true,
            name: true,
            profile: { select: { profileImage: true } },
          },
        },
        likes: true,
        comments: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                profile: { select: { profileImage: true } },
              },
            },
          },
        },
      },
    });

    return resources.map((r) => ({
      ...r,
      likesCount: r.likes.length,
      commentsCount: r.comments.length,
      isLiked: r.likes.some((l) => l.userId === userId),
    }));
  }



  // edit post
  async editResource(
    userId: string,
    resourceId: string,
    dto: { content?: string },
    file?: Express.Multer.File,
  ) {
    // 1️⃣ Find the existing resource
    const resource = await this.prisma.groupResource.findUnique({
      where: { id: resourceId },
    });

    if (!resource) throw new NotFoundException('Resource not found');

    // 2️⃣ Ensure the user owns the post
    if (resource.sharedById !== userId) {
      throw new ForbiddenException('You can only edit your own post');
    }

    // 3️⃣ Keep old file info, unless a new file is provided
    let resourceUrl = resource.resourceUrl;
    let originalName = resource.originalName;
    let fileType = resource.fileType;

    // 4️⃣ If a new file is uploaded, replace the file details
    if (file) {
      const uploadResult = await this.cloudinary.uploadRaw(
        file,
        AcademeetUploadType.RESOURCE_FILE,
      );
      resourceUrl = uploadResult.secure_url;
      originalName = file.originalname;
      const parts = file.originalname.split('.');
      fileType = parts.length > 1 ? parts.pop()!.toLowerCase() : null;
    }

    //  Update the database with new content and/or file
    return this.prisma.groupResource.update({
      where: { id: resourceId },
      data: {
        content: dto.content ?? resource.content, // fallback if not provided
        resourceUrl,
        originalName,
        fileType,
      },
    });
  }

  async deleteResource(userId: string, resourceId: string) {
    // Find the resource
    const resource = await this.prisma.groupResource.findUnique({
      where: { id: resourceId },
    });

    if (!resource) {
      throw new NotFoundException('Resource not found');
    }

    //  Ensure user owns the post
    if (resource.sharedById !== userId) {
      throw new ForbiddenException('You can only delete your own post');
    }

    // Soft delete (mark as deleted)
    const updated = await this.prisma.groupResource.update({
      where: { id: resourceId },
      data: { isDeleted: true },
    });

    return {
      message: 'Post deleted successfully (soft delete)',
      resource: updated,
    };
  }
}
