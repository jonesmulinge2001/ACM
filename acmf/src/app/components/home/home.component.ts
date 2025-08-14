import { RouterModule, RouterLink } from '@angular/router';
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
  ],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
})
export class HomeComponent implements OnInit {
  trendingPosts: Post[] = [];
  recentPosts: Post[] = [];
  recommendedPosts: Post[] = [];
  profiles: Profile[] = [];
  followingIds: string[] = [];
  mainFeedPosts: Post[] = [];


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

  // --- Edit modal / action menu state (new) ---
  actionMenuOpen: { [postId: string]: boolean } = {};
  showEditModal = false;
  selectedPostForEdit?: Post | null;

  // toggle small action menu (three-dot). stopPropagation to avoid card clicks.
  openActionMenu(postId: string, event: MouseEvent) {
    event.stopPropagation();
    // close other menus and toggle this one
    this.actionMenuOpen = {};
    this.actionMenuOpen[postId] = !this.actionMenuOpen[postId];
  }

  // open edit modal (only owner)
  openEditModal(post: Post) {
    // ownership check using loggedInUserId from localStorage
    if (post.author.id !== this.loggedInUserId) {
      this.toastr.warning('You are not allowed to edit this post');
      this.actionMenuOpen[post.id] = false;
      return;
    }

    // clone post so direct form edits don't mutate list until saved
    this.selectedPostForEdit = { ...post };
    this.showEditModal = true;
    this.actionMenuOpen[post.id] = false;
  }

  // close modal without saving
  onCloseEditModal() {
    this.showEditModal = false;
    this.selectedPostForEdit = undefined;
  }

  // when modal emits "save" with updated post object
  onPostSave(formData: FormData) {
    // ensure we still have a selected post to get its id
    if (!this.selectedPostForEdit) {
      this.toastr.error('No post selected to update');
      return;
    }

    // use the stored selectedPostForEdit.id to send update
    this.postService
      .updatePostWithFile(this.selectedPostForEdit.id, formData)
      .subscribe({
        next: (updatedPost: Post) => {
          // update the post in local lists with the server-returned Post
          this.updatePostInLists(updatedPost);
          this.toastr.success('Post updated successfully');
          this.onCloseEditModal();
        },
        error: (err) => {
          console.error('Failed to update post', err);
          this.toastr.error('Failed to update post');
        },
      });
  }

  // delete flow with ownership check
  confirmDeletePost(post: Post) {
    if (post.author.id !== this.loggedInUserId) {
      this.toastr.warning('You are not allowed to delete this post');
      return;
    }

    if (!confirm('Delete this post? This action cannot be undone.')) return;

    this.postService.deletePost(post.id).subscribe({
      next: () => {
        // remove from local lists
        this.trendingPosts = this.trendingPosts.filter((p) => p.id !== post.id);
        this.recentPosts = this.recentPosts.filter((p) => p.id !== post.id);
        this.recommendedPosts = this.recommendedPosts.filter(
          (p) => p.id !== post.id
        );
        this.toastr.success('Post deleted');
      },
      error: () => this.toastr.error('Failed to delete post'),
    });
  }

  // helper: find and replace updated post in any of the feed arrays
  private updatePostInLists(updated: Post) {
    const replace = (arr?: Post[]) => {
      if (!Array.isArray(arr)) return;
      const idx = arr.findIndex((p) => p.id === updated.id);
      if (idx > -1) arr[idx] = { ...arr[idx], ...updated };
    };
    replace(this.trendingPosts);
    replace(this.recentPosts);
    replace(this.recommendedPosts);
  }
  

  likingInProgress = new Set<string>();

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
    this.loadFeedPosts();

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

  loadFeedPosts(): void {
    this.loading = true;

 // Load All Posts for main feed
this.postService.getAllPosts().subscribe({
  next: (posts) => {
    this.mainFeedPosts = posts;
    this.injectLikesCount(this.mainFeedPosts);

    // Load comment counts for each post in the feed
    this.mainFeedPosts.forEach((post) => {
      this.commentService.getCommentCount(post.id).subscribe({
        next: (response) => (this.commentCounts[post.id] = response.total),
        error: () => (this.commentCounts[post.id] = 0),
      });
    });
  },
  error: () => {
    this.toastr.error('Failed to load all posts');
  },
});


    // Load Recent Posts
    this.postService.getAllPosts().subscribe({
      next: (posts) => {
        this.recentPosts = posts;
        this.injectLikesCount(this.recentPosts);
      },
    });

    // Load Trending Posts
this.postService.getTrendingPosts().subscribe({
  next: (posts) => {
    this.trendingPosts = posts;
    this.injectLikesCount(this.trendingPosts);
  },
  error: () => {
    this.toastr.error('Failed to load trending posts');
  }
});


    // Load Recommended Posts
    this.postService.getRecommendedPostsForUser().subscribe({
      next: (posts) => {
        this.recommendedPosts = posts;
        this.injectLikesCount(this.recommendedPosts);
      },
      complete: () => (this.loading = false),
    });
  }

  

  //>>> for injecting total likes to each post
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

          // Extract replies for each top-level comment
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

  loadReplies(commentId: string): void {
    this.repliesVisible[commentId] = !this.repliesVisible[commentId];
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

    // Optimistic UI update
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
        // Special handling for backend 400 error: "You already liked this post"
        const message = error?.error?.message || '';
        if (!wasLiked && message.includes('already liked')) {
          console.error('Like failed:', error);

          // Try to unlike instead — in case frontend and backend got out of sync
          this.likeService.unLikePost(post.id).subscribe({
            next: () => {
              post.likedByCurrentUser = false;
              post.likesCount = (post.likesCount || 1) - 1;
              this.likingInProgress.delete(post.id);
            },
            error: () => {
              // Total rollback
              post.likedByCurrentUser = wasLiked;
              post.likesCount = (post.likesCount || 0) + (wasLiked ? 1 : -1);
              this.toastr.error('Failed to update like');
              this.likingInProgress.delete(post.id);
            },
          });
        } else {
          // Total rollback
          post.likedByCurrentUser = wasLiked;
          post.likesCount = (post.likesCount || 0) + (wasLiked ? 1 : -1);
          this.toastr.error('Failed to update like');
          this.likingInProgress.delete(post.id);
        }
      },
    });
  }
}
