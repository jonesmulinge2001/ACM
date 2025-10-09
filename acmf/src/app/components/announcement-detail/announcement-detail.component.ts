import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AnnouncementSummary } from '../../interfaces';
import { StudentNotificationService } from '../../services/student-notification.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-announcement-detail',
  imports: [CommonModule],
  templateUrl: './announcement-detail.component.html',
  styleUrl: './announcement-detail.component.css'
})
export class AnnouncementDetailComponent {
  announcement?: AnnouncementSummary;
  loading = true;
  error = '';

  constructor(
    private route: ActivatedRoute,
    private notifService: StudentNotificationService
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.error = 'Invalid announcement id';
      this.loading = false;
      return;
    }

    this.notifService.getAnnouncements().subscribe({
      next: (list) => {
        this.announcement = list.find((a) => a.id === id);
        if (!this.announcement) {
          this.error = 'Announcement not found';
        }
        this.loading = false;
      },
      error: () => {
        this.error = 'Failed to load announcement';
        this.loading = false;
      },
    });
  }
}
