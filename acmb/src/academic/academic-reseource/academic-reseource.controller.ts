/* eslint-disable prettier/prettier */
import {
    Controller,
    Get,
    Patch,
    Delete,
    Param,
    Body,
    Req,
    Res,
  } from '@nestjs/common';
import { AcademicResourceService } from './academic-reseource.service';
import { RequestWithUser } from '../../interfaces/requestwithUser.interface';
import { Response } from 'express';
  
  @Controller('resources')
  export class AcademicResourceController {
    constructor(private service: AcademicResourceService) {}
  
    @Get()
    getAll() {
      return this.service.getAll();
    }
  
    @Get(':id/download')
    async download(@Param('id') id: string, @Res() res: Response) {
      const file = await this.service.getOne(id);
      return res.redirect(file.fileUrl);
    }
  
    @Get(':id')
    getOne(@Param('id') id: string) {
      return this.service.getOne(id);
    }
  
    @Patch(':id')
    update(
      @Param('id') id: string,
      @Body() body: { title?: string; fileUrl?: string },
      @Req() req: RequestWithUser,
    ) {
      return this.service.update(id, req.user.id, body);
    }
  
    @Delete(':id')
    delete(
      @Param('id') id: string,
      @Req() req: RequestWithUser,
    ) {
      return this.service.delete(id, req.user.id);
    }
  }