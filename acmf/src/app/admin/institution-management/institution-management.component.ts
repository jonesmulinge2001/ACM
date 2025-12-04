import { Component, OnInit } from '@angular/core';
import { Institution, InstitutionStatusFilter, RegisterInstitutionRequest } from '../../interfaces';
import { SuperAdminInstitutionService } from '../../services/super-admin-institution.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  imports: [CommonModule, FormsModule],
  selector: 'app-super-admin-institutions',
  templateUrl: './institution-management.component.html',
  styleUrl: './institution-management.component.css',
})
export class SuperAdminInstitutionsComponent implements OnInit {
  institutions: Institution[] = [];
  filteredInstitutions: Institution[] = [];
  currentTab: InstitutionStatusFilter = 'ALL';
  loading = false;

  showCreateModal = false;
  selectedFile?: File;

  constructor(private institutionService: SuperAdminInstitutionService) {}

  ngOnInit(): void {
    this.fetchInstitutions();
  }

  fetchInstitutions(): void {
    this.loading = true;
    this.institutionService.getAllInstitutions().subscribe({
      next: (data) => {
        this.institutions = data;
        this.applyFilter(this.currentTab);
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }

  applyFilter(tab: InstitutionStatusFilter): void {
    this.currentTab = tab;
    if (tab === 'ALL') {
      this.filteredInstitutions = [...this.institutions];
    } else {
      this.filteredInstitutions = this.institutions.filter(i => i.status === tab);
    }
  }

  approveInstitution(institutionId: string) {
    // Replace with super admin user ID from session/localStorage
    const reviewedById = localStorage.getItem('userId')!;
    this.institutionService.updateInstitutionStatus(institutionId, 'APPROVED', reviewedById).subscribe(() => {
      this.fetchInstitutions();
    });
  }

  rejectInstitution(institutionId: string) {
    const reviewedById = localStorage.getItem('userId')!;
    this.institutionService.updateInstitutionStatus(institutionId, 'REJECTED', reviewedById).subscribe(() => {
      this.fetchInstitutions();
    });
  }

  createData: RegisterInstitutionRequest = {
    name: '',
    description: '',
    officialEmail: '',
    officialDomain: '',
    websiteUrl: '',
  };
  
  openCreateModal() {
    this.showCreateModal = true;
  }
  
  closeCreateModal() {
    this.showCreateModal = false;
    this.createData = {
      name: '',
      description: '',
      officialEmail: '',
      officialDomain: '',
      websiteUrl: '',
    };
    this.selectedFile = undefined;
  }
  
  handleFileUpload(event: any) {
    this.selectedFile = event.target.files[0];
  }
  
  submitCreateInstitution() {
    this.institutionService.registerInstitution(this.createData, this.selectedFile)
      .subscribe({
        next: (res) => {
          this.filteredInstitutions.unshift(res);
          this.closeCreateModal();
        },
        error: (err) => {
          console.error(err);
        }
      });
  }

}
