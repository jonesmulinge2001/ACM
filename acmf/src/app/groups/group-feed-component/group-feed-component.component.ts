import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { GroupResource, GroupResourceComment } from '../../interfaces';
import { GroupsService } from '../../services/group.service';

@Component({
  selector: 'app-group-feed',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './group-feed-component.component.html',
})
export class GroupFeedComponent implements OnInit {
  @Input() groupId!: string;

  feed: GroupResource[] = [];
  newComment: Record<string, string> = {};
  editingComment: { id: string; content: string } | null = null;

  // 🆕 For editing posts
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

  currentUser = { name: 'User', profileImage: null };

  commentSectionOpen: { [key: string]: boolean } = {};

  postToDelete: GroupResource | null = null;
  isDeleteModalOpen = false;

  menuOpen: { [id: string]: boolean } = {};

  currentUserId: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private groupsService: GroupsService
  ) {}

  ngOnInit(): void {
    this.currentUserId = localStorage.getItem('userId'); 
    this.groupId = this.route.snapshot.paramMap.get('id') ?? '';
    if (!this.groupId) {
      this.errorMessage = 'Group ID missing';
      return;
    }
    this.loadFeed();
  }

  loadFeed(): void {
    this.loading = true;
    this.groupsService.getGroupFeed(this.groupId).subscribe({
      next: (data: GroupResource[]) => {
        this.feed = (data || []).map((r) => ({
          ...r,
          comments: r.comments ?? [],
        }));
        this.loading = false;
      },
      error: () => {
        this.errorMessage = 'Could not load feed';
        this.loading = false;
      },
    });
  }

  toggleLike(resource: GroupResource): void {
    const req = resource.isLikedByCurrentUser
      ? this.groupsService.unlikeFeedPost(this.groupId, resource.id)
      : this.groupsService.likeFeedPost(this.groupId, resource.id);

    req.subscribe({
      next: () => {
        resource.isLikedByCurrentUser = !resource.isLikedByCurrentUser;
        resource.likesCount =
          (resource.likesCount ?? 0) + (resource.isLikedByCurrentUser ? 1 : -1);
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
          resource.comments = resource.comments ?? [];
          resource.comments.push(comment);
          resource.commentsCount = (resource.commentsCount ?? 0) + 1;
          this.newComment[resource.id] = '';
        },
      });
  }

  startEdit(comment: GroupResourceComment): void {
    this.editingComment = { id: comment.id, content: comment.content };
  }

  saveEdit(resource: GroupResource): void {
    if (!this.editingComment) return;
    const content = this.editingComment.content.trim();
    if (!content) return;

    this.groupsService
      .editFeedComment(this.groupId, resource.id, this.editingComment.id, content)
      .subscribe({
        next: (updated: GroupResourceComment) => {
          const idx = resource.comments?.findIndex((c) => c.id === updated.id);
          if (idx !== undefined && idx >= 0) {
            resource.comments![idx] = updated;
          }
          this.cancelEdit();
        },
      });
  }

  cancelEdit(): void {
    this.editingComment = null;
  }

  // 🧭 Open the modal
openDeleteModal(resource: GroupResource): void {
  this.postToDelete = resource;
  this.isDeleteModalOpen = true;
}

// ❌ Close modal
closeDeleteModal(): void {
  this.postToDelete = null;
  this.isDeleteModalOpen = false;
}

// ✅ Confirm deletion
confirmDeletePost(): void {
  if (!this.postToDelete) return;

  this.groupsService
    .deleteGroupResource(this.groupId, this.postToDelete.id)
    .subscribe({
      next: () => {
        this.feed = this.feed.filter((r) => r.id !== this.postToDelete!.id);
        this.closeDeleteModal();
      },
      error: () => {
        this.errorMessage = 'Failed to delete post';
        this.closeDeleteModal();
      },
    });
}

  deleteComment(resource: GroupResource, commentId: string): void {
    this.groupsService
      .deleteFeedComment(this.groupId, resource.id, commentId)
      .subscribe({
        next: () => {
          resource.comments =
            resource.comments?.filter((c) => c.id !== commentId) ?? [];
          resource.commentsCount = Math.max(
            (resource.commentsCount ?? 1) - 1,
            0
          );
        },
      });
  }

  toggleComments(resourceId: string) {
    this.commentSectionOpen[resourceId] = !this.commentSectionOpen[resourceId];
  }

  toggleCommentLike(
    resource: GroupResource,
    comment: GroupResourceComment
  ): void {
    const req = comment.isLikedByCurrentUser
      ? this.groupsService.unlikeFeedComment(
          this.groupId,
          resource.id,
          comment.id
        )
      : this.groupsService.likeFeedComment(
          this.groupId,
          resource.id,
          comment.id
        );

    req.subscribe({
      next: () => {
        comment.isLikedByCurrentUser = !comment.isLikedByCurrentUser;
        comment.likesCount =
          (comment.likesCount ?? 0) +
          (comment.isLikedByCurrentUser ? 1 : -1);
      },
    });
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (!file) return;

    this.selectedFile = file;
    const type = file.type.split('/')[0];
    this.fileType =
      type === 'image' ? 'image' : type === 'video' ? 'video' : 'doc';

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
    if (this.selectedFile) formData.append('file', this.selectedFile);

    this.groupsService.shareResource(this.groupId, formData).subscribe({
      next: (newResource) => {
        this.feed.unshift(newResource);
        this.newPost.content = '';
        this.selectedFile = null;
        this.previewUrl = null;
        this.fileType = null;
        this.creatingPost = false;
      },
      error: (err) => {
        this.errorMessage = err.error?.message || 'Failed to create post';
        this.creatingPost = false;
      },
    });
  }

  // 🆕 Start editing a post
  startEditPost(resource: GroupResource): void {
    this.editingPost = {
      id: resource.id,
      content: resource.content,
      file: null,
      previewUrl: resource.resourceUrl || null,
      fileType: resource.fileType
        ? (['jpg', 'jpeg', 'png', 'gif'].includes(resource.fileType)
            ? 'image'
            : ['mp4', 'mov', 'avi'].includes(resource.fileType)
            ? 'video'
            : 'doc')
        : null,
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
    reader.onload = () => (this.editingPost!.previewUrl = reader.result as string);
    reader.readAsDataURL(file);
  }

  savePostEdit(): void {
    if (!this.editingPost) return;
    const { id, content, file } = this.editingPost;
    this.groupsService
      .updateGroupResource(this.groupId, id, content.trim(), file || undefined)
      .subscribe({
        next: (updated: GroupResource) => {
          const index = this.feed.findIndex((f) => f.id === updated.id);
          if (index !== -1) {
            this.feed[index] = updated;
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

  /** Return Material Icon name by fileType */
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

  toggleMenu(resourceId: string): void {
    this.menuOpen[resourceId] = !this.menuOpen[resourceId];
  }

}
