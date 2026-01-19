/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable prettier/prettier */
/* eslint-disable prettier/prettier */
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaClient } from 'generated/prisma';
import { GroupMemberResponse } from '../../interfaces/group-member';


@Injectable()
export class ManageGroupsService {
  private prisma = new PrismaClient();

  constructor() {}

  // ---------------------------------------------------------
  // Get ALL groups with unique return structure names
  // ---------------------------------------------------------
  async getAllGroups() {
    const groups = await this.prisma.group.findMany({
      where: { isDeleted: false },
      include: {
        creator: {
          select: { id: true, name: true, email: true },
        },
        members: {
          where: { isDeleted: false },
          include: {
            user: {
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
        },
        resources: {
          select: { id: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return groups.map((group) => ({
      id: group.id,
      name: group.name,
      description: group.description,
      coverImage: group.coverImage,
      visibility: group.visibility,
      createdAt: group.createdAt,
      updatedAt: group.updatedAt,

      creator: group.creator,

      membersCount: group.members.length,

      // --- NEW NAME (prevents interface conflicts) ---
      groupMembers: group.members.map((m) => ({
        userId: m.user.id,
        userName: m.user.name,
        userProfileImage: m.user.profile?.profileImage || null,
        userInstitution: m.user.profile?.institution || null,
        memberRole: m.role,
        joinedAt: m.joinedAt,
      })),

      resourcesCount: group.resources.length,
    }));
  }

  // ---------------------------------------------------------
  // Get specific group's active members
  // ---------------------------------------------------------
  async getGroupMembers(groupId: string): Promise<GroupMemberResponse[]> {
    const group = await this.prisma.group.findFirst({
      where: { id: groupId, isDeleted: false },
      include: {
        members: {
          where: { isDeleted: false },
          include: {
            user: {
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
        },
      },
    });

    if (!group) {
      throw new NotFoundException('Group not found or has been deleted');
    }

    return group.members.map<GroupMemberResponse>((m) => ({
      userId: m.user.id,
      role: m.role,
      joinedAt: m.joinedAt.toISOString(),
      user: {
        id: m.user.id,
        name: m.user.name,
        profile: {
          profileImage: m.user.profile?.profileImage || null,
          institution: m.user.profile?.institution || null,
        },
      },
    }));
  }

  // ---------------------------------------------------------
  // Soft-delete a group
  // ---------------------------------------------------------
  async deleteGroup(groupId: string) {
    const group = await this.prisma.group.findUnique({
      where: { id: groupId },
    });

    if (!group) {
      throw new NotFoundException('Group not found');
    }

    await this.prisma.group.update({
      where: { id: groupId },
      data: {
        isDeleted: true,
      },
    });

    await this.prisma.groupMember.updateMany({
      where: { groupId },
      data: { isDeleted: true },
    });

    return { message: 'Group deleted successfully' };
  }

  // ---------------------------------------------------------
  // Restore group
  // ---------------------------------------------------------
  async restoreGroup(groupId: string) {
    const group = await this.prisma.group.findUnique({
      where: { id: groupId },
    });

    if (!group) {
      throw new NotFoundException('Group not found');
    }

    await this.prisma.group.update({
      where: { id: groupId },
      data: {
        isDeleted: false,
      },
    });

    await this.prisma.groupMember.updateMany({
      where: { groupId },
      data: { isDeleted: false },
    });

    return { message: 'Group restored successfully' };
  }
}
