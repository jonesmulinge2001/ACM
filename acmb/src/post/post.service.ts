/* eslint-disable prettier/prettier */

/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { PostType, Prisma, PrismaClient } from 'generated/prisma';
import { CreatePostDto } from 'src/dto/create-post.dto';
import { UpdatePostDto } from 'src/dto/update-post.dto';
import { PostDto } from 'src/interfaces/post.interface';
import dayjs from 'dayjs';
import {
  AcademeetCloudinaryService,
  AcademeetUploadType,
} from 'src/shared/cloudinary/cloudinary/cloudinary.service';

@Injectable()
export class PostService {
  private prisma = new PrismaClient();

  constructor(private cloudinary: AcademeetCloudinaryService) {}

  // Create post
  async createPost(
    userId: string,
    dto: CreatePostDto,
    file?: Express.Multer.File,
  ): Promise<PostDto> {
    let fileUrl: string | undefined;

    // Upload file to Cloudinary (if exists)
    if (file) {
      try {
        const uploaded = await this.cloudinary.uploadMedia(
          file,
          AcademeetUploadType.POST_IMAGE,
        );
        console.log('Cloudinary response:', uploaded);
        fileUrl = uploaded.secure_url;
      } catch (err) {
        console.error('File upload failed:', err);
      }
    }

    // Correctly structure the tag connections via PostTag
    const createTags =
      dto.tags?.map((tagName) => ({
        tag: {
          connectOrCreate: {
            where: { name: tagName.toLowerCase() },
            create: { name: tagName.toLowerCase() },
          },
        },
      })) ?? [];

    // Create the post and connect tags via PostTag
    const post = await this.prisma.post.create({
      data: {
        title: dto.title,
        body: dto.body,
        fileUrl,
        authorId: userId,
        type: (dto.type?.toUpperCase() as PostType) || PostType.GENERAL,
        tags: {
          create: createTags,
        },
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            profile: { select: { profileImage: true } },
          },
        },
        tags: {
          include: { tag: true },
        },
      },
    });

    return this.toPostDto(post);
  }

  async getAllPosts(currentUserId: string): Promise<PostDto[]> {
    const posts = await this.prisma.post.findMany({
      where: {
        isDeleted: false,
      },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        body: true,
        fileUrl: true,
        createdAt: true,
        updatedAt: true,
        type: true,
        author: {
          select: {
            id: true,
            name: true,

            profile: {
              select: {
                profileImage: true,
                institution: true,
                academicLevel: true,
              },
            },
          },
        },
        tags: {
          include: {
            tag: true,
          },
        },
      },
    });

    return posts.map((post) => this.toPostDto(post, currentUserId));
  }

  // Helper method to convert Prisma post to PostDto
  private toPostDto(post: any, currentUserId?: string): PostDto {
    const likes = post.likes ?? [];
    return {
      id: post.id,
      title: post.title,
      body: post.body || undefined,
      fileUrl: post.fileUrl || undefined,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
      type: post.type,
      author: {
        id: post.author.id,
        name: post.author.name,
        profileImage: post.author.profile?.profileImage,
        institution: post.author.profile?.institution,
        academicLevel: post.author.profile?.academicLevel,
      },
      tags: post.tags?.map((pt) => pt.tag?.name) ?? [],
      likesCount: likes.length,
      likedByCurrentUser: !!likes.find((like) => like.userId === currentUserId),
    };
  }

  async deletePost(userId: string, postId: string): Promise<void> {
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
      select: { authorId: true, isDeleted: true },
    });

    if (!post || post.authorId !== userId || post.isDeleted) {
      throw new NotFoundException('Post not found or unauthorized');
    }

    await this.prisma.post.update({
      where: { id: postId },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
      },
    });
  }

  //>>> get post by id
  async getPostById(postId: string, currentUserId?: string): Promise<PostDto> {
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            profile: {
              select: {
                profileImage: true,
                institution: true,
                academicLevel: true,
              },
            },
          },
        },
        tags: {
          include: {
            tag: true,
          },
        },
      },
    });
    if (!post || post.isDeleted) {
      throw new NotFoundException('Post not found');
    }
    return this.toPostDto(post, currentUserId);
  }

  //>>> update post
  async updatePost(
    userId: string,
    postId: string,
    dto: UpdatePostDto,
    file?: Express.Multer.File,
  ): Promise<PostDto> {
    const existingPost = await this.prisma.post.findUnique({
      where: { id: postId },
      select: { authorId: true },
    });

    if (!existingPost || existingPost.authorId !== userId) {
      throw new NotFoundException('Post not found or unauthorized');
    }

    let fileUrl: string | undefined;
    if (file) {
      try {
        const uploaded = await this.cloudinary.uploadMedia(
          file,
          AcademeetUploadType.POST_IMAGE,
        );
        fileUrl = uploaded.secure_url;
      } catch (err) {
        console.error('Cloudinary upload error:', err);
        throw new InternalServerErrorException('Failed to upload file');
      }
    }
    

    const updatedTags = dto.tags?.map((tagName) => ({
      tag: {
        connectOrCreate: {
          where: { name: tagName.toLowerCase() },
          create: { name: tagName.toLowerCase() },
        },
      },
    }));

    const updateData: Prisma.PostUpdateInput = {
      title: { set: dto.title },
      body: { set: dto.body || null },
      fileUrl: { set: fileUrl || null },
      updatedAt: { set: new Date() },
    };

    if (updatedTags) {
      updateData.tags = {
        deleteMany: {}, // delete existing
        create: updatedTags, // add new
      };
    }

    const updatedPost = await this.prisma.post.update({
      where: { id: postId },
      data: updateData,
      include: {
        author: {
          select: {
            id: true,
            name: true,
            profile: { select: { profileImage: true } },
          },
        },
        tags: {
          include: { tag: true },
        },
      },
    });

    return this.toPostDto(updatedPost);
  }

  //>>> return posts depending on tpe
  async getPostByType(
    type: PostType,
    currentUserId: string,
  ): Promise<PostDto[]> {
    const posts = await this.prisma.post.findMany({
      where: {
        type,
        isDeleted: false,
      },
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        id: true,
        title: true,
        body: true,
        fileUrl: true,
        createdAt: true,
        updatedAt: true,
        type: true,
        author: {
          select: {
            id: true,
            name: true,
            profile: {
              select: {
                profileImage: true,
              },
            },
          },
        },
        tags: {
          include: {
            tag: true,
          },
        },
      },
    });
    return posts.map((post) => this.toPostDto(post, currentUserId));
  }

  //>>> trending posts
  async getTrendingPosts(currentUserId: string): Promise<PostDto[]> {
    const posts = await this.prisma.post.findMany({
      where: {
        createdAt: {
          gte: dayjs().subtract(7, 'day').toDate(),
        },
        isDeleted: false,
      },
      orderBy: {
        likes: {
          _count: 'desc',
        },
      },
      take: 20,
      select: {
        id: true,
        title: true,
        body: true,
        fileUrl: true,
        createdAt: true,
        updatedAt: true,
        type: true,
        author: {
          select: {
            id: true,
            name: true,
            profile: {
              select: {
                profileImage: true,
                institution: true,
                academicLevel: true,
              },
            },
          },
        },
        tags: {
          include: {
            tag: true,
          },
        },
      },
    });
    return posts.map((post) => this.toPostDto(post, currentUserId));
  }

  async getPostsByUser(
    userId: string,
    currentUserId: string,
  ): Promise<PostDto[]> {
    const posts = await this.prisma.post.findMany({
      where: {
        authorId: userId,
        isDeleted: false,
      },
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            profile: {
              select: {
                profileImage: true,
                institution: true,
                academicLevel: true,
              },
            },
          },
        },
        tags: {
          include: {
            tag: true,
          },
        },
        likes: true,
      },
    });

    return posts.map((post) => this.toPostDto(post, currentUserId));
  }
}
