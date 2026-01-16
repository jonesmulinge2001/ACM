/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable prettier/prettier */

import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaClient } from 'generated/prisma';
import * as crypto from 'crypto';
import {
  AcademeetCloudinaryService,
  AcademeetUploadType,
} from 'src/shared/cloudinary/cloudinary/cloudinary.service';
import { CreateAnnouncementDto } from 'src/dto/createAnnouncement.dto';
import { NotificationsGateway } from 'src/student-notifications/notifications.gateway';
// import { StudentNotificationDto } from 'src/dto/student-notification';
import { CreateInstitutionRequestDto } from 'src/dto/create-institution-request.dto';
import type { Express } from 'express'; 

function addHours(date: Date, hours: number): Date {
  const newDate = new Date(date);
  newDate.setHours(newDate.getHours() + hours);
  return newDate;
}

@Injectable()
export class InstitutionService {
  private prisma = new PrismaClient();

  constructor(private readonly cloudinary: AcademeetCloudinaryService,
    private readonly notificationsGateway: NotificationsGateway, 
  ) {}

  /** Create a new institution with optional logo upload */
/** Public registration request */
async registerInstitution(dto: CreateInstitutionRequestDto, file?: Express.Multer.File) {
  let logoUrl: string | undefined = undefined;

  if (file) {
    const uploadResult = await this.cloudinary.uploadMedia(file, AcademeetUploadType.COURSE_BANNER);
    logoUrl = uploadResult.secure_url;
  }

  // Create institution with PENDING_REVIEW status
  const institution = await this.prisma.institution.create({
    data: {
      name: dto.name,
      description: dto.description,
      logoUrl,
      status: 'PENDING_REVIEW', // new column for status
      officialEmail: dto.officialEmail,
      websiteUrl: dto.websiteUrl,
    },
  });

  return institution;
}

/** Super admin approves or rejects institution */
async updateInstitutionStatus(institutionId: string, dto: { status: 'APPROVED' | 'REJECTED'; reviewedById: string }) {
  const institution = await this.prisma.institution.findUnique({ where: { id: institutionId } });
  if (!institution) throw new NotFoundException('Institution not found');

  const updated = await this.prisma.institution.update({
    where: { id: institutionId },
    data: {
      status: dto.status,
    },
  });

  // Automatic first admin creation upon approval
  if (dto.status === 'APPROVED') {
    if (!institution.officialEmail) {
      throw new BadRequestException('Cannot create admin: institution has no official email');
    }
  
    const firstAdmin = await this.prisma.user.findUnique({
      where: { email: institution.officialEmail },
    });
  
    if (firstAdmin) {
      await this.prisma.user.update({
        where: { id: firstAdmin.id },
        data: { role: 'INSTITUTION_ADMIN' },
      });
  
      await this.prisma.institutionAdmin.upsert({
        where: { userId_institutionId: { userId: firstAdmin.id, institutionId } },
        create: { userId: firstAdmin.id, institutionId, createdById: dto.reviewedById },
        update: { isActive: true },
      });
    }
  }
  

  return updated;
}

/** Only approved institutions can create announcements */
async createAnnouncement(institutionId: string, dto: CreateAnnouncementDto, userId: string) {
  const institution = await this.prisma.institution.findUnique({ where: { id: institutionId } });
  if (!institution) throw new ForbiddenException('Institution not found');
  if (institution.status !== 'APPROVED') throw new ForbiddenException('Institution not approved yet');

  let fileUrls: string[] = [];
  if (dto.files?.length) {
    const uploads = await Promise.all(dto.files.map(file =>
      this.cloudinary.uploadMedia(file, AcademeetUploadType.POST_IMAGE),
    ));
    fileUrls = uploads.map(u => u.secure_url);
  }

  return this.prisma.institutionAnnouncement.create({
    data: {
      institutionId,
      title: dto.title,
      content: dto.content,
      fileUrls,
      createdById: userId,
    },
  });
}

/** List approved institutions for dropdowns */
async getApprovedInstitutions() {
  return this.prisma.institution.findMany({
    where: { status: 'APPROVED' },
    select: { 
      id: true,
      name: true,
      logoUrl: true, 
      websiteUrl: true, 
      officialEmail: true,
      description: true,
      createdAt: true 
    },
    orderBy: { name: 'asc' },
  });
}

  /** Assign a user as institution admin */
  async assignAdmin(
    institutionId: string,
    userId: string,
    assignedById: string,
  ) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    await this.prisma.user.update({
      where: { id: userId },
      data: { role: 'INSTITUTION_ADMIN' },
    });

    return this.prisma.institutionAdmin.upsert({
      where: { userId_institutionId: { userId, institutionId } },
      create: { userId, institutionId, createdById: assignedById },
      update: { isActive: true },
    });
  }

  /** Create an invite for a user to become an admin */
  async createInvite(
    institutionId: string,
    email: string,
    createdById: string,
  ) {
    const token = crypto.randomBytes(32).toString('hex');
    return this.prisma.institutionInvite.create({
      data: {
        email,
        institutionId,
        token,
        expiresAt: addHours(new Date(), 48),
        createdById,
      },
    });
  }

  /** Consume an invite token and assign admin role */
  async consumeInvite(token: string, userId: string) {
    const invite = await this.prisma.institutionInvite.findUnique({
      where: { token },
    });

    if (!invite || !invite.isActive)
      throw new BadRequestException('Invalid invite');
    if (invite.expiresAt < new Date())
      throw new ForbiddenException('Invite expired');
    if (invite.usedAt) throw new ForbiddenException('Invite already used');

    await this.prisma.$transaction([
      // Assign role
      this.prisma.user.update({
        where: { id: userId },
        data: { role: 'INSTITUTION_ADMIN' },
      }),

      // Create or reactivate InstitutionAdmin
      this.prisma.institutionAdmin.upsert({
        where: {
          userId_institutionId: { userId, institutionId: invite.institutionId },
        },
        create: {
          userId,
          institutionId: invite.institutionId,
          createdById: invite.createdById,
        },
        update: { isActive: true },
      }),

      // Mark invite as used
      this.prisma.institutionInvite.update({
        where: { id: invite.id },
        data: { usedAt: new Date(), isActive: false },
      }),
    ]);

    return { ok: true, institutionId: invite.institutionId };
  }

  /** Update an announcement */
  async updateAnnouncement(
    announcementId: string,
    dto: {
      title?: string;
      content?: string;
      publish?: boolean;
      files?: Express.Multer.File[];
    },
    userId: string, // expects userId now
  ) {
    const announcement = await this.prisma.institutionAnnouncement.findUnique({
      where: { id: announcementId },
    });

    if (!announcement) throw new NotFoundException('Announcement not found');
    if (announcement.createdById !== userId)
      throw new ForbiddenException('Not authorized');

    // handle file uploads if files exist
    let fileUrls: string[] = announcement.fileUrls ?? [];
    if (dto.files && dto.files.length > 0) {
      const uploaded = await Promise.all(
        dto.files.map((file) =>
          this.cloudinary.uploadMedia(file, AcademeetUploadType.POST_IMAGE),
        ),
      );
      fileUrls = [...fileUrls, ...uploaded.map((u) => u.secure_url)];
    }

    return this.prisma.institutionAnnouncement.update({
      where: { id: announcementId },
      data: {
        title: dto.title ?? announcement.title,
        content: dto.content ?? announcement.content,
        isPublished: dto.publish ?? announcement.isPublished,
        publishedAt: dto.publish ? new Date() : announcement.publishedAt,
        fileUrls,
      },
    });
  }

  /** Get a single announcement by ID with metadata */
  async getAnnouncementById(announcementId: string, userId: string) {
    const announcement = await this.prisma.institutionAnnouncement.findUnique({
      where: { id: announcementId },
      include: {
        createdBy: {
          select: {
            id: true,
            email: true,
            profile: {
              select: {
                name: true,
                profileImage: true,
              },
            },
          },
        },
        institution: {
          select: {
            id: true,
            name: true,
            logoUrl: true,
          },
        },
      },
    });

    if (!announcement) throw new NotFoundException('Announcement not found');

    // Authorization check — make sure requester belongs to the same institution
    const profile = await this.prisma.profile.findUnique({
      where: { userId },
      select: { institutionId: true },
    });

    if (!profile || profile.institutionId !== announcement.institutionId) {
      throw new ForbiddenException('Not authorized to view this announcement');
    }

    return announcement;
  }

  /** Delete an announcement */
  async deleteAnnouncement(announcementId: string, userId: string) {
    const announcement = await this.prisma.institutionAnnouncement.findUnique({
      where: { id: announcementId },
    });
    if (!announcement) throw new NotFoundException('Announcement not found');

    if (announcement.createdById !== userId) {
      throw new ForbiddenException(
        'Not authorized to delete this announcement',
      );
    }

    return this.prisma.institutionAnnouncement.delete({
      where: { id: announcementId },
    });
  }

  /** Get simple analytics for the institution */
  async getAnalytics(institutionId: string) {
    const studentCount = await this.prisma.profile.count({
      where: { institutionId },
    });
    const announcementCount = await this.prisma.institutionAnnouncement.count({
      where: { institutionId },
    });

    return { studentCount, announcementCount };
  }

  async getAdminAnnouncements(adminId: string, createdById?: string) {
    // 1. Find the admin’s institution
    const admin = await this.prisma.institutionAdmin.findFirst({
      where: { userId: adminId, isActive: true },
    });

    if (!admin) throw new NotFoundException('Admin not found');

    // 2. Build filters
    const where: any = {
      institutionId: admin.institutionId,
    };

    if (createdById) {
      where.createdById = createdById;
    }

    // 3. Fetch announcements with metadata
    return this.prisma.institutionAnnouncement.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        createdBy: {
          select: {
            id: true,
            email: true,
            profile: {
              select: {
                name: true,
                profileImage: true,
              },
            },
          },
        },
        institution: {
          select: {
            id: true,
            name: true,
            logoUrl: true,
          },
        },
      },
    });
  }

  /** Get all institutions for dropdowns */
  async getAllInstitutions() {
    try {
      return await this.prisma.institution.findMany({
        select: {
          id: true,
          name: true,
          logoUrl: true,
          officialEmail: true,
          websiteUrl: true,
          description: true,
          status: true,

          // Include the count of students for each institution
          _count: {
            select: { profiles: true },
          },
        },
        orderBy: {
          name: 'asc',
        },
      });
    } catch (error) {
      console.error('Error fetching institutions:', error);
      throw new InternalServerErrorException(
        'Unable to retrieve institutions at this time.',
      );
    }
  }
}

