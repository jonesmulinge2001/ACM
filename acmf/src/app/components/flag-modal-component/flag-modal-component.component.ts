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
      class="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex justify-center items-center z-50 transition-all duration-300"
      (click)="onBackdropClick($event)"
    >
      <!-- Modal Box -->
      <div
        class="
          bg-white rounded-2xl shadow-2xl 
          w-[calc(100%-2rem)] max-w-md mx-4
          transform transition-all duration-300 animate-modalSlideUp
          overflow-hidden
        "
        (click)="$event.stopPropagation()"
      >
        <!-- Red Accent Bar (LinkedIn Style) -->
        <div class="h-1 bg-orange-500"></div>
        
        <!-- Close Icon (top-right) -->
        <button
          class="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors z-10 w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100"
          (click)="cancel()"
        >
          <span class="material-icons text-lg">close</span>
        </button>

        <!-- Content -->
        <div class="p-6">
          <!-- Icon with Background -->
          <div class="flex justify-center mb-4">
            <div class="w-16 h-16 bg-orange-50 rounded-full flex items-center justify-center">
              <span class="material-icons text-orange-500 text-4xl">flag</span>
            </div>
          </div>
          
          <!-- Title -->
          <h2 class="text-xl font-semibold text-gray-900 text-center mb-2">
            Report this post
          </h2>
          
          <!-- Description -->
          <p class="text-sm text-gray-500 text-center mb-6 leading-relaxed">
            Please help us understand why you're reporting this post. Your feedback helps keep the community safe.
          </p>
          
          <!-- Reason Input -->
          <div class="mb-6">
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Reason for reporting
            </label>
            <textarea
              [(ngModel)]="reason"
              rows="4"
              class="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200 resize-none"
              placeholder="What's wrong with this post? (e.g., spam, harassment, inappropriate content)"
              [class.border-orange-300]="reason.trim() && reason.trim().length > 0"
            ></textarea>
            <p class="text-xs text-gray-400 mt-2">
              Your report will be reviewed by our moderators
            </p>
          </div>
          
          <!-- Action Buttons -->
          <div class="flex flex-col-reverse sm:flex-row gap-3">
            <button
              (click)="cancel()"
              class="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-1 flex items-center justify-center gap-2"
            >
              <span class="material-icons text-sm">close</span>
              Cancel
            </button>

            <button
              (click)="submit()"
              [disabled]="!reason.trim()"
              class="flex-1 px-4 py-2.5 bg-orange-600 text-white rounded-lg text-sm font-semibold hover:bg-orange-700 active:bg-orange-800 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-1 shadow-sm flex items-center justify-center gap-2"
            >
              <span class="material-icons text-sm">send</span>
              Submit Report
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    @keyframes modalSlideUp {
      from {
        opacity: 0;
        transform: translateY(20px) scale(0.96);
      }
      to {
        opacity: 1;
        transform: translateY(0) scale(1);
      }
    }

    @keyframes fadeIn {
      from {
        opacity: 0;
      }
      to {
        opacity: 1;
      }
    }

    .animate-modalSlideUp {
      animation: modalSlideUp 0.3s cubic-bezier(0.34, 1.2, 0.64, 1);
    }

    /* Custom scrollbar for textarea */
    textarea::-webkit-scrollbar {
      width: 6px;
    }

    textarea::-webkit-scrollbar-track {
      background: #f1f1f1;
      border-radius: 3px;
    }

    textarea::-webkit-scrollbar-thumb {
      background: #cbd5e1;
      border-radius: 3px;
    }

    textarea::-webkit-scrollbar-thumb:hover {
      background: #94a3b8;
    }

    /* Focus styles for accessibility */
    button:focus-visible,
    textarea:focus-visible {
      outline: 2px solid #f97316;
      outline-offset: 2px;
    }

    /* Smooth transitions */
    .transition-all {
      transition-property: all;
      transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
      transition-duration: 200ms;
    }
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