import { Router, RouterModule } from '@angular/router';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { Comment, Post, Profile, Group } from '../../interfaces';
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
import { forkJoin, timer } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { FlagPostModalComponent } from '../flag-modal-component/flag-modal-component.component';
import { ElementRef, HostListener } from '@angular/core';
import { RecommenderService } from '../../services/recommender.service';

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

  // Recommender: broken-out post categories from getRecommendations()
  recommendedResourcePosts: Post[] = [];
  recommendedAcademicPosts: Post[] = [];
  recommendedOpportunityPosts: Post[] = [];
  recommendedGeneralPosts: Post[] = [];

  // Recommender: profile suggestions
  profiles: Profile[] = []; // skill-matched profiles (replaces getAllProfiles)
  profilesByInterests: Profile[] = [];
  profilesByCourse: Profile[] = [];
  profilesByAcademicLevel: Profile[] = [];
  profilesByInstitution: Profile[] = [];

  // Recommender: group suggestions
  suggestedGroups: Group[] = [];

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

  editedComment: string = '';
  editingCommentId: string | null = null;

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

  showDeleteModal = false;
  postToDelete?: Post | null;

  constructor(
    private postService: PostService,
    private toastr: ToastrService,
    private profileService: ProfileService,
    private followService: FollowService,
    private commentService: CommentService,
    private likeService: LikeService,
    private eRef: ElementRef,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private recommenderService: RecommenderService
  ) {}

  ngOnInit(): void {
    this.loading = true;
    this.loadMorePosts();

    this.profileService.getMyProfile().subscribe({
      next: (profile) => (this.userProfile = profile),
      error: () => console.error('Failed to load profile'),
    });

    if (this.loggedInUserId) {
      this.followService.getFollowing(this.loggedInUserId).subscribe({
        next: (follows) => {
          this.followingIds = follows.map((f) => f.followingId);
        },
        error: () => console.error('Failed to load following list'),
      });
    }

    this.loadTrendingAndRecommended();
    this.loadRecommenderData();
  }

  // ─── Recommender ────────────────────────────────────────────────────────────

  private loadRecommenderData(): void {
    // Full recommendations: skill+interest scored profiles + posts by category
    this.recommenderService.getRecommendations().subscribe({
      next: ({ profiles, resources }) => {
        this.profiles = profiles;
        this.recommendedResourcePosts = resources.resource;
        this.recommendedAcademicPosts = resources.academic;
        this.recommendedOpportunityPosts = resources.opportunity;
        this.recommendedGeneralPosts = resources.general;

        // inject like counts into all recommended post lists
        [
          ...resources.resource,
          ...resources.academic,
          ...resources.opportunity,
          ...resources.general,
        ].forEach((post) => this.injectLikesCount(post));
      },
      error: () => console.error('Failed to load recommendations'),
    });

    // Profile suggestions by individual dimensions
    this.recommenderService.suggestProfilesByInterests().subscribe({
      next: (profiles) => (this.profilesByInterests = profiles),
      error: () => console.error('Failed to load interest-based profiles'),
    });

    this.recommenderService.suggestProfilesByCourse().subscribe({
      next: (profiles) => (this.profilesByCourse = profiles),
      error: () => console.error('Failed to load course-based profiles'),
    });

    this.recommenderService.suggestProfilesByAcademicLevel().subscribe({
      next: (profiles) => (this.profilesByAcademicLevel = profiles),
      error: () => console.error('Failed to load academic-level profiles'),
    });

    this.recommenderService.suggestProfilesByInstitution().subscribe({
      next: (profiles) => (this.profilesByInstitution = profiles),
      error: () => console.error('Failed to load institution-based profiles'),
    });

    // Group suggestions based on the user's skills
    this.recommenderService.recommendGroupsBySkills().subscribe({
      next: (groups) => (this.suggestedGroups = groups),
      error: () => console.error('Failed to load suggested groups'),
    });
  }

  // Load similar posts for a specific post (call this when viewing a post detail)
  loadSimilarPosts(postId: string): void {
    this.recommenderService.recommendSimilarPosts(postId).subscribe({
      next: (posts) => {
        this.recommendedPosts = posts;
        posts.forEach((post) => this.injectLikesCount(post));
      },
      error: () => console.error('Failed to load similar posts'),
    });
  }

  // ─── Existing methods (unchanged) ───────────────────────────────────────────

  loadMorePosts() {
    if (this.isLoading || this.nextCursor === null) return;

    this.isLoading = true;
    this.loading = true;

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

          // No need to fetch comment counts separately anymore
          // Use the commentsCount from the backend response
        // Log each post's commentsCount
        posts.posts.forEach((post, index) => {
          console.log(`Post ${index + 1}:`, {
            id: post.id,
            title: post.title,
            commentsCount: post.commentsCount,
            hasProperty: 'commentsCount' in post,
            type: typeof post.commentsCount
          });
        });

          this.nextCursor = posts.nextCursor ?? null;
        },
        error: () => console.error('Failed to load more posts'),
      });
  }

  loadTrendingAndRecommended() {
    this.postService.getTrendingPosts().subscribe({
      next: (posts) => {
        this.trendingPosts = posts;
        this.injectLikesCount(this.trendingPosts);
      },
      error: () => console.error('Failed to load trending posts'),
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

  toggleComments(postId: string) {
    this.commentVisible[postId] = !this.commentVisible[postId];
    if (this.commentVisible[postId] && !this.comments[postId]) {
      this.commentLoading[postId] = true;
      this.commentService.getComments(postId).subscribe({
        next: (response) => {
          this.comments[postId] = response.comments;
          if (response.total !== undefined) {
            this.commentCounts[postId] = response.total;
          }
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
        this.commentCounts[postId] = (this.commentCounts[postId] || 0) + 1;

        const post = this.posts.find((p) => p.id === postId);
        if (post) {
          post.commentsCount = (post.commentsCount || 0) + 1;
        }

        this.commentService.getComments(postId).subscribe({
          next: (response) => {
            this.comments[postId] = response.comments;
            this.cdr.detectChanges();
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
        if (!this.replies[commentId]) this.replies[commentId] = [];
        this.replies[commentId].push(newReply);
        this.cdr.detectChanges();
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
      next: () => this.likingInProgress.delete(post.id),
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
        error: () => this.toastr.error('Failed to update post'),
      });
  }

  toggleActionMenu(event: MouseEvent, postId: string): void {
    event.stopPropagation();
    Object.keys(this.actionMenuOpen).forEach(
      (key) => (this.actionMenuOpen[key] = false)
    );
    this.actionMenuOpen[postId] = !this.actionMenuOpen[postId];
  }

  @HostListener('document:click', ['$event'])
  handleClickOutside(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.post-dropdown')) this.actionMenuOpen = {};
  }

  openDeleteModal(post: Post): void {
    if (post.author.id !== this.loggedInUserId) {
      this.toastr.warning('You are not allowed to delete this post');
      return;
    }
    this.showDeleteModal = true;
    this.postToDelete = post;
    this.actionMenuOpen = {};
  }

  confirmDelete(): void {
    if (!this.postToDelete) return;

    this.postService.deletePost(this.postToDelete.id).subscribe({
      next: () => {
        const deletedId = this.postToDelete?.id;
        this.posts = this.posts.filter((p) => p.id !== deletedId);
        this.trendingPosts = this.trendingPosts.filter(
          (p) => p.id !== deletedId
        );
        this.recommendedPosts = this.recommendedPosts.filter(
          (p) => p.id !== deletedId
        );
        this.recommendedResourcePosts = this.recommendedResourcePosts.filter(
          (p) => p.id !== deletedId
        );
        this.recommendedAcademicPosts = this.recommendedAcademicPosts.filter(
          (p) => p.id !== deletedId
        );
        this.recommendedOpportunityPosts =
          this.recommendedOpportunityPosts.filter((p) => p.id !== deletedId);
        this.recommendedGeneralPosts = this.recommendedGeneralPosts.filter(
          (p) => p.id !== deletedId
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
    if (!Array.isArray(posts)) posts = [posts];
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
    if (words.length <= 10 || this.isExpanded(postId)) return postBody;
    return words.slice(0, 10).join(' ') + '...';
  }

  openFlagModal(post: Post) {
    this.selectedPostToFlag = post;
    this.showFlagModal = true;
  }

  onSubmitFlag(reason: string) {
    if (this.selectedPostToFlag) {
      this.flagPost(this.selectedPostToFlag, reason);
      this.showFlagModal = false;
      this.selectedPostToFlag = undefined;
    }
  }

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
      next: () => this.toastr.success('Post flagged successfully'),
      error: (err) => {
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

  toggleMenu(id: string) {
    this.menuOpen[id] = !this.menuOpen[id];
    this.cdr.markForCheck();
  }

  closeAllMenus() {
    this.menuOpen = {};
    this.cdr.markForCheck();
  }

  openEditCommentModal(comment: Comment) {
    if (!this.isMyComment(comment)) return;
    this.closeAllMenus();
    this.editedComment = comment.body;
    this.editingCommentId = comment.id;
    this.showCommentEditModal = true;
    this.cdr.markForCheck();
  }

  cancelEdit() {
    this.showCommentEditModal = false;
    this.editingCommentId = null;
    this.editedComment = '';
    this.cdr.markForCheck();
  }

  private updateCommentInLists(
    commentId: string,
    updatedComment: Comment
  ): void {
    Object.keys(this.comments).forEach((postId) => {
      const idx = this.comments[postId].findIndex((c) => c.id === commentId);
      if (idx > -1) {
        this.comments[postId][idx] = {
          ...this.comments[postId][idx],
          ...updatedComment,
          body: updatedComment.body,
        };
      }
    });

    Object.keys(this.replies).forEach((parentCommentId) => {
      const idx = this.replies[parentCommentId].findIndex(
        (r) => r.id === commentId
      );
      if (idx > -1) {
        this.replies[parentCommentId][idx] = {
          ...this.replies[parentCommentId][idx],
          ...updatedComment,
          body: updatedComment.body,
        };
      }
    });
  }

  saveEdit() {
    if (!this.editingCommentId || !this.editedComment.trim()) return;

    this.commentService
      .editComment(this.editingCommentId, this.editedComment.trim())
      .subscribe({
        next: (res) => {
          this.updateCommentInLists(this.editingCommentId!, res);
          this.showEditModal = false;
          this.editingCommentId = null;
          this.editedComment = '';
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
      navigator.clipboard
        .writeText(shareUrl)
        .then(() => alert('Link copied to clipboard!'));
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

    // Helper method to determine file type
    getFileType(post: Post): 'image' | 'video' | 'pdf' | 'unknown' {
      if (post.fileType) {
        return post.fileType as 'image' | 'video' | 'pdf';
      }
      
      // Fallback: detect from URL if fileType not provided
      if (post.fileUrl) {
        const url = post.fileUrl.toLowerCase();
        if (url.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
          return 'image';
        }
        if (url.match(/\.(mp4|mov|avi|mkv|webm)$/i)) {
          return 'video';
        }
        if (url.match(/\.pdf$/i)) {
          return 'pdf';
        }
      }
      
      return 'unknown';
    }
  
    // Check if post has image
    isImagePost(post: Post): boolean {
      return this.getFileType(post) === 'image';
    }
  
    // Check if post has video
    isVideoPost(post: Post): boolean {
      return this.getFileType(post) === 'video';
    }
  
    // Check if post has PDF
    isPdfPost(post: Post): boolean {
      return this.getFileType(post) === 'pdf';
    }
}
