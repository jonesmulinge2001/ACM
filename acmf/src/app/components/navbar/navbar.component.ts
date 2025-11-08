import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ProfileService } from '../../services/profile.service';
import { ToastrService } from 'ngx-toastr';
import { Profile, StudentNotification } from '../../interfaces';
import { CommonModule } from '@angular/common';
import { StudentNotificationService } from '../../services/student-notification.service';
import { NotificationSocketService } from '../../services/notification-socket.service';
import { Subscription } from 'rxjs';
import { NotificationCenterComponent } from '../notification-center/notification-center.component';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule, NotificationCenterComponent],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css',
})
export class NavbarComponent implements OnInit, OnDestroy {
  isLoggedIn = false;
  userName = '';
  userImage = '';
  menuOpen = false;
  unreadCount = 0;
  notifPanelOpen = false;
  logoutModalOpen = false; 
  private socketSub?: Subscription;

  constructor(
    private router: Router,
    private authService: AuthService,
    private profileService: ProfileService,
    private toastr: ToastrService,
    private notifService: StudentNotificationService,
    private notifSocket: NotificationSocketService
  ) {}

  ngOnInit(): void {
    this.isLoggedIn = this.authService.isLoggedIn();
    document.addEventListener('click', this.closeMenuOnOutsideClick.bind(this))

    if (this.isLoggedIn) {
      this.profileService.getMyProfile().subscribe({
        next: (profile: Profile) => {
          this.userName = profile.name;
          this.userImage = profile.profileImage || 'https://via.placeholder.com/40';
        },
        error: () => this.toastr.error('Error loading profile'),
      });

      // Load initial notifications count
      this.notifService.getUnread().subscribe({
        next: (unread: StudentNotification[]) => {
          this.unreadCount = unread.length;
        },
      });

      // Real-time updates
      this.socketSub = this.notifSocket.onNewNotification().subscribe((notif) => {
        if (notif.status === 'UNREAD') {
          this.unreadCount++;
        }
      });
    }
  }

  ngOnDestroy(): void {
    this.socketSub?.unsubscribe();
  }

  toggleMenu(): void {
    this.menuOpen = !this.menuOpen;
  }

  toggleNotifPanel(): void {
    this.notifPanelOpen = !this.notifPanelOpen;
  }



  viewProfile(): void {
    this.menuOpen = false;
    this.router.navigate(['/my-profile']);
  }
  
  
closeMenuOnOutsideClick(event: MouseEvent): void {
  const target = event.target as HTMLElement;
  const isInside = target.closest('.relative'); // The profile dropdown wrapper
  if (!isInside) {
    this.menuOpen = false;
  }
}

openLogoutModal(): void {
  this.menuOpen = false; // close dropdown
  this.logoutModalOpen = true;
}

// UPDATED: Log out directly from component
logOut(): void {
  localStorage.removeItem('token');
  localStorage.removeItem('userid');
  localStorage.removeItem('role');
  this.logoutModalOpen = false; // close modal
  this.router.navigate(['/login']);
}

onNotificationsRead() {
  this.unreadCount = 0;
}
}

