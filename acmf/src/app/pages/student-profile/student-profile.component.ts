import { Component, Input, input, OnInit } from '@angular/core';
import { Follow, Post, Profile } from '../../interfaces';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { PostService } from '../../services/post.service';
import { FollowService } from '../../services/follow.service';
import { ProfileService } from '../../services/profile.service';
import { CommonModule } from '@angular/common';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';
import {
  trigger,
  style,
  animate,
  transition,
  query,
  stagger,
} from '@angular/animations';
import { DmChatComponent } from "../../components/dm-chat/dm-chat/dm-chat.component";

@Component({
  selector: 'app-student-profile',
  imports: [CommonModule, RouterModule, NgxSkeletonLoaderModule, DmChatComponent],
  templateUrl: './student-profile.component.html',
  styleUrl: './student-profile.component.css',
  animations: [
    trigger('postsAnimation', [
      transition(':enter', [
        query(
          ':enter',
          [
            style({ opacity: 0, transform: 'translateY(15px)' }),
            stagger(120, [
              animate(
                '500ms ease-out',
                style({ opacity: 1, transform: 'translateY(0)' })
              ),
            ]),
          ],
          { optional: true }
        ),
      ]),
    ]),
  ],
})
export class StudentProfileComponent implements OnInit {
  activeTab: 'posts' | 'followers' | 'following' = 'posts';

  profileId!: string;
  userProfile!: Profile;
  userPosts: Post[] = [];
  followers: Follow[] = [];
  following: Follow[] = [];
  isFollowing = false;
  currentUserId = '';

  isLoading = true;
  errorMessage = '';

  @Input() profile!: Profile;
  showFullBio = false;

  showFullBody: { [postId: string]: boolean } = {};

  activeChatUserId?: string;

  constructor(
    private route: ActivatedRoute,
    private postService: PostService,
    private followService: FollowService,
    private profileService: ProfileService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      this.profileId = params.get('id')!;
      this.currentUserId = JSON.parse(localStorage.getItem('user') || '{}')?.id;
      this.fetchProfileData();
    });
  }

  fetchProfileData(): void {
    this.isLoading = true;

    // fetch profile
    this.profileService.getProfileByUserId(this.profileId).subscribe({
      next: (profile) => {
        this.userProfile = profile;
      },
      error: () => {
        this.errorMessage = 'failed to load profile';
        this.isLoading = false;
      },
    });

    //fetch posts
    this.postService.getPostsByUserId(this.profileId).subscribe({
      next: (posts) => {
        this.userPosts = posts;
      },
      error: () => {
        this.errorMessage = 'failed to load posts';
      },
    });

    // fetch followers

    this.followService.getFollowers(this.profileId).subscribe({
      next: (followers) => {
        this.followers = followers;
        this.checkIfFollowing();
      },
      error: () => {
        this.errorMessage = 'failed to load followers';
      },
    });

    //fetch following
    this.followService.getFollowing(this.profileId).subscribe({
      next: (following) => {
        this.following = following;
      },
      error: () => {
        this.errorMessage = 'failed to load following';
      },
      complete: () => {
        setTimeout(() => {
          this.isLoading = false;
        }, 2000);
      },
    });
  }

  loadFollowingState() {
    this.followService.getFollowing(this.currentUserId).subscribe(following => {
      this.following = following;
      this.isFollowing = this.following.some(
        f => f.followingId === this.profile.userId
      );
    });
  }

  

  checkIfFollowing(): void {
    this.isFollowing = this.followers.some(
      (f) => f.followerId === this.currentUserId
    );
  }

  isUserFollowing(userId: string): boolean {
    return this.following.some(f => f.followingId === userId);
  }
  

  toggleFollow(): void {
    if (this.isFollowing) {
      this.followService.unFollowUser(this.profileId).subscribe(() => {
        this.isFollowing = false;
        this.fetchProfileData(); // refresh data
      });
    } else {
      this.followService.followUser(this.profileId).subscribe(() => {
        this.isFollowing = true;
        this.fetchProfileData();
      });
    }
  }

  toggleFollowUser(userId: string): void {
    if (this.isUserFollowing(userId)) {
      this.followService.unFollowUser(userId).subscribe(() => {
        this.loadFollowingState(); // refresh list
      });
    } else {
      this.followService.followUser(userId).subscribe(() => {
        this.loadFollowingState(); // refresh list
      });
    }
  }
  
  

  // navigateToProfile() {
  //   this.router.navigate(['/profile', this.profile.userId]);
  // }

  toggleReadMore(event: Event): void {
    event.preventDefault();
    this.showFullBio = !this.showFullBio;
  }

  getShortBio(bio?: string): string {
    if (!bio) return '';
    return this.showFullBio
      ? bio
      : bio.split(' ').slice(0, 8).join(' ') +
          (bio.split(' ').length > 8 ? '...' : '');
  }

  hasLongBio(): boolean {
    return (
      !!this.userProfile?.bio && this.userProfile.bio.split(' ').length > 8
    );
  }

  // Track expanded state for each post

  togglePostReadMore(event: Event, postId: string): void {
    event.preventDefault();
    this.showFullBody[postId] = !this.showFullBody[postId];
  }

  getShortBody(postId: string, body?: string): string {
    if (!body) return '';
    const isExpanded = this.showFullBody[postId];
    return isExpanded
      ? body
      : body.split(' ').slice(0, 8).join(' ') +
          (body.split(' ').length > 8 ? '...' : '');
  }

  hasLongBody(body?: string): boolean {
    return !!body && body.split(' ').length > 8;
  }
  openInlineChat(participantId?: string) {
    if (!participantId) return;
    // Always set the ID to open the chat
    this.activeChatUserId = participantId;
  }
  
}
