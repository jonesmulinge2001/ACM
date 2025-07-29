import { Component, OnInit } from '@angular/core';
import { Post, Profile } from '../../interfaces';
import { PostService } from '../../services/post.service';
import { ToastrService } from 'ngx-toastr';
import { CommonModule } from '@angular/common';
import { ProfileService } from '../../services/profile.service';
import { FollowService } from '../../services/follow.service';

@Component({
  standalone: true,
  selector: 'app-home',
  imports: [CommonModule],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
})
export class HomeComponent implements OnInit {
  trendingPosts: Post[] = [];
  recentPosts: Post[] = [];
  recommendedPosts: Post[] = [];
  profiles: Profile[] = [];
  followingIds: string[] = [];

  loggedInUserId = localStorage.getItem('userId');
  loading = true;

  constructor(
    private postService: PostService,
    private toastr: ToastrService,
    private profileService: ProfileService,
    private followService: FollowService
  ) {}

  ngOnInit(): void {
    this.loading = true;
    this.loadFeedPosts();

    if (this.loggedInUserId) {
      this.followService.getFollowing(this.loggedInUserId).subscribe({
        next: (follows) => {
          this.followingIds = follows.map((f) => f.followingId);
        },
        error: () => this.toastr.error('Could not load following list'),
      });
    }

    this.loadProfilesWithFollowStats();
  }

  isFollowing(userId: string): boolean {
    return this.followingIds.includes(userId);
  }

  follow(userId: string): void {
    this.followService.followUser(userId).subscribe({
      next: () => {
        this.toastr.success('Followed successfully');
        this.followingIds.push(userId);
      },
      error: () => this.toastr.error('Follow failed')
    });
  }

  unFollow(userId: string): void {
    this.followService.unFollowUser(userId).subscribe({
      next: () => {
        this.toastr.info('Unfollowed');
        this.followingIds = this.followingIds.filter(id => id !== userId);
      },
      error: () => this.toastr.error('Unfollow failed')
    });
  }

  loadFeedPosts(): void {
    this.postService.getTrendingPosts().subscribe({
      next: (posts) => (this.trendingPosts = posts),
    });

    this.postService.getAllPosts().subscribe({
      next: (posts) => {
        this.recentPosts = posts;
      },
    });

    this.postService.getRecommendedPostsForUser().subscribe({
      next: (posts) => (this.recommendedPosts = posts),
      complete: () => (this.loading = false),
    });
  }

  private loadProfilesWithFollowStats(): void {
    this.profileService.getAllProfiles().subscribe({
      next: (profiles) => {
        this.profiles = profiles;

        this.profiles.forEach((profile) => {
          if (profile.id) {
            this.followService.getFollowStats(profile.id).subscribe({
              next: (followStats) => {
                profile.followersCount = followStats.followers;
                profile.followingCount = followStats.following;
              },
              error: () => 
                this.toastr.error('Error fetching profile stats'),
            });
          }
        });
      },
      error: () => 
        this.toastr.error('Error loading profiles'),
    });
  }
}
