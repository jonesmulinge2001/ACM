import { Component, Input, OnInit } from '@angular/core';
import { Announcement } from '../../interfaces';
import { InstitutionService } from '../../services/institution.service';
import { CommonModule } from '@angular/common';
import { CreateAnnouncementComponent } from "../create-announcement/create-announcement.component";

@Component({
  imports: [CommonModule, CreateAnnouncementComponent],
  selector: 'app-admin-announcement-feed',
  templateUrl: './announcement-feed.component.html',
})
export class AdminAnnouncementFeedComponent implements OnInit {
  @Input() institutionId!: string;
  @Input() announcement!: Announcement;
  announcements: Announcement[] = [];
  loading = false;
  error: string | null = null;

  editing = false;

  constructor(private announcementService: InstitutionService) {}

  ngOnInit() {
    this.loadAnnouncements();
  }

  toggleEdit() {
    this.editing = !this.editing;
  }
  
  onSaved(updated: Announcement) {
    this.refresh(updated);
    this.toggleEdit();
  }

  loadAnnouncements() {
    this.loading = true;
    this.announcementService.getMyAnnouncements().subscribe({
      next: (res) => {
        this.announcements = res;
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Failed to load announcements';
        this.loading = false;
        console.error(err);
      },
    });
  }

  refresh(event: Announcement) {
    // Replace or add updated announcement
    const idx = this.announcements.findIndex((a) => a.id === event.id);
    if (idx >= 0) {
      this.announcements[idx] = event;
    } else {
      this.announcements.unshift(event);
    }
  }

  deleteAnnouncement(id: string) {
    this.announcementService.deleteAnnouncement(id).subscribe({
      next: () => {
        this.announcements = this.announcements.filter((a) => a.id !== id);
      },
      error: (err) => {
        console.error(err);
      },
    });
  }
}
