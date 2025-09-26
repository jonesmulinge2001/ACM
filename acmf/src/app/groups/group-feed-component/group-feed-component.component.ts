import { Component, OnInit } from '@angular/core';
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
  groupId!: string;
  feed: GroupResource[] = [];
  newComment: Record<string, string> = {};
  editingComment: { id: string; content: string } | null = null;
  loading = false;
  errorMessage: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private groupsService: GroupsService
  ) {}

  ngOnInit(): void {
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
        this.feed = (data || []).map((r) => ({ ...r, comments: r.comments ?? [] }));
        this.loading = false;
      },
      error: (err) => {
        console.error('Feed load failed', err);
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
        resource.likesCount = (resource.likesCount ?? 0) + (resource.isLikedByCurrentUser ? 1 : -1);
      },
    });
  }

  addComment(resource: GroupResource): void {
    const content = (this.newComment[resource.id] ?? '').trim();
    if (!content) return;

    this.groupsService.addFeedComment(this.groupId, resource.id, content).subscribe({
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
        error: (err) => console.error('Edit failed', err),
      });
  }

  cancelEdit(): void {
    this.editingComment = null;
  }

  deleteComment(resource: GroupResource, commentId: string): void {
    this.groupsService.deleteFeedComment(this.groupId, resource.id, commentId).subscribe({
      next: () => {
        resource.comments = resource.comments?.filter((c) => c.id !== commentId) ?? [];
        resource.commentsCount = Math.max((resource.commentsCount ?? 1) - 1, 0);
      },
      error: (err) => console.error('Delete failed', err),
    });
  }

  toggleCommentLike(resource: GroupResource, comment: GroupResourceComment): void {
    const req = comment.isLikedByCurrentUser
      ? this.groupsService.unlikeFeedComment(this.groupId, resource.id, comment.id)
      : this.groupsService.likeFeedComment(this.groupId, resource.id, comment.id);

    req.subscribe({
      next: () => {
        comment.isLikedByCurrentUser = !comment.isLikedByCurrentUser;
        comment.likesCount = (comment.likesCount ?? 0) + (comment.isLikedByCurrentUser ? 1 : -1);
      },
      error: (err) => console.error('Toggle like failed', err),
    });
  }
}
