import {
  ChangeDetectorRef,
  Component,
  Input,
  NgZone,
  OnInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { GroupResource, GroupResourceComment, Profile } from '../../interfaces';
import { GroupsService } from '../../services/group.service';
import { ProfileService } from '../../services/profile.service';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { TimeagoModule } from 'ngx-timeago';

@Component({
  selector: 'app-group-feed',
  standalone: true,
  imports: [CommonModule, FormsModule, TimeagoModule],
  templateUrl: './group-feed-component.component.html',
})
export class GroupFeedComponent implements OnInit {
  @Input() groupId!: string;

  feed: GroupResource[] = [];
  newComment: Record<string, string> = {};

  // Store comments separately like home component
  comments: { [resourceId: string]: GroupResourceComment[] } = {};
  commentCounts: { [resourceId: string]: number } = {};

  // Comment editing (home component pattern)
  editedComment: string = '';
  editingCommentId: string | null = null;
  commentEditingInProgress = false;

  commentToDelete: { resourceId: string; commentId: string } | null = null;
  isDeleteCommentModalOpen = false;

  editingPost: {
    id: string;
    content: string;
    file: File | null;
    previewUrl: string | null;
    fileType: 'image' | 'video' | 'doc' | null;
  } | null = null;

  loading = false;
  creatingPost = false;
  errorMessage: string | null = null;

  newPost = { content: '' };
  selectedFile: File | null = null;
  previewUrl: string | null = null;
  fileType: 'image' | 'video' | 'doc' | null = null;
  fileIcon: string | null = null;

  userProfile?: Profile;

  commentSectionOpen: { [key: string]: boolean } = {};
  postToDelete: GroupResource | null = null;
  isDeleteModalOpen = false;

  menuOpen: { [id: string]: boolean } = {};
  currentUserId: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private groupsService: GroupsService,
    private profileService: ProfileService,
    private sanitizer: DomSanitizer,
    private cdr: ChangeDetectorRef,
    private ngZone: NgZone
  ) {}

  ngOnInit(): void {
    this.currentUserId = localStorage.getItem('userId');
    this.groupId = this.route.snapshot.paramMap.get('id') ?? '';

    if (!this.groupId) {
      this.errorMessage = 'Group ID missing';
      return;
    }

    // Load logged-in user's profile first
    this.profileService.getMyProfile().subscribe({
      next: (profile) => {
        this.userProfile = profile;
      },
      error: () => {
        console.error('Failed to load profile');
      },
    });

    // Load group feed next
    this.loadFeed();
  }

  getSafeUrl(url: string): SafeResourceUrl {
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }

  /** Optimize rendering: track by unique resource ID */
  trackByResourceId(index: number, resource: GroupResource) {
    return resource.id;
  }

  // Add trackBy for comments
  trackByCommentId(index: number, comment: GroupResourceComment): string {
    return comment.id;
  }

  loadFeed(): void {
    this.loading = true;

    this.groupsService.getGroupFeed(this.groupId).subscribe({
      next: (data: GroupResource[]) => {
        this.feed = (data || []).map((r) => ({
          ...r,
          resourceUrl: r.resourceUrl,
          fileType: this.detectFileType(
            r.fileType || r.originalName || r.resourceUrl || ''
          ),
        }));

        // Initialize comments from API response
        data.forEach((resource) => {
          if (resource.comments) {
            this.comments[resource.id] = resource.comments;
            this.commentCounts[resource.id] =
              resource.commentsCount || resource.comments.length;
          } else {
            this.comments[resource.id] = [];
            this.commentCounts[resource.id] = 0;
          }
        });

        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.errorMessage = 'Could not load feed';
        this.loading = false;
        this.cdr.detectChanges();
      },
    });
  }

  private detectFileType(fileTypeOrName?: string): 'image' | 'video' | 'doc' {
    if (!fileTypeOrName) return 'doc';

    const val = fileTypeOrName.toLowerCase().trim();

    // Direct mapping from backend fileType
    if (val === 'image') return 'image';
    if (val === 'video') return 'video';

    // Handle file extensions (for URLs or originalName fallback)
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg'].includes(val))
      return 'image';
    if (['mp4', 'mov', 'webm', 'ogg', 'avi', 'mkv'].includes(val))
      return 'video';

    return 'doc'; // everything else is a document
  }

  toggleLike(resource: GroupResource): void {
    const isLiking = !resource.isLikedByCurrentUser;

    // Optimistic UI update
    resource.isLikedByCurrentUser = isLiking;
    resource.likesCount = (resource.likesCount ?? 0) + (isLiking ? 1 : -1);

    const req = isLiking
      ? this.groupsService.likeFeedPost(this.groupId, resource.id)
      : this.groupsService.unlikeFeedPost(this.groupId, resource.id);

    req.subscribe({
      next: (res: any) => {
        // Backend confirmation sync (in case of delay or concurrent changes)
        resource.isLikedByCurrentUser = res.isLiked;
        resource.likesCount = res.likesCount;
      },
      error: () => {
        // Roll back optimistic change if failed
        resource.isLikedByCurrentUser = !isLiking;
        resource.likesCount = (resource.likesCount ?? 0) + (isLiking ? -1 : 1);
      },
    });
  }

  addComment(resource: GroupResource): void {
    const content = (this.newComment[resource.id] ?? '').trim();
    if (!content) return;

    this.groupsService
      .addFeedComment(this.groupId, resource.id, content)
      .subscribe({
        next: (comment: GroupResourceComment) => {
          // Add to comments array like home component
          if (!this.comments[resource.id]) {
            this.comments[resource.id] = [];
          }

          this.comments[resource.id].push(comment);
          this.commentCounts[resource.id] =
            (this.commentCounts[resource.id] || 0) + 1;

          // Create new array reference to trigger change detection
          this.comments[resource.id] = [...this.comments[resource.id]];

          // Clear the input
          this.newComment[resource.id] = '';

          // Force change detection
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Failed to add comment', err);
          this.cdr.detectChanges();
        },
      });
  }

  // ------------------ EDIT COMMENT HANDLERS (Home Component Pattern) ------------------
  startEdit(comment: GroupResourceComment): void {
    this.editingCommentId = comment.id;
    this.editedComment = comment.content;
    this.cdr.markForCheck();
  }

  // Helper method to update comments in all resources
  private updateCommentInAllResources(
    updatedComment: GroupResourceComment
  ): void {
    // Loop through all resources
    Object.keys(this.comments).forEach((resourceId) => {
      const idx = this.comments[resourceId].findIndex(
        (c) => c.id === updatedComment.id
      );
      if (idx > -1) {
        // Update the comment
        this.comments[resourceId][idx] = {
          ...this.comments[resourceId][idx],
          ...updatedComment,
        };
        // Create new array reference
        this.comments[resourceId] = [...this.comments[resourceId]];
      }
    });
  }

  saveEdit(): void {
    if (!this.editingCommentId || !this.editedComment.trim()) return;

    this.commentEditingInProgress = true;
    const updatedContent = this.editedComment.trim();

    this.groupsService
      .editFeedComment(this.editingCommentId, updatedContent)
      .subscribe({
        next: (updatedComment: GroupResourceComment) => {
          // Update the comment in all resources
          this.updateCommentInAllResources(updatedComment);

          // Reset editing state
          this.cancelEdit();

          // Force change detection
          this.cdr.detectChanges();
          this.commentEditingInProgress = false;
        },
        error: (err) => {
          console.error('Failed to edit comment', err);
          this.commentEditingInProgress = false;
          this.cdr.detectChanges();
        },
      });
  }

  cancelEdit(): void {
    this.editingCommentId = null;
    this.editedComment = '';
    this.commentEditingInProgress = false;
    this.cdr.markForCheck();
  }

  openDeleteModal(resource: GroupResource): void {
    this.postToDelete = resource;
    this.isDeleteModalOpen = true;
  }

  closeDeleteModal(): void {
    this.postToDelete = null;
    this.isDeleteModalOpen = false;
  }

  confirmDeletePost(): void {
    if (!this.postToDelete) return;

    const postId = this.postToDelete.id; // This is safe because we checked above

    this.groupsService.deleteGroupResource(this.groupId, postId).subscribe({
      next: () => {
        // Remove from feed
        this.feed = this.feed.filter((r) => r.id !== postId);

        // Also remove comments for this resource
        delete this.comments[postId];
        delete this.commentCounts[postId];

        this.closeDeleteModal();
      },
      error: () => {
        this.errorMessage = 'Failed to delete post';
        this.closeDeleteModal();
      },
    });
  }

  deleteComment(resourceId: string, commentId: string): void {
    this.groupsService.deleteFeedComment(commentId).subscribe({
      next: () => {
        // Remove the deleted comment from local list
        if (this.comments[resourceId]) {
          this.comments[resourceId] = this.comments[resourceId].filter(
            (c) => c.id !== commentId
          );
          // Update count
          this.commentCounts[resourceId] = Math.max(
            (this.commentCounts[resourceId] || 1) - 1,
            0
          );
          // Create new array reference
          this.comments[resourceId] = [...this.comments[resourceId]];
        }
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Failed to delete comment', err);
        this.cdr.detectChanges();
      },
    });
  }

  toggleComments(resourceId: string) {
    this.commentSectionOpen[resourceId] = !this.commentSectionOpen[resourceId];
    this.cdr.detectChanges();
  }

  toggleCommentLike(comment: GroupResourceComment): void {
    const req = comment.isLikedByCurrentUser
      ? this.groupsService.unlikeFeedComment(comment.id)
      : this.groupsService.likeFeedComment(comment.id);

    req.subscribe({
      next: () => {
        comment.isLikedByCurrentUser = !comment.isLikedByCurrentUser;
        comment.likesCount =
          (comment.likesCount ?? 0) + (comment.isLikedByCurrentUser ? 1 : -1);
      },
      error: (err) => {
        console.error('Failed to toggle comment like', err);
      },
    });
  }

  /** Cached icon + responsive preview fix */
  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (!file) return;

    this.selectedFile = file;

    const type = file.type.split('/')[0];
    this.fileType =
      type === 'image' ? 'image' : type === 'video' ? 'video' : 'doc';

    const ext = file.name.split('.').pop()?.toLowerCase();
    this.fileIcon = this.getFileIcon(ext);

    const reader = new FileReader();
    reader.onload = () => (this.previewUrl = reader.result as string);
    reader.readAsDataURL(file);
  }

  createPost(): void {
    const content = this.newPost.content?.trim() || '';

    if (!content && !this.selectedFile) {
      this.errorMessage = 'Please write something or attach a file.';
      return;
    }

    this.creatingPost = true;
    const formData = new FormData();

    if (content) formData.append('content', content);
    if (this.selectedFile) formData.append('attachments', this.selectedFile);

    this.groupsService.shareResource(this.groupId, formData).subscribe({
      next: (newResource) => {
        const normalized = Array.isArray(newResource)
          ? newResource.map((r) => ({
              ...r,
              resourceUrl: r.resourceUrl,
              fileType: this.detectFileType(
                r.fileType || r.originalName || r.resourceUrl
              ),
            }))
          : {
              ...newResource,
              resourceUrl: newResource.resourceUrl,
              fileType: this.detectFileType(
                newResource.fileType ||
                  newResource.originalName ||
                  newResource.resourceUrl
              ),
            };

        // Add to feed
        if (Array.isArray(normalized)) {
          normalized.forEach((resource) => {
            this.feed.unshift(resource);
            // Initialize comments for new resource
            this.comments[resource.id] = resource.comments || [];
            this.commentCounts[resource.id] =
              resource.commentsCount || resource.comments?.length || 0;
          });
        } else {
          this.feed.unshift(normalized);
          // Initialize comments for new resource
          this.comments[normalized.id] = normalized.comments || [];
          this.commentCounts[normalized.id] =
            normalized.commentsCount || normalized.comments?.length || 0;
        }

        // Reset form
        this.newPost.content = '';
        this.selectedFile = null;
        this.previewUrl = null;
        this.fileType = null;
        this.fileIcon = null;
        this.creatingPost = false;
        this.errorMessage = null;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.errorMessage = err.error?.message || 'Failed to create post';
        this.creatingPost = false;
      },
    });
  }

  startEditPost(resource: GroupResource): void {
    this.editingPost = {
      id: resource.id,
      content: resource.content,
      file: null,
      previewUrl: resource.resourceUrl || '',
      fileType: this.detectFileType(
        resource.fileType || resource.originalName || resource.resourceUrl || ''
      ),
    };
  }

  onEditFileSelected(event: any): void {
    if (!this.editingPost) return;
    const file = event.target.files[0];
    if (!file) return;

    this.editingPost.file = file;
    const type = file.type.split('/')[0];
    this.editingPost.fileType =
      type === 'image' ? 'image' : type === 'video' ? 'video' : 'doc';

    const reader = new FileReader();
    reader.onload = () =>
      (this.editingPost!.previewUrl = reader.result as string);
    reader.readAsDataURL(file);
  }

  savePostEdit(): void {
    if (!this.editingPost) return;
    const { id, content, file } = this.editingPost;

    // Safely handle null/undefined/empty content
    const safeContent = content ? content.trim() : '';

    this.groupsService
      .updateGroupResource(this.groupId, id, safeContent, file || undefined)
      .subscribe({
        next: (updated: GroupResource) => {
          const index = this.feed.findIndex((f) => f.id === updated.id);
          if (index !== -1) {
            this.feed[index] = updated;
            this.cdr.detectChanges();
          }
          this.cancelPostEdit();
        },
        error: () => {
          this.errorMessage = 'Failed to update post';
        },
      });
  }

  cancelPostEdit(): void {
    this.editingPost = null;
  }

  openDeleteCommentModal(resourceId: string, commentId: string): void {
    this.commentToDelete = { resourceId, commentId };
    this.isDeleteCommentModalOpen = true;
    this.cdr.markForCheck();
  }

  closeDeleteCommentModal(): void {
    this.commentToDelete = null;
    this.isDeleteCommentModalOpen = false;
    this.cdr.markForCheck();
  }

  confirmDeleteComment(): void {
    if (!this.commentToDelete) return;

    const { resourceId, commentId } = this.commentToDelete;

    this.groupsService.deleteFeedComment(commentId).subscribe({
      next: () => {
        // remove deleted comment from local array
        if (this.comments[resourceId]) {
          this.comments[resourceId] = this.comments[resourceId].filter(
            (c) => c.id !== commentId
          );
          this.commentCounts[resourceId] = Math.max(
            (this.commentCounts[resourceId] ?? 1) - 1,
            0
          );
          // Create new array reference
          this.comments[resourceId] = [...this.comments[resourceId]];
        }
        this.closeDeleteCommentModal();
        this.cdr.detectChanges();
      },
      error: () => {
        this.errorMessage = 'Failed to delete comment';
        this.closeDeleteCommentModal();
      },
    });
  }

  getFileIcon(fileType?: string | null): string {
    if (!fileType) return 'folder';
    const type = fileType.toLowerCase();

    if (['jpg', 'jpeg', 'png', 'gif'].includes(type)) return 'image';
    if (['mp4', 'mov', 'avi'].includes(type)) return 'movie';
    if (['pdf'].includes(type)) return 'picture_as_pdf';
    if (['doc', 'docx'].includes(type)) return 'description';
    if (['ppt', 'pptx'].includes(type)) return 'slideshow';
    if (['xls', 'xlsx'].includes(type)) return 'table_chart';
    if (['zip', 'rar'].includes(type)) return 'folder_zip';
    return 'insert_drive_file';
  }

  toggleMenu(id: string): void {
    this.menuOpen[id] = !this.menuOpen[id];
    this.cdr.markForCheck();
  }

  closeAllMenus(): void {
    this.menuOpen = {};
    this.cdr.markForCheck();
  }

  isMyComment(comment: GroupResourceComment): boolean {
    return comment.user.id === this.currentUserId;
  }

  formatTimeAgo(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return 'just now';

    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;

    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;

    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;

    const weeks = Math.floor(days / 7);
    if (weeks < 4) return `${weeks}w ago`;

    const months = Math.floor(days / 30);
    if (months < 12) return `${months}mo ago`;

    const years = Math.floor(days / 365);
    return `${years}y ago`;
  }
}
