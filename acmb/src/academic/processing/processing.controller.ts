/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-floating-promises */
/* eslint-disable prettier/prettier */
import {
    Controller,
    Post,
    Param,
    Get,
    NotFoundException,
  } from '@nestjs/common';
  import { ProcessingService } from './processing.service';
  import { PrismaClient } from 'generated/prisma';
  
  @Controller('processing')
  export class ProcessingController {
    private prisma = new PrismaClient();
  
    constructor(private readonly processingService: ProcessingService) {}
  
    /**
     *  Manually trigger processing
     * POST /processing/:resourceId
     */
    @Post(':resourceId')
    async process(@Param('resourceId') resourceId: string) {
      // check if resource exists
      const resource = await this.prisma.academicResource.findUnique({
        where: { id: resourceId },
      });
  
      if (!resource) {
        throw new NotFoundException('Resource not found');
      }
  
      // ensure processing record exists
      await this.prisma.academicResourceProcessing.upsert({
        where: { resourceId },
        update: {
          status: 'QUEUED',
          error: null,
        },
        create: {
          resourceId,
          status: 'QUEUED',
        },
      });
  
      // fire and forget (non-blocking)
      this.processingService.processResource(resourceId);
  
      return {
        message: 'Processing started',
        resourceId,
      };
    }
  
    /**
     * 📊 Get processing status
     * GET /processing/:resourceId/status
     */
    @Get(':resourceId/status')
    async getStatus(@Param('resourceId') resourceId: string) {
      const processing = await this.prisma.academicResourceProcessing.findUnique({
        where: { resourceId },
      });
  
      if (!processing) {
        throw new NotFoundException('Processing record not found');
      }
  
      return processing;
    }
  
    /**
     * 🔍 Get full intelligence result
     * GET /processing/:resourceId/result
     */
    @Get(':resourceId/result')
    async getResult(@Param('resourceId') resourceId: string) {
      const resource = await this.prisma.academicResource.findUnique({
        where: { id: resourceId },
        include: {
          flags: true,
          activityLogs: true,
        },
      });
  
      if (!resource) {
        throw new NotFoundException('Resource not found');
      }
  
      const extraction = await this.prisma.academicResourceExtraction.findUnique({
        where: { resourceId },
      });
  
      const moderation = await this.prisma.academicResourceModeration.findUnique({
        where: { resourceId },
      });
  
      const classification =
        await this.prisma.academicResourceClassification.findUnique({
          where: { resourceId },
        });
  
      return {
        resource,
        extraction,
        moderation,
        classification,
      };
    }
  }