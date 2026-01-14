/* eslint-disable prettier/prettier */
import { Injectable } from '@nestjs/common';
import { PrismaClient } from 'generated/prisma';

@Injectable()
export class SearchService {
  constructor() {}
  private prisma = new PrismaClient();
  async searchAll(query: string) {
    if (!query) return [];

    const students = await this.prisma.profile.findMany({
      where: {
        name: { contains: query, mode: 'insensitive' },
      },
      take: 5,
    });

    const posts = await this.prisma.post.findMany({
      where: {
        body: { contains: query, mode: 'insensitive' },
      },
      take: 5,
    });

     
    const resources = await this.prisma.academicResource.findMany({
      where: {
        title: { contains: query, mode: 'insensitive' },
      },
      take: 5,
    });

    return { students, posts, resources };
  }
}
