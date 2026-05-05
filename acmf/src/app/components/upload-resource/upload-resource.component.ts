import { Component } from '@angular/core';
import { MaterialType, CreateAcademicResource } from '../../interfaces';
import { AcademicResourcesService } from '../../services/academic-resources.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule],
  selector: 'app-upload-resource',
  templateUrl: './upload-resource.component.html',
})
export class UploadResourceComponent {
  title = '';
  type: MaterialType = MaterialType.NOTES;
  file: File | null = null;
  fileUrl = '';

  MaterialType = MaterialType; // for template

  loading = false;
  message = '';

  constructor(private resourceService: AcademicResourcesService) {}

  onFileSelected(event: any) {
    this.file = event.target.files[0];
  }

  submit() {
    if (!this.title || !this.type) return;

    const payload: CreateAcademicResource = {
      title: this.title,
      type: this.type,
      fileUrl: this.fileUrl || undefined,
    };

    this.loading = true;

    if (this.file) {
      this.resourceService.uploadFile(payload, this.file).subscribe({
        next: (res) => {
          this.message = res.message;
          this.reset();
        },
        error: (err) => {
          this.message = err.error?.message || 'Upload failed';
        },
        complete: () => (this.loading = false),
      });
    } else {
      this.resourceService.uploadViaUrl(payload).subscribe({
        next: (res) => {
          this.message = res.message;
          this.reset();
        },
        error: (err) => {
          this.message = err.error?.message || 'Upload failed';
        },
        complete: () => (this.loading = false),
      });
    }
  }

  reset() {
    this.title = '';
    this.file = null;
    this.fileUrl = '';
  }
}