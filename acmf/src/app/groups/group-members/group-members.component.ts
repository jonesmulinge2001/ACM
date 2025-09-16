import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Profile } from '../../interfaces';

@Component({
  selector: 'app-group-members',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="p-4 bg-white rounded-2xl border border-gray-200 shadow-sm">
      <!-- Header -->
      <h3 class="text-base font-semibold text-gray-900 mb-4">
        Group Members
      </h3>

      <!-- Members list -->
      <ul class="divide-y divide-gray-100">
        <li
          *ngFor="let member of members"
          class="flex items-center justify-between py-3 px-2 hover:bg-gray-50 rounded-lg transition"
        >
          <!-- Left: avatar + name -->
          <div class="flex items-center gap-3">
            <img
              [src]="member.profileImage || '/assets/default-avatar.png'"
              alt="{{ member.name }}"
              class="w-9 h-9 rounded-full object-cover"
            />
            <span class="text-sm font-medium text-gray-800">
              {{ member.name }}
            </span>
          </div>

          <!-- Right: message button -->
          <button
            class="px-3 py-1.5 text-sm font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 active:scale-95 transition-transform"
            (click)="message.emit(member.userId)"
          >
            Message
          </button>
        </li>
      </ul>
    </div>
  `,
})
export class GroupMembersComponent {
  @Input() members: Profile[] = [];
  @Output() message = new EventEmitter<string>(); // emits userId of the member
}
