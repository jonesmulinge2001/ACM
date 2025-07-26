import { Component, OnInit } from '@angular/core';
import { ProfileService } from '../../../services/profile.service';
import { ToastrService } from 'ngx-toastr';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterLink, RouterModule } from '@angular/router';
import { Follow, Profile, ProfileView } from '../../../interfaces';

@Component({
  selector: 'app-my-profile',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
  ],
  templateUrl: './my-profile.component.html',
  styleUrl: './my-profile.component.css',
})
export class MyProfileComponent implements OnInit {
  profile?: Profile;
  isLoading = true;
  coverPreview: string | null = null;
  profilePreview: string | null = null;
  followers: Follow[] = [];
  following: Follow[] = [];
  profileViews: ProfileView[] = [];
  showProfileModal = true;

closeProfileModal() {
  this.showProfileModal = false;
}


  // Toggle tab: 'followers' or 'following'
  selectedTab: 'followers' | 'following' = 'followers';

  constructor(
    private profileService: ProfileService,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.loadProfile();
  }

  // Load your own profile + followers/following
  loadProfile(): void {
    this.profileService.getMyProfile().subscribe({
      next: (data) => {
        this.profile = data;
        this.coverPreview = data.coverPhoto || null;
        this.profilePreview = data.profileImage || null;
        this.isLoading = false;

        const userId = data.userId;
        if (userId) {
          this.loadFollowersAndFollowing(userId);
          // this.loadProfileViews(userId);
        }
      },
      error: () => {
        this.toastr.error('Error loading your profile');
        this.isLoading = false;
      },
    });
  }

  loadFollowersAndFollowing(userId: string): void {
    this.profileService.getFollowers(userId).subscribe({
      next: (followers) => (this.followers = followers),
      error: () => this.toastr.error('Failed to load followers'),
    });

    this.profileService.getFollowing(userId).subscribe({
      next: (following) => (this.following = following),
      error: () => this.toastr.error('Failed to load following'),
    });
  }

  onCoverPhotoSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) {
      this.coverPreview = URL.createObjectURL(file);
      this.profileService.uploadCoverPhoto(file).subscribe({
        next: (updated) => {
          this.profile = updated;
          this.toastr.success('Cover photo updated');
        },
        error: () => this.toastr.error('Failed to upload cover photo'),
      });
    }
  }

  onProfileImageSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) {
      this.profilePreview = URL.createObjectURL(file);
      this.profileService.uploadProfileImage(file).subscribe({
        next: (updated) => {
          this.profile = updated;
          this.toastr.success('Profile image updated');
        },
        error: () => this.toastr.error('Failed to upload profile image'),
      });
    }
  }

  isFollowingUser(userId: string): boolean {
    return this.following.some(
      (f) => f.following?.profile?.userId === userId
    );
  }

  follow(userId: string): void {
    this.profileService.followUser(userId).subscribe({
      next: () => {
        this.toastr.success('Followed successfully');
        this.loadProfile();
      },
      error: () => this.toastr.error('Failed to follow user'),
    });
  }

  unFollow(userId: string): void {
    this.profileService.unFollowUser(userId).subscribe({
      next: () => {
        this.toastr.success('Unfollowed successfully');
        this.loadProfile();
      },
      error: () => this.toastr.error('Failed to unfollow user'),
    });
  }

  canFollow(userId: string | undefined): boolean {
    if (!userId || userId === this.profile?.userId) return false;
    return !this.isFollowingUser(userId);
  }

  toggleFollow(userId: string): void {
    if (this.isFollowingUser(userId)) {
      this.profileService.unFollowUser(userId).subscribe({
        next: () => {
          this.following = this.following.filter(
            (f) => f.following?.profile?.userId !== userId
          );
        },
        error: () => this.toastr.error('Failed to unfollow user'),
      });
    } else {
      this.profileService.followUser(userId).subscribe({
        next: (newFollow) => {
          this.following.push(newFollow);
        },
        error: () => this.toastr.error('Failed to follow user'),
      });
    }
  }

  // Switch between followers and following view
  setTab(tab: 'followers' | 'following') {
    this.selectedTab = tab;
  }

  // loadProfileViews(userId: string): void {
  //   this.profileService.getProfileViewers(userId).subscribe({
  //     next: (views) => {
  //       this.profileViews = views;
  //     },
  //     error: () => this.toastr.error('Failed to load profile views')
  //   });
  // }
}
