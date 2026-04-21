/* eslint-disable prettier/prettier */
import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaClient, ProcessingStatus } from 'generated/prisma';
import { CreateAcademicResourceDto } from 'src/dto/academic-resource.dto';
import {
  AcademeetCloudinaryService,
  AcademeetUploadType,
} from 'src/shared/cloudinary/cloudinary/cloudinary.service';
import { ProcessingService } from '../processing/processing.service';

@Injectable()
export class UploadService {
  constructor(
    private cloudinary: AcademeetCloudinaryService,
    private processingService: ProcessingService,
  ) {}

  private prisma = new PrismaClient();

  async uploadAcademicResource(
    file: Express.Multer.File | undefined,
    dto: CreateAcademicResourceDto,
    userId: string,
  ) {
    if (!file && !dto.fileUrl) {
      throw new BadRequestException('Provide either a file or a fileUrl');
    }
  
    const profile = await this.prisma.profile.findUnique({
      where: { userId },
    });
  
    if (!profile) throw new BadRequestException('Profile not found');
  
    let finalFileUrl: string;
    let fileType: string | null = null;
  
    // 📌 CASE 1: file upload
    if (file) {
      const uploadResult = await this.cloudinary.uploadRaw(
        file,
        AcademeetUploadType.RESOURCE_FILE,
      );
  
      finalFileUrl = uploadResult.secure_url;
      fileType = file.mimetype;
    }
  
    // 📌 CASE 2: URL upload
    else {
      finalFileUrl = dto.fileUrl!;
  
      // optional improvement: infer from URL
      // const ext = dto.fileUrl.split('.').pop();
      // fileType = ext ?? null;
    }
  
    const resource = await this.prisma.academicResource.create({
      data: {
        title: dto.title,
        fileUrl: finalFileUrl,
        fileType, // ✅ safe now
        uploaderId: profile.id,
        institutionId: profile.institutionId,
        course: profile.course ?? 'UNKNOWN',
      },
    });
  
    await this.prisma.academicResourceProcessing.create({
      data: {
        resourceId: resource.id,
        status: ProcessingStatus.QUEUED,
      },
    });
  
    setImmediate(() => {
      this.processingService.processResource(resource.id).catch((err) => {
        console.error(`Processing failed for ${resource.id}:`, err);
      });
    });
  
    return {
      message: file
        ? 'File upload successful. Processing started.'
        : 'URL upload successful. Processing started.',
      resource,
    };
  }
}