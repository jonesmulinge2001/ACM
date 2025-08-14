import { Component, EventEmitter, Output } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AcademicResourceService } from '../../services/academic-resource.service';

@Component({
  selector: 'app-resource-upload-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './resource-upload-modal.component.html',
})
export class ResourceUploadModalComponent {
  @Output() closeModal = new EventEmitter<void>();
  form: FormGroup;
  isSubmitting = false;
  selectedFile?: File;

  constructor(
    private fb: FormBuilder,
    private resourceService: AcademicResourceService
  ) {
    this.form = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(3)]],
      description: ['', [Validators.required]],
      course: ['', [Validators.required]],
      unitName: ['', [Validators.required]],
      semester: ['', [Validators.required]],
      year: ['', [Validators.required]],
      institution: ['', [Validators.required]],
    });
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input?.files?.length) {
      this.selectedFile = input.files[0];
    }
  }

  removeSelectedFile() {
    this.selectedFile = undefined;
  }

  submit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;

    const formData = new FormData();
    Object.entries(this.form.value).forEach(([key, value]) => {
      formData.append(key, value as string);
    });

    if (this.selectedFile) {
      formData.append('file', this.selectedFile);
    }

    this.resourceService.uploadResource(formData).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.closeModal.emit();
      },
      error: (err) => {
        this.isSubmitting = false;
        console.error('Upload failed:', err);
      },
    });
  }

  getControl(name: string) {
    return this.form.get(name);
  }
}
