/* eslint-disable prettier/prettier */
import { PostType } from 'generated/prisma';

/* eslint-disable prettier/prettier */
export interface PostDto {
    id: string;
    title: string;
    body?: string;
    fileUrl?: string;
    createdAt: Date;
    updatedAt: Date;
    type: PostType
    author: {
      id: string;
      name: string;
      profileImage?: string;
      institution: string;
      academicLevel: string;
    };
    tags?: string[];

    likesCount: number;
    likedByCurrentUser: boolean;
  }
  