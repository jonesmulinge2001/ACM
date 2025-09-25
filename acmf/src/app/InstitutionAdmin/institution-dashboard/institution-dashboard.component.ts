import { Component, OnInit } from '@angular/core';
import { InstitutionService } from '../../services/institution.service';
import { ProfileService } from '../../services/profile.service';
import { InstitutionAnalytics, Announcement, Profile } from '../../interfaces';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  imports: [CommonModule],
  selector: 'app-institution-dashboard',
  templateUrl: './institution-dashboard.component.html',
})
export class InstitutionDashboardComponent implements OnInit {
  analytics: InstitutionAnalytics | null = null;
  announcements: Announcement[] = [];
  profile: Profile | null = null;
  loading = true;

  constructor(
    private institutionService: InstitutionService,
    private profileService: ProfileService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.profileService.getMyProfile().subscribe({
      next: (profile) => {
        this.profile = profile;
        if (profile.institutionId) {
          this.fetchAnalytics(profile.institutionId);
          this.fetchAnnouncements(profile.institutionId); // ✅ pass institutionId
        }
      },
      error: (err) => {
        console.error('Failed to load profile', err);
        this.loading = false;
      },
    });
  }

  fetchAnalytics(institutionId: string): void {
    this.institutionService.getAnalytics(institutionId).subscribe({
      next: (res) => {
        this.analytics = res;
        this.loading = false;
      },
      error: (err) => {
        console.error('Analytics error', err);
        this.loading = false;
      },
    });
  }

  fetchAnnouncements(institutionId: string): void {
    this.institutionService.getMyAnnouncements(institutionId).subscribe({
      next: (res) => (this.announcements = res),
    });
  }

  goToCreateAnnouncement(): void {
    this.router.navigate(['/institution-admin/announcements/create-announcement']);
  }
  
}
