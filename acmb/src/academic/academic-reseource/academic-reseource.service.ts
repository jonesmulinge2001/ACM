/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-floating-promises */
/* eslint-disable prettier/prettier */
import {
    Injectable,
    NotFoundException,
    ForbiddenException,
  } from '@nestjs/common';
  import { PrismaClient, ProcessingStatus } from 'generated/prisma';
  import { ProcessingService } from '../processing/processing.service';
  
  @Injectable()
  export class AcademicResourceService {
    private prisma = new PrismaClient();
  
    constructor(private processingService: ProcessingService) {}
  
    // 🔹 GET ALL
    async getAll() {
      return this.prisma.academicResource.findMany({
        where: { isDeleted: false },
        orderBy: { createdAt: 'desc' },
      });
    }
  
    // 🔹 GET ONE
    async getOne(id: string) {
      const resource = await this.prisma.academicResource.findUnique({
        where: { id },
      });
  
      if (!resource) throw new NotFoundException('Resource not found');
  
      return resource;
    }
  
    // 🔹 UPDATE (title/file ONLY)
    async update(
      id: string,
      userId: string,
      data: { title?: string; fileUrl?: string },
    ) {
      const resource = await this.prisma.academicResource.findUnique({
        where: { id },
        include: { uploader: true },
      });
  
      if (!resource) throw new NotFoundException('Resource not found');
  
      // ownership check
      if (resource.uploader.userId !== userId) {
        throw new ForbiddenException('Not allowed');
      }
  
      const updated = await this.prisma.academicResource.update({
        where: { id },
        data: {
          title: data.title,
          fileUrl: data.fileUrl,
        },
      });
  
      // reset processing
      await this.prisma.academicResourceProcessing.update({
        where: { resourceId: id },
        data: { status: ProcessingStatus.QUEUED },
      });
  
      //  trigger again
      this.processingService.processResource(id);
  
      return updated;
    }
  
    // 🔹 DELETE (soft)
    async delete(id: string, userId: string) {
      const resource = await this.prisma.academicResource.findUnique({
        where: { id },
        include: { uploader: true },
      });
  
      if (!resource) throw new NotFoundException('Resource not found');
  
      if (resource.uploader.userId !== userId) {
        throw new ForbiddenException('Not allowed');
      }
  
      return this.prisma.academicResource.update({
        where: { id },
        data: { isDeleted: true },
      });
    }
  }