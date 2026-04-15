import { Component, OnInit, ElementRef, ViewChild, HostListener } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { PostService } from '../../services/post.service';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { Profile } from '../../interfaces';
import { Router } from '@angular/router';

@Component({
  selector: 'app-post',
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './post.component.html',
  styleUrls: ['./post.component.css']
})
export class PostComponent implements OnInit {
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;
  
  postForm!: FormGroup;
  selectedFile?: File;
  selectedFilePreview?: string;
  selectedFileType?: 'image' | 'video' | 'pdf' | 'document';
  tags: string[] = [];
  showModal: boolean = true;
  isSubmitting = false;
  profile: Profile | null = null;
  
  // Message states
  successMessage: string = '';
  errorMessage: string = '';
  showSuccessMessage: boolean = false;
  showErrorMessage: boolean = false;
  
  // Category options
  categories = [
    { value: 'General', label: 'General', icon: 'forum' },
    { value: 'Academic', label: 'Academic', icon: 'school' },
    { value: 'Opportunity', label: 'Opportunity', icon: 'rocket_launch' },
    { value: 'Resource', label: 'Resource', icon: 'attach_file' }
  ];

  constructor(
    private fb: FormBuilder,
    private postService: PostService,
    private authService: AuthService,
    private router: Router,
    private eRef: ElementRef
  ) {
    this.postForm = this.fb.group({
      category: ['General', Validators.required],
      title: ['', [Validators.minLength(3), Validators.maxLength(200)]],
      content: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(5000)]],
      tagInput: ['', [Validators.minLength(2), Validators.maxLength(30)]]
    });
  }

  ngOnInit(): void {
    this.authService.currentUser$.subscribe((user) => {
      if (user) {
        this.profile = user;
      }
    });
    
    // Auto-focus on content when modal opens
    setTimeout(() => {
      const textarea = document.querySelector('textarea');
      if (textarea) {
        textarea.focus();
      }
    }, 100);
  }

  @HostListener('document:click', ['$event'])
  handleClickOutside(event: Event) {
    const target = event.target as HTMLElement;
    if (this.showModal && target.classList.contains('modal-backdrop')) {
      this.closeModal();
    }
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files?.length) {
      this.selectedFile = input.files[0];
      
      // Determine file type
      if (this.selectedFile.type.startsWith('image/')) {
        this.selectedFileType = 'image';
        // Create preview for images
        const reader = new FileReader();
        reader.onload = (e) => {
          this.selectedFilePreview = e.target?.result as string;
        };
        reader.readAsDataURL(this.selectedFile);
      } else if (this.selectedFile.type.startsWith('video/')) {
        this.selectedFileType = 'video';
        this.selectedFilePreview = undefined;
        // Create video preview
        const videoUrl = URL.createObjectURL(this.selectedFile);
        this.selectedFilePreview = videoUrl;
      } else if (this.selectedFile.type === 'application/pdf') {
        this.selectedFileType = 'pdf';
        this.selectedFilePreview = undefined;
      } else {
        this.selectedFileType = 'document';
        this.selectedFilePreview = undefined;
      }
      
      this.showInlineMessage('info', `${this.selectedFile.name} selected (${this.getFileTypeLabel()})`);
      
      // Auto-hide info message after 3 seconds
      setTimeout(() => {
        this.clearMessages();
      }, 3000);
    }
  }

  getFileTypeLabel(): string {
    switch(this.selectedFileType) {
      case 'image': return 'Image';
      case 'video': return 'Video';
      case 'pdf': return 'PDF Document';
      default: return 'File';
    }
  }

  triggerFileUpload() {
    this.fileInput.nativeElement.click();
  }

  removeFile() {
    if (this.selectedFilePreview && this.selectedFileType === 'video') {
      URL.revokeObjectURL(this.selectedFilePreview);
    }
    this.selectedFile = undefined;
    this.selectedFilePreview = undefined;
    this.selectedFileType = undefined;
    if (this.fileInput) {
      this.fileInput.nativeElement.value = '';
    }
  }

  addTag() {
    const tag = this.postForm.get('tagInput')?.value?.trim();
    
    if (!tag) {
      return;
    }
    
    if (tag.length < 2) {
      this.showInlineMessage('error', 'Tag must be at least 2 characters');
      return;
    }
    
    if (tag.length > 30) {
      this.showInlineMessage('error', 'Tag must be less than 30 characters');
      return;
    }
    
    if (this.tags.includes(tag)) {
      this.showInlineMessage('error', 'Tag already exists');
      return;
    }
    
    if (this.tags.length >= 10) {
      this.showInlineMessage('error', 'Maximum 10 tags allowed');
      return;
    }
    
    this.tags.push(tag);
    this.postForm.get('tagInput')?.reset();
    this.postForm.get('tagInput')?.markAsUntouched();
    
    // Clear any previous error messages
    this.clearMessages();
  }

  removeTag(index: number) {
    this.tags.splice(index, 1);
  }

  submitPost() {
    // Clear previous messages
    this.clearMessages();
    
    if (this.postForm.invalid) {
      this.postForm.markAllAsTouched();
      
      // Show specific error messages
      if (this.postForm.get('content')?.errors?.['required']) {
        this.showInlineMessage('error', 'Please write something before posting');
      } else if (this.postForm.get('content')?.errors?.['minlength']) {
        this.showInlineMessage('error', 'Content must be at least 2 characters');
      } else if (this.postForm.get('title')?.errors?.['minlength']) {
        this.showInlineMessage('error', 'Title must be at least 3 characters');
      } else {
        this.showInlineMessage('error', 'Please fill out all required fields correctly');
      }
      return;
    }

    // Check if content is empty after trim
    const content = this.postForm.get('content')?.value?.trim();
    if (!content) {
      this.showInlineMessage('error', 'Please write something before posting');
      return;
    }

    this.isSubmitting = true;
    const formData = new FormData();
    
    // Add form fields
    formData.append('title', this.postForm.get('title')?.value || '');
    formData.append('body', content);
    formData.append('type', this.postForm.get('category')?.value);
    
    // Add tags
    this.tags.forEach((tag, index) => {
      formData.append(`tags[${index}]`, tag);
    });
    
    // Add file if selected
    if (this.selectedFile) {
      formData.append('file', this.selectedFile);
    }

    this.postService.createPostWithFile(formData).subscribe({
      next: (response) => {
        this.showInlineMessage('success', 'Post created successfully! 🎉');
        this.isSubmitting = false;
        
        // Close modal after showing success message
        setTimeout(() => {
          this.closeModal();
          this.resetForm();
        }, 1500);
      },
      error: (error) => {
        console.error('Error creating post:', error);
        let errorMessage = 'Failed to create post';
        
        if (error?.error?.message) {
          errorMessage = error.error.message;
        } else if (error?.message) {
          errorMessage = error.message;
        }
        
        this.showInlineMessage('error', errorMessage);
        this.isSubmitting = false;
      }
    });
  }

  showInlineMessage(type: 'success' | 'error' | 'info', message: string) {
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
      // For info messages, we'll use a temporary state
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

  clearMessages() {
    this.showSuccessMessage = false;
    this.showErrorMessage = false;
    this.successMessage = '';
    this.errorMessage = '';
  }

  resetForm() {
    this.postForm.reset({
      category: 'General',
      title: '',
      content: '',
      tagInput: ''
    });
    this.tags = [];
    this.selectedFile = undefined;
    this.selectedFilePreview = undefined;
    this.selectedFileType = undefined;
    this.isSubmitting = false;
    this.clearMessages();
    
    if (this.fileInput) {
      this.fileInput.nativeElement.value = '';
    }
  }

  isInvalid(controlName: string): boolean {
    const control = this.postForm.get(controlName);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  getErrorMessage(controlName: string): string {
    const control = this.postForm.get(controlName);
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

  closeModal(): void {
    this.showModal = false;
    this.resetForm();
    this.router.navigate(['/']);
  }
  
  // Helper method to check if content is empty
  hasContent(): boolean {
    const content = this.postForm.get('content')?.value?.trim();
    return !!(content || this.selectedFile || this.tags.length > 0);
  }
}