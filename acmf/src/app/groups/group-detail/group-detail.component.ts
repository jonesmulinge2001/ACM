import {
  Component,
  ChangeDetectionStrategy,
  OnInit,
  OnDestroy,
  ViewChild,
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { map } from 'rxjs/operators';
import { Observable, Subscription } from 'rxjs';
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

  editing = false;
  activeTab: 'feed' | 'chat' | 'members' | 'resources' = 'feed';
  dmUserId: string | null = null;

  @ViewChild('dmHost') dmPopupHost!: DmPopupHostComponent;

  constructor(
    private route: ActivatedRoute,
    private groups: GroupsService,
    private socket: SocketService,
    public auth: AuthService
  ) {}

  ngOnInit() {
    const groupId = this.route.snapshot.paramMap.get('id')!;
    this.group$ = this.groups.getGroupById(groupId);

    this.sub.add(
      this.group$.subscribe(group => {
        const currentUserId = this.auth.getUserId();
        this.joined = !!group.members?.some(
          m => m.userId === currentUserId && !m.isDeleted
        );
      })
    );

    this.members$ = this.group$.pipe(
      map(group => (group.members ?? []).map(m => this.toProfile(m.user?.profile)))
    );

    this.resources$ = this.group$.pipe(map(group => group.resources ?? []));

    this.socket.connect();
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

  join() {
    const groupId = this.route.snapshot.paramMap.get('id')!;
    this.groups.joinGroup(groupId).subscribe(() => {
      this.socket.join(groupId);
      this.joined = true;
    });
  }

  leave() {
    const groupId = this.route.snapshot.paramMap.get('id')!;
    this.groups.leaveGroup(groupId).subscribe(() => {
      this.socket.leave(groupId);
      this.joined = false;
    });
  }

  onGroupUpdated(updated: Group) {
    const groupId = this.route.snapshot.paramMap.get('id')!;
    this.group$ = this.groups.getGroupById(groupId);
    this.editing = false;
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
