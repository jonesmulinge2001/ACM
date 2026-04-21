/* eslint-disable prettier/prettier */
import {
    Controller,
    Get,
    Patch,
    Delete,
    Param,
    Body,
    Req,
  } from '@nestjs/common';
import { AcademicResourceService } from './academic-reseource.service';
import { RequestWithUser } from 'src/interfaces/requestwithUser.interface';
  
  @Controller('resources')
  export class AcademicResourceController {
    constructor(private service: AcademicResourceService) {}
  
    @Get()
    getAll() {
      return this.service.getAll();
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
    delete(@Param('id') id: string, 
    @Req() req: RequestWithUser
) {
      return this.service.delete(id, req.user.id);
    }
  }