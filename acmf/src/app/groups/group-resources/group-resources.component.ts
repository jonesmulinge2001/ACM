import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { catchError, of } from 'rxjs';
import { GroupsService } from '../../services/group.service';
import { GroupResource } from '../../interfaces';

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

  constructor(private groupsService: GroupsService) {}

  ngOnInit() {
    if (this.groupId) {
      console.log('Fetching resources for group:', this.groupId);
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
          console.log('Group data:', data);
          this.resources = data.filter((r) => !!r.resourceUrl);
          this.loading = false;

          this.resources.forEach((res) => {
            console.log('Detected filename:', this.getFileName(res.resourceUrl));
            console.log('Detected extension:', this.getFileExtension(res.resourceUrl));
          });
        });
    }
  }

  // 🧠 Extract file name from URL
  getFileName(url: string | null | undefined): string {
    if (!url) return 'File';
    try {
      const decoded = decodeURIComponent(url);
      const clean = decoded.split('?')[0];
      const file = clean.split('/').pop();
      return file || 'File';
    } catch {
      return 'File';
    }
  }

  // 🧠 Extract file extension safely
  getFileExtension(url: string | null | undefined): string {
    if (!url) return '';
    try {
      const decoded = decodeURIComponent(url);
      const clean = decoded.split('?')[0];
      const parts = clean.split('.');
      return parts.length > 1 ? parts.pop()!.toLowerCase() : '';
    } catch {
      return '';
    }
  }

  // 🧠 Choose icon based on file type
  getFileIcon(fileType?: string): string {
    if (!fileType) return '📁';
    const ext = fileType.toLowerCase();

    if (['pdf', 'doc', 'docx', 'txt'].includes(ext)) return '📄';
    if (['zip', 'rar', '7z'].includes(ext)) return '📦';
    if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg'].includes(ext)) return '🖼️';
    if (['mp4', 'mov', 'avi', 'mkv'].includes(ext)) return '🎥';
    if (['mp3', 'wav', 'ogg'].includes(ext)) return '🎵';
    return '📁';
  }
}
