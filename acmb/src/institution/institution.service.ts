/* eslint-disable prettier/prettier */
 
/* eslint-disable prettier/prettier */
 
 

import { randomBytes } from 'crypto';

import {
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaClient } from '../../generated/prisma/client';
import {
  AcademeetCloudinaryService,
  AcademeetUploadType,
} from '../shared/cloudinary/cloudinary/cloudinary.service';
import { CreateAnnouncementDto } from '../dto/createAnnouncement.dto';
import { NotificationsGateway } from '../student-notifications/notifications.gateway';
import { CreateInstitutionRequestDto } from '../dto/create-institution-request.dto';
import type { Express } from 'express';

@Injectable()
export class InstitutionService {
  private prisma = new PrismaClient();

  constructor(
    private readonly cloudinary: AcademeetCloudinaryService,
    private readonly notificationsGateway: NotificationsGateway,
  ) {}

  /** Create a new institution with optional logo upload */
  async registerInstitution(
    dto: CreateInstitutionRequestDto,
    file?: Express.Multer.File,
  ) {
    let logoUrl: string | undefined;

    if (file) {
      const uploadResult = await this.cloudinary.uploadMedia(
        file,
        AcademeetUploadType.COURSE_BANNER,
      );
      logoUrl = uploadResult.secure_url;
    }

    const institution = await this.prisma.institution.create({
      data: {
        name: dto.name,
        description: dto.description,
        logoUrl,
      },
    });

    return institution;
  }

  /** Create an announcement for an institution */
  async createAnnouncement(
    institutionId: string,
    dto: CreateAnnouncementDto,
    userId: string,
  ) {
    const institution = await this.prisma.institution.findUnique({
      where: { id: institutionId },
    });
    if (!institution) throw new ForbiddenException('Institution not found');

    let fileUrls: string[] = [];
    if (dto.files?.length) {
      const uploads = await Promise.all(
        dto.files.map((file) =>
          this.cloudinary.uploadMedia(file, AcademeetUploadType.POST_IMAGE),
        ),
      );
      fileUrls = uploads.map((u) => u.secure_url);
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
  async createInvite(institutionId: string, email: string, createdById: string) {
    return this.prisma.institutionInvite.create({
      data: {
        email,
        institutionId,
        token: randomBytes(32).toString('hex'),
        expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000), // 48 hours
        createdById,
      },
    });
  }

  /** Update an announcement */
  async updateAnnouncement(
    announcementId: string,
    dto: { title?: string; content?: string; publish?: boolean; files?: Express.Multer.File[] },
    userId: string,
  ) {
    const announcement = await this.prisma.institutionAnnouncement.findUnique({
      where: { id: announcementId },
    });
    if (!announcement) throw new NotFoundException('Announcement not found');
    if (announcement.createdById !== userId)
      throw new ForbiddenException('Not authorized');

    let fileUrls: string[] = announcement.fileUrls ?? [];
    if (dto.files?.length) {
      const uploads = await Promise.all(
        dto.files.map((file) =>
          this.cloudinary.uploadMedia(file, AcademeetUploadType.POST_IMAGE),
        ),
      );
      fileUrls = [...fileUrls, ...uploads.map((u) => u.secure_url)];
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

  /** Get all institutions for dropdowns */
  async getAllInstitutions() {
    try {
      return await this.prisma.institution.findMany({
        select: {
          id: true,
          name: true,
          logoUrl: true,
          description: true,
          createdAt: true,
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
  

  /** Get simple analytics for the institution */
  async getAnalytics(institutionId: string) {
    const studentCount = await this.prisma.profile.count({ where: { institutionId } });
    const announcementCount = await this.prisma.institutionAnnouncement.count({
      where: { institutionId },
    });
    return { studentCount, announcementCount };
  }

  /** Get a single announcement by ID with metadata */
  async getAnnouncementById(announcementId: string, userId: string) {
    const announcement = await this.prisma.institutionAnnouncement.findUnique({
      where: { id: announcementId },
      include: {
        createdBy: { select: { id: true, email: true, profile: { select: { name: true, profileImage: true } } } },
        institution: { select: { id: true, name: true, logoUrl: true } },
      },
    });
    if (!announcement) throw new NotFoundException('Announcement not found');

    const profile = await this.prisma.profile.findUnique({
      where: { userId },
      select: { institutionId: true },
    });
    if (!profile || profile.institutionId !== announcement.institutionId)
      throw new ForbiddenException('Not authorized to view this announcement');

    return announcement;
  }

  /** Delete an announcement */
  async deleteAnnouncement(announcementId: string, userId: string) {
    const announcement = await this.prisma.institutionAnnouncement.findUnique({
      where: { id: announcementId },
    });
    if (!announcement) throw new NotFoundException('Announcement not found');
    if (announcement.createdById !== userId)
      throw new ForbiddenException('Not authorized to delete this announcement');

    return this.prisma.institutionAnnouncement.delete({ where: { id: announcementId } });
  }
}
