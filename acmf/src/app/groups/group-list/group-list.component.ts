import {
  Component,
  OnInit,
  OnDestroy,
  ChangeDetectorRef,
  ChangeDetectionStrategy,
} from '@angular/core';
import { Observable, Subscription } from 'rxjs';
import { Group } from '../../interfaces';
import { GroupsService } from '../../services/group.service';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-group-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './group-list.component.html',
  styleUrls: ['./group-list.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GroupListComponent implements OnInit, OnDestroy {
  groups$!: Observable<Group[]>;
  filteredGroups: Group[] = [];
  allGroups: Group[] = [];

  isLoading = true;
  searchQuery = '';
  selectedFilter: 'all' | 'joined' = 'all';
  currentUserId: string = '';

  private subscriptions = new Subscription();

  constructor(
    private svc: GroupsService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.currentUserId = this.authService.getUserId() || '';
    this.loadGroups();
  }

  loadGroups(): void {
    this.isLoading = true;
    this.groups$ = this.svc.getAllGroups();

    this.subscriptions.add(
      this.groups$.subscribe({
        next: (groups) => {
          this.allGroups = groups;
          this.filterGroups();
          this.isLoading = false;
          this.cdr.markForCheck();
        },
        error: () => {
          this.isLoading = false;
          this.cdr.markForCheck();
        },
      })
    );
  }

  filterGroups(): void {
    let filtered = [...this.allGroups];

    // Text search
    const q = this.searchQuery.trim().toLowerCase();
    if (q) {
      filtered = filtered.filter(
        (g) =>
          g.name.toLowerCase().includes(q) ||
          (g.description && g.description.toLowerCase().includes(q))
      );
    }

    // Joined filter
    if (this.selectedFilter === 'joined') {
      filtered = filtered.filter((g) => this.isUserJoined(g));
    }

    this.filteredGroups = filtered;
    this.cdr.markForCheck();
  }

  // ── Helpers ────────────────────────────────────────────────────

  isUserJoined(group: Group): boolean {
    return (
      group.members?.some((m) => m.userId === this.currentUserId) ?? false
    );
  }

  getMemberCount(group: Group): number {
    return group._count?.members ?? group.members?.length ?? 0;
  }

  getTotalMembers(): number {
    return this.allGroups.reduce(
      (sum, g) => sum + this.getMemberCount(g),
      0
    );
  }

  getActiveGroups(): number {
    return this.allGroups.filter(
      (g) => (g.members?.length ?? 0) > 0
    ).length;
  }

  formatDate(dateString: string): string {
    if (!dateString) return 'Recently';
    const days = Math.floor(
      (Date.now() - new Date(dateString).getTime()) / 86_400_000
    );
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7)  return `${days}d ago`;
    if (days < 30) return `${Math.floor(days / 7)}w ago`;
    if (days < 365) return `${Math.floor(days / 30)}mo ago`;
    return `${Math.floor(days / 365)}y ago`;
  }

  trackByGroupId(_: number, group: Group): string {
    return group.id;
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}