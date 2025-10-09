/* eslint-disable prettier/prettier */

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
import { RequestWithUser } from 'src/interfaces/requestwithUser.interface';
import { FilesInterceptor } from '@nestjs/platform-express';
import { Permission } from 'src/permissions/permission.enum';
import { AuthGuard } from '@nestjs/passport';
import { RequirePermissions } from 'src/decorator/permissions.decorator';
import { CreateAnnouncementDto } from 'src/dto/createAnnouncement.dto';

@Controller('institutions')
@UseGuards(AuthGuard('jwt'))
export class InstitutionController {
  constructor(private readonly institutionService: InstitutionService) {}

  /** Create an announcement with optional file uploads */
  @Post(':institutionId/announcement')
  @UseInterceptors(FilesInterceptor('files', 5)) // max 5 files
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

  /** Update an existing announcement with optional new files */
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
  deleteAnnouncement(
    @Param('announcementId') announcementId: string,
    @Req() req: RequestWithUser,
  ) {
    return this.institutionService.deleteAnnouncement(
      announcementId,
      req.user.id,
    );
  }


  /** Get simple analytics for an institution */
  @Get(':institutionId/analytics')
  getAnalytics(@Param('institutionId') institutionId: string) {
    return this.institutionService.getAnalytics(institutionId);
  }

  /** Get all announcements sent by the logged-in admin */
  @Get('my-announcements')
  @RequirePermissions(Permission.CREATE_ANNOUNCEMENT)
  getMyAnnouncements(@Req() req: RequestWithUser) {
    return this.institutionService.getAdminAnnouncements(req.user.id);
  }

    /** Fetch all institutions for dropdowns */
    @Get()
    async getAllInstitutions() {
      return this.institutionService.getAllInstitutions();
    }

  /** Get single announcement by ID (with metadata) */
  @Get(':id')
  async getAnnouncementById(
    @Param('id') announcementId: string,
    @Req() req: RequestWithUser,
  ) {
    const userId = req.user.id;
    return this.institutionService.getAnnouncementById(announcementId, userId);
  }
}
