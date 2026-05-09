import { Component, OnInit } from '@angular/core';
import { ResourcesService } from '../../services/resources.service';
import { Resource } from '../../interfaces';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  imports:[CommonModule, FormsModule],
  selector: 'app-resources-list',
  templateUrl: './resources-list.component.html',
})
export class ResourcesListComponent implements OnInit {
  resources: Resource[] = [];
  filteredResources: Resource[] = [];

  loading: boolean = true;
  searchTerm: string = '';

  currentUserId = localStorage.getItem('userId');

  constructor(
    private resourcesService: ResourcesService
  ) {}

  ngOnInit(): void {
    this.loadResources();
  }

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
      }
    });
  }

  search(): void {
    const term = this.searchTerm.toLowerCase().trim();

    if (!term) {
      this.filteredResources = this.resources;
      return;
    }

    this.filteredResources = this.resources.filter(resource =>
      resource.title.toLowerCase().includes(term) ||
      resource.course.toLowerCase().includes(term)
    );
  }

  download(id: string): void {
    this.resourcesService.download(id);
  }

  delete(id: string): void {
    if (!confirm('Delete this resource?')) return;

    this.resourcesService.delete(id).subscribe(() => {
      this.loadResources();
    });
  }

  edit(resource: Resource): void {
    console.log('Edit resource', resource);
  }

  isOwner(resource: Resource): boolean {
    return resource.uploaderId === this.currentUserId;
  }

  getFileType(fileType: string): string {
    if (fileType.includes('pdf')) return 'PDF';
    if (fileType.includes('image')) return 'IMAGE';
    if (fileType.includes('word')) return 'DOC';
    return 'FILE';
  }

  getFileIcon(fileType: string): string {
    if (fileType.includes('pdf')) return 'picture_as_pdf';
    if (fileType.includes('image')) return 'image';
    if (fileType.includes('word')) return 'description';
    return 'insert_drive_file';
  }
}