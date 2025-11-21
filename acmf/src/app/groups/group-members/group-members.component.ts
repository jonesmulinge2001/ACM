
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Profile } from '../../interfaces';
import { DmChatComponent } from "../../components/dm-chat/dm-chat/dm-chat.component";

@Component({
  selector: 'app-group-members',
  standalone: true,
  imports: [CommonModule, DmChatComponent],
  template: `
  <!-- MEMBER SIDEBAR -->
<!-- MEMBER SIDEBAR -->
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
    *ngIf="members.length"
    (click)="$event.stopPropagation()"  
  >
    <!-- Header -->
    <div class="flex justify-between items-center p-6 bg-gradient-to-r from-indigo-500 to-purple-600 text-white">
      <h3 class="text-lg font-semibold">Group Members</h3>
    </div>

    <!-- Members List -->
    <div class="flex-1 overflow-y-auto p-6 space-y-4">
      <div
        *ngFor="let member of members"
        class="flex items-center gap-4 p-4 bg-gray-100 rounded-xl hover:bg-gray-200 hover:-translate-x-1 hover:shadow-md transition-all duration-300 cursor-pointer"
      >
        <!-- Avatar -->
        <div
          class="w-12 h-12 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white flex items-center justify-center font-semibold text-lg flex-shrink-0 overflow-hidden"
        >
          <img
            *ngIf="member.profileImage"
            [src]="member.profileImage"
            class="w-full h-full object-cover"
          />
          <span *ngIf="!member.profileImage">
            {{ (member.name || '?')[0] | uppercase }}
          </span>
        </div>

        <!-- Info -->
        <div class="flex-1 min-w-0">
          <span class="block font-semibold text-gray-900 text-sm truncate">
            {{ member.name }}
          </span>
          <span class="block text-gray-500 text-xs">Joined</span>
        </div>

     <!-- Message Button with Gradient -->
<button
  class="px-3 py-1.5 text-xs font-medium rounded-lg text-white hover:from-blue-600 hover:to-purple-700 active:scale-95 transition-transform flex items-center gap-1 bg-gradient-to-r from-blue-500 to-purple-600"
  (click)="openChatFromSidebar(member.userId)"
>
  <span class="material-icons text-[16px]">chat</span>
  Message
</button>

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
export class GroupMembersComponent {
  @Input() members: Profile[] = [];
  @Output() message = new EventEmitter<string>(); // emits userId of the member


  // LOCAL STATE
  showSidebar = true;       // sidebar visible initially
  showChatPopup = false;    // DM chat hidden initially
  selectedParticipantId: string | undefined;

  // OPEN DM CHAT
  openChatFromSidebar(userId: string) {
    this.showSidebar = false;            // hide sidebar
    this.selectedParticipantId = userId; // pass ID to DM chat
    this.showChatPopup = true;           // show DM chat
  }

  // CLOSE DM CHAT
  closeDmChat() {
    this.showChatPopup = false;
    this.showSidebar = true;             // optionally reopen sidebar
  }

  // Close sidebar when clicking outside
closeSidebar() {
  this.showSidebar = false;
}

}
