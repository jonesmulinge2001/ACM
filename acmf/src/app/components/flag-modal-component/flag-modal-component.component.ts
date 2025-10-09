import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-flag-post-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div
      class="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50"
    >
      <div class="bg-white rounded-lg w-96 p-6 shadow-lg relative">
        <h2 class="text-lg font-semibold mb-3">Flag Post</h2>
        <p class="text-sm text-gray-600 mb-4">
          Please provide a reason for flagging this post.
        </p>
        <textarea
          [(ngModel)]="reason"
          rows="4"
          class="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring focus:ring-blue-200"
          placeholder="Enter reason..."
        ></textarea>

        <div class="flex justify-end gap-3 mt-4">
          <button
            class="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
            (click)="cancel()"
          >
            Cancel
          </button>
          <button
            class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            [disabled]="!reason.trim()"
            (click)="submit()"
          >
            Submit
          </button>
        </div>

        <button
          class="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
          (click)="cancel()"
        >
          &times;
        </button>
      </div>
    </div>
  `,
})
export class FlagPostModalComponent {
  @Input() postId!: string;
  @Output() submitFlag = new EventEmitter<string>();
  @Output() closeModal = new EventEmitter<void>();

  reason = '';

  submit() {
    if (this.reason.trim()) this.submitFlag.emit(this.reason.trim());
  }

  cancel() {
    this.closeModal.emit();
  }
}
