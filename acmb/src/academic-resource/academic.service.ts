/* eslint-disable prettier/prettier */
 
/* eslint-disable prettier/prettier */
 
 
 
 
 
/* eslint-disable prettier/prettier */
import { Injectable } from '@nestjs/common';
import {
  AcademeetCloudinaryService,
  AcademeetUploadType,
} from 'src/shared/cloudinary/cloudinary/cloudinary.service';
import { PrismaClient } from 'generated/prisma';
import { CreateAcademicResourceDto } from 'src/dto/academic-resource.dto';

@Injectable()
export class AcademicResourceService {
  private prisma = new PrismaClient();
  constructor(private cloudinary: AcademeetCloudinaryService) {}

  async uploadResource(
    profileId: string,
    dto: CreateAcademicResourceDto,
    file?: Express.Multer.File,
  ) {
    let fileUrl: string | undefined;

    if (file) {
      try {
        const uploaded = await this.cloudinary.uploadRaw(
          file,
          AcademeetUploadType.RESOURCE_FILE,
        );
        
        fileUrl = uploaded.secure_url;
      } catch (err) {
        console.error('Upload failed:', err);
      }
    }

    return this.prisma.academicResource.create({
      data: {
        ...dto,
        fileUrl,
        uploaderId: profileId,
      },
      include: {
        uploader: {
          select: {
            id: true,
            name: true,
            profileImage: true,
          },
        },
      },
    });
  }

  async getAllResources() {
    return this.prisma.academicResource.findMany({
      orderBy: { uploadedAt: 'desc' },
      include: {
        uploader: {
          select: {
            id: true,
            name: true,
            profileImage: true,
          },
        },
      },
    });
  }

  async getFilteredResources(filters: {
    search?: string;
    course?: string;
    institution?: string;
    year?: string;
  }) {
    const query = this.prisma.academicResource.findMany({
      where: {
        AND: [
          filters.search
            ? {
                OR: [
                  { title: { contains: filters.search, mode: 'insensitive' } },
                  { description: { contains: filters.search, mode: 'insensitive' } },
                ],
              }
            : {},
          filters.course
            ? { course: { contains: filters.course, mode: 'insensitive' } }
            : {},
          filters.institution
            ? { institution: { contains: filters.institution, mode: 'insensitive' } }
            : {},
          filters.year
            ? { year: { contains: filters.year, mode: 'insensitive' } }
            : {},
        ],
      },
      include: {
        uploader: {
          select: {
            id: true,
            name: true,
            profileImage: true,
          },
        },
      },
      orderBy: {
        uploadedAt: 'desc',
      },
    });
  
    return query;
  }
  
  async incrementDownloadCount(id: string) {
    return this.prisma.academicResource.update({
      where: { id },
      data: {
        downloadCount: {
          increment: 1,
        },
      },
    });
  }
  
}
