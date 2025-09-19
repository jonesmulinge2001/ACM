import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ProfileService } from '../../../services/profile.service';
import { ToastrService } from 'ngx-toastr';
import { Router, RouterLink, RouterModule } from '@angular/router';
import { response } from 'express';
import { CommonModule } from '@angular/common';
import { InstitutionService } from '../../../services/institution.service';

@Component({
  selector: 'app-create-profile',
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule],
  templateUrl: './create-profile.component.html',
  styleUrl: './create-profile.component.css'
})
export class CreateProfileComponent implements OnInit{
  profileForm!: FormGroup;
  profilePreview: string | null = null;
  coverPreview: string | null = null;

  selectedProfileImage!: File;
  selcetedCoverImage!: File;

  institutions: { id: string; name: string }[] = []; // holds dropdown values

  constructor(
    private fb: FormBuilder,
    private profileService: ProfileService,
    private toastr: ToastrService,
    private router: Router,
    private institutionService: InstitutionService,
  ){}

  ngOnInit(): void {
    this.profileForm = this.fb.group({
      name:['', [Validators.required, Validators.minLength(2)]],
      institutionId: ['', Validators.required],
      academicLevel: ['', Validators.required],
      skills: ['', Validators.required],
      bio: ['', Validators.required],
      interests: ['', Validators.required]
    });

        // fetch institutions for dropdown
        this.institutionService.getInstitutions().subscribe({
          next: (data) => (this.institutions = data),
          error: (err) => console.error('Failed to load institutions', err),
        });
  }

  onProfileImageSelected(event: Event): void {
    const file = (event.target as HTMLInputElement)?.files?.[0];
    if(file) {
      this.profilePreview = URL.createObjectURL(file);
      this.selectedProfileImage = file;
    }
  }

  onCoverPhotoSelected(event: Event): void {
    const file = (event.target as HTMLInputElement)?.files?.[0];
    if(file) {
      this.coverPreview = URL.createObjectURL(file);
      this.selcetedCoverImage = file;
    }
  }

  onSubmit(): void {
    if(this.profileForm.invalid){
      return;
    }

    const formData = this.profileForm.value;
    const payload = {
      ...formData,
      skills: formData.skills.split(',').map((skill: string) => skill.trim()),
      interests: formData.interests.split(',').map((interest: string) => interest.trim()),
    };

    this.profileService.createProfile(payload).subscribe({
      next: (response) => {
        this.toastr.success('Profile Created successfully');
        if(this.selectedProfileImage) {
          this.profileService.uploadProfileImage(this.selectedProfileImage).subscribe({
            next: (response) => {
              this.toastr.success('Profile Image uploaded successfully');
              this.router.navigate(['/home']);
            },
            error: (err) => {
              console.error(err);
              this.toastr.error('Image upload failed');
            },
          });
        }
        else {
          this.router.navigate(['/home']);
        }
      },
      error: (err) => {
        console.error(err);
        this.toastr.error(err.error?.message || 'Failde to create profile');
      }
    });
  }

}
