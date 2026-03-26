import { Component, EventEmitter, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Video } from '../../interfaces';
import { ToastrService } from 'ngx-toastr';
import { HttpEvent, HttpEventType, HttpResponse } from '@angular/common/http';
import { VideoService } from '../../services/unitok-video.service';

@Component({
  selector: 'app-create-video',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './create-video.component.html',
})
export class CreateVideoComponent {
  @Output() videoCreated = new EventEmitter<Video>();
  @Output() cancelled = new EventEmitter<void>();

  videoForm: FormGroup;
  isSubmitting: boolean = false;
  uploadProgress: number = 0;
  uploadStatus: 'idle' | 'uploading' | 'processing' | 'complete' | 'error' = 'idle';
  error: string | null = null;
  videoPreviewUrl: string | null = null;
  selectedTags: string[] = [];
  uploadedFileName: string = '';

  // Available tags
  tags = [
    'HELB', 'Campus Life', 'Unit Registration', 'Hostel Tips',
    'Food Hacks', 'Mental Health', 'Study Tips', 'Club Activities',
    'Scholarships', 'Career Advice', 'Internships', 'Graduation'
  ];

  constructor(
    private fb: FormBuilder, 
    private videoService: VideoService,
    private toastr: ToastrService
  ) {
    this.videoForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(200)]],
      description: ['', [Validators.maxLength(500)]],
      videoFile: [null, [Validators.required]],
      tags: [[]]
    });
  }

  onFileSelected(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;

    // Validate file size (max 100MB)
    if (file.size > 100 * 1024 * 1024) {
      this.toastr.error('File size must be less than 100MB', 'Error');
      return;
    }

    // Validate file type
    const allowedTypes = ['video/mp4', 'video/quicktime', 'video/x-msvideo'];
    if (!allowedTypes.includes(file.type)) {
      this.toastr.error('Only MP4, MOV, and AVI files are allowed', 'Error');
      return;
    }

    this.videoForm.patchValue({ videoFile: file });
    this.videoForm.get('videoFile')?.updateValueAndValidity();
    this.uploadedFileName = file.name;

    // Preview
    const reader = new FileReader();
    reader.onload = () => {
      this.videoPreviewUrl = reader.result as string;
    };
    reader.readAsDataURL(file);
  }

  toggleTag(tag: string) {
    const idx = this.selectedTags.indexOf(tag);
    if (idx > -1) {
      this.selectedTags.splice(idx, 1);
    } else if (this.selectedTags.length < 5) {
      this.selectedTags.push(tag);
    } else {
      this.toastr.warning('Maximum 5 tags allowed', 'Warning');
    }
    this.videoForm.patchValue({ tags: this.selectedTags });
  }

  submit() {
    if (this.videoForm.invalid) {
      this.videoForm.markAllAsTouched();
      
      if (this.videoForm.get('title')?.errors?.['required']) {
        this.toastr.error('Please enter a video title', 'Error');
      } else if (this.videoForm.get('videoFile')?.errors?.['required']) {
        this.toastr.error('Please select a video file', 'Error');
      }
      return;
    }

    this.isSubmitting = true;
    this.uploadProgress = 0;
    this.uploadStatus = 'uploading';
    this.error = null;

    const formData = new FormData();
    formData.append('title', this.videoForm.value.title);
    formData.append('description', this.videoForm.value.description || '');
    formData.append('file', this.videoForm.value.videoFile);
    formData.append('tags', JSON.stringify(this.videoForm.value.tags));

    this.videoService.uploadVideoWithProgress(formData).subscribe({
      next: (event: HttpEvent<Video>) => {
        if (event.type === HttpEventType.UploadProgress) {
          // Calculate and update upload progress
          this.uploadProgress = Math.round(100 * (event.loaded / event.total!));
        } else if (event.type === HttpEventType.Response) {
          // Upload complete - handle the response
          const videoData = event.body;
          
          if (videoData) {
            this.uploadStatus = 'processing';
            this.uploadProgress = 100;
            
            // Simulate processing delay
            setTimeout(() => {
              this.uploadStatus = 'complete';
              this.toastr.success('Video uploaded successfully! 🎉', 'Success');
              this.videoCreated.emit(videoData);
              this.resetForm();
              this.isSubmitting = false;
            }, 1000);
          } else {
            // Handle empty response
            this.uploadStatus = 'error';
            this.error = 'Received empty response from server';
            this.toastr.error('Upload failed: No response from server', 'Error');
            this.isSubmitting = false;
          }
        }
      },
      error: (err: any) => {
        console.error('Error uploading video:', err);
        this.uploadStatus = 'error';
        const errorMessage = err?.error?.message || err?.message || 'Failed to upload video. Please try again.';
        this.toastr.error(errorMessage, 'Error');
        this.error = errorMessage;
        this.isSubmitting = false;
        
        // Reset progress after error
        setTimeout(() => {
          this.uploadProgress = 0;
          this.uploadStatus = 'idle';
        }, 3000);
      }
    });
  }

  resetForm() {
    this.videoForm.reset();
    this.videoPreviewUrl = null;
    this.selectedTags = [];
    this.error = null;
    this.uploadProgress = 0;
    this.uploadStatus = 'idle';
    this.uploadedFileName = '';
  }

  cancel() {
    if (this.isSubmitting) {
      if (confirm('Upload in progress. Are you sure you want to cancel?')) {
        this.resetForm();
        this.cancelled.emit();
      }
    } else {
      this.resetForm();
      this.cancelled.emit();
    }
  }
}