import { Component, OnInit } from '@angular/core';
import { DashboardOverview, InstitutionStats } from '../../interfaces';
import { AdmindashboardService } from '../../services/admindashboard.service';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { forkJoin } from 'rxjs';

type TabKey = 'total' | 'today' | 'last7Days' | 'thisMonth';

@Component({
  standalone: true,
  imports: [CommonModule, RouterModule],
  selector: 'app-dashboard-overview',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css'],
})
export class DashboardOverviewComponent implements OnInit {
  overview?: DashboardOverview;
  institutionStats: InstitutionStats[] = [];
  metrics: {
    label: string;
    value: number;
    icon: string;
    color: string;
  }[] = [];

  loading = true;
  error?: string;

  tabs: { key: TabKey; label: string }[] = [
    { key: 'total', label: 'Total' },
    { key: 'today', label: 'Today' },
    { key: 'last7Days', label: 'Last 7 Days' },
    { key: 'thisMonth', label: 'This Month' },
  ];

  activeTab: TabKey = 'total';

  objectKeys = Object.keys;

  constructor(private dashboardService: AdmindashboardService) {}

  ngOnInit(): void {
    forkJoin({
      overview: this.dashboardService.getOverview(),
      activity: this.dashboardService.getInstitutionStats(),
    }).subscribe({
      next: ({ overview, activity }) => {
        this.overview = overview;
        this.institutionStats = activity ?? [];

        if (!this.overview) {
          this.error = 'No overview data received';
          this.loading = false;
          return;
        }

        // metrics mapping
        this.metrics = [
          {
            label: 'Total Users',
            value: this.overview.usersCount ?? 0,
            icon: 'group',
            color: 'bg-blue-100 text-blue-600',
          },
          {
            label: 'Total Posts',
            value: this.overview.postsCount ?? 0,
            icon: 'article',
            color: 'bg-orange-100 text-orange-600',
          },
          {
            label: 'Academic Resources',
            value: this.overview.academicResourceCount ?? 0,
            icon: 'menu_book',
            color: 'bg-teal-100 text-teal-600',
          },
          {
            label: 'New Signups Today',
            value: this.overview.newSignUpsToday ?? 0,
            icon: 'person_add',
            color: 'bg-purple-100 text-purple-600',
          },
          {
            label: 'New Signups (Last 7 Days)',
            value: this.overview.newSignUpsLast7Days ?? 0,
            icon: 'date_range',
            color: 'bg-green-100 text-green-600',
          },
          {
            label: 'New Signups (This Month)',
            value: this.overview.newSignUpsThisMonth ?? 0,
            icon: 'calendar_month',
            color: 'bg-pink-100 text-pink-600',
          },
          {
            label: 'Total Likes',
            value: this.overview.likesCount ?? 0,
            icon: 'thumb_up',
            color: 'bg-yellow-100 text-yellow-600',
          },
          {
            label: 'Total Comments',
            value: this.overview.commentsCount ?? 0,
            icon: 'comment',
            color: 'bg-indigo-100 text-indigo-600',
          },
        ];

        this.loading = false;
      },
      error: () => {
        this.error = 'Failed to load dashboard data';
        this.loading = false;
      },
    });
  }

  getTabLabel(key: TabKey): string {
    const found = this.tabs.find((t) => t.key === key);
    return found ? found.label : '';
  }

  getMaxActivity(): number {
    if (!this.institutionStats?.length) return 1;
    return Math.max(
      ...this.institutionStats.map((i) => i.totalPosts + i.totalResources)
    );
  }

  getStudentCount(inst: string): number {
    const data = this.overview?.studentsPerInstitution[this.activeTab];
    return data ? data[inst] ?? 0 : 0;
  }
  
}
