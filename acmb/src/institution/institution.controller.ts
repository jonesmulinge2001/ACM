/* eslint-disable prettier/prettier */
import {
  Body,
  Controller,
  Param,
  Post,
  Get,
  Req,
  Patch,
  Delete,
  UseInterceptors,
  UploadedFiles,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import { InstitutionService } from './institution.service';
import { RequestWithUser } from '../interfaces/requestwithUser.interface';
import { FilesInterceptor } from '@nestjs/platform-express';
import { AuthGuard } from '@nestjs/passport';
import { CreateAnnouncementDto } from '../dto/createAnnouncement.dto';
import { CreateInstitutionRequestDto } from '../dto/create-institution-request.dto';
import type { Express } from 'express';

@Controller('institutions')
@UseGuards(AuthGuard('jwt'))
export class InstitutionController {
  constructor(private readonly institutionService: InstitutionService) {}

  /** Register a new institution */
  @Post('register')
  @UseInterceptors(FilesInterceptor('logo', 1))
  async registerInstitution(
    @Body(new ValidationPipe({ transform: true }))
    body: CreateInstitutionRequestDto,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    const file = files?.[0];
    return this.institutionService.registerInstitution(body, file);
  }

  /** Create an announcement for an institution */
  @Post(':institutionId/announcement')
  @UseInterceptors(FilesInterceptor('files', 5))
  async createAnnouncement(
    @Param('institutionId') institutionId: string,
    @Body(new ValidationPipe({ transform: true })) body: CreateAnnouncementDto,
    @UploadedFiles() files: Express.Multer.File[],
    @Req() req: RequestWithUser,
  ) {
    return this.institutionService.createAnnouncement(
      institutionId,
      { ...body, files },
      req.user.id,
    );
  }

  /** Update an announcement */
  @Patch('announcements/:announcementId')
  @UseInterceptors(FilesInterceptor('files', 5))
  async updateAnnouncement(
    @Param('announcementId') announcementId: string,
    @Body(new ValidationPipe({ transform: true }))
    body: {
      title?: string;
      content?: string;
      publish?: boolean;
    },
    @UploadedFiles() files: Express.Multer.File[],
    @Req() req: RequestWithUser,
  ) {
    return this.institutionService.updateAnnouncement(
      announcementId,
      { ...body, files },
      req.user.id,
    );
  }

  /** Delete an announcement */
  @Delete('announcements/:announcementId')
  async deleteAnnouncement(
    @Param('announcementId') announcementId: string,
    @Req() req: RequestWithUser,
  ) {
    return this.institutionService.deleteAnnouncement(
      announcementId,
      req.user.id,
    );
  }

  /** Get analytics for an institution */
  @Get(':institutionId/analytics')
  async getAnalytics(@Param('institutionId') institutionId: string) {
    return this.institutionService.getAnalytics(institutionId);
  }

  /** Get all announcements for the logged-in admin */
  // @Get('my-announcements')
  // async getMyAnnouncements(@Req() req: RequestWithUser) {
  //   return this.institutionService.getAnnouncementById(req.user.id);
  // }

  /** Fetch all institutions for dropdowns */
  @Get()
  async getAllInstitutions() {
    return this.institutionService.getAllInstitutions();
  }

  /** Get a single announcement by ID */
  @Get(':id')
  async getAnnouncementById(
    @Param('id') announcementId: string,
    @Req() req: RequestWithUser,
  ) {
    return this.institutionService.getAnnouncementById(
      announcementId,
      req.user.id,
    );
  }
}
