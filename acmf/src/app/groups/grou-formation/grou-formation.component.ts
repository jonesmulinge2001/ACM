import {
  Component,
  ViewChild,
  ElementRef,
  HostListener,
} from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { GroupsService } from '../../services/group.service';
import { ToastrService } from 'ngx-toastr';

interface Step {
  label: string;
  hint: string;
  description: string;
}

@Component({
  imports: [CommonModule, ReactiveFormsModule],
  selector: 'app-create-group',
  templateUrl: './create-group.html',
  styleUrls: ['./create-group.css'],
})
export class CreateGroupComponent {
  @ViewChild('coverInput') coverInput!: ElementRef<HTMLInputElement>;

  // ── Step metadata ──────────────────────────────────────────────
  steps: Step[] = [
    {
      label: 'Basic Info',
      hint: 'Step 1 of 4',
      description: 'Give your group a name and describe what it\'s all about.',
    },
    {
      label: 'Privacy',
      hint: 'Step 2 of 4',
      description: 'Control who can find and join your group.',
    },
    {
      label: 'Cover Photo',
      hint: 'Step 3 of 4',
      description: 'Upload a cover image that represents your community.',
    },
    {
      label: 'Review',
      hint: 'Step 4 of 4',
      description: 'Review your settings before publishing your group.',
    },
  ];

  currentStep = 0;

  // ── Form ───────────────────────────────────────────────────────
  groupForm: FormGroup;

  // ── State ──────────────────────────────────────────────────────
  isLoading = false;
  successMessage = '';
  errorMessage = '';
  showSuccessBanner = false;
  showErrorBanner = false;
  coverPreview: string | ArrayBuffer | null = null;
  selectedCoverFile: File | null = null;
  isDragging = false;

  constructor(
    private fb: FormBuilder,
    private groupsService: GroupsService,
    public router: Router,
    private toastr: ToastrService
  ) {
    this.groupForm = this.fb.group({
      name: [
        '',
        [Validators.required, Validators.minLength(3), Validators.maxLength(100)],
      ],
      description: ['', [Validators.maxLength(500)]],
      visibility: ['PUBLIC', Validators.required],
    });
  }

  // ── Step navigation ────────────────────────────────────────────
  canAdvance(): boolean {
    if (this.currentStep === 0) {
      const nameCtrl = this.groupForm.get('name')!;
      return nameCtrl.valid && nameCtrl.value?.trim().length >= 3;
    }
    return true; // steps 1, 2 are always advanceable
  }

  nextStep(): void {
    if (!this.canAdvance()) {
      this.groupForm.get('name')?.markAsTouched();
      return;
    }
    if (this.currentStep < this.steps.length - 1) {
      this.currentStep++;
    }
  }

  prevStep(): void {
    if (this.currentStep > 0) {
      this.currentStep--;
    }
  }

  goToStep(index: number): void {
    // Allow navigation back or to already-completed steps
    if (index <= this.currentStep) {
      this.currentStep = index;
    }
  }

  // ── Cover image ────────────────────────────────────────────────
  triggerFileInput(): void {
    this.coverInput?.nativeElement.click();
  }

  onCoverSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;
    this.processFile(input.files[0]);
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = true;
  }

  onDragLeave(): void {
    this.isDragging = false;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;

    const file = event.dataTransfer?.files[0];
    if (file) this.processFile(file);
  }

  private processFile(file: File): void {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

    if (file.size > 5 * 1024 * 1024) {
      this.showInlineMessage('error', 'Cover image must be less than 5 MB.');
      return;
    }
    if (!allowedTypes.includes(file.type)) {
      this.showInlineMessage('error', 'Only JPEG, PNG, GIF, and WEBP images are allowed.');
      return;
    }

    this.selectedCoverFile = file;
    const reader = new FileReader();
    reader.onload = () => (this.coverPreview = reader.result);
    reader.readAsDataURL(file);
  }

  removeCover(): void {
    this.coverPreview = null;
    this.selectedCoverFile = null;
    if (this.coverInput) {
      this.coverInput.nativeElement.value = '';
    }
  }

  // ── Messages ───────────────────────────────────────────────────
  showInlineMessage(type: 'success' | 'error', message: string): void {
    this.clearMessages();
    if (type === 'success') {
      this.successMessage = message;
      this.showSuccessBanner = true;
    } else {
      this.errorMessage = message;
      this.showErrorBanner = true;
    }
    setTimeout(() => this.clearMessages(), 5000);
  }

  clearMessages(): void {
    this.showSuccessBanner = false;
    this.showErrorBanner = false;
    this.successMessage = '';
    this.errorMessage = '';
  }

  // ── Validation helpers ─────────────────────────────────────────
  isInvalid(controlName: string): boolean {
    const c = this.groupForm.get(controlName);
    return !!(c && c.invalid && (c.dirty || c.touched));
  }

  getErrorMessage(controlName: string): string {
    const c = this.groupForm.get(controlName);
    if (!c?.errors || !(c.dirty || c.touched)) return '';

    if (c.errors['required'])   return 'This field is required.';
    if (c.errors['minlength'])  return `At least ${c.errors['minlength'].requiredLength} characters required.`;
    if (c.errors['maxlength'])  return `Maximum ${c.errors['maxlength'].requiredLength} characters allowed.`;

    return 'Invalid value.';
  }

  // ── Submit ─────────────────────────────────────────────────────
  submit(): void {
    this.clearMessages();

    if (this.groupForm.invalid) {
      this.groupForm.markAllAsTouched();
      this.showInlineMessage('error', 'Please fill in all required fields.');
      return;
    }

    this.isLoading = true;
    const formValue = this.groupForm.value;

    const request$ = this.selectedCoverFile
      ? this.groupsService.createGroup(this.buildFormData(formValue) as any)
      : this.groupsService.createGroup(formValue);

    request$.subscribe({
      next: () => {
        this.isLoading = false;
        this.showInlineMessage('success', 'Group created successfully! 🎉');
        this.resetForm();
        setTimeout(() => this.router.navigate(['/groups']), 2000);
      },
      error: (err) => {
        this.isLoading = false;
        this.showInlineMessage('error', err.error?.message || 'Failed to create group. Please try again.');
      },
    });
  }

  private buildFormData(values: Record<string, string>): FormData {
    const fd = new FormData();
    fd.append('name', values['name']);
    fd.append('description', values['description'] || '');
    fd.append('visibility', values['visibility']);
    if (this.selectedCoverFile) fd.append('coverImage', this.selectedCoverFile);
    return fd;
  }

  private resetForm(): void {
    this.groupForm.reset({ visibility: 'PUBLIC' });
    this.removeCover();
    this.currentStep = 0;
  }

  // ── Keyboard navigation ────────────────────────────────────────
  @HostListener('window:keydown', ['$event'])
  onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && event.ctrlKey) {
      if (this.currentStep < this.steps.length - 1) {
        this.nextStep();
      }
    }
  }
}