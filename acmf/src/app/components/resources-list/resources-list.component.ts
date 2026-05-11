import { Component, OnInit, HostListener } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ResourcesService } from '../../services/resources.service';
import { Resource } from '../../interfaces';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  imports: [CommonModule, FormsModule],
  selector: 'app-resources-list',
  templateUrl: './resources-list.component.html',
})
export class ResourcesListComponent implements OnInit {
  resources: Resource[] = [];
  filteredResources: Resource[] = [];

  loading = true;
  searchTerm = '';

  currentUserId = localStorage.getItem('userId');

  // ── Preview state ──────────────────────────────────────────
  previewResource: Resource | null = null;
  previewUrl: SafeResourceUrl | null = null;
  previewLoading = false;
  previewError = false;

  constructor(
    private resourcesService: ResourcesService,
    private sanitizer: DomSanitizer
  ) {}

  ngOnInit(): void {
    this.loadResources();
  }

  // ── Escape key closes modal ────────────────────────────────
  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.previewResource) this.closePreview();
  }

  // ── Data ──────────────────────────────────────────────────
  loadResources(): void {
    this.resourcesService.getAll().subscribe({
      next: (data) => {
        this.resources = data;
        this.filteredResources = data;
        this.loading = false;
      },
      error: (err) => {
        console.error(err);
        this.loading = false;
      },
    });
  }

  search(): void {
    const term = this.searchTerm.toLowerCase().trim();
    this.filteredResources = term
      ? this.resources.filter(
          (r) =>
            r.title.toLowerCase().includes(term) ||
            r.course.toLowerCase().includes(term)
        )
      : this.resources;
  }

  // ── Preview ───────────────────────────────────────────────
  openPreview(resource: Resource): void {
    this.previewResource = resource;
    this.previewLoading = true;
    this.previewError = false;
    this.previewUrl = null;

    // Unsupported types skip loading — show the fallback immediately
    if (this.isUnsupportedPreview(resource.fileType)) {
      this.previewLoading = false;
      return;
    }

    // Build the URL. The resource service should expose a method that
    // returns the raw file URL (signed URL, CDN link, etc.).
    // Adjust `getPreviewUrl` to match your actual API.
    this.resourcesService.getPreviewUrl(resource.id).subscribe({
      next: (url: string) => {
        if (resource.fileType.includes('pdf')) {
          // Embed the PDF directly
          this.previewUrl = this.sanitizer.bypassSecurityTrustResourceUrl(url);
        } else if (
          resource.fileType.includes('word') ||
          resource.fileType.includes('officedocument') ||
          resource.fileType.includes('msword')
        ) {
          // Route Word docs through Google Docs Viewer
          const viewerUrl = `https://docs.google.com/gviewer?embedded=true&url=${encodeURIComponent(url)}`;
          this.previewUrl = this.sanitizer.bypassSecurityTrustResourceUrl(viewerUrl);
        } else {
          // Images and anything else — direct URL
          this.previewUrl = this.sanitizer.bypassSecurityTrustResourceUrl(url);
        }
      },
      error: () => {
        this.previewLoading = false;
        this.previewError = true;
      },
    });
  }

  closePreview(): void {
    this.previewResource = null;
    this.previewUrl = null;
    this.previewLoading = false;
    this.previewError = false;
  }

  /** Returns true for types the browser cannot render inline */
  isUnsupportedPreview(fileType: string): boolean {
    return (
      !fileType.includes('pdf') &&
      !fileType.includes('image') &&
      !fileType.includes('word') &&
      !fileType.includes('officedocument') &&
      !fileType.includes('msword')
    );
  }

  // ── Actions ───────────────────────────────────────────────
  download(id: string): void {
    this.resourcesService.download(id);
  }

  delete(id: string): void {
    if (!confirm('Delete this resource?')) return;
    this.resourcesService.delete(id).subscribe(() => this.loadResources());
  }

  edit(resource: Resource): void {
    console.log('Edit resource', resource);
  }

  // ── Helpers ───────────────────────────────────────────────
  isOwner(resource: Resource): boolean {
    return resource.uploaderId === this.currentUserId;
  }

  getFileType(fileType: string): string {
    if (fileType.includes('pdf')) return 'PDF';
    if (fileType.includes('image')) return 'IMAGE';
    if (fileType.includes('word') || fileType.includes('officedocument')) return 'DOC';
    return 'FILE';
  }

  getFileIcon(fileType: string): string {
    if (fileType.includes('pdf')) return 'picture_as_pdf';
    if (fileType.includes('image')) return 'image';
    if (fileType.includes('word') || fileType.includes('officedocument')) return 'description';
    return 'insert_drive_file';
  }
}