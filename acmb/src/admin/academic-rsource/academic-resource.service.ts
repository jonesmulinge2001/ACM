/* eslint-disable prettier/prettier */

/* eslint-disable prettier/prettier */

/* eslint-disable prettier/prettier */
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { FlagStatus, PrismaClient } from 'generated/prisma';

@Injectable()
export class AcademicResourceService {
  private prisma = new PrismaClient();

  /**
   * Get all resources with filtering, search, and pagination
   */

  async findAllResources(params: {
    page?: number;
    limit?: number;
    search?: string;
    institution?: string;
    course?: string;
    semester?: string;
    year?: string;
  }) {
    const {
      page = 1,
      limit = 10,
      search,
      institution,
      course,
      semester,
      year,
    } = params;

    const where = {
      ...(search && {
        OR: [
          { title: { contains: search, QueryMode: 'insensitive' } },
          { description: { contains: search, QueryMode: 'insensitive' } },
          { course: { contains: search, QueryMode: 'insensitive' } },
          { unitName: { contains: search, QueryMode: 'insensitive' } },
          { institution: { contains: search, QueryMode: 'insensitive' } },
        ],
      }),
      ...(institution && { institution }),
      ...(course && { course }),
      ...(semester && { semester }),
      ...(year && { year }),
    };

    const [resources, total] = await this.prisma.$transaction([
      this.prisma.academicResource.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { uploadedAt: 'desc' },
        include: {
          uploader: {
            select: {
              id: true,
              name: true,
              institution: true,
              course: true,
            },
          },
        },
      }),
      this.prisma.academicResource.count({ where }),
    ]);

    return {
      data: resources,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get single resource by ID
   */
  async findOneResource(id: string) {
    const resource = await this.prisma.academicResource.findUnique({
      where: { id },
      include: {
        uploader: {
          select: {
            id: true,
            name: true,
            institution: true,
            course: true,
          },
        },
      },
    });

    if (!resource) {
      throw new NotFoundException('Academic resource not found');
    }

    return resource;
  }

  /**
   * Delete a resource (soft delete or hard delete depending on your policy)
   */

  async softDeleteResource(id: string) {
    const existing = await this.prisma.academicResource.findUnique({
      where: { id },
    });
    if (!existing) throw new NotFoundException('Resource not found');

    // Soft delete (just set deletedAt)
    return this.prisma.academicResource.update({
      where: { id },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
      },
    });
  }

  async hardDeleteResource(id: string) {
    const existing = await this.prisma.academicResource.findUnique({
      where: { id },
    });
    if (!existing) throw new NotFoundException('Resource not found');

    // Hard delete (permanent)
    return this.prisma.academicResource.delete({ where: { id } });
  }

  /**
   * Bulk delete resources
   */
  /**
   * Bulk soft delete resources
   */
  async bulkDelete(resourceIds: string[]) {
    if (!resourceIds || resourceIds.length === 0) {
      throw new BadRequestException('No resource IDs provided');
    }

    // Step 1: Find resources that are not yet deleted
    const activeResources = await this.prisma.academicResource.findMany({
      where: {
        id: { in: resourceIds },
        isDeleted: false,
      },
      select: { id: true },
    });

    if (activeResources.length === 0) {
      throw new BadRequestException(
        'No active resources found to delete. Make sure the resources exist and are not already deleted.',
      );
    }

    // Step 2: Soft delete only those
    const result = await this.prisma.academicResource.updateMany({
      where: { id: { in: activeResources.map((r) => r.id) } },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
      },
    });

    return {
      deletedCount: result.count,
      deletedIds: activeResources.map((r) => r.id),
      skipped: resourceIds.filter(
        (id) => !activeResources.map((r) => r.id).includes(id),
      ),
    };
  }

  /**
   * Bulk restore resources (after soft delete)
   */
  async bulkRestore(resourceIds: string[]) {
    if (!resourceIds || resourceIds.length === 0) {
      throw new BadRequestException('No resource IDs provided');
    }

    // Step 1: Find which ones are actually soft deleted
    const deletedResources = await this.prisma.academicResource.findMany({
      where: {
        id: { in: resourceIds },
        isDeleted: true,
      },
      select: { id: true },
    });

    if (deletedResources.length === 0) {
      throw new BadRequestException(
        'No deleted resources found to restore. Make sure the resources exist and are soft deleted.',
      );
    }

    // Step 2: Restore only the soft-deleted ones
    const result = await this.prisma.academicResource.updateMany({
      where: { id: { in: deletedResources.map((r) => r.id) } },
      data: {
        isDeleted: false,
        deletedAt: null,
      },
    });

    return {
      restoredCount: result.count,
      restoredIds: deletedResources.map((r) => r.id),
      skipped: resourceIds.filter(
        (id) => !deletedResources.map((r) => r.id).includes(id),
      ),
    };
  }

  async reviewFlag(flagId: string, adminId: string, status: FlagStatus) {
    const flag = await this.prisma.academicResourceFlag.findUnique({
      where: { id: flagId },
    });
    if (!flag) throw new NotFoundException('Flag not found');

    return this.prisma.academicResourceFlag.update({
      where: { id: flagId },
      data: {
        status,
        reviewedById: adminId,
        updatedAt: new Date(),
      },
    });
  }

  async approveResource(id: string, adminId: string) {
    return this.prisma.academicResource.update({
      where: { id },
      data: {
        isApproved: true,
        approvedAt: new Date(),
        approvedBy: adminId,
      },
    });
  }

  async unpublishResource(id: string) {
    return this.prisma.academicResource.update({
      where: { id },
      data: { isApproved: false },
    });
  }
}
