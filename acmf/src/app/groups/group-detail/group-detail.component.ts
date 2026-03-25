import {
  Component,
  ChangeDetectionStrategy,
  OnInit,
  OnDestroy,
  ViewChild,
  ChangeDetectorRef
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { map, take, switchMap } from 'rxjs/operators';
import { Observable, Subscription, BehaviorSubject } from 'rxjs';
import { Group, Profile } from '../../interfaces';
import { AuthService } from '../../services/auth.service';
import { GroupsService } from '../../services/group.service';
import { SocketService } from '../../services/socket.service';
import { CommonModule } from '@angular/common';
import { GroupChatComponent } from '../group-chat/group-chat.component';
import { GroupMembersComponent } from '../group-members/group-members.component';
import { GroupResourcesComponent } from '../group-resources/group-resources.component';
import { EditGroupComponent } from '../edit-group/edit-group.component';
import { DmChatComponent } from "../../components/dm-chat/dm-chat/dm-chat.component";
import { DmPopupHostComponent } from '../../components/dm-popup-host/dm-popup-host.component';
import { GroupFeedComponent } from '../group-feed-component/group-feed-component.component';

@Component({
  selector: 'app-group-detail',
  standalone: true,
  imports: [
    CommonModule,
    GroupChatComponent,
    GroupMembersComponent,
    GroupResourcesComponent,
    EditGroupComponent,
    DmChatComponent,
    DmPopupHostComponent,
    GroupFeedComponent,
  ],
  templateUrl: './group-detail.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GroupDetailComponent implements OnInit, OnDestroy {
  group$!: Observable<Group>;
  members$!: Observable<Profile[]>;
  resources$!: Observable<Group['resources']>;
  private sub = new Subscription();
  joined = false;
  
  // Use BehaviorSubject for immediate updates
  private groupSubject = new BehaviorSubject<Group | null>(null);
  group: Group | null = null;

  editing = false;
  activeTab: 'feed' | 'chat' | 'members' | 'resources' = 'feed';
  dmUserId: string | null = null;
  
  // Leave Modal Properties
  showLeaveModal: boolean = false;
  groupToLeave: Group | null = null;

  @ViewChild('dmHost') dmPopupHost!: DmPopupHostComponent;

  constructor(
    private route: ActivatedRoute,
    private groups: GroupsService,
    private socket: SocketService,
    public auth: AuthService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    const groupId = this.route.snapshot.paramMap.get('id')!;
    this.loadGroupData(groupId);
    
    this.members$ = this.group$.pipe(
      map(group => (group.members ?? []).map(m => this.toProfile(m.user?.profile)))
    );

    this.resources$ = this.group$.pipe(map(group => group.resources ?? []));

    this.socket.connect();
  }

  loadGroupData(groupId: string) {
    this.group$ = this.groups.getGroupById(groupId);
    
    this.sub.add(
      this.group$.subscribe(group => {
        if (group) {
          this.group = group;
          this.groupSubject.next(group);
          const currentUserId = this.auth.getUserId();
          this.joined = !!group.members?.some(
            m => m.userId === currentUserId && !m.isDeleted
          );
          this.cdr.detectChanges(); // Force change detection
        }
      })
    );
  }

  private toProfile(user?: Profile | null): Profile {
    return {
      id: user?.id || '',
      name: user?.name || '',
      email: user?.email || '',
      institutionId: user?.institutionId || '',
      academicLevel: user?.academicLevel || '',
      skills: user?.skills || [],
      bio: user?.bio || '',
      course: user?.course || '',
      interests: user?.interests || [],
      profileImage: user?.profileImage,
      coverPhoto: user?.coverPhoto ?? null,
      userId: user?.userId || '',
      followersCount: user?.followersCount || 0,
      followingCount: user?.followingCount || 0,
      viewsCount: user?.viewsCount || 0,
      createdAt: user?.createdAt || new Date().toISOString(),
      updatedAt: user?.updatedAt || new Date().toISOString(),
      showFullBio: user?.showFullBio || false,
    };
  }

  formatDate(dateString: string): string {
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

  // Fixed: Proper join with immediate UI update
  join() {
    const groupId = this.route.snapshot.paramMap.get('id')!;
    this.groups.joinGroup(groupId).subscribe({
      next: () => {
        this.socket.join(groupId);
        this.joined = true;
        // Immediately update the group data
        this.loadGroupData(groupId);
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error joining group:', err);
      }
    });
  }

  // Fixed: Proper open leave modal with single click
  openLeaveModal(): void {
    if (this.group) {
      this.groupToLeave = this.group;
      this.showLeaveModal = true;
      this.cdr.detectChanges();
    }
  }

  // Close leave modal
  closeLeaveModal(): void {
    this.showLeaveModal = false;
    this.groupToLeave = null;
    this.cdr.detectChanges();
  }

  // Confirm leave with immediate UI update
  confirmLeave(): void {
    if (this.groupToLeave) {
      const groupId = this.route.snapshot.paramMap.get('id')!;
      this.groups.leaveGroup(groupId).subscribe({
        next: () => {
          this.socket.leave(groupId);
          this.joined = false;
          // Immediately update the group data
          this.loadGroupData(groupId);
          this.closeLeaveModal();
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Error leaving group:', err);
          this.closeLeaveModal();
        }
      });
    }
  }

  onGroupUpdated(updated: Group) {
    const groupId = this.route.snapshot.paramMap.get('id')!;
    this.loadGroupData(groupId);
    this.editing = false;
    this.cdr.detectChanges();
  }

  isGroupAdminOrOwner(group: Group, userId: string | null | undefined): boolean {
    if (!userId) return false;
    if (group.creatorId === userId) return true;
    const member = group.members?.find(m => m.userId === userId);
    return member?.role === 'OWNER' || member?.role === 'ADMIN';
  }

  openDm(userId: string) {
    this.dmPopupHost.openForUser(userId);
  }

  ngOnDestroy() {
    this.sub.unsubscribe();
  }
}