/* eslint-disable prettier/prettier */
 
/* eslint-disable prettier/prettier */
 
 
/* eslint-disable prettier/prettier */
import {
    Body,
    Controller,
    Get,
    Param,
    Patch,
    Post,
    Query,
    Request,
    UploadedFile,
    UseGuards,
    UseInterceptors,
  } from '@nestjs/common';
  import { ProfileService } from './profile.service';
  import { PermissionGuard } from 'src/guards/permissions.guard';
  import { Permission } from 'src/permissions/permission.enum';
  import { CreateProfileDto } from 'src/dto/create-profile.dto';
  import { UpdateProfileDto } from 'src/dto/update-profile.dto';
  import { AuthGuard } from '@nestjs/passport';
  import { FileInterceptor } from '@nestjs/platform-express';
  import { RequirePermissions } from 'src/decorator/permissions.decorator';
  import type { Express } from 'express'; 

  interface AuthUser {
    id: string;
    email: string;
    role: string;
  }
  
  @Controller('profiles')
  @UseGuards(AuthGuard('jwt'), PermissionGuard)
  export class ProfileController {
    constructor(private readonly profileService: ProfileService) {}
  
    @Post()
    @RequirePermissions(Permission.CREATE_PROFILE)
    async createProfile(
      @Body() dto: CreateProfileDto,
      @Request() req: { user: AuthUser },
    ) {
      return this.profileService.createprofile(req.user.id, dto);
    }
  
    @Get('me')
    @RequirePermissions(Permission.CREATE_PROFILE)
    async getMyProfile(@Request() req: { user: AuthUser }) {
      return this.profileService.getProfileByUserId(req.user.id);
    }
  
    @Get(':userId')
    @RequirePermissions(Permission.MANAGE_PROFILE)
    async getProfile(@Param('userId') userId: string) {
      return this.profileService.getProfileByUserId(userId);
    }
  
    @Patch()
    @RequirePermissions(Permission.MANAGE_PROFILE)
    async updateProfile(
      @Body() dto: UpdateProfileDto,
      @Request() req: { user: AuthUser },
    ) {
      return this.profileService.updateProfile(req.user.id, dto);
    }
  
    @Post('upload-image')
    @RequirePermissions(Permission.MANAGE_PROFILE)
    @UseInterceptors(FileInterceptor('file'))
    async uploadProfileImage(
      @Request() req: { user: AuthUser },
      @UploadedFile() file: Express.Multer.File,
    ) {
      return this.profileService.uploadProfileImage(req.user.id, file);
    }
  
    @Post('upload-cover')
    @RequirePermissions(Permission.MANAGE_PROFILE)
    @UseInterceptors(FileInterceptor('file'))
    async uploadCoverPhoto(
      @Request() req: { user: AuthUser},
      @UploadedFile() file: Express.Multer.File,
    ) {
      return this.profileService.uploadCoverPhoto(req.user.id, file)
    }
  
    @Get()
    @RequirePermissions(Permission.MANAGE_PROFILE)
    async getAllProfiles(@Query('search') search?: string) {
      return this.profileService.getAllProfiles(search)
    }

    @Get(':id')
    @RequirePermissions(Permission.MANAGE_PROFILE)
    getProfileById(@Param('id') id: string) {
  return this.profileService.getProfileById(id);
}

  }
  
  