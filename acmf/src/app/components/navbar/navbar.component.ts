import { Component, OnInit, OnDestroy, Inject, PLATFORM_ID } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ProfileService } from '../../services/profile.service';
import { ToastrService } from 'ngx-toastr';
import { Profile } from '../../interfaces';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { GlobalSearchService } from '../../services/global-search.service';
import { GlobalSearchResult } from '../../interfaces';
import { Subject, debounceTime, switchMap } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { isPlatformBrowser } from '@angular/common'; 
import { NotificationService } from '../../services/notification.service';
import { NotificationComponent } from '../notifications/notifications.component';
import { SettingsPanelComponent } from "../../settings/settings-panel/settings-panel.component";

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    NotificationComponent,
    SettingsPanelComponent
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
  logoutModalOpen = false;
  searchQuery = '';
  searchResults: GlobalSearchResult = { profiles: [], posts: [], resources: [] };
  loading = false;
  searchPanelOpen = false;

  window = window;
  
  private socketSub?: Subscription;
  private searchSubject = new Subject<string>();
  private notificationSub?: Subscription;

  settingsPanelOpen: boolean = false;

  constructor(
    private router: Router,
    private authService: AuthService,
    private profileService: ProfileService,
    private toastr: ToastrService,
    private searchService: GlobalSearchService,
    private notificationService: NotificationService,
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

      // Subscribe to notification unread count
      this.notificationSub = this.notificationService.unreadCount$.subscribe(
        count => {
          this.unreadCount = count;
        }
      );
    }
  }

  ngOnDestroy(): void {
    this.socketSub?.unsubscribe();
    this.notificationSub?.unsubscribe();
    document.removeEventListener('click', this.closeMenuOnOutsideClick.bind(this));
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
    
    // Close menu if clicking outside
    const isInsideMenu = target.closest('.profile-dropdown-container');
    if (!isInsideMenu && this.menuOpen) {
      this.menuOpen = false;
    }
  }

  openLogoutModal(): void {
    this.menuOpen = false;
    this.logoutModalOpen = true;
  }

  navigateToProfile(profileId: string) {
    this.router.navigate(['/profile', profileId]);
  }

  navigateToPost(postId: string) {
    this.router.navigate(['/posts', postId]);
  }

  navigateToResource(resourceId: string) {
    // TODO: specific resource detail
    this.router.navigate(['/resources']); 
  }

  toggleSettingsPanel() {
    this.settingsPanelOpen = !this.settingsPanelOpen;
  }

  closeSettingsPanel() {
    this.settingsPanelOpen = false;
  }

  logOut(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('userid');
    localStorage.removeItem('role');
    this.logoutModalOpen = false;
    this.router.navigate(['/login']);
  }
}