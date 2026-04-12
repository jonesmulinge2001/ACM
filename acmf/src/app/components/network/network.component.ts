import { Component, ElementRef, OnInit, QueryList, ViewChild, ViewChildren } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Profile } from '../../interfaces';
import { StudentCardComponent } from '../shared/student-card/student-card.component';
import { RecommenderService } from '../../services/recommender.service';
import { FollowService } from '../../services/follow.service';
import { Follow } from '../../interfaces';
import { map } from 'rxjs/operators';
import { Observable } from 'rxjs';

type TabKey = 'all' | 'skills' | 'interests' | 'course' | 'academicLevel' | 'institution';

interface Tab {
  key: TabKey;
  label: string;
  icon: string;
  description: string;
}

@Component({
  imports: [CommonModule, StudentCardComponent],
  selector: 'app-network',
  templateUrl: './network.component.html',
  styleUrls: ['./network.component.css']
})
export class NetworkComponent implements OnInit {
  currentUserId: string = '';
  selectedTab: TabKey = 'all';

  @ViewChild('tabNav') tabNav!: ElementRef<HTMLElement>;
@ViewChildren('tabBtn') tabBtns!: QueryList<ElementRef<HTMLElement>>;

  tabs: Tab[] = [
    {
      key: 'all',
      label: 'All Profiles',
      icon: 'ri-team-line',
      description: 'Suggested connections for you'
    },
    {
      key: 'skills',
      label: 'By Skills',
      icon: 'ri-tools-line',
      description: 'People who share your skills'
    },
    {
      key: 'interests',
      label: 'By Interests',
      icon: 'ri-heart-line',
      description: 'People with similar interests'
    },
    {
      key: 'course',
      label: 'By Course',
      icon: 'ri-book-open-line',
      description: 'People in your course'
    },
    {
      key: 'academicLevel',
      label: 'By Level',
      icon: 'ri-graduation-cap-line',
      description: 'People at your academic level'
    },
    {
      key: 'institution',
      label: 'By Institution',
      icon: 'ri-building-line',
      description: 'People from your institution'
    },
  ];

  profileCache: Partial<Record<TabKey, Profile[]>> = {};
  displayedProfiles: Profile[] = [];
  following: Follow[] = [];
  loading = false;

  get activeTab(): Tab {
    return this.tabs.find(t => t.key === this.selectedTab)!;
  }

  constructor(
    private recommenderService: RecommenderService,
    private followService: FollowService
  ) {}

  ngOnInit(): void {
    this.currentUserId = localStorage.getItem('userId') || '';
    this.loadFollowing();
    this.loadTab('all');
  }

  loadFollowing(): void {
    this.followService.getFollowing(this.currentUserId).subscribe({
      next: (follows: Follow[]) => {
        this.following = follows;
      }
    });
  }

  selectTab(key: TabKey): void {
    if (this.selectedTab === key) return;
    this.selectedTab = key;
    this.loadTab(key);
    this.scrollTabIntoView(key);
  }
  
  private scrollTabIntoView(key: TabKey): void {
    const index = this.tabs.findIndex(t => t.key === key);
    if (index === -1) return;
  
    // Allow DOM to update before scrolling
    setTimeout(() => {
      const nav = this.tabNav?.nativeElement;
      const btn = this.tabBtns?.toArray()[index]?.nativeElement;
      if (!nav || !btn) return;
  
      const btnLeft = btn.offsetLeft;
      const btnWidth = btn.offsetWidth;
      const navWidth = nav.offsetWidth;
  
      // Center the active tab in the scroll container
      nav.scrollTo({
        left: btnLeft - navWidth / 2 + btnWidth / 2,
        behavior: 'smooth'
      });
    }, 0);
  }

  loadTab(key: TabKey): void {
    if (this.profileCache[key]) {
      this.displayedProfiles = this.profileCache[key]!;
      return;
    }

    this.loading = true;
    this.displayedProfiles = [];

    this.getTabSource(key).subscribe({
      next: (profiles: Profile[]) => {
        const filtered = profiles.filter((p: Profile) => p.userId !== this.currentUserId);
        this.profileCache[key] = filtered;
        this.displayedProfiles = filtered;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  private getTabSource(key: TabKey): Observable<Profile[]> {
    switch (key) {
      case 'skills':
        return this.recommenderService.suggestProfilesBySkills();
      case 'interests':
        return this.recommenderService.suggestProfilesByInterests();
      case 'course':
        return this.recommenderService.suggestProfilesByCourse();
      case 'academicLevel':
        return this.recommenderService.suggestProfilesByAcademicLevel();
      case 'institution':
        return this.recommenderService.suggestProfilesByInstitution();
      default:
        return this.recommenderService.getRecommendations().pipe(
          map(response => response.profiles)
        );
    }
  }

  isUserFollowing(userId: string): boolean {
    return this.following.some((f: Follow) => f.followingId === userId);
  }

  followUser(userId: string): void {
    this.followService.followUser(userId).subscribe({
      next: () => {
        // Optimistically update local following list
        const tempFollow: Follow = {
          id: '',
          followerId: this.currentUserId,
          followingId: userId,
          createdAt: new Date().toISOString()
        };
        this.following = [...this.following, tempFollow];
        // Refresh following list from server
        this.loadFollowing();
      }
    });
  }

  unfollowUser(userId: string): void {
    this.followService.unFollowUser(userId).subscribe({
      next: () => {
        // Optimistically remove from local following list
        this.following = this.following.filter((f: Follow) => f.followingId !== userId);
      }
    });
  }

  trackByUserId(_index: number, profile: Profile): string {
    return profile.userId;
  }

  invalidateCacheAndReload(): void {
    this.profileCache = {};
    this.loadTab(this.selectedTab);
  }
}