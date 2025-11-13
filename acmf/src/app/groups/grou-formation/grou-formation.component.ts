import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { GroupsService } from '../../services/group.service';
import { CommonModule } from '@angular/common';

@Component({
  imports: [CommonModule, ReactiveFormsModule],
  selector: 'app-create-group',
  templateUrl: './create-group.html',
  styleUrls: ['./create-group.css']
})
export class CreateGroupComponent {
  groupForm: FormGroup;
  isLoading = false;
  successMessage = '';
  errorMessage = '';
  coverPreview: string | ArrayBuffer | null = null;
  selectedCoverFile: File | null = null;

  constructor(private fb: FormBuilder, private groupsService: GroupsService) {
    this.groupForm = this.fb.group({
      name: ['', Validators.required],
      description: [''],
      visibility: ['PUBLIC', Validators.required]
    });
  }

  onCoverSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;

    this.selectedCoverFile = input.files[0];

    const reader = new FileReader();
    reader.onload = () => (this.coverPreview = reader.result);
    reader.readAsDataURL(this.selectedCoverFile);
  }
  submit() {
    if (this.groupForm.invalid) return;
  
    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';
  
    const formValue = this.groupForm.value;
  
    if (this.selectedCoverFile) {
      const formData = new FormData();
      formData.append('name', formValue.name);
      formData.append('description', formValue.description || '');
      formData.append('visibility', formValue.visibility);
      formData.append('coverImage', this.selectedCoverFile);
  
      // Use createGroup() instead of updateGroup()
      this.groupsService.createGroup(formData as any).subscribe({ 
        next: (res) => {
          this.isLoading = false;
          this.successMessage = 'Group created successfully!';
          this.groupForm.reset({ visibility: 'PUBLIC' });
          this.coverPreview = null;
          this.selectedCoverFile = null;
        },
        error: (err) => {
          this.isLoading = false;
          this.errorMessage = err.error?.message || 'Failed to create group';
        }
      });
    } else {
      // Send JSON if no file
      this.groupsService.createGroup(formValue).subscribe({
        next: (res) => {
          this.isLoading = false;
          this.successMessage = 'Group created successfully!';
          this.groupForm.reset({ visibility: 'PUBLIC' });
        },
        error: (err) => {
          this.isLoading = false;
          this.errorMessage = err.error?.message || 'Failed to create group';
        }
      });
    }
  }
  
}
