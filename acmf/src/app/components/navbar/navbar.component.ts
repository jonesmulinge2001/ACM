import { Component, OnInit, OnDestroy, Inject, PLATFORM_ID, EventEmitter, Output } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ProfileService } from '../../services/profile.service';
import { ToastrService } from 'ngx-toastr';
import { ConversationSummary, Profile } from '../../interfaces';
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
import { ConversationsService } from '../../services/conversations.service';
import { DmChatComponent } from '../dm-chat/dm-chat/dm-chat.component';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    NotificationComponent,
    SettingsPanelComponent,
    DmChatComponent
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

  recentConversations: ConversationSummary[] = [];
  recentPanelOpen: boolean = false;

  // Add computed properties
  totalUnreadMessages: number = 0;
  
  // Chat modal properties
  activeConversationId: string | null = null;
  chatModalOpen: boolean = false;

  @Output() chatOpened = new EventEmitter<void>();
@Output() chatClosed = new EventEmitter<void>();

  
  
  constructor(
    private router: Router,
    private authService: AuthService,
    private profileService: ProfileService,
    private toastr: ToastrService,
    private searchService: GlobalSearchService,
    private notificationService: NotificationService,
    private conversationsService: ConversationsService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit(): void {
    this.loadRecentConversations();
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
          this.userImage = profile.profileImage || 'https://via.placeholder.com/40';
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

  loadRecentConversations(): void {
    this.conversationsService.list().subscribe({
      next: (convos: any[]) => {
        console.log('Loaded conversations raw:', convos);
        
        // Map the backend response to match our interface
        this.recentConversations = convos.map(convo => ({
          id: convo.conversationId || convo.id, // Map conversationId to id
          title: convo.title,
          isGroup: convo.isGroup,
          participants: convo.participants,
          lastMessage: convo.lastMessage,
          unreadCount: convo.unreadCount || 0
        }));
        
        console.log('Mapped conversations:', this.recentConversations);
        this.calculateTotalUnreadMessages();
      },
      error: (err) => {
        console.error('Error fetching recent conversations', err);
        this.toastr.error('Failed to load conversations');
      }
    });
  }

  // Add this method to calculate total unread messages
  calculateTotalUnreadMessages(): void {
    this.totalUnreadMessages = this.recentConversations.reduce(
      (acc, c) => acc + (c.unreadCount || 0), 
      0
    );
  }

  // Add method to get conversation display name
  getConversationDisplayName(convo: ConversationSummary): string {
    if (convo.title) {
      return convo.title;
    }
    
    // Filter out current user and join names
    const otherParticipantNames = convo.participants
      .filter(p => p.name !== this.userName)
      .map(p => p.name)
      .join(', ');
    
    return otherParticipantNames || 'Unknown';
  }

  // Add method to get other participant's image
  getOtherParticipantImage(convo: ConversationSummary): string {
    if (convo.isGroup) {
      return 'https://via.placeholder.com/40'; // Default for groups
    }
    
    const userId = localStorage.getItem('userid');
    const otherParticipant = convo.participants.find(p => p.id !== userId);
    
    return otherParticipant?.profileImage || 'https://via.placeholder.com/40';
  }

  toggleRecentPanel(): void {
    this.recentPanelOpen = !this.recentPanelOpen;
  }

  openConversation(conversationId: string): void {
    this.recentPanelOpen = false;
  
    if (!conversationId || conversationId.trim() === '') {
      console.error('Invalid conversation ID:', conversationId);
      this.toastr.error('Cannot open conversation: Invalid ID');
      return;
    }
  
    this.activeConversationId = conversationId;
    this.chatModalOpen = true;
  
    //  TELL LAYOUT CHAT IS OPEN
    this.chatOpened.emit();
  }
  

  closeChatModal(): void {
    this.chatModalOpen = false;
    this.activeConversationId = null;
  
    //  TELL LAYOUT CHAT IS CLOSED
    this.chatClosed.emit();
  }
  

  logOut(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('userid');
    localStorage.removeItem('role');
    this.logoutModalOpen = false;
    this.router.navigate(['/login']);
  }
}