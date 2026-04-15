import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { ProfileService } from '../../../services/profile.service';
import { ToastrService } from 'ngx-toastr';
import { Profile } from '../../../interfaces';
import { InstitutionService } from '../../../services/institution.service';

@Component({
  selector: 'app-update-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule],
  templateUrl: './update-profile.component.html',
  styleUrls: ['./update-profile.component.css']
})
export class UpdateProfileComponent implements OnInit {
  profileForm!: FormGroup;
  isLoading = true;
  profilePreview: string | null = null;
  coverPreview: string | null | undefined = null;
  institutions: { id: string; name: string }[] = [];

  constructor(
    private fb: FormBuilder,
    private profileService: ProfileService,
    private toastr: ToastrService,
    private router: Router,
    private institutionService: InstitutionService
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.loadInstitutions();
    this.loadProfile();
  }

  private initForm(): void {
    this.profileForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
      institutionId: ['', Validators.required],
      academicLevel: ['', [Validators.required, Validators.maxLength(100)]],
      course: ['', [Validators.required, Validators.maxLength(200)]], 
      skills: ['', [Validators.required, Validators.maxLength(500)]],
      bio: ['', [Validators.required, Validators.maxLength(500)]],
      interests: ['', [Validators.maxLength(500)]]
    });
  }

  private loadInstitutions(): void {
    this.institutionService.getInstitutions().subscribe({
      next: (data) => (this.institutions = data),
      error: () => this.toastr.error('Failed to load institutions'),
    });
  }

  private loadProfile(): void {
    this.profileService.getMyProfile().subscribe({
      next: (profile: Profile) => {
        this.isLoading = false;
        this.profileForm.patchValue({
          name: profile.name,
          institutionId: profile.institutionId,
          academicLevel: profile.academicLevel,
          course: profile.course || '', 
          skills: profile.skills?.join(', ') || '',
          bio: profile.bio,
          interests: profile.interests?.join(', ') || ''
        });
        this.profilePreview = profile.profileImage ?? null;
        this.coverPreview = profile.coverPhoto ?? null;
      },
      error: (err) => {
        this.isLoading = false;
        console.error('Failed to load profile:', err);
        this.toastr.error('Failed to load profile');
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/my-profile']);
  }

  onSubmit(): void {
    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      
      if (this.profileForm.get('name')?.errors?.['required']) {
        this.toastr.error('Please enter your name');
      } else if (this.profileForm.get('institutionId')?.errors?.['required']) {
        this.toastr.error('Please select your institution');
      } else if (this.profileForm.get('academicLevel')?.errors?.['required']) {
        this.toastr.error('Please enter your academic level');
      } else if (this.profileForm.get('course')?.errors?.['required']) { 
        this.toastr.error('Please enter your course');
      } else if (this.profileForm.get('skills')?.errors?.['required']) {
        this.toastr.error('Please enter your skills');
      } else if (this.profileForm.get('bio')?.errors?.['required']) {
        this.toastr.error('Please enter a bio');
      }
      return;
    }

    const formData = this.profileForm.value;
    
    // Parse skills and interests
    formData.skills = formData.skills.split(',').map((s: string) => s.trim()).filter((s: string) => s);
    formData.interests = formData.interests ? 
      formData.interests.split(',').map((i: string) => i.trim()).filter((i: string) => i) : [];

    this.profileService.updateProfile(formData).subscribe({
      next: () => {
        this.toastr.success('Profile updated successfully! 🎉');
        setTimeout(() => {
          this.goBack();
        }, 1500);
      },
      error: (err) => {
        console.error('Failed to update profile:', err);
        const errorMessage = err.error?.message || 'Failed to update profile';
        this.toastr.error(errorMessage);
      }
    });
  }

  onProfileImageSelected(event: Event): void {
    const file = (event.target as HTMLInputElement)?.files?.[0];
    if (!file) return;

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

    this.profileService.uploadProfileImage(file).subscribe({
      next: (res) => {
        this.profilePreview = res.profileImage ?? null;
        this.toastr.success('Profile photo updated successfully');
      },
      error: (err) => {
        console.error('Failed to upload profile photo:', err);
        this.toastr.error('Failed to upload profile photo');
      }
    });
  }

  onCoverPhotoSelected(event: Event): void {
    const file = (event.target as HTMLInputElement)?.files?.[0];
    if (!file) return;

    // Validate file size (max 5MB)
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

    this.profileService.uploadCoverPhoto(file).subscribe({
      next: (res) => {
        this.coverPreview = res.coverPhoto ?? null;
        this.toastr.success('Cover photo updated successfully');
      },
      error: (err) => {
        console.error('Failed to upload cover photo:', err);
        this.toastr.error('Failed to upload cover photo');
      }
    });
  }
}