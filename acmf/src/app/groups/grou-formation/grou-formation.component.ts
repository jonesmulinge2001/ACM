import { Component, ViewChild, ElementRef } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { GroupsService } from '../../services/group.service';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';

@Component({
  imports: [CommonModule, ReactiveFormsModule],
  selector: 'app-create-group',
  templateUrl: './create-group.html',
  styleUrls: ['./create-group.css'],
})
export class CreateGroupComponent {
  @ViewChild('coverInput') coverInput!: ElementRef<HTMLInputElement>;

  groupForm: FormGroup;
  isLoading = false;
  successMessage = '';
  errorMessage = '';
  showSuccessBanner = false;
  showErrorBanner = false;
  coverPreview: string | ArrayBuffer | null = null;
  selectedCoverFile: File | null = null;

  constructor(
    private fb: FormBuilder,
    private groupsService: GroupsService,
    public router: Router,
    private toastr: ToastrService
  ) {
    this.groupForm = this.fb.group({
      name: [
        '',
        [
          Validators.required,
          Validators.minLength(3),
          Validators.maxLength(100),
        ],
      ],
      description: ['', [Validators.maxLength(500)]],
      visibility: ['PUBLIC', Validators.required],
    });
  }

  onCoverSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;

    const file = input.files[0];

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      this.showInlineMessage('error', 'Cover image must be less than 5MB');
      return;
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      this.showInlineMessage(
        'error',
        'Only JPEG, PNG, GIF, and WEBP images are allowed'
      );
      return;
    }

    this.selectedCoverFile = file;

    const reader = new FileReader();
    reader.onload = () => (this.coverPreview = reader.result);
    reader.readAsDataURL(this.selectedCoverFile);
  }

  triggerFileInput() {
    if (this.coverInput) {
      this.coverInput.nativeElement.click();
    }
  }

  removeCover() {
    this.coverPreview = null;
    this.selectedCoverFile = null;
    if (this.coverInput) {
      this.coverInput.nativeElement.value = '';
    }
  }

  showInlineMessage(type: 'success' | 'error', message: string) {
    if (type === 'success') {
      this.successMessage = message;
      this.showSuccessBanner = true;
      this.showErrorBanner = false;
      this.errorMessage = '';
    } else if (type === 'error') {
      this.errorMessage = message;
      this.showErrorBanner = true;
      this.showSuccessBanner = false;
      this.successMessage = '';
    }

    setTimeout(() => {
      this.clearMessages();
    }, 5000);
  }

  clearMessages() {
    this.showSuccessBanner = false;
    this.showErrorBanner = false;
    this.successMessage = '';
    this.errorMessage = '';
  }

  isInvalid(controlName: string): boolean {
    const control = this.groupForm.get(controlName);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  getErrorMessage(controlName: string): string {
    const control = this.groupForm.get(controlName);
    if (!control || !control.errors || !(control.dirty || control.touched)) {
      return '';
    }

    if (control.errors['required']) {
      return 'This field is required';
    }
    if (control.errors['minlength']) {
      const requiredLength = control.errors['minlength'].requiredLength;
      return `Minimum ${requiredLength} characters required`;
    }
    if (control.errors['maxlength']) {
      const requiredLength = control.errors['maxlength'].requiredLength;
      return `Maximum ${requiredLength} characters allowed`;
    }

    return 'Invalid input';
  }

  submit() {
    this.clearMessages();

    if (this.groupForm.invalid) {
      this.groupForm.markAllAsTouched();

      if (this.groupForm.get('name')?.errors?.['required']) {
        this.showInlineMessage('error', 'Please enter a group name');
      } else if (this.groupForm.get('name')?.errors?.['minlength']) {
        this.showInlineMessage(
          'error',
          'Group name must be at least 3 characters'
        );
      }
      return;
    }

    this.isLoading = true;
    const formValue = this.groupForm.value;

    if (this.selectedCoverFile) {
      const formData = new FormData();
      formData.append('name', formValue.name);
      formData.append('description', formValue.description || '');
      formData.append('visibility', formValue.visibility);
      formData.append('coverImage', this.selectedCoverFile);

      this.groupsService.createGroup(formData as any).subscribe({
        next: (res) => {
          this.isLoading = false;
          this.showInlineMessage('success', 'Group created successfully! 🎉');
          this.resetForm();

          setTimeout(() => {
            this.router.navigate(['/groups']);
          }, 2000);
        },
        error: (err) => {
          this.isLoading = false;
          const errorMessage = err.error?.message || 'Failed to create group';
          this.showInlineMessage('error', errorMessage);
        },
      });
    } else {
      this.groupsService.createGroup(formValue).subscribe({
        next: (res) => {
          this.isLoading = false;
          this.showInlineMessage('success', 'Group created successfully! 🎉');
          this.resetForm();

          setTimeout(() => {
            this.router.navigate(['/groups']);
          }, 2000);
        },
        error: (err) => {
          this.isLoading = false;
          const errorMessage = err.error?.message || 'Failed to create group';
          this.showInlineMessage('error', errorMessage);
        },
      });
    }
  }

  resetForm() {
    this.groupForm.reset({ visibility: 'PUBLIC' });
    this.coverPreview = null;
    this.selectedCoverFile = null;
    if (this.coverInput) {
      this.coverInput.nativeElement.value = '';
    }
  }
}
