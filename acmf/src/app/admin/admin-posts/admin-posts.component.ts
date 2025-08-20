/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  AdminPost,
  PostFlag,
  FlagStatus,
} from '../../interfaces';
import { AdminPostService } from '../../services/admin-post.service';

type TabKey = 'ALL' | 'FLAGGED';

@Component({
  selector: 'app-admin-posts',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-posts.component.html',
})
export class AdminPostsComponent implements OnInit {
  // Tabs
  tabs: { key: TabKey; label: string }[] = [
    { key: 'ALL', label: 'All Posts' },
    { key: 'FLAGGED', label: 'Flagged' },
  ];
  activeTab: TabKey = 'ALL';

  // Lists
  posts: AdminPost[] = [];
  flagged: PostFlag[] = [];

  // Views
  loading = false;
  error: string | null = null;

  // Search & client-side filtering/paging
  searchTerm = '';
  filteredPosts: AdminPost[] = [];
  paginatedPosts: AdminPost[] = [];
  page = 1;
  limit = 10;
  get totalUsers() { return this.filteredPosts.length; } // naming kept similar to your pattern
  get totalPages() { return Math.ceil(this.filteredPosts.length / this.limit); }
  Math = Math;

  // Selection
  selectedPostIds = new Set<string>();
  selectAllChecked = false;

  // Track expanded states
expandedPosts = new Set<string>();

  // Confirm modal
  confirmAction: { show: boolean; message: string; onConfirm?: () => void } = {
    show: false,
    message: '',
  };

  constructor(private adminPostService: AdminPostService) {}

  ngOnInit(): void {
    this.loadAll();
  }

  // Loader wrapper
  private async runWithLoader<T>(fn: () => Promise<T>): Promise<T | void> {
    this.loading = true;
    this.error = null;
    try {
      return await fn();
    } catch (e: any) {
      this.error = e?.message ?? 'Something went wrong';
    } finally {
      this.loading = false;
    }
  }

  loadAll() {
    this.runWithLoader(async () => {
      const [posts, flagged] = await Promise.all([
        this.adminPostService.getAllPosts().toPromise(),
        this.adminPostService.getFlaggedPosts().toPromise().catch(() => [] as PostFlag[]),
      ]);
      this.posts = posts ?? [];
      this.flagged = flagged ?? [];
      this.applySearch();
    });
  }

  // --- Confirm modal ---
  openConfirm(message: string, onConfirm: () => void) {
    this.confirmAction = { show: true, message, onConfirm };
  }
  closeConfirm() {
    this.confirmAction = { show: false, message: '', onConfirm: undefined };
  }

  // --- Search & paging for posts tab (client-side for now) ---
  applySearch() {
    const term = this.searchTerm.trim().toLowerCase();
    const base = this.posts.slice();

    this.filteredPosts = term
      ? base.filter((p) => {
          const author = p.author?.name?.toLowerCase() || '';
          const inst = p.author?.profile?.institution?.toLowerCase() || '';
          const title = p.title?.toLowerCase() || '';
          const body = p.body?.toLowerCase() || '';
          return (
            author.includes(term) ||
            inst.includes(term) ||
            title.includes(term) ||
            body.includes(term)
          );
        })
      : base;

    this.setPage(1);
  }

  setPage(page: number) {
    if (page < 1 || page > this.totalPages) return;
    this.page = page;
    const start = (this.page - 1) * this.limit;
    const end = start + this.limit;
    this.paginatedPosts = this.filteredPosts.slice(start, end);
  }

  getPaginationRange(): Array<number | '...'> {
    const total = this.totalPages;
    const range: Array<number | '...'> = [];
    if (total <= 7) {
      for (let i = 1; i <= total; i++) range.push(i);
    } else {
      range.push(1);
      if (this.page > 4) range.push('...');
      for (let i = Math.max(2, this.page - 1); i <= Math.min(total - 1, this.page + 1); i++) {
        range.push(i);
      }
      if (this.page < total - 3) range.push('...');
      range.push(total);
    }
    return range;
  }

  // --- Selection (posts tab) ---
  togglePostSelection(id: string) {
    if (this.selectedPostIds.has(id)) this.selectedPostIds.delete(id);
    else this.selectedPostIds.add(id);
  }
  toggleSelectAll() {
    this.selectAllChecked = !this.selectAllChecked;
    if (this.selectAllChecked) {
      this.paginatedPosts.forEach((p) => this.selectedPostIds.add(p.id));
    } else {
      this.paginatedPosts.forEach((p) => this.selectedPostIds.delete(p.id));
    }
  }
  clearSelection() {
    this.selectedPostIds.clear();
    this.selectAllChecked = false;
  }

  // --- Per-post actions ---
  softDelete(post: AdminPost) {
    this.openConfirm(`Soft-delete "${post.title}"?`, () => {
      this.adminPostService.changeStatus(post.id, 'DELETE').subscribe({
        next: (updated) => {
          const idx = this.posts.findIndex((p) => p.id === post.id);
          if (idx > -1) this.posts[idx] = { ...this.posts[idx], ...updated };
          this.applySearch();
          this.closeConfirm();
        },
        error: (e) => (this.error = e.message || 'Failed to soft-delete'),
      });
    });
  }

  restore(post: AdminPost) {
    this.openConfirm(`Restore "${post.title}"?`, () => {
      this.adminPostService.changeStatus(post.id, 'RESTORE').subscribe({
        next: (updated) => {
          const idx = this.posts.findIndex((p) => p.id === post.id);
          if (idx > -1) this.posts[idx] = { ...this.posts[idx], ...updated };
          this.applySearch();
          this.closeConfirm();
        },
        error: (e) => (this.error = e.message || 'Failed to restore'),
      });
    });
  }

  hardDelete(post: AdminPost) {
    this.openConfirm(`Hard-delete "${post.title}" permanently?`, () => {
      this.adminPostService.hardDelete(post.id).subscribe({
        next: () => {
          this.posts = this.posts.filter((p) => p.id !== post.id);
          this.applySearch();
          this.closeConfirm();
        },
        error: (e) => (this.error = e.message || 'Failed to hard-delete'),
      });
    });
  }

  // --- Bulk actions (posts tab) ---
  bulkSoftDelete() {
    const ids = Array.from(this.selectedPostIds);
    if (!ids.length) return;
    this.openConfirm(`Soft-delete ${ids.length} posts?`, () => {
      this.adminPostService.bulkDelete(ids).subscribe({
        next: (updated) => {
          const map = new Map(updated.map((p) => [p.id, p]));
          this.posts = this.posts.map((p) => (map.has(p.id) ? { ...p, ...map.get(p.id)! } : p));
          this.applySearch();
          this.clearSelection();
          this.closeConfirm();
        },
        error: (e) => (this.error = e.message || 'Bulk delete failed'),
      });
    });
  }

  bulkRestore() {
    const ids = Array.from(this.selectedPostIds);
    if (!ids.length) return;
    this.openConfirm(`Restore ${ids.length} posts?`, () => {
      this.adminPostService.bulkRestore(ids).subscribe({
        next: (updated) => {
          const map = new Map(updated.map((p) => [p.id, p]));
          this.posts = this.posts.map((p) => (map.has(p.id) ? { ...p, ...map.get(p.id)! } : p));
          this.applySearch();
          this.clearSelection();
          this.closeConfirm();
        },
        error: (e) => (this.error = e.message || 'Bulk restore failed'),
      });
    });
  }

  // --- Flagged tab actions ---
  setFlagStatus(flag: PostFlag, status: FlagStatus) {
    this.adminPostService.updateFlagStatus(flag.id, status).subscribe({
      next: (f) => {
        const i = this.flagged.findIndex((x) => x.id === flag.id);
        if (i > -1) this.flagged[i] = { ...this.flagged[i], ...f };
      },
      error: (e) => (this.error = e.message || 'Failed to update flag'),
    });
  }

  softDeleteFromFlag(flag: PostFlag) {
    this.openConfirm(`Soft-delete flagged post "${flag.post.title}"?`, () => {
      this.adminPostService.softDeleteFlaggedPost(flag.postId).subscribe({
        next: (updatedPost) => {
          // reflect in posts list, if present
          const idx = this.posts.findIndex((p) => p.id === updatedPost.id);
          if (idx > -1) this.posts[idx] = { ...this.posts[idx], ...updatedPost };
          // update flag's post copy
          const fIdx = this.flagged.findIndex((f) => f.id === flag.id);
          if (fIdx > -1) this.flagged[fIdx].post = { ...this.flagged[fIdx].post, ...updatedPost };
          this.applySearch();
          this.closeConfirm();
        },
        error: (e) => (this.error = e.message || 'Failed to soft-delete flagged post'),
      });
    });
  }

  restoreFromFlag(flag: PostFlag) {
    this.openConfirm(`Restore flagged post "${flag.post.title}"?`, () => {
      this.adminPostService.restoreFlaggedPost(flag.postId).subscribe({
        next: (updatedPost) => {
          const idx = this.posts.findIndex((p) => p.id === updatedPost.id);
          if (idx > -1) this.posts[idx] = { ...this.posts[idx], ...updatedPost };
          const fIdx = this.flagged.findIndex((f) => f.id === flag.id);
          if (fIdx > -1) this.flagged[fIdx].post = { ...this.flagged[fIdx].post, ...updatedPost };
          this.applySearch();
          this.closeConfirm();
        },
        error: (e) => (this.error = e.message || 'Failed to restore flagged post'),
      });
    });
  }

  bulkClearFlagsForSelection() {
    const ids = Array.from(this.selectedPostIds);
    if (!ids.length) return;
    this.openConfirm(`Remove all flags for ${ids.length} posts?`, () => {
      this.adminPostService.bulkRemoveFlags(ids).subscribe({
        next: () => {
          // remove any flags whose postId is in ids
          this.flagged = this.flagged.filter((f) => !ids.includes(f.postId));
          this.clearSelection();
          this.closeConfirm();
        },
        error: (e) => (this.error = e.message || 'Bulk remove flags failed'),
      });
    });
  }

  // toggle expand for readmore/readless
  toggleExpand(postId: string) {
    if (this.expandedPosts.has(postId)) {
      this.expandedPosts.delete(postId);
    } else {
      this.expandedPosts.add(postId);
    }
  }
  
  isExpanded(postId: string): boolean {
    return this.expandedPosts.has(postId);
  }
}
