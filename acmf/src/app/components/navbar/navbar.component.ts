import { Component, OnInit, OnDestroy, Inject, PLATFORM_ID } from '@angular/core';
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
import { SearchResultsComponent } from '../search-results/search-results.component';
import { GlobalSearchService } from '../../services/global-search.service';
import { GlobalSearchResult } from '../../interfaces';
import { Subject, debounceTime, switchMap } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { isPlatformBrowser } from '@angular/common'; 

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule,
    RouterModule, 
    NotificationCenterComponent,
    SearchResultsComponent,
    
  ],
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
  searchQuery = '';
  searchResults: GlobalSearchResult = { profiles: [], posts: [], resources: [] };
  loading = false;
  searchPanelOpen = false;

  window = window;
  
  private socketSub?: Subscription;
  private searchSubject = new Subject<string>();

  constructor(
    private router: Router,
    private authService: AuthService,
    private profileService: ProfileService,
    private toastr: ToastrService,
    private notifService: StudentNotificationService,
    private notifSocket: NotificationSocketService,
    private searchService: GlobalSearchService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.window = window;
    }
    this.isLoggedIn = this.authService.isLoggedIn();
    document.addEventListener('click', this.closeMenuOnOutsideClick.bind(this));

    // Search subscription
    this.searchSubject
      .pipe(
        debounceTime(300),
        switchMap(query => {
          this.loading = true;
          return this.searchService.search(query);
        })
      )
      .subscribe({
        next: (res) => {
          this.searchResults = {
            profiles: res.profiles || [],
            posts: res.posts || [],
            resources: res.resources || []
          };
          this.loading = false;
          this.searchPanelOpen = true;
        },
        error: () => {
          this.loading = false;
          this.searchResults = { profiles: [], posts: [], resources: [] };
        }
      });

    if (this.isLoggedIn) {
      this.profileService.getMyProfile().subscribe({
        next: (profile: Profile) => {
          this.userName = profile.name;
          this.userImage =
            profile.profileImage || 'https://via.placeholder.com/40';
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
      this.socketSub = this.notifSocket
        .onNewNotification()
        .subscribe((notif) => {
          if (notif.status === 'UNREAD') {
            this.unreadCount++;
          }
        });
    }
  }

  ngOnDestroy(): void {
    this.socketSub?.unsubscribe();
  }

  // Search methods
  onSearchQueryChange(value: string): void {
    this.searchQuery = value;
    if (value.trim()) {
      this.searchSubject.next(value);
    } else {
      this.searchResults = { profiles: [], posts: [], resources: [] };
      this.searchPanelOpen = false;
    }
  }

  toggleSearchPanel(): void {
    this.searchPanelOpen = !this.searchPanelOpen;
    if (this.searchPanelOpen && this.searchQuery.trim()) {
      this.searchSubject.next(this.searchQuery);
    }
  }

  closeSearchPanel(): void {
    this.searchPanelOpen = false;
  }

  viewAllResults(): void {
    this.closeSearchPanel();
    this.router.navigate(['/search'], { 
      queryParams: { q: this.searchQuery } 
    });
  }

  onSearchItemClick(): void {
    this.closeSearchPanel();
    this.searchQuery = '';
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
    
    // Close search panel if clicking outside
    const isInsideSearch = target.closest('.search-container');
    if (!isInsideSearch) {
      this.searchPanelOpen = false;
    }
    
    // Close notification panel if clicking outside
    const isInsideNotif = target.closest('.notification-container');
    if (!isInsideNotif && this.notifPanelOpen) {
      this.notifPanelOpen = false;
    }
    
    // Close menu if clicking outside
    const isInsideMenu = target.closest('.relative');
    if (!isInsideMenu) {
      this.menuOpen = false;
    }
  }

  openLogoutModal(): void {
    this.menuOpen = false;
    this.logoutModalOpen = true;
  }

  logOut(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('userid');
    localStorage.removeItem('role');
    this.logoutModalOpen = false;
    this.router.navigate(['/login']);
  }

  onNotificationsRead() {
    this.unreadCount = 0;
  }
}