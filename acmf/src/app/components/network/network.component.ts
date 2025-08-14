import { Component, Input, OnInit } from '@angular/core';
import { Follow, Profile } from '../../interfaces';
import { ProfileService } from '../../services/profile.service';
import { CommonModule } from '@angular/common';
import { StudentCardComponent } from "../shared/student-card/student-card.component";
import { FollowService } from '../../services/follow.service';
import { Router } from '@angular/router';

@Component({
  imports: [CommonModule, StudentCardComponent],
  selector: 'app-network',
  templateUrl: './network.component.html',
  styleUrls: ['./network.component.css']
})
export class NetworkComponent implements OnInit {
  currentUserId: string = '';
  selectedTab: 'all' | 'following' | 'followers' = 'all';

  allProfiles: Profile[] = [];
  following: Follow[] = [];
  followers: Follow[] = [];

  loading: boolean = false;

  @Input() profile!: Profile;
  @Input() isFollowing = false;

  constructor(
    private profileService: ProfileService, 
    private followService: FollowService,
    private router: Router
  ) {}

  ngOnInit() {
    this.currentUserId = localStorage.getItem('userId') || '';
    this.fetchAllData();
  }

  fetchAllData() {
    this.loading = true;

    const allProfiles$ = this.profileService.getAllProfiles();
    const following$ = this.followService.getFollowing(this.currentUserId);
    const followers$ = this.followService.getFollowers(this.currentUserId);

    const startTime = Date.now();
    let completedRequests = 0;

    const finishLoading = () => {
      completedRequests++;
      if (completedRequests === 3) {
        const elapsed = Date.now() - startTime;
        const remaining = 2000 - elapsed;
        setTimeout(() => {
          this.loading = false;
        }, remaining > 0 ? remaining : 0);
      }
    };

    allProfiles$.subscribe(all => {
      this.allProfiles = all.filter(p => p.userId !== this.currentUserId);
      finishLoading();
    });

    following$.subscribe(f => {
      this.following = f;
      finishLoading();
    });

    followers$.subscribe(f => {
      this.followers = f;
      finishLoading();
    });
  }

  isUserFollowing(userId: string): boolean {
    return this.following.some(f => f.followingId === userId);
  }

  followUser(userId: string) {
    this.profileService.followUser(userId).subscribe(() => {
      this.fetchAllData(); 
    });
  }
  
  unfollowUser(userId: string) {
    this.profileService.unFollowUser(userId).subscribe(() => {
      this.fetchAllData();
    });
  }

  getDisplayedProfiles(): Profile[] {
    if (this.selectedTab === 'all') {
      return this.allProfiles;
    } else if (this.selectedTab === 'following') {
      return this.following.map(f => f.following!.profile);
    } else if (this.selectedTab === 'followers') {
      return this.followers.map(f => f.follower!.profile);
    }
    return [];
  }
}
