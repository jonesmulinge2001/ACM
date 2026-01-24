import { Component, EventEmitter, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { VideoService } from '../../services/unitok-video.service';
import { Video } from '../../interfaces';

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
  isSubmitting = false;
  error: string | null = null;
  videoPreviewUrl: string | null = null;
  selectedTags: string[] = [];

  // Available tags
  tags = [
    'HELB', 'Campus Life', 'Unit Registration', 'Hostel Tips',
    'Food Hacks', 'Mental Health', 'Study Tips', 'Club Activities'
  ];

  constructor(private fb: FormBuilder, private videoService: VideoService) {
    this.videoForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(3)]],
      description: ['', [Validators.maxLength(500)]],
      videoFile: [null, [Validators.required]],
      tags: [[]]
    });
  }

  onFileSelected(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;

    this.videoForm.patchValue({ videoFile: file });
    this.videoForm.get('videoFile')?.updateValueAndValidity();

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
    }
    this.videoForm.patchValue({ tags: this.selectedTags });
  }

  submit() {
    if (this.videoForm.invalid) {
      this.videoForm.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    this.error = null;

    const formData = new FormData();
    formData.append('title', this.videoForm.value.title);
    formData.append('description', this.videoForm.value.description || '');
    formData.append('file', this.videoForm.value.videoFile); 
    formData.append('tags', JSON.stringify(this.videoForm.value.tags));
    

    this.videoService.uploadVideo(formData).subscribe({
      next: (video) => {
        this.videoCreated.emit(video);
        this.videoForm.reset();
        this.videoPreviewUrl = null;
        this.selectedTags = [];
        this.isSubmitting = false;
      },
      error: () => {
        this.error = 'Failed to upload video.';
        this.isSubmitting = false;
      }
    });
    
  }

  cancel() {
    this.cancelled.emit();
  }
}
