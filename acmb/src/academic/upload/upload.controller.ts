/* eslint-disable prettier/prettier */
import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  Body,
  Req,
  UseGuards,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CreateAcademicResourceDto } from 'src/dto/academic-resource.dto';
import { UploadService } from './upload.service';
import { RequestWithUser } from 'src/interfaces/requestwithUser.interface';
import { AuthGuard } from '@nestjs/passport';

@Controller('upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post('academic-resource')
  @UseGuards(AuthGuard('jwt'))
  @UseInterceptors(FileInterceptor('file'))
  async uploadResource(
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: CreateAcademicResourceDto,
    @Req() req: RequestWithUser,
  ) {
    return this.uploadService.uploadAcademicResource(file, dto, req.user.id);
  }
}
