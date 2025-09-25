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
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule],
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

  // Toggle tab: 'followers' or 'following'
  selectedTab: 'followers' | 'following' = 'followers';

  constructor(
    private profileService: ProfileService,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.loadProfile();
  }

  closeProfileModal() {
    this.showProfileModal = false;
  }

  // Load your own profile + followers/following
  loadProfile(): void {
    this.profileService.getMyProfile().subscribe({
      next: (data) => {
        this.profile = data;
        this.coverPreview = data.coverPhoto || null;
        this.profilePreview = data.profileImage || null;
        this.isLoading = false;

        if (data.userId) {
          this.loadFollowersAndFollowing(data.userId);
        }
      },
      error: () => {
        console.error('Error loading your profile');
        this.isLoading = false;
      },
    });
  }

  loadFollowersAndFollowing(userId: string): void {
    this.profileService.getFollowers(userId).subscribe({
      next: (followers) => (this.followers = followers),
      error: () => console.error('Failed to load followers'),
    });

    this.profileService.getFollowing(userId).subscribe({
      next: (following) => (this.following = following),
      error: () => console.error('Failed to load following'),
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
        error: () => console.error('Failed to upload cover photo'),
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
        error: () => console.error('Failed to upload profile image'),
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
      error: () => console.error('Failed to follow user'),
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
      this.unFollow(userId);
    } else {
      this.follow(userId);
    }
  }

  setTab(tab: 'followers' | 'following') {
    this.selectedTab = tab;
  }
}
