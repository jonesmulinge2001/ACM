import { Component, EventEmitter, Input, Output, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { Post } from '../../interfaces';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  selector: 'app-edit-post',
  templateUrl: './edit-post.component.html',
  styleUrls: ['./edit-post.component.css']
})
export class EditPostComponent implements OnInit, OnChanges {
  @Input() post!: Post;
  @Input() showModal: boolean = false;
  @Output() close = new EventEmitter<void>();
  @Output() save = new EventEmitter<FormData>(); 

  editForm!: FormGroup;
  selectedFile: File | null = null;
  selectedFilePreview: string | null = null;
  isSubmitting = false;
  
  // Message states
  successMessage: string = '';
  errorMessage: string = '';
  showSuccessMessage: boolean = false;
  showErrorMessage: boolean = false;

  constructor(private fb: FormBuilder) {}

  ngOnInit(): void {
    this.initForm();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['post'] && this.editForm && this.post) {
      this.patchForm();
      // Reset file preview when post changes
      if (this.post?.fileUrl) {
        this.selectedFilePreview = this.post.fileUrl;
      }
    }
  }

  private initForm(): void {
    this.editForm = this.fb.group({
      title: [this.post?.title || '', [Validators.required, Validators.minLength(3), Validators.maxLength(200)]],
      body: [this.post?.body || '', [Validators.maxLength(5000)]],
      tags: [this.post?.tags ? this.post.tags.join(', ') : '', [Validators.maxLength(500)]],
      type: [this.post?.type || 'GENERAL', Validators.required],
      fileUrl: [this.post?.fileUrl || '']
    });
  }

  private patchForm(): void {
    this.editForm.patchValue({
      title: this.post.title,
      body: this.post.body,
      tags: this.post.tags ? this.post.tags.join(', ') : '',
      type: this.post.type || 'GENERAL',
      fileUrl: this.post.fileUrl || ''
    });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input?.files?.length) {
      const file = input.files[0];
      
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        this.showInlineMessage('error', 'File size must be less than 10MB');
        input.value = '';
        return;
      }
      
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        this.showInlineMessage('error', 'Only JPEG, PNG, GIF, and WEBP images are allowed');
        input.value = '';
        return;
      }
      
      this.selectedFile = file;
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        this.selectedFilePreview = e.target?.result as string;
      };
      reader.readAsDataURL(file);
      
      this.showInlineMessage('info', `${file.name} selected for upload`);
      
      // Auto-hide info message after 3 seconds
      setTimeout(() => {
        this.clearMessages();
      }, 3000);
    }
  }

  removeFile(): void {
    this.selectedFile = null;
    this.selectedFilePreview = this.post?.fileUrl || null;
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  }

  onSave(): void {
    this.clearMessages();
    
    if (this.editForm.invalid) {
      this.editForm.markAllAsTouched();
      
      if (this.editForm.get('title')?.errors?.['required']) {
        this.showInlineMessage('error', 'Title is required');
      } else if (this.editForm.get('title')?.errors?.['minlength']) {
        this.showInlineMessage('error', 'Title must be at least 3 characters');
      } else if (this.editForm.get('title')?.errors?.['maxlength']) {
        this.showInlineMessage('error', 'Title must be less than 200 characters');
      } else {
        this.showInlineMessage('error', 'Please fix the form errors before saving');
      }
      return;
    }
    
    this.isSubmitting = true;
    
    const tagsArray = this.editForm.value.tags
      ? this.editForm.value.tags.split(',').map((t: string) => t.trim()).filter((t: string) => t)
      : [];

    const formData = new FormData();
    formData.append('title', this.editForm.value.title);
    formData.append('body', this.editForm.value.body || '');
    formData.append('type', this.editForm.value.type || 'GENERAL');

    // Append each tag separately
    tagsArray.forEach((tag: string) => {
      if (tag) formData.append('tags', tag);
    });

    if (this.selectedFile) {
      formData.append('file', this.selectedFile);
    }

    this.save.emit(formData);
  }
  
  showInlineMessage(type: 'success' | 'error' | 'info', message: string): void {
    if (type === 'success') {
      this.successMessage = message;
      this.showSuccessMessage = true;
      this.showErrorMessage = false;
      this.errorMessage = '';
    } else if (type === 'error') {
      this.errorMessage = message;
      this.showErrorMessage = true;
      this.showSuccessMessage = false;
      this.successMessage = '';
    } else if (type === 'info') {
      this.errorMessage = message;
      this.showErrorMessage = true;
      this.showSuccessMessage = false;
      this.successMessage = '';
    }
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
      this.clearMessages();
    }, 5000);
  }

  clearMessages(): void {
    this.showSuccessMessage = false;
    this.showErrorMessage = false;
    this.successMessage = '';
    this.errorMessage = '';
  }

  onClose(): void {
    this.clearMessages();
    this.close.emit();
  }
  
  isInvalid(controlName: string): boolean {
    const control = this.editForm.get(controlName);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }
  
  getErrorMessage(controlName: string): string {
    const control = this.editForm.get(controlName);
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
}