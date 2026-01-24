import { Router, RouterModule } from '@angular/router';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
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
import { LikeService } from '../../services/like.service';
import { InfiniteScrollModule } from 'ngx-infinite-scroll';
import { forkJoin, timer, filter } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { FlagPostModalComponent } from '../flag-modal-component/flag-modal-component.component';
import { ElementRef, HostListener } from '@angular/core';
import Swal from 'sweetalert2';

@Component({
  standalone: true,
  selector: 'app-home',
  imports: [
    CommonModule,
    RouterModule,
    NumberShortPipe,
    ReactiveFormsModule,
    FormsModule,
    TimeagoModule,
    ResourceUploadModalComponent,
    EditPostComponent,
    InfiniteScrollModule,
    FlagPostModalComponent,
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

  // edit a comment
  editedComment: string = '';
  editingCommentId: string | null = null;

  // delete a comment
  commentToDelete: Comment | null = null;
  showCommentDeleteModal = false;

  posts: Post[] = [];
  post: Post | null = null;
  nextCursor?: string | null = undefined;
  isLoading = false;
  limit = 10;

  likingInProgress = new Set<string>();

  expandedPosts: { [postId: string]: boolean } = {};

  showFlagModal = false;
  selectedPostToFlag?: Post;
  showMoreOptions = false;

  showCommentEditModal = false;

  menuOpen: Record<string, boolean> = {};

  constructor(
    private postService: PostService,
    private toastr: ToastrService,
    private profileService: ProfileService,
    private followService: FollowService,
    private commentService: CommentService,
    private likeService: LikeService,
    private eRef: ElementRef,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loading = true;
    this.loadMorePosts(); // initial load via infinite scroll array

    this.profileService.getMyProfile().subscribe({
      next: (profile) => {
        this.userProfile = profile;
      },
      error: () => {
        console.error('Failed to load profile');
      },
    });

    if (this.loggedInUserId) {
      this.followService.getFollowing(this.loggedInUserId).subscribe({
        next: (follows) => {
          this.followingIds = follows.map((f) => f.followingId);
        },
        error: () => console.error('Failed to load following list'),
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
      delay: timer(2000),
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
              next: (response) =>
                (this.commentCounts[post.id] = response.total),
              error: () => (this.commentCounts[post.id] = 0),
            });
          });

          this.nextCursor = posts.nextCursor ?? null;
        },
        error: () => {
          console.error('Failed to load more posts');
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
        console.error('Failed to load trending posts');
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
              error: () => console.error('Error fetching follow stats'),
            });
          }
        });
      },
      error: () => console.error('Error while loading profiles'),
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
          console.error('Failed to load comments');
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

  //  Toggles dropdown and closes others
  toggleActionMenu(event: MouseEvent, postId: string): void {
    event.stopPropagation();
    Object.keys(this.actionMenuOpen).forEach(
      (key) => (this.actionMenuOpen[key] = false)
    );
    this.actionMenuOpen[postId] = !this.actionMenuOpen[postId];
  }

  // ✅ Detects outside click to close all menus
  @HostListener('document:click', ['$event'])
  handleClickOutside(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    const clickedInsideDropdown = target.closest('.post-dropdown');
    if (!clickedInsideDropdown) {
      this.actionMenuOpen = {};
    }
  }

  // Delete modal controls
  showDeleteModal = false;
  postToDelete?: Post | null;

  // Open delete modal
  openDeleteModal(post: Post): void {
    if (post.author.id !== this.loggedInUserId) {
      this.toastr.warning('You are not allowed to delete this post');
      return;
    }
    this.showDeleteModal = true;
    this.postToDelete = post;
    this.actionMenuOpen = {};
  }

  // Confirm delete
  confirmDelete(): void {
    if (!this.postToDelete) return;

    this.postService.deletePost(this.postToDelete.id).subscribe({
      next: () => {
        this.posts = this.posts.filter((p) => p.id !== this.postToDelete?.id);
        this.trendingPosts = this.trendingPosts.filter(
          (p) => p.id !== this.postToDelete?.id
        );
        this.recommendedPosts = this.recommendedPosts.filter(
          (p) => p.id !== this.postToDelete?.id
        );
        this.toastr.success('Post deleted');
        this.showDeleteModal = false;
        this.postToDelete = null;
      },
      error: () => {
        this.toastr.error('Failed to delete post');
        this.showDeleteModal = false;
      },
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

  // Open modal when user clicks “Flag Post”
  openFlagModal(post: Post) {
    this.selectedPostToFlag = post;
    this.showFlagModal = true;
  }

  // Handle modal submission
  onSubmitFlag(reason: string) {
    if (this.selectedPostToFlag) {
      this.flagPost(this.selectedPostToFlag, reason);
      this.showFlagModal = false;
      this.selectedPostToFlag = undefined;
    }
  }

  // Handle modal close
  onCloseFlagModal() {
    this.showFlagModal = false;
    this.selectedPostToFlag = undefined;
  }

  flagPost(post: Post, reason: string) {
    if (!this.loggedInUserId) {
      this.toastr.warning('You must be logged in to flag a post');
      return;
    }

    this.postService.flagPost(post.id, reason).subscribe({
      next: (response) => {
        this.toastr.success('Post flagged successfully');
        // console.log('Flag response:', response);
      },
      error: (err) => {
        console.error(err);
        const message = err?.error?.message || 'Failed to flag post';
        this.toastr.error(message);
      },
    });
  }

  goToPost(id: string) {
    this.router.navigate(['/posts', id]);
  }

  isMyComment(comment: Comment) {
    return comment.userId === this.loggedInUserId;
  }

  // ------------------ MENU HANDLERS ------------------
  toggleMenu(id: string) {
    this.menuOpen[id] = !this.menuOpen[id];
    this.cdr.markForCheck();
  }

  closeAllMenus() {
    this.menuOpen = {};
    this.cdr.markForCheck();
  }

  // ------------------ EDIT MODAL ------------------
  // Update the openEditCommentModal method
  openEditCommentModal(comment: Comment) {
    if (!this.isMyComment(comment)) return;
    this.closeAllMenus();
    this.editedComment = comment.body;
    this.editingCommentId = comment.id;
    this.showCommentEditModal = true; // Use separate modal
    this.cdr.markForCheck();
  }
  // Also update the cancelEdit method to properly reset everything
  cancelEdit() {
    this.showCommentEditModal = false;
    this.editingCommentId = null;
    this.editedComment = '';
    this.cdr.markForCheck();
  }

  // In your component class, add a method to find and update comments
  private updateCommentInLists(
    commentId: string,
    updatedComment: Comment
  ): void {
    // Update in main comments
    Object.keys(this.comments).forEach((postId) => {
      const commentIndex = this.comments[postId].findIndex(
        (c) => c.id === commentId
      );
      if (commentIndex > -1) {
        this.comments[postId][commentIndex] = {
          ...this.comments[postId][commentIndex],
          ...updatedComment,
          body: updatedComment.body,
        };
        return; // Found and updated
      }
    });

    // Update in replies
    Object.keys(this.replies).forEach((parentCommentId) => {
      const replyIndex = this.replies[parentCommentId].findIndex(
        (r) => r.id === commentId
      );
      if (replyIndex > -1) {
        this.replies[parentCommentId][replyIndex] = {
          ...this.replies[parentCommentId][replyIndex],
          ...updatedComment,
          body: updatedComment.body,
        };
      }
    });
  }

  // Update the saveEdit() method
  saveEdit() {
    if (!this.editingCommentId || !this.editedComment.trim()) return;
    const updatedContent = this.editedComment.trim();

    this.commentService
      .editComment(this.editingCommentId, updatedContent)
      .subscribe({
        next: (res) => {
          // Use the new update method
          this.updateCommentInLists(this.editingCommentId!, res);

          // Close edit modal and reset
          this.showEditModal = false;
          this.editingCommentId = null;
          this.editedComment = '';

          // Force change detection
          this.cdr.detectChanges();
          this.toastr.success('Comment updated successfully');
        },
        error: (err) => {
          console.error('Edit failed', err);
          this.toastr.error('Failed to update comment');
          this.cancelEdit();
        },
      });
  }

  // ------------------ DELETE COMMENT MODAL ------------------
  openDeleteCommentModal(comment: Comment) {
    if (!this.isMyComment(comment)) return;
    this.closeAllMenus();
    this.commentToDelete = comment;
    this.showCommentDeleteModal = true;
    this.cdr.markForCheck();
  }

  cancelDelete() {
    this.showCommentDeleteModal = false;
    this.commentToDelete = null;
    this.cdr.markForCheck();
  }

  conformDelete() {
    if (!this.commentToDelete) return;

    this.commentService.deleteComment(this.commentToDelete.id).subscribe({
      next: () => {
        Object.keys(this.comments).forEach((postId) => {
          this.comments[postId] = this.comments[postId].filter(
            (c) => c.id !== this.commentToDelete?.id
          );
        });
        this.showCommentDeleteModal = false;
        this.commentToDelete = null;
        this.cdr.detectChanges();
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Delete failed', err);
        this.cancelDelete();
      },
    });
  }

  sharePost() {
    if (!this.post) return;

    const shareUrl = `${window.location.origin}/posts/${this.post.id}`;

    if (navigator.share) {
      navigator.share({
        title: this.post.title,
        text: this.post.body?.substring(0, 100),
        url: shareUrl,
      });
    } else {
      navigator.clipboard.writeText(shareUrl).then(() => {
        alert('Link copied to clipboard!');
      });
    }
  }

  copyPostLink() {
    if (!this.post) return;

    const shareUrl = `${window.location.origin}/posts/${this.post.id}`;
    navigator.clipboard.writeText(shareUrl).then(() => {
      alert('Link copied to clipboard!');
      this.showMoreOptions = false;
    });
  }
}
