import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CreateIntentDto, IntentType } from '../../interfaces';
import { IntentService } from '../../services/intent.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-intent-modal',
  imports: [CommonModule, FormsModule],
  templateUrl: './intent-modal.component.html',
  styleUrl: './intent-modal.component.css',
})
export class IntentModalComponent {
  @Output() close = new EventEmitter<void>();

  selectedIntent: IntentType | null = null;
  urgency: number = 3;
  skill: string = '';
  description: string = '';
  loading: boolean = false;

  constructor(private intentService: IntentService) {}

  selectIntent(type: IntentType) {
    this.selectedIntent = type;
  }

  onBackdropClick(event: MouseEvent): void {
    if ((event.target as Element).classList.contains('intent-backdrop')) {
      this.close.emit();
    }
  }

  submit() {
    if (!this.selectedIntent) {
      Swal.fire({
        icon: 'warning',
        title: 'Select an intent',
        text: 'Please choose what you want before submitting.',
        confirmButtonText: 'Okay',
        buttonsStyling: false,

        background: '#ffffff',
        color: '#111827',

        customClass: {
          popup: 'rounded-2xl p-6 shadow-lg border border-gray-200',
          title: 'text-lg font-semibold text-gray-900',
          htmlContainer: 'text-gray-500 text-sm',
          confirmButton:
            'mt-4 px-5 py-2 rounded-lg bg-indigo-500 hover:bg-indigo-600 text-white transition',
        },
      });
      return;
    }

    const payload: CreateIntentDto = {
      type: this.selectedIntent,
      priority: this.urgency,
      context: {
        skills: this.skill,
        description: this.description,
      },
    };

    this.loading = true;

    this.intentService.createIntent(payload).subscribe({
      next: () => {
        this.loading = false;

        Swal.fire({
          icon: 'success',
          title: 'Intent Submitted!',
          text: 'We’ll match you with the right people shortly.',
          confirmButtonText: 'Continue',
          buttonsStyling: false,

          background: '#ffffff',
          color: '#111827',
          iconColor: '#6366f1',

          customClass: {
            popup: 'rounded-2xl p-6 shadow-lg border border-gray-200',
            title: 'text-xl font-semibold text-gray-900',
            htmlContainer: 'text-gray-500 text-sm',
            confirmButton:
              'mt-4 px-6 py-2 rounded-lg bg-indigo-500 hover:bg-indigo-600 text-white transition',
          },
        }).then(() => {
          this.close.emit();
        });
      },

      error: () => {
        this.loading = false;

        Swal.fire({
          icon: 'error',
          title: 'Submission Failed',
          text: 'Something went wrong. Please try again.',
          confirmButtonText: 'Retry',
          buttonsStyling: false,

          background: '#ffffff',
          color: '#111827',

          customClass: {
            popup: 'rounded-2xl p-6 shadow-lg border border-gray-200',
            title: 'text-lg font-semibold text-gray-900',
            htmlContainer: 'text-gray-500 text-sm',
            confirmButton:
              'mt-4 px-5 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white transition',
          },
        });
      },
    });
  }

  get urgencyLabel(): string {
    if (this.urgency <= 1) return 'Low';
    if (this.urgency <= 3) return 'Medium';
    return 'High';
  }
}