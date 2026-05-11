import { Component, OnInit, HostListener } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
  FormsModule,
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { ProfileService } from '../../../services/profile.service';
import Swal from 'sweetalert2';
import { Profile } from '../../../interfaces';
import { InstitutionService } from '../../../services/institution.service';

@Component({
  selector: 'app-update-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule],
  templateUrl: './update-profile.component.html',
  styleUrls: ['./update-profile.component.css'],
})
export class UpdateProfileComponent implements OnInit {
  profileForm!: FormGroup;
  isLoading    = true;
  isSubmitting = false;

  profilePreview: string | null           = null;
  coverPreview:   string | null | undefined = null;

  institutions: { id: string; name: string }[] = [];

  // ── Institution custom dropdown ──────────────────────────────
  instDropdownOpen        = false;
  institutionSearchQuery  = '';
  selectedInstitutionName = '';

  constructor(
    private fb: FormBuilder,
    private profileService: ProfileService,
    private router: Router,
    private institutionService: InstitutionService
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.loadInstitutions();
    this.loadProfile();
  }

  // ── Institution dropdown ──────────────────────────────────────
  getFilteredInstitutions(): { id: string; name: string }[] {
    const q = this.institutionSearchQuery.trim().toLowerCase();
    if (!q) return this.institutions;
    return this.institutions.filter(i => i.name.toLowerCase().includes(q));
  }

  selectInstitution(inst: { id: string; name: string }): void {
    this.profileForm.get('institutionId')!.setValue(inst.id);
    this.profileForm.get('institutionId')!.markAsDirty();
    this.selectedInstitutionName = inst.name;
    this.instDropdownOpen        = false;
    this.institutionSearchQuery  = '';
  }

  /** Close dropdown on outside click */
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest('[data-dropdown="institution"]')) {
      this.instDropdownOpen = false;
    }
  }

  // ── Sweetalert helper ─────────────────────────────────────────
  private alert(icon: any, title: string, text?: string) {
    return Swal.fire({
      icon,
      title,
      text,
      confirmButtonText: 'OK',
      buttonsStyling: false,
      background: '#ffffff',
      color: '#111827',
      customClass: {
        popup:          'rounded-2xl p-6 shadow-lg border border-gray-200',
        title:          'text-lg font-semibold text-gray-900',
        htmlContainer:  'text-gray-500 text-sm',
        confirmButton:  'mt-4 px-5 py-2 rounded-xl bg-gray-950 hover:bg-gray-800 text-white text-sm font-semibold transition',
      },
    });
  }

  // ── Init ──────────────────────────────────────────────────────
  private initForm(): void {
    this.profileForm = this.fb.group({
      name:          ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
      institutionId: ['', Validators.required],
      academicLevel: ['', [Validators.required, Validators.maxLength(100)]],
      course:        ['', [Validators.required, Validators.maxLength(200)]],
      skills:        ['', [Validators.required, Validators.maxLength(500)]],
      bio:           ['', [Validators.required, Validators.maxLength(500)]],
      interests:     ['', [Validators.maxLength(500)]],
    });
  }

  private loadInstitutions(): void {
    this.institutionService.getInstitutions().subscribe({
      next: (data) => {
        this.institutions = data;
        // After institutions load, sync the display name if institutionId is already set
        this.syncInstitutionName();
      },
      error: () => this.alert('error', 'Failed to load institutions'),
    });
  }

  private loadProfile(): void {
    this.profileService.getMyProfile().subscribe({
      next: (profile: Profile) => {
        this.isLoading = false;

        this.profileForm.patchValue({
          name:          profile.name,
          institutionId: profile.institutionId,
          academicLevel: profile.academicLevel,
          course:        profile.course || '',
          skills:        profile.skills?.join(', ') || '',
          bio:           profile.bio,
          interests:     profile.interests?.join(', ') || '',
        });

        this.profilePreview = profile.profileImage   ?? null;
        this.coverPreview   = profile.coverPhoto     ?? null;

        // Sync institution display name after form is patched
        this.syncInstitutionName();
      },
      error: () => {
        this.isLoading = false;
        this.alert('error', 'Failed to load profile');
      },
    });
  }

  /** Set the display name for the institution trigger button */
  private syncInstitutionName(): void {
    const id = this.profileForm.get('institutionId')?.value;
    if (id && this.institutions.length > 0) {
      const found = this.institutions.find(i => i.id === id);
      if (found) this.selectedInstitutionName = found.name;
    }
  }

  // ── Navigation ────────────────────────────────────────────────
  goBack(): void {
    this.router.navigate(['/my-profile']);
  }

  // ── Submit ────────────────────────────────────────────────────
  onSubmit(): void {
    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      this.alert('warning', 'Please complete all required fields');
      return;
    }

    this.isSubmitting = true;
    const v = { ...this.profileForm.value };

    v.skills    = v.skills.split(',').map((s: string) => s.trim()).filter(Boolean);
    v.interests = v.interests
      ? v.interests.split(',').map((i: string) => i.trim()).filter(Boolean)
      : [];

    this.profileService.updateProfile(v).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.alert('success', 'Profile updated successfully! 🎉').then(() => this.goBack());
      },
      error: (err) => {
        this.isSubmitting = false;
        this.alert('error', 'Update failed', err.error?.message || 'Failed to update profile');
      },
    });
  }

  // ── Image uploads ─────────────────────────────────────────────
  onProfileImageSelected(event: Event): void {
    const file = (event.target as HTMLInputElement)?.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { this.alert('error', 'Image too large', 'Max size is 2 MB'); return; }

    this.profileService.uploadProfileImage(file).subscribe({
      next: (res) => {
        this.profilePreview = res.profileImage ?? null;
        this.alert('success', 'Profile photo updated');
      },
      error: () => this.alert('error', 'Upload failed'),
    });
  }

  onCoverPhotoSelected(event: Event): void {
    const file = (event.target as HTMLInputElement)?.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { this.alert('error', 'Image too large', 'Max size is 5 MB'); return; }

    this.profileService.uploadCoverPhoto(file).subscribe({
      next: (res) => {
        this.coverPreview = res.coverPhoto ?? null;
        this.alert('success', 'Cover photo updated');
      },
      error: () => this.alert('error', 'Upload failed'),
    });
  }
}