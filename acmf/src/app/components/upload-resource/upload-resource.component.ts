import { Component, HostListener } from '@angular/core';
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
  title   = '';
  type: MaterialType = MaterialType.NOTES;
  file: File | null  = null;
  fileUrl = '';

  MaterialType = MaterialType; // expose enum to template

  loading          = false;
  message          = '';
  typeDropdownOpen = false;

  constructor(private resourceService: AcademicResourcesService) {}

  // Close dropdown when clicking outside
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest('[data-dropdown="type"]')) {
      this.typeDropdownOpen = false;
    }
  }

  // ── File selection via input ──────────────────────────────────
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;
    this.setFile(input.files[0]);
  }

  // ── Drag and drop ─────────────────────────────────────────────
  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    const dropped = event.dataTransfer?.files?.[0];
    if (dropped) this.setFile(dropped);
  }

  private setFile(f: File): void {
    const maxMb = 20;
    if (f.size > maxMb * 1024 * 1024) {
      this.message = `File too large. Maximum size is ${maxMb} MB.`;
      return;
    }
    this.file    = f;
    this.message = '';
  }

  // ── Submit ────────────────────────────────────────────────────
  submit(): void {
    if (!this.title || !this.type) return;

    const payload: CreateAcademicResource = {
      title:   this.title,
      type:    this.type,
      fileUrl: this.fileUrl || undefined,
    };

    this.loading = true;
    this.message = '';

    const request$ = this.file
      ? this.resourceService.uploadFile(payload, this.file)
      : this.resourceService.uploadViaUrl(payload);

    request$.subscribe({
      next: (res) => {
        this.message = res.message;
        this.reset();
      },
      error: (err) => {
        this.message = err.error?.message || 'Upload failed. Please try again.';
        this.loading = false;
      },
      complete: () => (this.loading = false),
    });
  }

  private reset(): void {
    this.title   = '';
    this.file    = null;
    this.fileUrl = '';
    this.type    = MaterialType.NOTES;
  }
}