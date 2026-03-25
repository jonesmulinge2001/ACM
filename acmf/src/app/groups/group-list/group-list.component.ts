import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { Observable, Subscription, BehaviorSubject, combineLatest } from 'rxjs';
import { map, take } from 'rxjs/operators';
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
  styleUrls: ['./group-list.component.css']
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

  loadGroups() {
    this.isLoading = true;
    this.groups$ = this.svc.getAllGroups();
    
    this.subscriptions.add(
      this.groups$.subscribe(groups => {
        this.allGroups = groups;
        this.filterGroups();
        this.isLoading = false;
        this.cdr.detectChanges();
      })
    );
  }

  filterGroups() {
    let filtered = [...this.allGroups];
    
    // Filter by search query
    if (this.searchQuery.trim()) {
      const query = this.searchQuery.toLowerCase();
      filtered = filtered.filter(group => 
        group.name.toLowerCase().includes(query) ||
        (group.description && group.description.toLowerCase().includes(query))
      );
    }
    
    // Filter by joined status
    if (this.selectedFilter === 'joined') {
      filtered = filtered.filter(group => this.isUserJoined(group));
    }
    
    this.filteredGroups = filtered;
    this.cdr.detectChanges();
  }

  isUserJoined(group: Group): boolean {
    return group.members?.some(member => member.userId === this.currentUserId) || false;
  }

  getMemberCount(group: Group): number {
    return group._count?.members ?? group.members?.length ?? 0;
  }

  getTotalMembers(): number {
    return this.allGroups.reduce((total, group) => total + this.getMemberCount(group), 0);
  }

  getActiveGroups(): number {
    // This is a placeholder - you can implement actual active groups logic
    return this.allGroups.filter(group => group.members && group.members.length > 0).length;
  }

  formatDate(dateString: string): string {
    if (!dateString) return 'Recently';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return `${Math.floor(diffDays / 365)} years ago`;
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }
}