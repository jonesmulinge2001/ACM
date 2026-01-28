import { Component, OnInit, OnDestroy, ElementRef, HostListener, QueryList, ViewChildren } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Video, VideoComment, CreateVideoDto, UpdateVideoDto, LikeStatusResponse, VideoLikeResponse } from '../../interfaces';
import { VideoService } from '../../services/unitok-video.service';
import { VideoCommentService } from '../../services/video-comment.service';
import { VideoLikeService } from '../../services/video-like.service';
import { CreateVideoComponent } from "../create-video/create-video.component";
import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-video-manager',
  templateUrl: './video-manager.component.html',
  styleUrl: './video-manager.component.css',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, CreateVideoComponent],
  providers: [DatePipe]
})
export class VideoManagerComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  // Video Properties
  videos: Video[] = [];
  selectedVideo: Video | null = null;
  isLoadingVideos = false;
  isSubmittingVideo = false;
  videoError: string | null = null;

  // Comment Properties
  comments: VideoComment[] = [];
  isLoadingComments = false;
  isSubmittingComment = false;
  commentError: string | null = null;
  editingCommentId: string | null = null;
  showCommentsForVideo: string | null = null;

  // Comment Modals Properties
  showEditModal = false;
  showDeleteModal = false;
  selectedComment: VideoComment | null = null;
  isUpdatingComment = false;
  isDeletingComment = false;
  
  // Temporary storage for comment to edit
  commentToEdit: VideoComment | null = null;

  // Like Properties
  videoLikes: Map<string, boolean> = new Map();
  isLoadingLikes = false;
  likeError: string | null = null;

  // Forms
  videoForm: FormGroup;
  commentForm: FormGroup;
  videoEditForm: FormGroup;
  commentEditForm: FormGroup;

  // UI State
  activeTab: 'videos' | 'comments' | 'likes' = 'videos';
  showCreateForm = false;
  showEditForm = false;

  currentVideoIndex = 0;
  isMuted = false;
  videoPlayers = new Map<string, HTMLVideoElement>();
  videoPlayStates = new Map<string, boolean>();

  // Comment menu state
  commentMenuOpen: string | null = null;

  constructor(
    private videoService: VideoService,
    private commentService: VideoCommentService,
    private likeService: VideoLikeService,
    private fb: FormBuilder,
    private datePipe: DatePipe
  ) {
    // Initialize forms
    this.videoForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(3)]],
      description: ['', [Validators.maxLength(500)]],
      url: ['', [Validators.required, Validators.pattern('^(https?://).+')]],
    });

    this.videoEditForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(3)]],
      description: ['', [Validators.maxLength(500)]],
    });

    this.commentForm = this.fb.group({
      content: ['', [Validators.required, Validators.minLength(1), Validators.maxLength(1000)]]
    });

    this.commentEditForm = this.fb.group({
      content: ['', [Validators.required, Validators.minLength(1), Validators.maxLength(1000)]]
    });
  }

  ngOnInit(): void {
    this.loadAllVideos();
    
    // Close comment menu when clicking outside
    document.addEventListener('click', this.closeCommentMenu.bind(this));
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    document.removeEventListener('click', this.closeCommentMenu.bind(this));
  }

  // Close comment menu when clicking outside
  private closeCommentMenu(event: MouseEvent): void {
    if (!(event.target as HTMLElement).closest('.comment-menu-trigger') && 
        !(event.target as HTMLElement).closest('.comment-menu')) {
      this.commentMenuOpen = null;
    }
  }

  // ==================== COMMENT OPERATIONS ====================

  loadComments(videoId: string): void {
    this.isLoadingComments = true;
    this.commentError = null;

    this.commentService.getComments(videoId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (comments) => {
          this.comments = comments;
          this.isLoadingComments = false;
        },
        error: (error) => {
          this.commentError = 'Failed to load comments. Please try again.';
          console.error('Error loading comments:', error);
          this.isLoadingComments = false;
        }
      });
  }

  createCommentForVideo(videoId: string): void {
    if (this.commentForm.invalid) {
      this.markFormGroupTouched(this.commentForm);
      return;
    }
  
    this.isSubmittingComment = true;
    this.commentError = null;
  
    this.commentService.createComment(videoId, this.commentForm.value.content)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (newComment) => {
          this.comments.push(newComment);
          
          // Increment the video's comment count
          const video = this.videos.find(v => v.id === videoId);
          if (video) {
            video.commentsCount = (video.commentsCount || 0) + 1;
          }
          
          this.commentForm.reset();
          this.isSubmittingComment = false;
        },
        error: (error) => {
          this.commentError = 'Failed to post comment. Please try again.';
          console.error('Error creating comment:', error);
          this.isSubmittingComment = false;
        }
      });
  }

  // Open edit modal
  openEditModal(comment: VideoComment): void {
    this.selectedComment = comment;
    this.commentEditForm.patchValue({ content: comment.content });
    this.showEditModal = true;
    this.commentMenuOpen = null; // Close the menu
  }

  // Open delete modal
  openDeleteModal(comment: VideoComment): void {
    this.selectedComment = comment;
    this.showDeleteModal = true;
    this.commentMenuOpen = null; // Close the menu
  }

  // Update comment via modal
  updateComment(): void {
    if (this.commentEditForm.invalid || !this.selectedComment) {
      return;
    }

    this.isUpdatingComment = true;
    this.commentError = null;

    this.commentService.updateComment(this.selectedComment.id, this.commentEditForm.value.content)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (updatedComment) => {
          // Update the comment in the array
          const index = this.comments.findIndex(c => c.id === updatedComment.id);
          if (index !== -1) {
            this.comments[index] = updatedComment;
          }
          this.closeEditModal();
          this.isUpdatingComment = false;
        },
        error: (error) => {
          this.commentError = 'Failed to update comment. Please try again.';
          console.error('Error updating comment:', error);
          this.isUpdatingComment = false;
        }
      });
  }

  deleteComment(): void {
    if (!this.selectedComment) {
      return;
    }
  
    if (!this.isCommentAuthor(this.selectedComment)) {
      this.commentError = 'You can only delete your own comments.';
      return;
    }
  
    this.isDeletingComment = true;
    const videoId = this.selectedComment.videoId;
  
    this.commentService.deleteComment(this.selectedComment.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.comments = this.comments.filter(c => c.id !== this.selectedComment?.id);
          
          const video = this.videos.find(v => v.id === videoId);
          if (video && video.commentsCount > 0) {
            video.commentsCount -= 1;
          }
          
          this.closeDeleteModal();
          this.isDeletingComment = false;
        },
        error: (error) => {
          this.commentError = 'Failed to delete comment. Please try again.';
          console.error('Error deleting comment:', error);
          this.isDeletingComment = false;
        }
      });
  }
  

  // Close edit modal
  closeEditModal(): void {
    this.showEditModal = false;
    this.selectedComment = null;
    this.commentEditForm.reset();
    this.isUpdatingComment = false;
  }

  // Close delete modal
  closeDeleteModal(): void {
    this.showDeleteModal = false;
    this.selectedComment = null;
    this.isDeletingComment = false;
  }

  // Toggle comment menu
  toggleCommentMenu(commentId: string, event: Event): void {
    event.stopPropagation();
    this.commentMenuOpen = this.commentMenuOpen === commentId ? null : commentId;
  }

  // ==================== VIDEO OPERATIONS ====================

  loadAllVideos(): void {
    this.isLoadingVideos = true;
    this.videoError = null;
    
    this.videoService.getAllVideos()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (videos) => {
          this.videos = videos;
          this.isLoadingVideos = false;
          
          // Load like status for all videos
          if (videos.length > 0) {
            this.loadAllLikeStatuses();
          }
        },
        error: (error) => {
          this.videoError = 'Failed to load videos. Please try again.';
          console.error('Error loading videos:', error);
          this.isLoadingVideos = false;
        }
      });
  }

  toggleVideoComments(videoId: string): void {
    if (this.showCommentsForVideo === videoId) {
      // Close comments if already open
      this.showCommentsForVideo = null;
      this.comments = [];
      this.commentMenuOpen = null; // Close any open menu
    } else {
      // Open comments for this video
      this.showCommentsForVideo = videoId;
      this.selectedVideo = this.videos.find(v => v.id === videoId) || null;
      if (this.selectedVideo) {
        this.loadComments(videoId);
      }
      this.commentMenuOpen = null; // Close any open menu
    }
  }

  // ==================== LIKE OPERATIONS ====================

  loadAllLikeStatuses(): void {
    this.isLoadingLikes = true;
    this.likeError = null;

    const videoIds = this.videos.map(v => v.id);
    videoIds.forEach(videoId => {
      this.checkLikeStatus(videoId);
    });
    this.isLoadingLikes = false;
  }

  checkLikeStatus(videoId: string): void {
    this.likeService.hasLiked(videoId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: LikeStatusResponse) => {
          this.videoLikes.set(videoId, response.hasLiked);
        },
        error: (error) => {
          console.error('Error checking like status:', error);
        }
      });
  }

  toggleLike(videoId: string): void {
    if (!videoId) return;

    const currentlyLiked = this.videoLikes.get(videoId);
    
    if (currentlyLiked) {
      this.unlikeVideo(videoId);
    } else {
      this.likeVideo(videoId);
    }
  }

  likeVideo(videoId: string): void {
    this.likeService.likeVideo(videoId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: VideoLikeResponse) => {
          this.videoLikes.set(videoId, true);
          // Update the video's like count in the videos array
          const video = this.videos.find(v => v.id === videoId);
          if (video) {
            video.likesCount = (video.likesCount || 0) + 1;
          }
        },
        error: (error) => {
          this.likeError = 'Failed to like video. Please try again.';
          console.error('Error liking video:', error);
        }
      });
  }

  unlikeVideo(videoId: string): void {
    this.likeService.unlikeVideo(videoId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.videoLikes.set(videoId, false);
          // Update the video's like count in the videos array
          const video = this.videos.find(v => v.id === videoId);
          if (video && video.likesCount && video.likesCount > 0) {
            video.likesCount -= 1;
          }
        },
        error: (error) => {
          this.likeError = 'Failed to unlike video. Please try again.';
          console.error('Error unliking video:', error);
        }
      });
  }

  // ==================== HELPER METHODS ====================

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.values(formGroup.controls).forEach(control => {
      control.markAsTouched();
      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }

  isVideoLiked(videoId: string): boolean {
    return this.videoLikes.get(videoId) || false;
  }

  setActiveTab(tab: 'videos' | 'comments' | 'likes'): void {
    this.activeTab = tab;
  }

  getVideoCommentsCount(videoId: string): number {
    const video = this.videos.find(v => v.id === videoId);
    return video ? video.commentsCount : 0;
  }

  // Check if current user is the comment author
  isCommentAuthor(comment: VideoComment): boolean {
    const currentUserId = localStorage.getItem('userId');
    return currentUserId === comment.authorId; 
  }
  

  createVideo(): void {
    if (this.videoForm.invalid) {
      this.markFormGroupTouched(this.videoForm);
      return;
    }
  
    this.isSubmittingVideo = true;
    this.videoError = null;
  
    const payload: CreateVideoDto = {
      title: this.videoForm.value.title,
      description: this.videoForm.value.description,
      videoUrl: this.videoForm.value.url,
      tags: []
    };
  
    this.videoService.createVideo(payload)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (newVideo) => {
          const videoWithCount = {
            ...newVideo,
            commentsCount: 0 
          };
          
          this.videos.unshift(videoWithCount);
          this.videoForm.reset();
          this.showCreateForm = false;
          this.isSubmittingVideo = false;
          this.selectedVideo = videoWithCount;
          this.showCommentsForVideo = videoWithCount.id;
          this.loadComments(videoWithCount.id);
        },
        error: (error) => {
          this.videoError = 'Failed to create video. Please try again.';
          console.error('Error creating video:', error);
          this.isSubmittingVideo = false;
        }
      });
  }

  // Viewport detection (for autoplay)
  @HostListener('window:scroll', ['$event'])
  onScroll(event: Event) {
    const videoElements = document.querySelectorAll('article');
    videoElements.forEach((element, index) => {
      const rect = element.getBoundingClientRect();
      if (rect.top >= 0 && rect.bottom <= window.innerHeight) {
        this.currentVideoIndex = index;
        this.playCurrentVideo();
      }
    });
  }

  playCurrentVideo(): void {
    // Pause all videos
    this.videoPlayers.forEach((player, videoId) => {
      player.pause();
      this.videoPlayStates.set(videoId, false);
    });
    
    // Play current video
    const currentVideo = this.videos[this.currentVideoIndex];
    if (currentVideo && this.videoPlayers.has(currentVideo.id)) {
      const player = this.videoPlayers.get(currentVideo.id);
      if (player) {
        player.play().catch(e => console.log('Autoplay prevented:', e));
        this.videoPlayStates.set(currentVideo.id, true);
      }
    }
  }

  togglePlayPause(videoId: string): void {
    const player = this.videoPlayers.get(videoId);
    if (player) {
      if (player.paused) {
        player.play();
        this.videoPlayStates.set(videoId, true);
      } else {
        player.pause();
        this.videoPlayStates.set(videoId, false);
      }
    }
  }

  getVideoPlayState(videoId: string): boolean {
    return this.videoPlayStates.get(videoId) || false;
  }

  toggleMute(): void {
    this.isMuted = !this.isMuted;
    this.videoPlayers.forEach(player => {
      player.muted = this.isMuted;
    });
  }

  // Template reference for video players
  @ViewChildren('videoPlayer') set videoPlayerRefs(refs: QueryList<ElementRef>) {
    refs.forEach((ref, index) => {
      const video = this.videos[index];
      if (video) {
        this.videoPlayers.set(video.id, ref.nativeElement);
        this.videoPlayStates.set(video.id, false);
      }
    });
  }

  shareVideo(video: Video): void {
    if (navigator.share) {
      navigator.share({
        title: video.title,
        text: video.description,
        url: window.location.href
      });
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href + '?video=' + video.id);
      alert('Link copied to clipboard!');
    }
  }

  toggleCommentLike(commentId: string): void {
    // Implement comment liking if needed
    console.log('Toggle comment like:', commentId);
  }

  scrollToVideos() {
    const videoFeed = document.getElementById('videoFeed');
    if (videoFeed) {
      videoFeed.scrollIntoView({ behavior: 'smooth' });
    }
  }
}