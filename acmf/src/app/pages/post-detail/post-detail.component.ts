import { Component, OnInit, Input, Output, EventEmitter, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { PostService } from '../../services/post.service';
import { AuthService } from '../../services/auth.service';
import { CommentService } from '../../services/comment.service';
import { Post, Comment, Author } from '../../interfaces';
import { catchError, finalize } from 'rxjs/operators';
import { of } from 'rxjs';
import { LikeService } from '../../services/like.service';

@Component({
  selector: 'app-post-detail',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './post-detail.component.html',
  styleUrls: ['./post-detail.component.css']
})
export class PostDetailComponent implements OnInit {
  @Input() postId: string | null = null;
  @Input() isOpen = false;
  @Output() closed = new EventEmitter<void>();
  @Output() postUpdated = new EventEmitter<Post>();

  post: Post | null = null;
  loading = false;
  error: string | null = null;
  showFullText = false;
  isBookmarked = false;
  showMoreOptions = false;
  newComment = '';
  postingComment = false;
  viewCount = 0;
  showMediaViewer = false;
  currentMediaUrl = '';
  currentUserProfileImage = 'assets/default-avatar.png';

  private currentUserId: string | null = null;

  constructor(
    private postService: PostService,
    private likeService: LikeService,
    private authService: AuthService,
    private commentService: CommentService,
    private route: ActivatedRoute,
    private router: Router,
  ) {}

  ngOnInit() {
    this.authService.currentUser$.subscribe(user => {
      if (user?.id) {
        this.currentUserId = user.id;
        this.currentUserProfileImage = user.profileImage || 'assets/default-avatar.png';
      }
    });

    this.route.params.subscribe(params => {
      if (params['id']) {
        this.postId = params['id'];
        this.isOpen = true;
        this.loadPost();
      }
    });
  }

  @HostListener('document:keydown', ['$event'])
  handleKeydown(event: Event) {
    const keyboardEvent = event as KeyboardEvent;
    if (this.isOpen && keyboardEvent.key === 'Escape') {
      keyboardEvent.preventDefault();
      this.close();
    }
  }

  loadPost() {
    if (!this.postId) return;

    this.loading = true;
    this.error = null;

    this.postService.getPostById(this.postId).pipe(
      catchError(err => {
        this.error = err.message || 'Failed to load post';
        return of(null);
      }),
      finalize(() => {
        this.loading = false;
      })
    ).subscribe(post => {
      if (post) {
        this.post = post;
        this.incrementViewCount();
        if (!post.comments) {
          this.loadComments();
        }
      }
    });
  }

  loadComments() {
    if (!this.postId) return;

    this.commentService.getComments(this.postId).subscribe({
      next: (response) => {
        if (this.post) {
          this.post.comments = response.comments;
        }
      },
      error: (err) => {
        console.error('Failed to load comments:', err);
      }
    });
  }

  close() {
    this.isOpen = false;
    this.post = null;
    this.error = null;
    this.showFullText = false;
    this.showMoreOptions = false;
    this.newComment = '';
    this.closed.emit();

    if (this.route.snapshot.params['id']) {
      this.router.navigate(['/'], { relativeTo: this.route });
    }
  }

  toggleLike() {
    if (!this.post || !this.currentUserId) return;

    const wasLiked = this.post.likedByCurrentUser;

    this.post.likedByCurrentUser = !wasLiked;
    this.post.likesCount = (this.post.likesCount || 0) + (wasLiked ? -1 : 1);

    const likeAction = wasLiked
      ? this.likeService.unLikePost(this.post.id)
      : this.likeService.likePost(this.post.id);

    likeAction.subscribe({
      error: () => {
        this.post!.likedByCurrentUser = wasLiked;
        this.post!.likesCount = (this.post!.likesCount || 0) + (wasLiked ? 1 : -1);
      }
    });
  }

  toggleBookmark() {
    this.isBookmarked = !this.isBookmarked;
    // TODO: Implement bookmark service call
  }

  canEditPost(): boolean {
    return this.currentUserId === this.post?.author.id;
  }

  editPost() {
    this.router.navigate(['/posts/edit', this.post?.id]);
    this.close();
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

  reportPost() {
    this.router.navigate(['/report'], {
      queryParams: { postId: this.post?.id, type: 'POST' }
    });
    this.close();
  }

  focusCommentInput() {
    const input = document.querySelector('.comment-input') as HTMLElement;
    input?.focus();
  }

  addComment(event?: Event) {
    if (event) {
      event.preventDefault();
    }

    if (!this.newComment.trim() || !this.post || !this.currentUserId || this.postingComment) return;

    this.postingComment = true;

    this.commentService.createComment(this.post.id, this.newComment).subscribe({
      next: (comment) => {
        if (!this.post!.comments) {
          this.post!.comments = [];
        }
        this.post!.comments.unshift(comment);
        this.newComment = '';
        this.postingComment = false;
      },
      error: (err) => {
        alert('Failed to post comment: ' + err.message);
        this.postingComment = false;
      }
    });
  }

  toggleCommentLike(comment: Comment) {
    comment.isLikedByCurrentUser = !comment.isLikedByCurrentUser;
    comment.likes = (comment.likes || 0) + (comment.isLikedByCurrentUser ? 1 : -1);
    // TODO: Call comment like service
  }

  startReply(comment: Comment) {
    this.newComment = `@${comment.user.name} `;
    this.focusCommentInput();
  }

  getFileType(url: string): 'image' | 'video' | 'file' {
    if (!url) return 'file';

    const extension = url.split('.').pop()?.toLowerCase();
    const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'];
    const videoExtensions = ['mp4', 'webm', 'ogg', 'mov'];

    if (imageExtensions.includes(extension || '')) return 'image';
    if (videoExtensions.includes(extension || '')) return 'video';
    return 'file';
  }

  openMediaViewer(url: string) {
    if (this.getFileType(url) === 'image') {
      this.currentMediaUrl = url;
      this.showMediaViewer = true;
    }
  }

  closeMediaViewer() {
    this.showMediaViewer = false;
    this.currentMediaUrl = '';
  }

  handleImageError(event: Event) {
    const img = event.target as HTMLImageElement;
    img.src = 'assets/default-avatar.png';
  }

  handleMediaError(event: Event) {
    console.error('Failed to load media:', event);
  }

  formatTime(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);

    if (diffHours < 1) {
      const diffMins = Math.floor(diffMs / (1000 * 60));
      return `${diffMins}m ago`;
    } else if (diffHours < 24) {
      return `${Math.floor(diffHours)}h ago`;
    } else if (diffHours < 168) {
      return `${Math.floor(diffHours / 24)}d ago`;
    } else {
      return date.toLocaleDateString();
    }
  }

  private incrementViewCount() {
    // TODO: Call service to increment view count
    this.viewCount++;
  }
}