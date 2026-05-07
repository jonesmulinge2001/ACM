import { Component, EventEmitter, Input, OnInit, Output, OnChanges, SimpleChanges, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Profile } from '../../interfaces';
import { FollowService } from '../../services/follow.service';
import { HttpClientModule } from '@angular/common/http';
import { DmChatComponent } from '../../components/dm-chat/dm-chat/dm-chat.component';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-group-members',
  standalone: true,
  imports: [CommonModule, DmChatComponent,FormsModule, HttpClientModule],
  templateUrl: './group-members.component.html',
})
export class GroupMembersComponent implements OnInit, OnChanges {
  @Input() members: Profile[] = [];
  @Output() message = new EventEmitter<string>();
  @Output() membersChange = new EventEmitter<Profile[]>();

  showSidebar = true;
  showChatPopup = false;
  selectedParticipantId?: string;
  selectedParticipantName?: string;
  selectedParticipantImage?: string;

  followingUsers: Set<string> = new Set();
  currentUserId = '';
  
  // UI States
  animatingFollow: string | null = null;
  hoveredMember: string | null = null;
  searchQuery = '';

  constructor(
    private followService: FollowService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    this.currentUserId = user?.id || '';
    this.loadFollowingState();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['members'] && !changes['members'].firstChange) {
      this.refreshFollowingState();
    }
  }

  loadFollowingState() {
    if (!this.currentUserId) return;
    this.followService.getFollowing(this.currentUserId).subscribe({
      next: (follows) => {
        this.followingUsers.clear();
        follows.forEach((follow: { followingId: string }) => {
          this.followingUsers.add(follow.followingId);
        });
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Failed to load following', err),
    });
  }

  refreshFollowingState() {
    this.loadFollowingState();
  }

  isUserFollowing(userId: string): boolean {
    return this.followingUsers.has(userId);
  }

  toggleFollowUser(userId: string): void {
    this.animatingFollow = userId;
    
    if (this.isUserFollowing(userId)) {
      this.followService.unFollowUser(userId).subscribe({
        next: () => {
          this.followingUsers.delete(userId);
          setTimeout(() => {
            if (this.animatingFollow === userId) this.animatingFollow = null;
            this.cdr.detectChanges();
          }, 300);
        },
        error: (err) => {
          console.error('Failed to unfollow', err);
          this.animatingFollow = null;
        }
      });
    } else {
      this.followService.followUser(userId).subscribe({
        next: () => {
          this.followingUsers.add(userId);
          setTimeout(() => {
            if (this.animatingFollow === userId) this.animatingFollow = null;
            this.cdr.detectChanges();
          }, 300);
        },
        error: (err) => {
          console.error('Failed to follow', err);
          this.animatingFollow = null;
        }
      });
    }
  }

  openChatFromSidebar(member: Profile) {
    // this.showSidebar = false;
    // this.selectedParticipantId = member.userId;
    // this.selectedParticipantName = member.name;
    // this.selectedParticipantImage = member.profileImage;
    // this.showChatPopup = true;
    // this.cdr.detectChanges();
    this.message.emit(member.userId!);
  }

  closeDmChat() {
    this.showChatPopup = false;
    this.showSidebar = true;
    this.selectedParticipantId = undefined;
    this.selectedParticipantName = undefined;
    this.selectedParticipantImage = undefined;
    this.cdr.detectChanges();
  }

  closeSidebar() {
    this.showSidebar = false;
    this.cdr.detectChanges();
  }

  getFilteredMembers(): Profile[] {
    if (!this.searchQuery.trim()) return this.members;
    return this.members.filter(member => 
      member.name?.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
      member.institution?.name?.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
      member.name?.toLowerCase().includes(this.searchQuery.toLowerCase())
    );
  }

  trackByUserId(index: number, member: Profile): string {
    return member.userId || index.toString();
  }

  getAvatarColor(userId?: string): string {
    const code = (userId || '').charCodeAt(0) % 5;
    return ['bg-blue-50','bg-emerald-50','bg-violet-50','bg-rose-50','bg-amber-50'][code];
  }
}