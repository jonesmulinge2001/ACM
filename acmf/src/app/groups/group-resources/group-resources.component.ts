import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GroupsService } from '../../services/group.service';
import { GroupResource } from '../../interfaces';
import { catchError, of } from 'rxjs';
import * as pdfjsLib from 'pdfjs-dist';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

// Configure PDF.js worker
(
  pdfjsLib as any
).GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${
  (pdfjsLib as any).version
}/pdf.worker.min.js`;

@Component({
  selector: 'app-group-resources',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './group-resources.component.html',
})
export class GroupResourcesComponent implements OnInit {
  @Input() groupId?: string;
  resources: GroupResource[] = [];
  loading = true;

  constructor(
    private groupsService: GroupsService,
    private sanitizer: DomSanitizer
  ) {}

  ngOnInit() {
    if (this.groupId) {
      this.groupsService
        .getGroupResources(this.groupId)
        .pipe(
          catchError((err) => {
            console.error('Failed to load resources', err);
            this.loading = false;
            return of([]);
          })
        )
        .subscribe((data) => {
          this.resources = data.filter((r) => !!r.resourceUrl);
          this.loading = false;
          this.generatePreviews();
        });
    }
  }

  getSafeUrl(url: string): SafeResourceUrl {
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }

  /** Generate PDF previews for all PDF files */
  async generatePreviews() {
    for (const res of this.resources) {
      const ext = this.getFileExtension(res.resourceUrl);
      if (ext === 'pdf') {
        try {
          res.previewImage = await this.generatePdfThumbnail(res.resourceUrl);
        } catch (err) {
          console.error('Failed to generate PDF preview', err);
        }
      }
    }
  }

  /** Create a base64 image preview from the first PDF page */
  async generatePdfThumbnail(url: string): Promise<string> {
    const loadingTask = (pdfjsLib as any).getDocument(url);
    const pdf = await loadingTask.promise;
    const page = await pdf.getPage(1);

    const viewport = page.getViewport({ scale: 1.2 });
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d')!;
    canvas.height = viewport.height;
    canvas.width = viewport.width;

    const renderContext = { canvasContext: context, viewport };
    await page.render(renderContext).promise;

    // Crop to top half for a more "chat-like" preview
    const croppedCanvas = document.createElement('canvas');
    const croppedContext = croppedCanvas.getContext('2d')!;
    croppedCanvas.width = canvas.width;
    croppedCanvas.height = canvas.height / 2;
    croppedContext.drawImage(
      canvas,
      0,
      0,
      canvas.width,
      canvas.height / 2,
      0,
      0,
      canvas.width,
      canvas.height / 2
    );

    return croppedCanvas.toDataURL();
  }

  getFileName(url: string | null | undefined): string {
    if (!url) return '';
    return url.split('/').pop() || 'file';
  }

  getFileExtension(url: string | null | undefined): string {
    if (!url) return '';
    const parts = url.split('.');
    return parts.length > 1 ? parts.pop()!.toLowerCase() : '';
  }

  getFileIcon(fileType?: string): string {
    switch (fileType) {
      case 'pdf':
        return 'picture_as_pdf';
      case 'doc':
      case 'docx':
        return 'description';
      case 'ppt':
      case 'pptx':
        return 'slideshow';
      case 'xls':
      case 'xlsx':
        return 'grid_on';
      case 'zip':
      case 'rar':
        return 'archive';
      default:
        return 'insert_drive_file';
    }
  }

  /** Check if a file is a video */
  isVideo(res: GroupResource): boolean {
    const videoTypes = ['mp4', 'mov', 'webm', 'avi', 'mkv'];
    const ext = this.getFileExtension(res.resourceUrl);
    return videoTypes.includes(ext);
  }
}
