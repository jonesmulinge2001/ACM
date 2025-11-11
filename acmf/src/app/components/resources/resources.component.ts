import { Component, OnInit } from '@angular/core';
import { AcademicResource } from '../../interfaces';
import { AcademicResourceService } from '../../services/academic-resource.service';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ResourceUploadModalComponent } from "../resource-upload-modal/resource-upload-modal.component";

@Component({
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule, ResourceUploadModalComponent],
  selector: 'app-resources',
  templateUrl: './resources.component.html',
})
export class ResourcesComponent implements OnInit {
  resources: AcademicResource[] = [];
  searchTerm = '';
  selectedCourse = '';
  selectedInstitution = '';
  selectedYear = '';
  years = ['Year 1', 'Year 2', 'Year 3', 'Year 4'];

  loading = false;

  showUploadModal = false; 
  constructor(private resourceService: AcademicResourceService) {}

  ngOnInit(): void {
    this.fetchResources();
  }

  fetchResources(): void {
    this.loading = true; // Start loading
    setTimeout(() => { // Artificial 2s delay
      this.resourceService
        .searchResources(this.searchTerm, this.selectedCourse, this.selectedInstitution, this.selectedYear)
        .subscribe((data) => {
          this.resources = data;
          this.loading = false; // Done loading
        });
    }, 2000);
  }

  onDownload(resource: AcademicResource): void {
    this.resourceService.downloadResourceFile(resource);
  }
  

  onFilterChange(): void {
    this.fetchResources();
  }

  openUploadModal(): void {
    this.showUploadModal = true;
  }

  closeUploadModal(): void {
    this.showUploadModal = false;
  }
}
