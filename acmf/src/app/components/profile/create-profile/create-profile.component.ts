import { Component, OnInit, HostListener } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ProfileService } from '../../../services/profile.service';
import { ToastrService } from 'ngx-toastr';
import { Router, RouterModule } from '@angular/router';
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

  // ── Institution custom dropdown ──────────────────────────────
  instDropdownOpen        = false;
  institutionSearchQuery  = '';
  selectedInstitutionName = '';

  // ── Progress tracking ─────────────────────────────────────────
  completionPercentage = 0;
  completedFields      = 0;
  totalFields          = 9; // 7 form fields + profile image + cover image
  showBadge            = false;
  badgeAnimating       = false;

  constructor(
    private fb: FormBuilder,
    private profileService: ProfileService,
    private toastr: ToastrService,
    public router: Router,
    private institutionService: InstitutionService
  ) {}

  ngOnInit(): void {
    this.profileForm = this.fb.group({
      name:          ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
      institutionId: ['', Validators.required],
      academicLevel: ['', [Validators.required, Validators.maxLength(100)]],
      course:        ['', [Validators.required, Validators.maxLength(200)]],
      skills:        ['', [Validators.required, Validators.maxLength(500)]],
      bio:           ['', [Validators.required, Validators.maxLength(500)]],
      interests:     ['', [Validators.required, Validators.maxLength(500)]],
    });

    this.institutionService.getInstitutions().subscribe({
      next: (data) => (this.institutions = data),
    });

    this.profileForm.valueChanges.subscribe(() => this.calculateProgress());
  }

  // ── Institution dropdown helpers ──────────────────────────────
  getFilteredInstitutions(): { id: string; name: string }[] {
    const q = this.institutionSearchQuery.trim().toLowerCase();
    if (!q) return this.institutions;
    return this.institutions.filter(i => i.name.toLowerCase().includes(q));
  }

  selectInstitution(inst: { id: string; name: string }): void {
    this.profileForm.get('institutionId')!.setValue(inst.id);
    this.profileForm.get('institutionId')!.markAsDirty();
    this.selectedInstitutionName  = inst.name;
    this.instDropdownOpen         = false;
    this.institutionSearchQuery   = '';
    this.calculateProgress();
  }

  /** Close institution dropdown on outside click */
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest('[data-dropdown="institution"]')) {
      this.instDropdownOpen = false;
    }
  }

  // ── Progress ──────────────────────────────────────────────────
  calculateProgress(): void {
    const fields = ['name', 'institutionId', 'academicLevel', 'course', 'skills', 'bio', 'interests'];
    let filled = 0;

    fields.forEach(field => {
      const control = this.profileForm.get(field);
      if (control?.valid && control.value?.toString().trim() !== '') filled++;
    });

    if (this.selectedProfileImage) filled++;
    if (this.selectedCoverImage)   filled++;

    this.completedFields = filled;
    const newPct = Math.round((filled / this.totalFields) * 100);

    const wasComplete = this.completionPercentage === 100;
    this.completionPercentage = newPct;

    if (newPct === 100 && !wasComplete) this.triggerBadge();
    else if (newPct < 100) { this.showBadge = false; this.badgeAnimating = false; }
  }

  triggerBadge(): void {
    this.showBadge = true;
    this.badgeAnimating = true;
    setTimeout(() => (this.badgeAnimating = false), 1000);
  }

  get progressLabel(): string {
    if (this.completionPercentage === 0)   return 'Just getting started…';
    if (this.completionPercentage < 30)    return 'Keep going!';
    if (this.completionPercentage < 60)    return 'Making progress 🚀';
    if (this.completionPercentage < 90)    return 'Almost there!';
    if (this.completionPercentage < 100)   return 'One more step!';
    return 'Profile complete! 🎉';
  }

  // ── Image handlers ────────────────────────────────────────────
  onProfileImageSelected(event: Event): void {
    const file = (event.target as HTMLInputElement)?.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { this.toastr.error('Profile image must be less than 2 MB'); return; }
    if (!['image/jpeg','image/png','image/gif','image/webp'].includes(file.type)) {
      this.toastr.error('Only JPEG, PNG, GIF, and WEBP images are allowed'); return;
    }
    this.profilePreview      = URL.createObjectURL(file);
    this.selectedProfileImage = file;
    this.calculateProgress();
  }

  onCoverPhotoSelected(event: Event): void {
    const file = (event.target as HTMLInputElement)?.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { this.toastr.error('Cover image must be less than 5 MB'); return; }
    if (!['image/jpeg','image/png','image/gif','image/webp'].includes(file.type)) {
      this.toastr.error('Only JPEG, PNG, GIF, and WEBP images are allowed'); return;
    }
    this.coverPreview      = URL.createObjectURL(file);
    this.selectedCoverImage = file;
    this.calculateProgress();
  }

  // ── Submit ────────────────────────────────────────────────────
  onSubmit(): void {
    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      this.toastr.error('Please fill out all required fields');
      return;
    }

    this.isSubmitting = true;
    const v = this.profileForm.value;

    const payload = {
      ...v,
      skills:    v.skills.split(',').map((s: string) => s.trim()).filter(Boolean),
      interests: v.interests.split(',').map((i: string) => i.trim()).filter(Boolean),
    };

    this.profileService.createProfile(payload).subscribe({
      next: () => {
        this.toastr.success('Profile created successfully! 🎉');

        const imageUploads = () => {
          if (this.selectedCoverImage) {
            this.profileService.uploadCoverPhoto(this.selectedCoverImage).subscribe({
              next: () => this.toastr.success('Cover photo uploaded'),
              error: () => this.toastr.warning('Cover photo upload failed'),
              complete: () => this.finishProfileCreation(),
            });
          } else {
            this.finishProfileCreation();
          }
        };

        if (this.selectedProfileImage) {
          this.profileService.uploadProfileImage(this.selectedProfileImage).subscribe({
            next: () => { this.toastr.success('Profile photo uploaded'); imageUploads(); },
            error: () => { this.toastr.warning('Profile created but image upload failed'); imageUploads(); },
          });
        } else {
          imageUploads();
        }
      },
      error: (err) => {
        this.toastr.error(err.error?.message || 'Failed to create profile');
        this.isSubmitting = false;
      },
    });
  }

  private finishProfileCreation(): void {
    this.isSubmitting = false;
    setTimeout(() => this.router.navigate(['/home']), 1500);
  }
}