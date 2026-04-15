import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { Profile } from '../../../interfaces';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  imports: [CommonModule],
  selector: 'app-student-card',
  templateUrl: './student-card.component.html',
  styleUrls: ['./student-card.component.css']
})
export class StudentCardComponent implements OnInit {
  @Input() profile!: Profile;
  @Input() isFollowing: boolean = false;

  @Output() follow = new EventEmitter<string>();
  @Output() unfollow = new EventEmitter<string>();

  // Local reactive state — updates immediately without waiting for parent
  followState: boolean = false;
  isLoading: boolean = false;
  displayFollowers: number = 0;
  showAllSkills: boolean = false;

  constructor(private router: Router) {}

  ngOnInit() {
    // Initialize local state from inputs
    this.followState = this.isFollowing;
    this.displayFollowers = this.profile.followersCount || 0;
  }

  get displayedSkills(): string[] {
    if (!this.profile.skills) return [];
    return this.showAllSkills ? this.profile.skills : this.profile.skills.slice(0, 3);
  }

  handleFollow() {
    if (this.isLoading) return;

    // Optimistic update — instant UI change
    this.followState = true;
    this.displayFollowers += 1;

    this.follow.emit(this.profile.userId);
  }

  handleUnfollow() {
    if (this.isLoading) return;

    // Optimistic update — instant UI change
    this.followState = false;
    this.displayFollowers = Math.max(0, this.displayFollowers - 1);

    this.unfollow.emit(this.profile.userId);
  }

  navigateToProfile() {
    this.router.navigate(['/profile', this.profile.userId]);
  }

  getShortBio(bio?: string): string {
    if (!bio) return '';
    const words = bio.split(' ');
    if (this.profile.showFullBio) return bio;
    return words.length > 8 ? words.slice(0, 8).join(' ') : bio;
  }

  toggleReadMore(event: MouseEvent) {
    event.stopPropagation();
    this.profile.showFullBio = !this.profile.showFullBio;
  }

  toggleSkills(event: MouseEvent) {
    event.stopPropagation();
    this.showAllSkills = !this.showAllSkills;
  }
}