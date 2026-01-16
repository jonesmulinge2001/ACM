/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/require-await */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaClient, StudyRequestStatus } from '@prisma/client';

@Injectable()
export class StudyRequestsService {
  private prisma = new PrismaClient();
  constructor() {}

  async sendRequest(senderId: string, receiverId: string) {
    if (senderId === receiverId) {
      throw new BadRequestException('You cannot send a request to yourself');
    }

    // check existing link
    const existingLink = await this.prisma.studyLink.findFirst({
      where: {
        OR: [
          { student1Id: senderId, student2Id: receiverId },
          { student1Id: receiverId, student2Id: senderId },
        ],
      },
    });
    if (existingLink) {
      throw new BadRequestException('You are already study partners');
    }

    // check existing request
    const existingRequest = await this.prisma.studyRequest.findFirst({
      where: {
        OR: [
          { senderId, receiverId },
          { senderId: receiverId, receiverId: senderId },
        ],
      },
    });
    if (existingRequest) {
      throw new BadRequestException('You already have a pending request');
    }

    // create request
    return this.prisma.studyRequest.create({
      data: {
        senderId,
        receiverId,
      },
    });
  }

  async respondToRequest(
    userId: string,
    requestId: string,
    status: StudyRequestStatus,
  ) {
    // check if request exists
    const request = await this.prisma.studyRequest.findUnique({
      where: {
        id: requestId,
      },
    });
    if (!request || request.receiverId !== userId) {
      throw new BadRequestException('Request not found');
    }
    if (request.status !== StudyRequestStatus.PENDING) {
      throw new BadRequestException('Request already responded to');
    }

    const updated = await this.prisma.studyRequest.update({
      where: {
        id: requestId,
      },
      data: {
        status,
        respondedAt: new Date(),
      },
    });
    if (status === StudyRequestStatus.ACCEPTED) {
      const [a, b] =
        request.senderId < request.receiverId
          ? [request.senderId, request.receiverId]
          : [request.receiverId, request.senderId];

      await this.prisma.studyLink.create({
        data: {
          student1Id: a,
          student2Id: b,
        },
      });
    }
    return updated;
  }

  async cancelRequest(userId: string, requestId: string) {
    const request = await this.prisma.studyRequest.findUnique({
      where: { id: requestId },
    });
    if (!request || request.senderId !== userId) {
      throw new NotFoundException('Study request not found');
    }
    if (request.status !== StudyRequestStatus.PENDING) {
      throw new BadRequestException(
        'Cannot cancel a request that is not pending',
      );
    }
    return this.prisma.studyRequest.update({
      where: { id: requestId },
      data: {
        status: StudyRequestStatus.CANCELED,
        reporterId: new Date(),
      },
    });
  }

  async myIncomingRequests(userId: string) {
    return this.prisma.studyRequest.findMany({
      where: {
        receiverId: userId,
        status: StudyRequestStatus.PENDING,
      },
      include: {
        sender: {
          include: {
            profile: true,
          },
        },
      },
    });
  }

  async myStudyPartners(userId: string) {
    const links = await this.prisma.studyLink.findMany({
      where: {
        OR: [{ student1Id: userId }, { student2Id: userId }],
      },
      include: {
        student1: { select: { id: true, name: true, profile: true } },
        student2: { select: { id: true, name: true, profile: true } },
      },
    });
    return links.map((link) =>
      link.student1.id === userId ? link.student2 : link.student1,
    );
  }
}
