/* eslint-disable prettier/prettier */

/* eslint-disable prettier/prettier */

/* eslint-disable prettier/prettier */

import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  NotFoundException,
  Query,
  Patch,
  Param,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RequirePermissions } from 'src/decorator/permissions.decorator';
import { Permission } from 'src/permissions/permission.enum';
import { RequestWithUser } from 'src/interfaces/requestwithUser.interface';
import { FileInterceptor } from '@nestjs/platform-express';
import { AcademicResourceService } from './academic.service';
import { CreateAcademicResourceDto } from 'src/dto/academic-resource.dto';
import { PrismaClient } from 'generated/prisma';
import type { Express } from 'express'; 

@Controller('academic-resources')
export class AcademicResourceController {
  private prisma = new PrismaClient();

  constructor(private readonly academicService: AcademicResourceService) {}

  @Post()
  @UseGuards(AuthGuard('jwt'))
  @RequirePermissions(Permission.CREATE_POST)
  @UseInterceptors(FileInterceptor('file'))
  async uploadResource(
    @Req() req: RequestWithUser,
    @Body() dto: CreateAcademicResourceDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    // Fetch profile based on the logged-in user ID
    const profile = await this.prisma.profile.findUnique({
      where: { userId: req.user.id },
    });

    if (!profile) {
      throw new NotFoundException('Profile not found for this user');
    }

    return this.academicService.uploadResource(profile.id, dto, file);
  }

  @Get()
  @UseGuards(AuthGuard('jwt'))
  @RequirePermissions(Permission.CREATE_POST)
  async getResources(
    @Query('search') search?: string,
    @Query('course') course?: string,
    @Query('institution') institution?: string,
    @Query('year') year?: string,
  ) {
    const hasFilter = search || course || institution || year;
    if (hasFilter) {
      return this.academicService.getFilteredResources({
        search,
        course,
        institution,
        year,
      });
    }

    return this.academicService.getAllResources();
  }

  @Patch(':id/download')
  @UseGuards(AuthGuard('jwt'))
  @RequirePermissions(Permission.CREATE_POST)
  async incrementDownload(@Param('id') id: string) {
    return this.academicService.incrementDownloadCount(id);
  }
}
