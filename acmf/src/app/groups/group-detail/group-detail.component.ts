import {
  Component,
  ChangeDetectionStrategy,
  OnInit,
  OnDestroy,
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { map } from 'rxjs/operators';
import { Observable, Subscription } from 'rxjs';
import { Group, Profile, GroupResource } from '../../interfaces';
import { AuthService } from '../../services/auth.service';
import { GroupsService } from '../../services/group.service';
import { SocketService } from '../../services/socket.service';
import { CommonModule } from '@angular/common';
import { GroupChatComponent } from '../group-chat/group-chat.component';
import { GroupMembersComponent } from '../group-members/group-members.component';
import { GroupResourcesComponent } from '../group-resources/group-resources.component';
import { EditGroupComponent } from '../edit-group/edit-group.component';

@Component({
  imports: [
    CommonModule,
    GroupChatComponent,
    GroupMembersComponent,
    GroupResourcesComponent,
    EditGroupComponent,
  ],
  selector: 'app-group-detail',
  templateUrl: './group-detail.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GroupDetailComponent implements OnInit, OnDestroy {
  group$!: Observable<Group>;
  members$!: Observable<Profile[]>;
  resources$!: Observable<Group['resources']>;
  private sub = new Subscription();
  groupId!: string;
  joined = false;

  editing = false;

  currentUserId: string | null = null;

  activeTab: 'feed' | 'chat' | 'members' | 'resources' = 'feed';


  constructor(
    private route: ActivatedRoute,
    private groups: GroupsService,
    private socket: SocketService,
    public auth: AuthService
  ) {}

  ngOnInit() {
    this.groupId = this.route.snapshot.paramMap.get('id')!;
  
    // Load group
    this.group$ = this.groups.getGroupById(this.groupId);
  
    // When group or user changes, recalc joined
    this.sub.add(
      this.group$.subscribe(group => {
        const currentUserId = this.auth.getUserId(); // from localStorage
        this.joined = !!group.members?.some(
          m => m.userId === currentUserId && !m.isDeleted
        );
        console.log('Joined status:', this.joined);
      })
    );
  
    // Keep resources & members streams
    this.members$ = this.group$.pipe(
      map(group => (group.members ?? []).map(m => this.toProfile(m.user?.profile)))
    );
  
    this.resources$ = this.group$.pipe(map(group => group.resources ?? []));
  
    // Setup socket connection
    this.socket.connect();
    this.sub.add(this.socket.onUserJoined().subscribe(() => {}));
    this.sub.add(this.socket.onUserLeft().subscribe(() => {}));
  }
  
  
  

  // Converts user.profile or undefined to a valid Profile
  private toProfile(user?: Profile | null): Profile {
    return {
      id: user?.id || '',
      name: user?.name || '',
      email: user?.email || '',
      institution: user?.institution || '',
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

  join() {
    this.groups.joinGroup(this.groupId).subscribe(() => {
      this.socket.join(this.groupId);
      this.joined = true;
    });
  }

  leave() {
    this.groups.leaveGroup(this.groupId).subscribe(() => {
      this.socket.leave(this.groupId);
      this.joined = false;
    });
  }

  ngOnDestroy() {
    this.sub.unsubscribe();
  }

  onGroupUpdated(updated: Group) {
    this.group$ = this.groups.getGroupById(this.groupId);
    this.editing = false;
    this.groups.getGroupById(this.groupId).subscribe();
  }

  isGroupAdminOrOwner(group: Group, userId: string | null | undefined): boolean {
    if (!userId) return false;
  
    // creator is always considered owner even if membership row is wrong
    if (group.creatorId === userId) return true;
  
    // otherwise check the membership role
    const member = group.members?.find((m) => m.userId === userId);
    return member?.role === 'OWNER' || member?.role === 'ADMIN';
  }
  
}
