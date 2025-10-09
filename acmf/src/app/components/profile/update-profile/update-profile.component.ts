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

  showProfileModal = true;

  institutions: { id: string; name: string }[] = [];

  closeProfileModal() {
    this.showProfileModal = false;
  }

  constructor(
    private fb: FormBuilder,
    private profileService: ProfileService,
    private toastr: ToastrService,
    private router: Router,
    private institutionService: InstitutionService
  ) {}

  ngOnInit(): void {
    this.profileForm = this.fb.group({
      name: ['', Validators.required],
      institutionId: ['', Validators.required],
      academicLevel: ['', Validators.required],
      skills: ['', Validators.required],
      bio: ['', Validators.required]
    });

       // fetch institutions for dropdown
       this.institutionService.getInstitutions().subscribe({
        next: (data) => (this.institutions = data),
        error: () => this.toastr.error('Failed to load institutions'),
      });

    this.profileService.getMyProfile().subscribe({
      next: (profile: Profile) => {
        this.isLoading = false;
        this.profileForm.patchValue({
          name: profile.name,
          institutionId: profile.institutionId,
          academicLevel: profile.academicLevel,
          skills: profile.skills.join(', '),
          bio: profile.bio
        });
        this.profilePreview = profile.profileImage ?? null;
        this.coverPreview = profile.coverPhoto ?? null;
      },
      error: () => {
        this.isLoading = false;
        this.toastr.error('Failed to load profile');
      }
    });
  }

  onSubmit(): void {
    if (this.profileForm.invalid) return;

    const formData = this.profileForm.value;
    formData.skills = formData.skills.split(',').map((s: string) => s.trim());

    this.profileService.updateProfile(formData).subscribe({
      next: () => {
        this.toastr.success('Profile updated successfully!');
        this.router.navigate(['/my-profile']);
      },
      error: () => this.toastr.error('Failed to update profile')
    });
  }

  onProfileImageSelected(event: Event): void {
    const file = (event.target as HTMLInputElement)?.files?.[0];
    if (!file) return;

    this.profileService.uploadProfileImage(file).subscribe({
      next: (res) => {
        this.profilePreview = res.profileImage ?? null;


        this.toastr.success('Profile photo updated');
      },
      error: () => this.toastr.error('Failed to upload profile photo')
    });
  }

  onCoverPhotoSelected(event: Event): void {
    const file = (event.target as HTMLInputElement)?.files?.[0];
    if (!file) return;

    this.profileService.uploadCoverPhoto(file).subscribe({
      next: (res) => {
        this.coverPreview = res.coverPhoto ?? null;
        this.toastr.success('Cover photo updated');
      },
      error: () => this.toastr.error('Failed to upload cover photo')
    });
  }
}
