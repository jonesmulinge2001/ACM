import { Component, OnInit } from '@angular/core';
import { ProfileService } from '../../../services/profile.service';
import { ToastrService } from 'ngx-toastr';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink, RouterModule } from '@angular/router';
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

  selectedTab: 'followers' | 'following' = 'followers';
  isBioExpanded: boolean = false;
  bioCharLimit: number = 150;

  // Progress & Badge
  completionPercentage = 0;
  completedFields = 0;
  totalFields = 9; // name, institution, academicLevel, course, skills, bio, interests, profileImage, coverPhoto
  showBadge = false;
  badgeAnimating = false;
  showCompletionCard = true; // user can dismiss the nudge card

  constructor(
    private profileService: ProfileService,
    private toastr: ToastrService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadProfile();
  }

  loadProfile(): void {
    this.profileService.getMyProfile().subscribe({
      next: (data) => {
        this.profile = data;
        this.coverPreview = data.coverPhoto || null;
        this.profilePreview = data.profileImage || null;
        this.isLoading = false;

        this.calculateProfileCompletion();

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

  calculateProfileCompletion(): void {
    if (!this.profile) return;

    let filled = 0;

    if (this.profile.name?.trim()) filled++;
    if (this.profile.institution?.name || (this.profile as any).institutionId) filled++;
    if (this.profile.academicLevel?.trim()) filled++;
    if (this.profile.course?.trim()) filled++;
    if (this.profile.skills && this.profile.skills.length > 0) filled++;
    if (this.profile.bio?.trim()) filled++;
    if (this.profile.interests && (this.profile as any).interests?.length > 0) filled++;
    if (this.profile.profileImage?.trim()) filled++;
    if (this.profile.coverPhoto?.trim()) filled++;

    this.completedFields = filled;
    this.completionPercentage = Math.round((filled / this.totalFields) * 100);

    if (this.completionPercentage === 100) {
      // Small delay for a nicer reveal on page load
      setTimeout(() => {
        this.showBadge = true;
        this.badgeAnimating = true;
        setTimeout(() => (this.badgeAnimating = false), 1000);
      }, 600);
    }
  }

  get progressColor(): string {
    if (this.completionPercentage < 30) return 'from-red-400 to-orange-400';
    if (this.completionPercentage < 60) return 'from-orange-400 to-yellow-400';
    if (this.completionPercentage < 90) return 'from-yellow-400 to-blue-500';
    return 'from-blue-500 to-purple-600';
  }

  get progressLabel(): string {
    if (this.completionPercentage === 0) return 'Just getting started...';
    if (this.completionPercentage < 30) return 'Keep going!';
    if (this.completionPercentage < 60) return 'Making progress 🚀';
    if (this.completionPercentage < 90) return 'Almost there!';
    if (this.completionPercentage < 100) return 'One more step!';
    return 'Profile complete! 🎉';
  }

  get missingFields(): string[] {
    if (!this.profile) return [];
    const missing: string[] = [];
    if (!this.profile.bio?.trim()) missing.push('Bio');
    if (!this.profile.profileImage?.trim()) missing.push('Profile photo');
    if (!this.profile.coverPhoto?.trim()) missing.push('Cover photo');
    if (!this.profile.skills || this.profile.skills.length === 0) missing.push('Skills');
    if (!(this.profile as any).interests || (this.profile as any).interests?.length === 0) missing.push('Interests');
    if (!this.profile.course?.trim()) missing.push('Course');
    if (!this.profile.academicLevel?.trim()) missing.push('Academic level');
    return missing;
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
      if (file.size > 5 * 1024 * 1024) {
        this.toastr.error('Cover image must be less than 5MB');
        return;
      }
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        this.toastr.error('Only JPEG, PNG, GIF, and WEBP images are allowed');
        return;
      }
      this.coverPreview = URL.createObjectURL(file);
      this.profileService.uploadCoverPhoto(file).subscribe({
        next: (updated) => {
          this.profile = updated;
          this.toastr.success('Cover photo updated');
          this.calculateProfileCompletion();
        },
        error: () => this.toastr.error('Failed to upload cover photo'),
      });
    }
  }

  onProfileImageSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        this.toastr.error('Profile image must be less than 2MB');
        return;
      }
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        this.toastr.error('Only JPEG, PNG, GIF, and WEBP images are allowed');
        return;
      }
      this.profilePreview = URL.createObjectURL(file);
      this.profileService.uploadProfileImage(file).subscribe({
        next: (updated) => {
          this.profile = updated;
          this.toastr.success('Profile image updated');
          this.calculateProfileCompletion();
        },
        error: () => this.toastr.error('Failed to upload profile image'),
      });
    }
  }

  isFollowingUser(userId: string): boolean {
    return this.following.some((f) => f.following?.profile?.userId === userId);
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

  toggleBioReadMore(): void {
    this.isBioExpanded = !this.isBioExpanded;
  }
}