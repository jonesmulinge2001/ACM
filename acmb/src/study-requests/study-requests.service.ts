/* eslint-disable prettier/prettier */
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaClient, RequestStatus } from '@prisma/client';

// StudyRequestStatus enum for backward compatibility
export const StudyRequestStatus = RequestStatus;

@Injectable()
export class StudyRequestsService {
  private prisma = new PrismaClient();
  
  async sendRequest(senderId: string, receiverId: string) {
    if (senderId === receiverId) {
      throw new BadRequestException('You cannot send a request to yourself');
    }

    // Validate both users exist
    await this.validateUsersExist(senderId, receiverId);

    // Check existing link
    const existingLink = await this.checkExistingStudyLink(senderId, receiverId);
    if (existingLink) {
      throw new BadRequestException('You are already study partners');
    }

    // Check existing request
    const existingRequest = await this.checkExistingStudyRequest(senderId, receiverId);
    if (existingRequest) {
      throw new BadRequestException('You already have a pending request');
    }

    // Create request
    return this.createStudyRequest(senderId, receiverId);
  }

  async respondToRequest(
    userId: string,
    requestId: string,
    status: RequestStatus,
  ) {
    // Validate the response status
    if(!RequestStatus.PENDING) {
      throw new BadRequestException('Invalid response status');
    }

    // Check if request exists and is valid
    const request = await this.validateAndGetRequest(requestId, userId);

    // Update the request status
    const updatedRequest = await this.updateRequestStatus(requestId, status);

    // If approved, create study link
    if (status === RequestStatus.APPROVED) {
      await this.createStudyLink(request.senderId, request.receiverId);
    }

    return updatedRequest;
  }

  async cancelRequest(userId: string, requestId: string) {
    const request = await this.prisma.studyRequest.findUnique({
      where: { id: requestId },
    });

    if (!request) {
      throw new NotFoundException('Study request not found');
    }

    if (request.senderId !== userId) {
      throw new BadRequestException('Only the sender can cancel the request');
    }

    if (request.status !== StudyRequestStatus.PENDING) {
      throw new BadRequestException(
        'Cannot cancel a request that is not pending',
      );
    }

    return this.prisma.studyRequest.update({
      where: { id: requestId },
      data: {
        status: RequestStatus.CLOSED, // Using CLOSED status for canceled requests
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
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async myStudyPartners(userId: string) {
    const links = await this.prisma.studyLink.findMany({
      where: {
        OR: [{ student1Id: userId }, { student2Id: userId }],
      },
      include: {
        student1: { 
          select: { 
            id: true, 
            name: true, 
            email: true,
            profile: true 
          } 
        },
        student2: { 
          select: { 
            id: true, 
            name: true, 
            email: true,
            profile: true 
          } 
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return links.map((link) =>
      link.student1.id === userId ? link.student2 : link.student1,
    );
  }

  async mySentRequests(userId: string) {
    return this.prisma.studyRequest.findMany({
      where: {
        senderId: userId,
        status: StudyRequestStatus.PENDING,
      },
      include: {
        receiver: {
          include: {
            profile: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async getStudyRequestHistory(userId: string) {
    return this.prisma.studyRequest.findMany({
      where: {
        OR: [
          { senderId: userId },
          { receiverId: userId },
        ],
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            profile: true,
          },
        },
        receiver: {
          select: {
            id: true,
            name: true,
            profile: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async getStudyRequestById(requestId: string, userId: string) {
    const request = await this.prisma.studyRequest.findUnique({
      where: { id: requestId },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            email: true,
            profile: true,
          },
        },
        receiver: {
          select: {
            id: true,
            name: true,
            email: true,
            profile: true,
          },
        },
      },
    });

    if (!request) {
      throw new NotFoundException('Study request not found');
    }

    // Check if the user is authorized to view this request
    if (request.senderId !== userId && request.receiverId !== userId) {
      throw new BadRequestException('You are not authorized to view this request');
    }

    return request;
  }

  // Private helper methods
  private async validateUsersExist(userId1: string, userId2: string): Promise<void> {
    const [user1, user2] = await Promise.all([
      this.prisma.user.findUnique({ where: { id: userId1 } }),
      this.prisma.user.findUnique({ where: { id: userId2 } }),
    ]);

    if (!user1 || !user2) {
      throw new BadRequestException('One or both users not found');
    }
  }

  private async checkExistingStudyLink(userId1: string, userId2: string) {
    return this.prisma.studyLink.findFirst({
      where: {
        OR: [
          { student1Id: userId1, student2Id: userId2 },
          { student1Id: userId2, student2Id: userId1 },
        ],
      },
    });
  }

  private async checkExistingStudyRequest(senderId: string, receiverId: string) {
    return this.prisma.studyRequest.findFirst({
      where: {
        OR: [
          { senderId, receiverId, status: StudyRequestStatus.PENDING },
          { senderId: receiverId, receiverId: senderId, status: StudyRequestStatus.PENDING },
        ],
      },
    });
  }

  private async createStudyRequest(senderId: string, receiverId: string) {
    return this.prisma.studyRequest.create({
      data: {
        title: 'Study Partner Request',
        description: 'Request to become study partners',
        status: StudyRequestStatus.PENDING,
        senderId,
        receiverId,
      },
      include: {
        receiver: {
          select: {
            id: true,
            name: true,
            email: true,
            profile: true,
          },
        },
      },
    });
  }

  private async validateAndGetRequest(requestId: string, userId: string) {
    const request = await this.prisma.studyRequest.findUnique({
      where: { id: requestId },
    });

    if (!request) {
      throw new NotFoundException('Request not found');
    }

    if (request.receiverId !== userId) {
      throw new BadRequestException('You are not authorized to respond to this request');
    }

    if (request.status !== StudyRequestStatus.PENDING) {
      throw new BadRequestException('Request already responded to');
    }

    return request;
  }

  private async updateRequestStatus(requestId: string, status: RequestStatus) {
    return this.prisma.studyRequest.update({
      where: { id: requestId },
      data: {
        status,
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }

  private async createStudyLink(userId1: string, userId2: string) {
    // Sort IDs to maintain consistency
    const [student1Id, student2Id] = [userId1, userId2].sort();
    
    return this.prisma.studyLink.create({
      data: {
        student1Id,
        student2Id,
      },
    });
  }

  async removeStudyPartner(userId: string, partnerId: string) {
    // Check if study link exists
    const studyLink = await this.prisma.studyLink.findFirst({
      where: {
        OR: [
          { student1Id: userId, student2Id: partnerId },
          { student1Id: partnerId, student2Id: userId },
        ],
      },
    });

    if (!studyLink) {
      throw new NotFoundException('Study partnership not found');
    }

    // Delete the study link
    await this.prisma.studyLink.delete({
      where: { id: studyLink.id },
    });

    // Optionally, create a CLOSED request to track the history
    await this.prisma.studyRequest.create({
      data: {
        title: 'Study Partnership Ended',
        description: 'Study partnership has been removed',
        status: RequestStatus.CLOSED,
        senderId: userId,
        receiverId: partnerId,
      },
    });

    return { message: 'Study partnership removed successfully' };
  }

  // Clean up any pending requests between two users when they become partners
  async cleanupPendingRequests(userId1: string, userId2: string) {
    await this.prisma.studyRequest.updateMany({
      where: {
        OR: [
          { senderId: userId1, receiverId: userId2, status: StudyRequestStatus.PENDING },
          { senderId: userId2, receiverId: userId1, status: StudyRequestStatus.PENDING },
        ],
      },
      data: {
        status: RequestStatus.CLOSED,
      },
    });
  }
}