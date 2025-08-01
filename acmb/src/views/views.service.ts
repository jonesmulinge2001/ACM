/* eslint-disable prettier/prettier */

/* eslint-disable prettier/prettier */
import { Injectable } from '@nestjs/common';
import { PrismaClient } from 'generated/prisma';

@Injectable()
export class ViewsService {
  private prisma = new PrismaClient();

  async trackView(userId: string, postId: string) {
    const existing = await this.prisma.interaction.findFirst({
      where: {
        userId,
        postId,
        type: 'VIEW',
      },
    });

    if (!existing) {
      return this.prisma.interaction.create({
        data: {
          userId,
          postId,
          type: 'VIEW',
        },
      });
    }

    return existing;
  }
}
