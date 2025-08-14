import { Component, Input, Output, EventEmitter } from '@angular/core';
import { Profile } from '../../../interfaces';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  imports: [CommonModule],
  selector: 'app-student-card',
  templateUrl: './student-card.component.html',
  styleUrls: ['./student-card.component.css']
})
export class StudentCardComponent {
  @Input() profile!: Profile;
  @Input() isFollowing: boolean = false;

  @Output() follow = new EventEmitter<string>();
  @Output() unfollow = new EventEmitter<string>();

  constructor(private router: Router) {}

  handleFollow() {
    this.follow.emit(this.profile.userId);
  }

  handleUnfollow() {
    this.unfollow.emit(this.profile.userId);
  }

  navigateToProfile() {
    this.router.navigate(['/profile', this.profile.userId]);
  }

  getShortBio(bio?: string): string {
    if (!bio) return '';
  
    const words = bio.split(' ');
    
    if (this.profile.showFullBio) {
      return bio;
    }
  
    return words.length > 8 ? words.slice(0, 8).join(' ') + '...' : bio;
  }
  
  toggleReadMore(event: MouseEvent) {
    event.stopPropagation();
    this.profile.showFullBio = !this.profile.showFullBio;
  }
  
  
}
