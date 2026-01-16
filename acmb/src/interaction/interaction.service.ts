/* eslint-disable prettier/prettier */

/* eslint-disable prettier/prettier */
import { Injectable } from '@nestjs/common';
import { PrismaClient } from 'generated/prisma';

@Injectable()
export class InteractionService {
  private prisma = new PrismaClient();

  async logInteraction(
    userId: string,
    postId: string,
    type: 'VIEW' | 'LIKE' | 'COMMENT',
  ) {
    const interaction = await this.prisma.interaction.create({
      data: {
        userId,
        postId,
        type,
      },
    });
    return interaction;
  }
}
