import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Profile } from '../../interfaces';
import { FollowService } from '../../services/follow.service';
import { HttpClientModule } from '@angular/common/http';
import { DmChatComponent } from '../../components/dm-chat/dm-chat/dm-chat.component';

@Component({
  selector: 'app-group-members',
  standalone: true,
  imports: [CommonModule, DmChatComponent, HttpClientModule],
  template: `
    <div *ngIf="showSidebar">
      <!-- Overlay -->
      <div
        class="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
        *ngIf="members.length"
        (click)="closeSidebar()"
      ></div>

      <!-- Side Panel -->
      <div
        class="fixed top-0 right-0 w-[420px] max-w-full h-full bg-white shadow-xl flex flex-col z-50"
        (click)="$event.stopPropagation()"
      >
        <!-- Header -->
        <div
          class="flex justify-between items-center px-6 py-4 bg-white border-b border-gray-100"
        >
          <div class="flex items-center gap-3">
            <div class="p-2 bg-indigo-50 rounded-lg">
              <span class="material-icons text-indigo-600 text-xl">group</span>
            </div>
            <div>
              <h3 class="text-base font-semibold text-gray-900 tracking-tight">
                Group Members
              </h3>
              <p class="text-xs text-gray-500 font-medium">
                {{ members.length }} total contributors
              </p>
            </div>
          </div>

          <button
            (click)="closeSidebar()"
            class="p-2 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-600 transition-colors"
          >
            <span class="material-icons text-xl">close</span>
          </button>
        </div>

        <!-- Members List -->
        <div class="flex-1 overflow-y-auto  space-y-4">
          <div
            *ngFor="let member of members"
            class="flex items-center justify-between flex-wrap sm:flex-nowrap gap-2 p-2 bg-gray-100 rounded-xl hover:bg-gray-200 hover:-translate-x-1 hover:shadow-md transition-all duration-300"
          >
            <!-- Avatar + Info -->
            <a class="flex items-center gap-3 flex-1 min-w-0">
              <div
                class="inline-flex rounded-full bg-gradient-to-r from-blue-500 to-purple-600 p-[3px]"
              >
                <div
                  *ngIf="member.profileImage"
                  class="w-11 h-11 rounded-full flex-shrink-0"
                >
                  <img
                    [src]="member.profileImage"
                    class="w-full h-full rounded-full object-cover border border-white"
                  />
                </div>
              </div>

              <div class="flex-1 min-w-0">
                <span
                  class="block font-semibold text-gray-900 text-xs truncate"
                  >{{ member.name }}</span
                >
                <span class="block text-gray-500 text-xs">{{
                  member.institution?.name
                }}</span>
              </div>
            </a>

            <!-- Buttons -->
            <div class="flex gap-2 flex-shrink-0">
              <!-- Follow/Unfollow -->
              <button
                class="px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium rounded-lg text-white transition-all flex items-center gap-1 sm:gap-2 active:scale-95 shadow-sm bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 whitespace-nowrap"
                (click)="toggleFollowUser(member.userId!)"
              >
                {{ isUserFollowing(member.userId!) ? 'Unfollow' : 'Follow' }}
              </button>

              <!-- Chat -->
              <button
                class="px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium rounded-lg text-white transition-all flex items-center gap-1 sm:gap-2 active:scale-95 shadow-sm bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 whitespace-nowrap"
                (click)="openChatFromSidebar(member.userId)"
              >
                <span class="material-icons text-[14px] sm:text-[16px]"
                  >chat</span
                >
                Message
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- DM CHAT POPUP -->
    <div *ngIf="showChatPopup" class="fixed bottom-4 right-4 z-[999]">
      <app-dm-chat
        [participantId]="selectedParticipantId"
        (close)="closeDmChat()"
      ></app-dm-chat>
    </div>
  `,
})
export class GroupMembersComponent implements OnInit {
  @Input() members: Profile[] = [];
  @Output() message = new EventEmitter<string>();

  showSidebar = true;
  showChatPopup = false;
  selectedParticipantId?: string;

  following: { followingId: string }[] = [];
  currentUserId = '';

  constructor(private followService: FollowService) {}

  ngOnInit(): void {
    this.currentUserId = JSON.parse(localStorage.getItem('user') || '{}')?.id;
    this.loadFollowingState();
  }

  loadFollowingState() {
    if (!this.currentUserId) return;
    this.followService.getFollowing(this.currentUserId).subscribe({
      next: (follows) => {
        this.following = follows;
      },
      error: (err) => console.error('Failed to load following', err),
    });
  }

  isUserFollowing(userId: string): boolean {
    return this.following.some((f) => f.followingId === userId);
  }

  toggleFollowUser(userId: string): void {
    if (this.isUserFollowing(userId)) {
      this.followService.unFollowUser(userId).subscribe(() => {
        this.loadFollowingState(); // refresh list
      });
    } else {
      this.followService.followUser(userId).subscribe(() => {
        this.loadFollowingState(); // refresh list
      });
    }
  }

  openChatFromSidebar(userId: string) {
    console.log('openChatFromSidebar called with userId:', userId);
    this.showSidebar = false;
    this.selectedParticipantId = userId;
    this.showChatPopup = true;
  }

  closeDmChat() {
    this.showChatPopup = false;
    this.showSidebar = true;
  }

  closeSidebar() {
    this.showSidebar = false;
  }
}
