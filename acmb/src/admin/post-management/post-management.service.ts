/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/restrict-template-expressions */
/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable prettier/prettier */
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { Post, PostFlag, PrismaClient } from 'generated/prisma';

@Injectable()
export class PostManagementService {
  private prisma = new PrismaClient();

  
  // Fetch all posts with author info and counts
  async getAllPosts(): Promise<Post[]> {
    try {
      const posts = await this.prisma.post.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
          author: {
            select: {
              id: true,
              name: true,
              profile: {
                select: {
                  profileImage: true,
                  institution: {
                    select:{
                      id: true,
                      name: true,
                    }
                  }
                },
              },
            },
          },
          _count: { select: { likes: true, comments: true } },
        },
      });

      if (!posts || posts.length === 0) {
        throw new HttpException(
          {
            statusCode: HttpStatus.NOT_FOUND,
            message: 'No posts found',
          },
          HttpStatus.NOT_FOUND,
        );
      }

      return posts;
    } catch (error) {
      throw new HttpException(
        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'Failed to fetch posts',
          error: error.message || error,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // Fetch single post by id
  async getPostById(postId: string): Promise<Post> {
    try {
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
                },
              },
            },
          },
          _count: { select: { likes: true, comments: true } },
        },
      });

      if (!post) {
        throw new HttpException(
          {
            statusCode: HttpStatus.NOT_FOUND,
            message: `Post with id ${postId} not found`,
          },
          HttpStatus.NOT_FOUND,
        );
      }

      return post;
    } catch (error) {
      throw new HttpException(
        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'Failed to fetch post',
          error: error.message || error,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // Soft delete / Restore
  async changeStatus(
    postId: string,
    action: 'DELETE' | 'RESTORE',
  ): Promise<Post> {
    try {
      // Ensure post exists
      const existingPost = await this.prisma.post.findUnique({
        where: { id: postId },
      });

      if (!existingPost) {
        throw new HttpException(
          {
            statusCode: HttpStatus.NOT_FOUND,
            message: `Post with id ${postId} not found`,
          },
          HttpStatus.NOT_FOUND,
        );
      }

      let updatedPost: Post;

      if (action === 'DELETE') {
        updatedPost = await this.prisma.post.update({
          where: { id: postId },
          data: {
            isDeleted: true,
            deletedAt: new Date(),
          },
        });
      } else if (action === 'RESTORE') {
        updatedPost = await this.prisma.post.update({
          where: { id: postId },
          data: {
            isDeleted: false,
            deletedAt: null,
          },
        });
      } else {
        throw new HttpException(
          {
            statusCode: HttpStatus.BAD_REQUEST,
            message: `Invalid action: ${action}`,
          },
          HttpStatus.BAD_REQUEST,
        );
      }

      return updatedPost;
    } catch (error) {
      throw new HttpException(
        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'Failed to update post status',
          error: error.message || error,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // Hard delete (permanently remove)
  async deletePost(postId: string): Promise<Post> {
    try {
      const existingPost = await this.prisma.post.findUnique({
        where: { id: postId },
      });
  
      if (!existingPost) {
        throw new HttpException(
          {
            statusCode: HttpStatus.NOT_FOUND,
            message: `Post with id ${postId} not found`,
          },
          HttpStatus.NOT_FOUND,
        );
      }
  
      // Perform all deletes atomically (transaction)
      await this.prisma.$transaction([
        // 1. Delete comment likes (or other children of comments)
        this.prisma.commentLike.deleteMany({
          where: { comment: { postId } },
        }),
  
        // 2. Delete comments
        this.prisma.comment.deleteMany({
          where: { postId },
        }),
  
        // 3. Delete likes on the post
        this.prisma.like.deleteMany({
          where: { postId },
        }),
  
        // 4. Delete interactions
        this.prisma.interaction.deleteMany({
          where: { postId },
        }),
  
        // 5. Delete post tags
        this.prisma.postTag.deleteMany({
          where: { postId },
        }),
      ]);
  
      // 6. Finally delete the post itself
      const deletedPost = await this.prisma.post.delete({
        where: { id: postId },
      });
  
      return deletedPost;
    } catch (error) {
      throw new HttpException(
        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'Failed to permanently delete post',
          error: error.message || error,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
  
  

  // getAllFlaggedPosts
async getAllFlaggedPosts() {
    try {
      const flaggedPosts = await this.prisma.postFlag.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
          post: {
            include: {
              author: {
                select: {
                  id: true,
                  name: true,
                  profile: {
                    select: {
                      profileImage: true,
                      institution: {
                        select:{
                          id: true,
                          name: true,
                        }
                      }
                    },
                  },
                },
              },
              _count: {
                select: {
                  likes: true,
                  comments: true,
                },
              },
            },
          },
          reporter: {
            select: {
              id: true,
              name: true,
              profile: {
                select: {
                  profileImage: true,
                  institution: {
                    select: {
                      id: true,
                      name: true,
                    }
                  }
                },
              },
            },
          },
        },
      });
  
      if (!flaggedPosts || flaggedPosts.length === 0) {
        throw new HttpException(
          {
            statusCode: HttpStatus.NOT_FOUND,
            message: 'No flagged posts found',
          },
          HttpStatus.NOT_FOUND,
        );
      }
  
      return flaggedPosts;
    } catch (error) {
      throw new HttpException(
        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'Failed to fetch flagged posts',
          error: error.message || error,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
  


// Update flag status
async updateFlagStatus(flagId: string, status: 'PENDING' | 'REVIEWED' | 'RESOLVED') {
    try {
      const flag = await this.prisma.postFlag.findUnique({
        where: { id: flagId },
      });
  
      if (!flag) {
        throw new HttpException(
          { statusCode: HttpStatus.NOT_FOUND, message: `Flag with id ${flagId} not found` },
          HttpStatus.NOT_FOUND
        );
      }
  
      const updatedFlag = await this.prisma.postFlag.update({
        where: { id: flagId },
        data: { status },
      });
  
      return updatedFlag;
    } catch (error) {
      throw new HttpException(
        { statusCode: HttpStatus.INTERNAL_SERVER_ERROR, message: 'Failed to update flag status', error: error.message || error },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
  
  // Soft delete a post flagged for moderation
  async softDeleteFlaggedPost(postId: string) {
    try {
      const post = await this.prisma.post.findUnique({ where: { id: postId } });
  
      if (!post) {
        throw new HttpException(
          { statusCode: HttpStatus.NOT_FOUND, message: `Post with id ${postId} not found` },
          HttpStatus.NOT_FOUND
        );
      }
  
      const updatedPost = await this.prisma.post.update({
        where: { id: postId },
        data: { isDeleted: true, deletedAt: new Date() },
      });
  
      return updatedPost;
    } catch (error) {
      throw new HttpException(
        { statusCode: HttpStatus.INTERNAL_SERVER_ERROR, message: 'Failed to soft-delete post', error: error.message || error },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
  
  // Restore a soft-deleted post
  async restoreFlaggedPost(postId: string) {
    try {
      const post = await this.prisma.post.findUnique({ where: { id: postId } });
  
      if (!post) {
        throw new HttpException(
          { statusCode: HttpStatus.NOT_FOUND, message: `Post with id ${postId} not found` },
          HttpStatus.NOT_FOUND
        );
      }
  
      const restoredPost = await this.prisma.post.update({
        where: { id: postId },
        data: { isDeleted: false, deletedAt: null },
      });
  
      return restoredPost;
    } catch (error) {
      throw new HttpException(
        { statusCode: HttpStatus.INTERNAL_SERVER_ERROR, message: 'Failed to restore post', error: error.message || error },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }


  // bulk delete post
  async bulkDeletePosts(postIds: string[]): Promise<Post[]> {
    try {
      // 1️⃣ Update posts
      await this.prisma.post.updateMany({
        where: { id: { in: postIds } },
        data: { isDeleted: true, deletedAt: new Date() },
      });
  
      // 2️⃣ Fetch the updated posts
      const updatedPosts = await this.prisma.post.findMany({
        where: { id: { in: postIds } },
        include: {
          author: {
            select: {
              id: true,
              name: true,
              profile: { select: { profileImage: true, institution: true } },
            },
          },
          _count: { select: { likes: true, comments: true } },
        },
      });
  
      return updatedPosts;
    } catch (error) {
      throw new HttpException(
        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'Failed to bulk delete posts',
          error: error.message || error,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
  
  
// Bulk restore posts
async bulkRestorePosts(postIds: string[]): Promise<Post[]> {
    try {
      await this.prisma.post.updateMany({
        where: { id: { in: postIds } },
        data: { isDeleted: false, deletedAt: null },
      });
  
      const restoredPosts = await this.prisma.post.findMany({
        where: { id: { in: postIds } },
        include: {
          author: {
            select: {
              id: true,
              name: true,
              profile: { select: { profileImage: true, institution: true } },
            },
          },
          _count: { select: { likes: true, comments: true } },
        },
      });
  
      return restoredPosts;
    } catch (error) {
      throw new HttpException(
        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'Failed to bulk restore posts',
          error: error.message || error,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
  

// Bulk remove flagged posts (admin can clear flags)
async bulkRemoveFlags(postIds: string[]): Promise<PostFlag[]> {
    try {
      // 1️⃣ Delete flags for the given posts
      await this.prisma.postFlag.deleteMany({
        where: { postId: { in: postIds } },
      });
  
      // 2️⃣ Return remaining flags for these posts (should be empty if fully deleted)
      const remainingFlags = await this.prisma.postFlag.findMany({
        where: { postId: { in: postIds } },
        include: {
          post: true,
          reporter: true,
        },
      });
  
      return remainingFlags;
    } catch (error) {
      throw new HttpException(
        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'Failed to bulk remove flags',
          error: error.message || error,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
  

}
