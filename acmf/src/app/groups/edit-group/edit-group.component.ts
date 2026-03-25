import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup } from '@angular/forms';
import { GroupsService } from '../../services/group.service';
import { Group } from '../../interfaces';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-edit-group',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './edit-group.component.html',
  styleUrls: ['./edit-group.component.css']
})
export class EditGroupComponent implements OnChanges {
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;
  @Input({ required: true }) group!: Group | null;
  @Output() updated = new EventEmitter<Group>();
  @Output() cancel = new EventEmitter<void>();

  form: FormGroup;
  previewUrl: string | ArrayBuffer | null = null;
  selectedFile: File | null = null;
  isLoading = false;
  showSuccessBanner = false;
  showErrorBanner = false;
  successMessage = '';
  errorMessage = '';

  constructor(
    private fb: FormBuilder, 
    private groups: GroupsService,
    private toastr: ToastrService
  ) {
    this.form = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
      description: ['', [Validators.maxLength(500)]],
      visibility: ['PUBLIC', Validators.required],
      coverImage: [null]
    });
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['group'] && this.group) {
      this.form.patchValue({
        name: this.group.name,
        description: this.group.description ?? '',
        visibility: this.group.visibility,
      });
      this.previewUrl = null;
      this.selectedFile = null;
      this.clearMessages();
    }
  }

  triggerFileInput() {
    if (this.fileInput) {
      this.fileInput.nativeElement.click();
    }
  }

  onFileSelected(event: Event) {
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
      this.showInlineMessage('error', 'Only JPEG, PNG, GIF, and WEBP images are allowed');
      return;
    }

    this.selectedFile = file;

    // For preview
    const reader = new FileReader();
    reader.onload = () => (this.previewUrl = reader.result);
    reader.readAsDataURL(this.selectedFile);
  }

  removeImage() {
    this.previewUrl = null;
    this.selectedFile = null;
    if (this.fileInput) {
      this.fileInput.nativeElement.value = '';
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
    const control = this.form.get(controlName);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  getErrorMessage(controlName: string): string {
    const control = this.form.get(controlName);
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

  onSubmit() {
    this.clearMessages();
    
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      
      if (this.form.get('name')?.errors?.['required']) {
        this.showInlineMessage('error', 'Please enter a group name');
      } else if (this.form.get('name')?.errors?.['minlength']) {
        this.showInlineMessage('error', 'Group name must be at least 3 characters');
      }
      return;
    }

    if (!this.group) return;

    this.isLoading = true;
    const formData = new FormData();
    formData.append('name', this.form.value.name);
    formData.append('description', this.form.value.description || '');
    formData.append('visibility', this.form.value.visibility);

    if (this.selectedFile) {
      formData.append('coverImage', this.selectedFile);
    }

    this.groups.updateGroup(this.group.id, formData).subscribe({
      next: () => {
        this.groups.getGroupById(this.group!.id).subscribe(fullGroup => {
          this.isLoading = false;
          this.showInlineMessage('success', 'Group updated successfully!');
          
          setTimeout(() => {
            this.updated.emit(fullGroup);
          }, 1500);
        });
      },
      error: (err) => {
        this.isLoading = false;
        const errorMessage = err.error?.message || 'Failed to update group';
        this.showInlineMessage('error', errorMessage);
      }
    });
  }
}