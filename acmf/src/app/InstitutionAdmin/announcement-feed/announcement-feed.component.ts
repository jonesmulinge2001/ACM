import { Component, Input, OnInit } from '@angular/core';
import { Announcement, Profile } from '../../interfaces';
import { InstitutionService } from '../../services/institution.service';
import { CommonModule } from '@angular/common';
import { CreateAnnouncementComponent } from "../create-announcement/create-announcement.component";
import { ProfileService } from '../../services/profile.service';

@Component({
  imports: [CommonModule, CreateAnnouncementComponent],
  selector: 'app-admin-announcement-feed',
  templateUrl: './announcement-feed.component.html',
})
export class AdminAnnouncementFeedComponent implements OnInit {
  @Input() institutionId!: string;
  announcements: Announcement[] = [];
  loading = false;
  error: string | null = null;

  deleteModalOpen = false;
  deleteTargetId: string | null = null;
  editingId: string | null = null;   // ✅ track which announcement is being edited

  constructor(
    private announcementService: InstitutionService,
    private profileService: ProfileService
  ) {}

  ngOnInit() {
    if (!this.institutionId) {
      this.profileService.getMyProfile().subscribe((profile: Profile) => {
        this.institutionId = profile.institutionId;
        console.log('Loaded institutionId:', this.institutionId);
        this.loadAnnouncements(); 
      });
    } else {
      this.loadAnnouncements();
    }
  }

  toggleEdit(id: string) {
    this.editingId = this.editingId === id ? null : id;
  }
  
  onSaved(updated: Announcement) {
    this.refresh(updated);
    this.editingId = null; // ✅ close edit after save
  }

  loadAnnouncements() {
    if (!this.institutionId) return;

    this.loading = true;
    this.announcementService.getMyAnnouncements(this.institutionId).subscribe({
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

  openDeleteModal(id: string) {
    this.deleteTargetId = id;
    this.deleteModalOpen = true;
  }
  
  closeDeleteModal() {
    this.deleteTargetId = null;
    this.deleteModalOpen = false;
  }
  
  confirmDelete() {
    if (this.deleteTargetId) {
      this.deleteAnnouncement(this.deleteTargetId);
    }
    this.closeDeleteModal();
  }
}
