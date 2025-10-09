import { Component, EventEmitter, Input, Output, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { Announcement } from '../../interfaces';
import { InstitutionService } from '../../services/institution.service';
import { ProfileService } from '../../services/profile.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-create-announcement',
  templateUrl: './create-announcement.component.html',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
})
export class CreateAnnouncementComponent implements OnInit {
  @Input() announcement?: Announcement; // edit mode
  @Output() saved = new EventEmitter<Announcement>(); // emit to parent feed

  form: FormGroup;
  selectedFiles: File[] = [];
  loading = false;
  institutionId!: string;

  constructor(
    private fb: FormBuilder,
    private announcementService: InstitutionService,
    private profileService: ProfileService
  ) {
    this.form = this.fb.group({
      title: ['', Validators.required],
      content: ['', Validators.required],
    });
  }

  ngOnInit() {
    // ✅ Fetch institutionId once profile is loaded
    this.profileService.getMyProfile().subscribe({
      next: (profile) => {
        this.institutionId = profile.institutionId;
      },
      error: (err) => console.error('Failed to fetch profile:', err),
    });

    // ✅ Pre-fill form if editing
    if (this.announcement) {
      this.form.patchValue({
        title: this.announcement.title,
        content: this.announcement.content,
      });
    }
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      this.selectedFiles = Array.from(input.files);
    }
  }

  submit() {
    if (this.form.invalid || !this.institutionId) {
      console.error('Missing institutionId or invalid form');
      return;
    }

    this.loading = true;
    const { title, content } = this.form.value;

    let req$;
    if (this.announcement) {
      // update existing
      req$ = this.announcementService.updateAnnouncement(
        this.announcement.id,
        { title, content },
        this.selectedFiles
      );
    } else {
      // create new
      req$ = this.announcementService.createAnnouncement(
        this.institutionId,
        { title, content },
        this.selectedFiles
      );
    }

    req$.subscribe({
      next: (res) => {
        this.saved.emit(res); // ✅ notify parent feed to refresh
        this.loading = false;
        this.form.reset();
        this.selectedFiles = [];
      },
      error: (err) => {
        console.error(err);
        this.loading = false;
      },
    });
  }

  removeFile(file: File) {
    this.selectedFiles = this.selectedFiles.filter((f) => f !== file);
  }
}
