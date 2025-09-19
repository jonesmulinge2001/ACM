import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Announcement } from '../../interfaces';
import { InstitutionService } from '../../services/institution.service';
import { CommonModule } from '@angular/common';

@Component({
imports:[CommonModule, ReactiveFormsModule, FormsModule],
  selector: 'app-admin-announcement-form',
  templateUrl: './create-announcement.component.html',
})
export class CreateAnnouncementComponent {
  @Input() institutionId!: string;
  @Input() announcement?: Announcement; // if set, we are editing
  @Output() saved = new EventEmitter<Announcement>();

  form: FormGroup;
  selectedFiles: File[] = [];
  loading = false;

  constructor(
    private fb: FormBuilder,
    private announcementService: InstitutionService,
  ) {
    this.form = this.fb.group({
      title: ['', Validators.required],
      content: ['', Validators.required],
    });
  }

  ngOnInit() {
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

  async submit() {
    if (this.form.invalid) return;
    this.loading = true;

    const { title, content } = this.form.value;

    let req$;
    if (this.announcement) {
      // update
      req$ = this.announcementService.updateAnnouncement(
        this.announcement.id,
        { title, content },
        this.selectedFiles,
      );
    } else {
      // create
      req$ = this.announcementService.createAnnouncement(
        this.institutionId,
        { title, content },
        this.selectedFiles,
      );
    }

    req$.subscribe({
      next: (res) => {
        this.saved.emit(res);
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

  get selectedFileNames(): string {
    return this.selectedFiles.map(f => f.name).join(', ');
  }
  
}
