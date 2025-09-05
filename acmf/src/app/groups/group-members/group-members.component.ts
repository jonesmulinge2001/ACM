import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Profile } from '../../interfaces';

@Component({
  selector: 'app-group-members',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="p-4 bg-white rounded-xl shadow">
      <h3 class="text-lg font-semibold mb-3">Group Members</h3>
      <ul class="space-y-2">
        <li *ngFor="let member of members" class="flex items-center gap-3">
          <img
            [src]="member.profileImage || '/assets/default-avatar.png'"
            class="w-8 h-8 rounded-full"
          />
          <span>{{ member.name }}</span>
        </li>
      </ul>
    </div>
  `,
})
export class GroupMembersComponent {
  @Input() members: Profile[] = [];
}
