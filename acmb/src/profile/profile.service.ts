/* eslint-disable prettier/prettier */
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {  Prisma } from 'generated/prisma';
import { PrismaClient } from '../../generated/prisma/client';
import { CreateProfileDto } from '../dto/create-profile.dto';
import { UpdateProfileDto } from '../dto/update-profile.dto';
import {
  AcademeetCloudinaryService,
  AcademeetUploadType,
} from '../shared/cloudinary/cloudinary/cloudinary.service';
import type { Express } from 'express'; 

@Injectable()
export class ProfileService {
  private prisma = new PrismaClient();

  constructor(private cloudinary: AcademeetCloudinaryService) {}

  async createprofile(userId: string, dto: CreateProfileDto) {
    const profileExists = await this.prisma.profile.findUnique({
      where: { userId },
    });
    if (profileExists) {
      throw new BadRequestException('Profile already exists');
    }

    const institution = await this.prisma.institution.findUnique({
      where: { id: dto.institutionId },
    });
    if (!institution) {
      throw new NotFoundException('Institution not found');
    }

    return this.prisma.profile.create({
      data: {
        name: dto.name,
        bio: dto.bio,
        academicLevel: dto.academicLevel,
        skills: dto.skills,
        userId,
        institutionId: dto.institutionId,
      },
    });
  }

  async getProfileByUserId(userId: string) {
    const profile = await this.prisma.profile.findUnique({
      where: { userId },
      include: {
        institution: { 
          select: { 
            id: true, 
            name: true
          }
        },
      }
    });

    if (!profile) {
      throw new NotFoundException('Profile not found');
    }

    return profile;
  }

// >>> get profile by id
async getProfileById(id: string) {
  const profile = await this.prisma.profile.findUnique({
    where: { id },
    include: {
      user: true,
      institution: {
        select: {
          id: true,
          name: true,
          logoUrl: true,
        },
      },
    },
  });

  if (!profile) {
    throw new NotFoundException('Profile not found');
  }

  return profile;
}


  // Update your profile
  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const profile = await this.prisma.profile.findUnique({ where: { userId } });
    if (!profile) {
      throw new NotFoundException('Profile not found');
    }

    if (dto.institutionId) {
      const institution = await this.prisma.institution.findUnique({
        where: { id: dto.institutionId },
      });
      if (!institution) {
        throw new NotFoundException('Institution not found');
      }
    }

    const updateData: Prisma.ProfileUpdateInput = {
      name: dto.name,
      bio: dto.bio,
      academicLevel: dto.academicLevel,
      skills: dto.skills,
      ...(dto.institutionId && { institutionId: dto.institutionId }),
    };

    return this.prisma.profile.update({
      where: { userId },
      data: updateData,
    });
  }

  // upload a profile image
  async uploadProfileImage(userId: string, file: Express.Multer.File) {
    const profile = await this.prisma.profile.findUnique({
      where: { userId },
    });

    if (!profile) {
      throw new NotFoundException('Profile not found');
    }

    const upload = await this.cloudinary.uploadMedia(
      file,
      AcademeetUploadType.PROFILE_IMAGE,
    );

    return this.prisma.profile.update({
      where: { userId },
      data: {
        profileImage: upload.secure_url,
      },
    });
  }

  async uploadCoverPhoto(userId: string, file: Express.Multer.File) {
    const profile = await this.prisma.profile.findUnique({
      where: { userId },
    });

    if (!profile) {
      throw new NotFoundException('Profile not found');
    }

    const upload = await this.cloudinary.uploadMedia(
      file,
      AcademeetUploadType.PROFILE_IMAGE,
    );

    return this.prisma.profile.update({
      where: { userId },
      data: {
        coverPhoto: upload.secure_url,
      },
    });
  }

  async getAllProfiles(search?: string) {
    return this.prisma.profile.findMany({
      where: search
        ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              {
                institution: {
                  name: { contains: search, mode: 'insensitive' },
                },
              },
              { skills: { hasSome: [search] } },
            ],
          }
        : {},
      orderBy: { createdAt: 'asc' },
      include: {
        institution: true, // optional: returns institution data along with profile
      },
    });
  }
}
