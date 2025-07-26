/* eslint-disable prettier/prettier */
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaClient } from 'generated/prisma';
import { CreateProfileDto } from 'src/dto/create-profile.dto';
import { UpdateProfileDto } from 'src/dto/update-profile.dto';
import {
  AcademeetCloudinaryService,
  AcademeetUploadType,
} from 'src/shared/cloudinary/cloudinary/cloudinary.service';

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
    return this.prisma.profile.create({
      data: {
        ...dto,
        userId,
      },
    });
  }

  async getProfileByUserId(userId: string) {
    const profile = await this.prisma.profile.findUnique({
      where: { userId },
    });

    if (!profile) {
      throw new NotFoundException('Profile not found');
    }

    return profile;
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const profile = await this.prisma.profile.findUnique({
      where: { userId },
    });

    if (!profile) {
      throw new NotFoundException('Profile not found');
    }

    return this.prisma.profile.update({
      where: { userId },
      data: { ...dto },
    });
  }

  async uploadProfileImage(userId: string, file: Express.Multer.File) {
    const profile = await this.prisma.profile.findUnique({
      where: { userId },
    });

    if (!profile) {
      throw new NotFoundException('Profile not found');
    }

    const upload = await this.cloudinary.uploadImage(
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

    const upload = await this.cloudinary.uploadImage(
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
              { institution: { contains: search, mode: 'insensitive' } },
              { skills: { hasSome: [search] } },
            ],
          }
        : {},
      orderBy: { createdAt: 'asc' },
    });
  }
}
