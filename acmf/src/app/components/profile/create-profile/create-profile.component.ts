import { Component, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ProfileService } from '../../../services/profile.service';
import { ToastrService } from 'ngx-toastr';
import { Router, RouterLink, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { InstitutionService } from '../../../services/institution.service';

@Component({
  selector: 'app-create-profile',
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule],
  templateUrl: './create-profile.component.html',
  styleUrls: ['./create-profile.component.css'],
})
export class CreateProfileComponent implements OnInit {
  profileForm!: FormGroup;
  profilePreview: string | null = null;
  coverPreview: string | null = null;

  selectedProfileImage!: File;
  selectedCoverImage!: File;

  institutions: { id: string; name: string }[] = [];
  isSubmitting = false;

  constructor(
    private fb: FormBuilder,
    private profileService: ProfileService,
    private toastr: ToastrService,
    public router: Router,
    private institutionService: InstitutionService
  ) {}

  ngOnInit(): void {
    this.profileForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
      institutionId: ['', Validators.required],
      academicLevel: ['', [Validators.required, Validators.maxLength(100)]],
      skills: ['', [Validators.required, Validators.maxLength(500)]],
      bio: ['', [Validators.required, Validators.maxLength(500)]],
      interests: ['', [Validators.required, Validators.maxLength(500)]],
    });

    this.institutionService.getInstitutions().subscribe({
      next: (data) => (this.institutions = data),
      error: (err) => {
        console.error('Failed to load institutions', err);
        this.toastr.error('Failed to load institutions');
      },
    });
  }

  onProfileImageSelected(event: Event): void {
    const file = (event.target as HTMLInputElement)?.files?.[0];
    if (file) {
      // Validate file size (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        this.toastr.error('Profile image must be less than 2MB');
        return;
      }
      
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        this.toastr.error('Only JPEG, PNG, GIF, and WEBP images are allowed');
        return;
      }
      
      this.profilePreview = URL.createObjectURL(file);
      this.selectedProfileImage = file;
    }
  }

  onCoverPhotoSelected(event: Event): void {
    const file = (event.target as HTMLInputElement)?.files?.[0];
    if (file) {
      // Validate file size (max 5MB for cover)
      if (file.size > 5 * 1024 * 1024) {
        this.toastr.error('Cover image must be less than 5MB');
        return;
      }
      
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        this.toastr.error('Only JPEG, PNG, GIF, and WEBP images are allowed');
        return;
      }
      
      this.coverPreview = URL.createObjectURL(file);
      this.selectedCoverImage = file;
    }
  }

  onSubmit(): void {
    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      
      // Show specific error message
      if (this.profileForm.get('name')?.errors?.['required']) {
        this.toastr.error('Please enter your name');
      } else if (this.profileForm.get('institutionId')?.errors?.['required']) {
        this.toastr.error('Please select your institution');
      } else if (this.profileForm.get('academicLevel')?.errors?.['required']) {
        this.toastr.error('Please enter your academic level');
      } else if (this.profileForm.get('skills')?.errors?.['required']) {
        this.toastr.error('Please enter your skills');
      } else if (this.profileForm.get('interests')?.errors?.['required']) {
        this.toastr.error('Please enter your interests');
      } else if (this.profileForm.get('bio')?.errors?.['required']) {
        this.toastr.error('Please enter a bio');
      } else {
        this.toastr.error('Please fill out all required fields');
      }
      return;
    }

    this.isSubmitting = true;
    const formData = this.profileForm.value;
    
    const payload = {
      ...formData,
      skills: formData.skills.split(',').map((skill: string) => skill.trim()).filter((s: string) => s),
      interests: formData.interests
        .split(',')
        .map((interest: string) => interest.trim())
        .filter((i: string) => i),
    };

    this.profileService.createProfile(payload).subscribe({
      next: (response) => {
        this.toastr.success('Profile created successfully! 🎉');
        
        // Upload profile image if selected
        if (this.selectedProfileImage) {
          this.profileService.uploadProfileImage(this.selectedProfileImage).subscribe({
            next: () => {
              this.toastr.success('Profile photo uploaded');
              this.finishProfileCreation();
            },
            error: (err) => {
              console.error(err);
              this.toastr.warning('Profile created but image upload failed');
              this.finishProfileCreation();
            },
          });
        } else if (this.selectedCoverImage) {
          this.profileService.uploadCoverPhoto(this.selectedCoverImage).subscribe({
            next: () => {
              this.toastr.success('Cover photo uploaded');
              this.finishProfileCreation();
            },
            error: (err) => {
              console.error(err);
              this.toastr.warning('Profile created but cover upload failed');
              this.finishProfileCreation();
            },
          });
        } else {
          this.finishProfileCreation();
        }
      },
      error: (err) => {
        console.error(err);
        const errorMessage = err.error?.message || 'Failed to create profile';
        this.toastr.error(errorMessage);
        this.isSubmitting = false;
      },
    });
  }

  private finishProfileCreation(): void {
    this.isSubmitting = false;
    setTimeout(() => {
      this.router.navigate(['/home']);
    }, 1500);
  }
}