import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GroupResource } from '../../interfaces';



@Component({
  selector: 'app-group-resources',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="p-4 bg-white rounded-xl shadow">
      <h3 class="text-lg font-semibold mb-3">Shared Resources</h3>

      <ng-container *ngIf="resources?.length; else empty">
        <ul class="space-y-3">
          <li
            *ngFor="let res of resources"
            class="p-3 border rounded-lg hover:bg-gray-50 flex justify-between items-center"
          >
            <div>
              <p class="font-medium text-blue-600">{{ res.title }}</p>
              <p class="text-sm text-gray-500">
                by {{ res.sharedBy?.name }} ·
                {{ res.createdAt | date: 'short' }}
              </p>
            </div>
            <a
              [href]="res.resourceUrl"
              target="_blank"
              class="text-sm px-3 py-1 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
            >
              View
            </a>
          </li>
        </ul>
      </ng-container>

      <ng-template #empty>
        <p class="text-gray-500 text-sm">No resources shared yet.</p>
      </ng-template>
    </div>
  `,
})
export class GroupResourcesComponent {
  @Input() resources: GroupResource[] = [];
}
