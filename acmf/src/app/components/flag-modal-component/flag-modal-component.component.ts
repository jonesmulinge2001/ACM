import { Component, EventEmitter, HostListener, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-flag-post-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <!-- Backdrop -->
    <div
      class="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex justify-center items-end md:items-center z-50 animate-fadeIn"
      (click)="onBackdropClick($event)"
    >
      <!-- Modal Box -->
      <div
        class="
          bg-white rounded-t-2xl md:rounded-2xl shadow-lg 
          w-full md:w-96 p-6 relative text-center 
          animate-slideUp md:animate-scaleIn
        "
        (click)="$event.stopPropagation()"
      >
        <!-- Drag handle for mobile -->
        <div class="w-12 h-1.5 bg-gray-300 rounded-full mx-auto mb-3 md:hidden"></div>

        <span class="material-icons text-orange-500 text-4xl mb-2 animate-bounce-slow">
          flag
        </span>

        <h2 class="text-lg font-semibold mb-2 text-gray-800">Flag Post</h2>
        <p class="text-sm text-gray-600 mb-4">
          Please provide a reason for flagging this post.
        </p>

        <textarea
          [(ngModel)]="reason"
          rows="4"
          class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
          placeholder="Write your reason..."
        ></textarea>

        <div class="flex justify-end gap-3 mt-5 animate-slideUp">
          <button
            (click)="cancel()"
            class="px-5 py-2 bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition flex items-center gap-1"
          >
            <span class="material-icons text-sm">close</span>
            Cancel
          </button>

          <button
            (click)="submit()"
            [disabled]="!reason.trim()"
            class="px-5 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-full hover:bg-blue-700 transition flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span class="material-icons text-sm">send</span>
            Submit
          </button>
        </div>

        <!-- Close icon (top-right) -->
        <button
          class="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
          (click)="cancel()"
        >
          <span class="material-icons text-lg">close</span>
        </button>
      </div>
    </div>
  `,
  styles: [`
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    @keyframes scaleIn {
      from { transform: scale(0.95); opacity: 0; }
      to { transform: scale(1); opacity: 1; }
    }
    @keyframes slideUp {
      from { transform: translateY(100%); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }
    @keyframes bounceSlow {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-5px); }
    }

    .animate-fadeIn { animation: fadeIn 0.25s ease-out; }
    .animate-scaleIn { animation: scaleIn 0.25s ease-out; }
    .animate-slideUp { animation: slideUp 0.35s ease-out; }
    .animate-bounce-slow { animation: bounceSlow 1.8s infinite ease-in-out; }
  `]
})
export class FlagPostModalComponent {
  @Input() postId!: string;
  @Output() submitFlag = new EventEmitter<string>();
  @Output() closeModal = new EventEmitter<void>();

  reason = '';

  /** Close modal when clicking backdrop */
  onBackdropClick(event: MouseEvent) {
    this.closeModal.emit();
  }

  /** Submit reason */
  submit() {
    if (this.reason.trim()) {
      this.submitFlag.emit(this.reason.trim());
      this.closeModal.emit();
    }
  }

  /** Cancel modal */
  cancel() {
    this.closeModal.emit();
  }
}
