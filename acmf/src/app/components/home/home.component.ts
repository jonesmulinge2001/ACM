import { RouterModule } from '@angular/router';
import { Component, OnInit } from '@angular/core';
import { Comment, Post, Profile } from '../../interfaces';
import { PostService } from '../../services/post.service';
import { ToastrService } from 'ngx-toastr';
import { CommonModule } from '@angular/common';
import { ProfileService } from '../../services/profile.service';
import { FollowService } from '../../services/follow.service';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CommentService } from '../../services/comment.service';
import { TimeagoModule } from 'ngx-timeago';
import { ResourceUploadModalComponent } from '../resource-upload-modal/resource-upload-modal.component';
import { NumberShortPipe } from '../../pipes/number-short.pipe';
import { EditPostComponent } from '../edit-post/edit-post.component';
import { CountUpDirective } from '../../directives/count-up/count-up.component';
import { LikeService } from '../../services/like.service';
import { InfiniteScrollModule } from 'ngx-infinite-scroll';
import { forkJoin, timer } from 'rxjs';
import { finalize } from 'rxjs/operators';

@Component({
  standalone: true,
  selector: 'app-home',
  imports: [
    CommonModule,
    CountUpDirective,
    RouterModule,
    NumberShortPipe,
    ReactiveFormsModule,
    FormsModule,
    TimeagoModule,
    ResourceUploadModalComponent,
    EditPostComponent,
    InfiniteScrollModule,
  ],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
})
export class HomeComponent implements OnInit {
  trendingPosts: Post[] = [];
  recommendedPosts: Post[] = [];
  profiles: Profile[] = [];
  followingIds: string[] = [];

  loggedInUserId = localStorage.getItem('userId');
  loading = true;
  showUpload = false;

  commentVisible: { [postId: string]: boolean } = {};
  newComments: { [postId: string]: string } = {};
  userProfile?: Profile;
  comments: { [postId: string]: Comment[] } = {};
  commentCounts: { [postId: string]: number } = {};
  commentLoading: { [postId: string]: boolean } = {};

  replies: { [commentId: string]: Comment[] } = {};
  replyInputs: { [commentId: string]: string } = {};
  repliesVisible: { [commentId: string]: boolean } = {};

  actionMenuOpen: { [postId: string]: boolean } = {};
  showEditModal = false;
  selectedPostForEdit?: Post | null;

  posts: Post[] = [];
  nextCursor?: string | null = undefined;
  isLoading = false;
  limit = 10;

  likingInProgress = new Set<string>();

  expandedPosts: { [postId: string]: boolean } = {};

  constructor(
    private postService: PostService,
    private toastr: ToastrService,
    private profileService: ProfileService,
    private followService: FollowService,
    private commentService: CommentService,
    private likeService: LikeService
  ) {}

  ngOnInit(): void {
    this.loading = true;
    this.loadMorePosts(); // initial load via infinite scroll array

    this.profileService.getMyProfile().subscribe({
      next: (profile) => {
        this.userProfile = profile;
      },
      error: () => {
        this.toastr.warning('Failed to load user profile');
      },
    });

    if (this.loggedInUserId) {
      this.followService.getFollowing(this.loggedInUserId).subscribe({
        next: (follows) => {
          this.followingIds = follows.map((f) => f.followingId);
        },
        error: () => this.toastr.error('Could not load following list'),
      });
    }

    this.loadProfilesWithFollowStats();
    this.loadTrendingAndRecommended();
  }

  loadMorePosts() {
    if (this.isLoading || this.nextCursor === null) return;
  
    this.isLoading = true;
    this.loading = true; // show skeleton loader
  
    // Wrap the HTTP request and a 2-second timer
    forkJoin({
      posts: this.postService.getInfinitePosts(this.limit, this.nextCursor),
      delay: timer(2000)
    })
    .pipe(
      finalize(() => {
        this.isLoading = false;
        this.loading = false;
      })
    )
    .subscribe({
      next: ({ posts }) => {
        this.posts = [...this.posts, ...posts.posts];
        this.injectLikesCount(posts.posts);
  
        posts.posts.forEach((post) => {
          this.commentService.getCommentCount(post.id).subscribe({
            next: (response) => (this.commentCounts[post.id] = response.total),
            error: () => (this.commentCounts[post.id] = 0),
          });
        });
  
        this.nextCursor = posts.nextCursor ?? null;
      },
      error: () => {
        this.toastr.error('Failed to load more posts');
      },
    });
  }

  loadTrendingAndRecommended() {
    this.postService.getTrendingPosts().subscribe({
      next: (posts) => {
        this.trendingPosts = posts;
        this.injectLikesCount(this.trendingPosts);
      },
      error: () => {
        this.toastr.error('Failed to load trending posts');
      },
    });

    this.postService.getRecommendedPostsForUser().subscribe({
      next: (posts) => {
        this.recommendedPosts = posts;
        this.injectLikesCount(this.recommendedPosts);
      },
    });
  }

  isFollowing(userId: string): boolean {
    return this.followingIds.includes(userId);
  }

  follow(userId: string): void {
    this.followService.followUser(userId).subscribe({
      next: () => {
        this.toastr.success('Followed successfully');
        this.followingIds.push(userId);
      },
      error: () => this.toastr.error('Follow failed'),
    });
  }

  unFollow(userId: string): void {
    this.followService.unFollowUser(userId).subscribe({
      next: () => {
        this.toastr.info('Unfollowed');
        this.followingIds = this.followingIds.filter((id) => id !== userId);
      },
      error: () => this.toastr.error('Unfollow failed'),
    });
  }

  private loadProfilesWithFollowStats(): void {
    this.profileService.getAllProfiles().subscribe({
      next: (profiles) => {
        this.profiles = profiles;
        this.profiles.forEach((profile) => {
          if (profile.id) {
            this.followService.getFollowStats(profile.id).subscribe({
              next: (followStats) => {
                profile.followersCount = followStats.followers;
                profile.followingCount = followStats.following;
              },
              error: () => this.toastr.error('Error fetching profile stats'),
            });
          }
        });
      },
      error: () => this.toastr.error('Error loading profiles'),
    });
  }

  toggleComments(postId: string) {
    this.commentVisible[postId] = !this.commentVisible[postId];
    if (this.commentVisible[postId] && !this.comments[postId]) {
      this.commentLoading[postId] = true;
      this.commentService.getComments(postId).subscribe({
        next: (response) => {
          this.comments[postId] = response.comments;
          this.commentCounts[postId] = response.total;
          this.commentLoading[postId] = false;

          for (const comment of response.comments) {
            if (comment.replies && comment.replies.length > 0) {
              this.replies[comment.id] = comment.replies;
            }
          }
        },
        error: () => {
          this.toastr.error('Failed to load comments');
          this.commentLoading[postId] = false;
        },
      });
    }
  }

  toggleLike(comment: Comment) {
    const likeAction = comment.isLikedByCurrentUser
      ? this.commentService.unlikeComment(comment.id)
      : this.commentService.likeComment(comment.id);

    likeAction.subscribe({
      next: () => {
        comment.isLikedByCurrentUser = !comment.isLikedByCurrentUser;
        comment.likes = comment.isLikedByCurrentUser
          ? (comment.likes ?? 0) + 1
          : (comment.likes ?? 1) - 1;
      },
      error: () => this.toastr.warning('Like toggle failed'),
    });
  }

  submitComment(postId: string) {
    const content = this.newComments[postId]?.trim();
    if (!content) return;

    this.commentService.createComment(postId, content).subscribe({
      next: () => {
        this.newComments[postId] = '';
        this.commentService.getComments(postId).subscribe({
          next: (response) => {
            this.comments[postId] = response.comments;
            this.commentCounts[postId] = response.total;
          },
        });
      },
      error: () => this.toastr.error('Comment failed'),
    });
  }

  submitReply(commentId: string): void {
    const reply = this.replyInputs[commentId]?.trim();
    if (!reply) return;

    this.commentService.replyToComment(commentId, reply).subscribe({
      next: (newReply) => {
        this.replyInputs[commentId] = '';
        if (!this.replies[commentId]) {
          this.replies[commentId] = [];
        }
        this.replies[commentId].push(newReply);
        this.toastr.success('Replied successfully');
      },
      error: () => this.toastr.error('Reply failed'),
    });
  }

  togglePostLike(post: Post): void {
    if (!this.userProfile?.id || this.likingInProgress.has(post.id)) return;

    const wasLiked = post.likedByCurrentUser ?? false;
    post.likedByCurrentUser = !wasLiked;
    post.likesCount = (post.likesCount || 0) + (wasLiked ? -1 : 1);

    this.likingInProgress.add(post.id);

    const action$ = wasLiked
      ? this.likeService.unLikePost(post.id)
      : this.likeService.likePost(post.id);

    action$.subscribe({
      next: () => {
        this.likingInProgress.delete(post.id);
      },
      error: (error) => {
        const message = error?.error?.message || '';
        if (!wasLiked && message.includes('already liked')) {
          this.likeService.unLikePost(post.id).subscribe({
            next: () => {
              post.likedByCurrentUser = false;
              post.likesCount = (post.likesCount || 1) - 1;
              this.likingInProgress.delete(post.id);
            },
            error: () => {
              post.likedByCurrentUser = wasLiked;
              post.likesCount = (post.likesCount || 0) + (wasLiked ? 1 : -1);
              this.toastr.error('Failed to update like');
              this.likingInProgress.delete(post.id);
            },
          });
        } else {
          post.likedByCurrentUser = wasLiked;
          post.likesCount = (post.likesCount || 0) + (wasLiked ? 1 : -1);
          this.toastr.error('Failed to update like');
          this.likingInProgress.delete(post.id);
        }
      },
    });
  }

  openActionMenu(postId: string, event: MouseEvent) {
    event.stopPropagation();
    this.actionMenuOpen = {};
    this.actionMenuOpen[postId] = !this.actionMenuOpen[postId];
  }

  openEditModal(post: Post) {
    if (post.author.id !== this.loggedInUserId) {
      this.toastr.warning('You are not allowed to edit this post');
      this.actionMenuOpen[post.id] = false;
      return;
    }
    this.selectedPostForEdit = { ...post };
    this.showEditModal = true;
    this.actionMenuOpen[post.id] = false;
  }

  onCloseEditModal() {
    this.showEditModal = false;
    this.selectedPostForEdit = undefined;
  }

  onPostSave(formData: FormData) {
    if (!this.selectedPostForEdit) {
      this.toastr.error('No post selected to update');
      return;
    }
    this.postService
      .updatePostWithFile(this.selectedPostForEdit.id, formData)
      .subscribe({
        next: (updatedPost: Post) => {
          this.updatePostInList(updatedPost);
          this.toastr.success('Post updated successfully');
          this.onCloseEditModal();
        },
        error: () => {
          this.toastr.error('Failed to update post');
        },
      });
  }

  confirmDeletePost(post: Post) {
    if (post.author.id !== this.loggedInUserId) {
      this.toastr.warning('You are not allowed to delete this post');
      return;
    }
    if (!confirm('Delete this post? This action cannot be undone.')) return;

    this.postService.deletePost(post.id).subscribe({
      next: () => {
        this.posts = this.posts.filter((p) => p.id !== post.id);
        this.trendingPosts = this.trendingPosts.filter((p) => p.id !== post.id);
        this.recommendedPosts = this.recommendedPosts.filter(
          (p) => p.id !== post.id
        );
        this.toastr.success('Post deleted');
      },
      error: () => this.toastr.error('Failed to delete post'),
    });
  }

  private injectLikesCount(posts: Post[] | Post) {
    if (!posts) return;
    if (!Array.isArray(posts)) {
      posts = [posts];
    }
    posts.forEach((post) => {
      this.likeService.getPostLikes(post.id).subscribe({
        next: (likeData) => (post.likesCount = likeData.likes.length),
        error: () => (post.likesCount = 0),
      });
    });
  }

  private updatePostInList(updated: Post) {
    const idx = this.posts.findIndex((p) => p.id === updated.id);
    if (idx > -1) this.posts[idx] = { ...this.posts[idx], ...updated };
  }

  isExpanded(postId: string): boolean {
    return !!this.expandedPosts[postId];
  }

  
toggleReadMore(postId: string) {
  this.expandedPosts[postId] = !this.expandedPosts[postId];
}

getPostPreview(postBody: string | undefined, postId: string): string {
  if (!postBody) return '';

  const words = postBody.split(' ');
  if (words.length <= 10 || this.isExpanded(postId)) {
    return postBody;
  }
  return words.slice(0, 10).join(' ') + '...';
}



}
