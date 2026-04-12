import { Component, OnInit, Input, Output, EventEmitter, HostListener, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { catchError, finalize, switchMap } from 'rxjs/operators';
import { of, forkJoin } from 'rxjs';
import { VideoLikeService } from '../../services/video-like.service';
import { VideoCommentService } from '../../services/video-comment.service';
import { Video, VideoComment, LikeStatusResponse } from '../../interfaces';
import { VideoService } from '../../services/unitok-video.service';

@Component({
  selector: 'app-video-detail',
  standalone: true,
  imports: [CommonModule, FormsModule],
  styleUrls: ['./video-detail.component.css'],
  templateUrl: './video-detail.component.html'
})
export class VideoDetailComponent implements OnInit, AfterViewInit {
  @Input() postId: string | null = null;
  @Input() isOpen = false;
  @Output() closed = new EventEmitter<void>();
  @Output() postDeleted = new EventEmitter<string>();
  
  @ViewChild('videoPlayer') videoPlayerRef!: ElementRef<HTMLVideoElement>;

  post: Video | null = null;
  comments: VideoComment[] = [];
  loading: boolean = false;
  error: string | null = null;
  showFullText: boolean = false;
  isBookmarked: boolean = false;
  showMoreOptions: boolean = false;
  newComment: string = '';
  postingComment: boolean = false;
  viewCount: number = 0;
  showMediaViewer: boolean = false;
  currentMediaUrl: string = '';
  currentUserProfileImage = 'assets/default-avatar.png';
  hasLiked: boolean = false;

  private currentUserId: string | null = null;

  // Video Player Properties
  isMuted: boolean = false;
  isPlaying: boolean = true;
  showPlayOverlay: boolean = false;
  showCommentsPanel: boolean = false;
  commentMenuOpen: string | null = null;
  showEditCommentModal: boolean = false;
  editingCommentId: string | null = null;
  editingCommentContent: string = '';
  private videoElement: HTMLVideoElement | null = null;
  private playOverlayTimeout: any;

  constructor(
    private postService: VideoService,
    private likeService: VideoLikeService,
    private commentService: VideoCommentService,
    private authService: AuthService,
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

    // Handle route changes if opened via route
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.postId = params['id'];
        this.isOpen = true;
        this.loadPost();
      }
    });
  }

  ngAfterViewInit() {
    // Initialize video element after view is ready
    if (this.videoPlayerRef) {
      this.videoElement = this.videoPlayerRef.nativeElement;
    }
  }

  @HostListener('document:keydown', ['$event'])
  handleKeydown(event: KeyboardEvent) {
    if (this.isOpen && event.key === 'Escape') {
      event.preventDefault();
      this.close();
    }
  }

  loadPost() {
    if (!this.postId) return;

    this.loading = true;
    this.error = null;

    // Load video and check like status in parallel
    forkJoin({
      video: this.postService.getVideoById(this.postId),
      likeStatus: this.likeService.hasLiked(this.postId)
    }).pipe(
      catchError(err => {
        this.error = err.message || 'Failed to load post';
        return of({ video: null, likeStatus: { hasLiked: false } as LikeStatusResponse });
      }),
      finalize(() => {
        this.loading = false;
      })
    ).subscribe(result => {
      if (result.video) {
        this.post = result.video;
        this.hasLiked = result.likeStatus.hasLiked;
        this.incrementViewCount();
        this.loadComments();
        
        // Small delay to ensure video element is ready
        setTimeout(() => {
          this.initVideoPlayer();
        }, 100);
      }
    });
  }

  initVideoPlayer() {
    if (this.videoElement) {
      this.videoElement.muted = this.isMuted;
      this.videoElement.play().catch(e => console.log('Autoplay prevented:', e));
      this.isPlaying = true;
      this.showPlayOverlay = false;
    }
  }

  loadComments() {
    if (!this.postId) return;

    this.commentService.getComments(this.postId).subscribe({
      next: (comments) => {
        this.comments = comments;
      },
      error: (err) => {
        console.error('Failed to load comments:', err);
      }
    });
  }

  close() {
    // Stop video playback
    if (this.videoElement) {
      this.videoElement.pause();
      this.videoElement.currentTime = 0;
    }
    
    this.isOpen = false;
    this.post = null;
    this.comments = [];
    this.error = null;
    this.showFullText = false;
    this.showMoreOptions = false;
    this.newComment = '';
    this.hasLiked = false;
    this.showCommentsPanel = false;
    this.showPlayOverlay = false;
    
    if (this.playOverlayTimeout) {
      clearTimeout(this.playOverlayTimeout);
    }
    
    this.closed.emit();
    
    // Navigate back if opened via route
    if (this.route.snapshot.params['id']) {
      this.router.navigate(['/'], { relativeTo: this.route });
    }
  }

  // Add this method to format numbers (K, M)
formatNumber(num: number): string {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
}

// Add this method to handle video loading errors
handleVideoError(event: Event): void {
  console.error('Video failed to load:', event);
  // this.toastr.error('Failed to load video', 'Error');
}

  toggleLike() {
    if (!this.post || !this.currentUserId) return;
  
    const wasLiked = this.hasLiked;
    
    // Optimistic update
    this.hasLiked = !wasLiked;
    if (this.post.likesCount !== undefined) {
      this.post.likesCount += (wasLiked ? -1 : 1);
    }
  
    const likeObservable = wasLiked 
      ? this.likeService.unLikeVideo(this.post.id)
      : this.likeService.likeVideo(this.post.id);
  
    // Cast to any to bypass type checking, then subscribe
    (likeObservable as any).subscribe({
      next: (response: any) => {
        console.log('Action successful', response);
      },
      error: (error: any) => {
        console.error('Action failed:', error);
        // Revert on error
        this.hasLiked = wasLiked;
        if (this.post!.likesCount !== undefined) {
          this.post!.likesCount += (wasLiked ? 1 : -1);
        }
      }
    });
  }

  toggleBookmark() {
    this.isBookmarked = !this.isBookmarked;
  }

  canEditPost(): boolean {
    return this.currentUserId === this.post?.user.id;
  }

  canDeletePost(): boolean {
    return this.canEditPost();
  }

  canEditComment(comment: VideoComment): boolean {
    return this.currentUserId === comment.author.id;
  }

  deletePost() {
    if (!this.post || !confirm('Are you sure you want to delete this post?')) return;

    this.postService.deleteVideo(this.post.id).subscribe({
      next: () => {
        this.postDeleted.emit(this.post!.id);
        this.close();
      },
      error: (err: any) => {
        alert('Failed to delete post: ' + err.message);
      }
    });
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
        text: this.post.description?.substring(0, 100),
        url: shareUrl,
      }).catch(() => {});
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
      queryParams: { 
        videoId: this.post?.id, 
        type: 'VIDEO' 
      } 
    });
    this.close();
  }

  focusCommentInput() {
    this.showCommentsPanel = true;
    setTimeout(() => {
      const input = document.querySelector('.comment-input') as HTMLElement;
      input?.focus();
    }, 100);
  }

  addComment() {
    if (!this.newComment.trim() || !this.post || !this.currentUserId || this.postingComment) return;

    this.postingComment = true;

    this.commentService.createComment(this.post.id, this.newComment).subscribe({
      next: (comment) => {
        this.comments = [comment, ...this.comments];
        this.newComment = '';
        this.postingComment = false;
      },
      error: (err) => {
        alert('Failed to post comment: ' + err.message);
        this.postingComment = false;
      }
    });
  }

  deleteComment(commentId: string) {
    if (!confirm('Are you sure you want to delete this comment?')) return;

    this.commentService.deleteComment(commentId).subscribe({
      next: () => {
        this.comments = this.comments.filter(c => c.id !== commentId);
      },
      error: (err) => {
        alert('Failed to delete comment: ' + err.message);
      }
    });
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
    this.viewCount++;
  }

  toggleMute(): void {
    this.isMuted = !this.isMuted;
    if (this.videoElement) {
      this.videoElement.muted = this.isMuted;
    }
  }
  
  togglePlayPause(): void {
    if (this.videoElement) {
      if (this.videoElement.paused) {
        this.videoElement.play();
        this.isPlaying = true;
        this.showPlayOverlay = false;
      } else {
        this.videoElement.pause();
        this.isPlaying = false;
        this.showPlayOverlay = true;
        
        if (this.playOverlayTimeout) clearTimeout(this.playOverlayTimeout);
        this.playOverlayTimeout = setTimeout(() => {
          this.showPlayOverlay = false;
        }, 2000);
      }
    }
  }
  
  onVideoLoaded(): void {
    if (this.videoElement && this.videoElement.paused && this.isOpen) {
      this.videoElement.play().catch(e => console.log('Autoplay prevented:', e));
    }
  }
  
  toggleCommentMenu(commentId: string, event: Event): void {
    event.stopPropagation();
    this.commentMenuOpen = this.commentMenuOpen === commentId ? null : commentId;
  }
  
  openEditCommentModal(comment: VideoComment): void {
    this.editingCommentId = comment.id;
    this.editingCommentContent = comment.content;
    this.showEditCommentModal = true;
    this.commentMenuOpen = null;
  }
  
  closeEditCommentModal(): void {
    this.showEditCommentModal = false;
    this.editingCommentId = null;
    this.editingCommentContent = '';
  }
  
  updateComment(): void {
    if (!this.editingCommentId || !this.editingCommentContent.trim()) return;
  
    this.commentService.updateComment(this.editingCommentId, this.editingCommentContent).subscribe({
      next: (updatedComment) => {
        const index = this.comments.findIndex(c => c.id === updatedComment.id);
        if (index !== -1) {
          this.comments[index] = updatedComment;
        }
        this.closeEditCommentModal();
      },
      error: (err) => {
        alert('Failed to update comment: ' + err.message);
      }
    });
  }
}