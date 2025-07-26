/* eslint-disable prettier/prettier */
 
 
/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';

export interface CloudinaryUploadResult extends UploadApiResponse {
  folder: string;
}

export interface AcademeetUploadConfig {
  uploadType: AcademeetUploadType;
  maxSizeBytes: number;
  allowedFormats: string[];
  folder: string;
  transformations?: any;
}

export enum AcademeetUploadType {
  PROFILE_IMAGE = 'profile_image',
  POST_IMAGE = 'post_image',
  COURSE_BANNER = 'course_banner',
  RESOURCE_FILE = 'resource_file',
}

@Injectable()
export class AcademeetCloudinaryService {
  private readonly logger = new Logger(AcademeetCloudinaryService.name);

  constructor(private configService: ConfigService) {
    cloudinary.config({
      cloud_name: this.configService.get<string>('CLOUDINARY_CLOUD_NAME'),
      api_key: this.configService.get<string>('CLOUDINARY_API_KEY'),
      api_secret: this.configService.get<string>('CLOUDINARY_API_SECRET'),
    });

    this.logger.log('Academeet Cloudinary service initialized');
  }

  private getUploadConfig(uploadType: AcademeetUploadType): AcademeetUploadConfig {
    const configs: Record<AcademeetUploadType, AcademeetUploadConfig> = {
      [AcademeetUploadType.PROFILE_IMAGE]: {
        uploadType,
        maxSizeBytes: 2 * 1024 * 1024,
        allowedFormats: ['jpg', 'jpeg', 'png', 'webp'],
        folder: 'academeet/users/profiles',
        transformations: {
          width: 400,
          height: 400,
          crop: 'fill',
          gravity: 'face',
          quality: 'auto',
          format: 'auto',
        },
      },
      [AcademeetUploadType.POST_IMAGE]: {
        uploadType,
        maxSizeBytes: 5 * 1024 * 1024,
        allowedFormats: ['jpg', 'jpeg', 'png', 'webp'],
        folder: 'academeet/posts/images',
        transformations: {
          width: 800,
          height: 600,
          crop: 'fill',
          quality: 'auto',
          format: 'auto',
        },
      },
      [AcademeetUploadType.COURSE_BANNER]: {
        uploadType,
        maxSizeBytes: 8 * 1024 * 1024,
        allowedFormats: ['jpg', 'jpeg', 'png', 'webp'],
        folder: 'academeet/courses/banners',
        transformations: {
          width: 1600,
          height: 600,
          crop: 'fill',
          quality: 'auto',
          format: 'auto',
        },
      },
      [AcademeetUploadType.RESOURCE_FILE]: {
        uploadType,
        maxSizeBytes: 15 * 1024 * 1024,
        allowedFormats: ['pdf', 'doc', 'docx', 'ppt', 'pptx', 'jpg', 'png'],
        folder: 'academeet/resources/files',
      },
    };

    return configs[uploadType];
  }

  async uploadImage(
    file: Express.Multer.File,
    uploadType: AcademeetUploadType,
  ): Promise<CloudinaryUploadResult> {
    const config = this.getUploadConfig(uploadType);

    if (!file) {
      throw new BadRequestException('No file provided');
    }

    if (file.size > config.maxSizeBytes) {
      throw new BadRequestException('File exceeds maximum allowed size');
    }

    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: config.folder,
          transformation: config.transformations,
          resource_type: 'auto',
        },
        (error, result) => {
          if (error || !result) {
            return reject(
              new BadRequestException(
                'Cloudinary upload failed: ' + (error?.message || 'Unknown error'),
              ),
            );
          }

          const uploadResult: CloudinaryUploadResult = {
            ...result,
            folder: config.folder,
          };

          resolve(uploadResult);
        },
      );

      uploadStream.end(file.buffer);
    });
  }
}
