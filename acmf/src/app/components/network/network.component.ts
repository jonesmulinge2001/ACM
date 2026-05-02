import { Component, Input, OnInit } from '@angular/core';
import { Follow, Profile } from '../../interfaces';
import { ProfileService } from '../../services/profile.service';
import { CommonModule } from '@angular/common';
import { StudentCardComponent } from '../shared/student-card/student-card.component';
import { FollowService } from '../../services/follow.service';
import { RecommenderService } from '../../services/recommender.service';
import { forkJoin } from 'rxjs';
import { IntentMatchesComponent } from "../intent-matches/intent-matches.component";

export type NetworkTab =
  | 'skills'
  | 'interests'
  | 'course'
  | 'academic-level'
  | 'institution'
  | 'matches';

export interface TabConfig {
  key: NetworkTab;
  label: string;
  icon: string;
  description: string;
  emptyIcon: string;
  emptyTitle: string;
  emptySubtitle: string;
}

@Component({
  imports: [CommonModule, StudentCardComponent, IntentMatchesComponent],
  selector: 'app-network',
  templateUrl: './network.component.html',
  styleUrls: ['./network.component.css'],
})
export class NetworkComponent implements OnInit {
  currentUserId: string = '';
  selectedTab: NetworkTab = 'skills';

  // Recommender buckets
  bySkills: Profile[] = [];
  byInterests: Profile[] = [];
  byCourse: Profile[] = [];
  byAcademicLevel: Profile[] = [];
  byInstitution: Profile[] = [];

  // For follow state
  following: Follow[] = [];

  loading = false;

  @Input() profile!: Profile;

  readonly tabs: TabConfig[] = [
    {
      key: 'skills',
      label: 'Skills',
      icon: 'psychology',
      description: 'People who share your skills — great for collaboration and study groups.',
      emptyIcon: 'psychology',
      emptyTitle: 'No skill matches yet',
      emptySubtitle: 'Add skills to your profile to find peers who share your expertise.',
    },
    {
      key: 'interests',
      label: 'Interests',
      icon: 'favorite_border',
      description: 'People who share your interests and passions.',
      emptyIcon: 'favorite_border',
      emptyTitle: 'No interest matches yet',
      emptySubtitle: 'Add interests to your profile to discover like-minded peers.',
    },
    {
      key: 'course',
      label: 'Same Course',
      icon: 'school',
      description: 'Classmates studying the same course as you.',
      emptyIcon: 'school',
      emptyTitle: 'No coursemates found',
      emptySubtitle: 'Make sure your course is set in your profile.',
    },
    {
      key: 'academic-level',
      label: 'Academic Level',
      icon: 'military_tech',
      description: 'Peers at the same academic level as you.',
      emptyIcon: 'military_tech',
      emptyTitle: 'No matches at your level',
      emptySubtitle: 'Ensure your academic level is set in your profile.',
    },
    {
      key: 'institution',
      label: 'Institution',
      icon: 'account_balance',
      description: 'People from your institution — build your local network.',
      emptyIcon: 'account_balance',
      emptyTitle: 'No institution matches',
      emptySubtitle: 'Make sure your institution is set in your profile.',
    },
    {
      key: 'matches',
      label: 'Matches',
      icon: 'auto_awesome',
      description: 'Students whose goals and skills align with yours.',
      emptyIcon: 'groups',
      emptyTitle: 'No intent matches yet',
      emptySubtitle: 'Set your intent to discover matching students.'
    }
  ];

  get activeTab(): TabConfig | undefined {
    return this.tabs.find((t) => t.key === this.selectedTab);
  }

  constructor(
    private profileService: ProfileService,
    private followService: FollowService,
    private recommenderService: RecommenderService,
  ) {}

  ngOnInit() {
    this.currentUserId = localStorage.getItem('userId') || '';
    this.fetchAllData();
  }

  fetchAllData() {
    this.loading = true;

    const start = Date.now();

    forkJoin({
      skills:        this.recommenderService.suggestProfilesBySkills(),
      interests:     this.recommenderService.suggestProfilesByInterests(),
      course:        this.recommenderService.suggestProfilesByCourse(),
      academicLevel: this.recommenderService.suggestProfilesByAcademicLevel(),
      institution:   this.recommenderService.suggestProfilesByInstitution(),
      following:     this.followService.getFollowing(this.currentUserId),
    }).subscribe({
      next: ({ skills, interests, course, academicLevel, institution, following }) => {
        this.bySkills        = skills;
        this.byInterests     = interests;
        this.byCourse        = course;
        this.byAcademicLevel = academicLevel;
        this.byInstitution   = institution;
        this.following       = following;

        const elapsed = Date.now() - start;
        const delay = Math.max(0, 1500 - elapsed);
        setTimeout(() => (this.loading = false), delay);
      },
      error: () => (this.loading = false),
    });
  }

  getProfiles(tab: NetworkTab): Profile[] {
    switch (tab) {
      case 'skills':         return this.bySkills;
      case 'interests':      return this.byInterests;
      case 'course':         return this.byCourse;
      case 'academic-level': return this.byAcademicLevel;
      case 'institution':    return this.byInstitution;
      default:               return [];
    }
  }

  isUserFollowing(userId: string): boolean {
    return this.following.some((f) => f.followingId === userId);
  }

  followUser(userId: string) {
    this.followService.followUser(userId);
  
    this.followService.followUser(userId).subscribe({ 
      error: () => this.followService.unFollowUser(userId)
    });
  }
  
  unfollowUser(userId: string) {
    this.followService.unFollowUser(userId);
  
    this.followService.unFollowUser(userId).subscribe({
      error: () => this.followService.followUser(userId)
    });
  }
  trackByUserId(index: number, profile: Profile): string {
    return profile.userId;
  }

  scrollTabIntoView(event: MouseEvent) {
    const btn = event.currentTarget as HTMLElement;
    btn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
  }
}