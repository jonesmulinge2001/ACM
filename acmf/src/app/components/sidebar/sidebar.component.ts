import { Component, HostListener, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './sidebar.component.html'
})
export class SidebarComponent implements OnInit {
  collapsed = false;
  showSidebar = true;
  isBrowser: boolean;

  navItems = [
    { label: 'Feed', link: '/home', icon: 'dynamic_feed', activeIcon: 'feed' },
    { label: 'Network', link: '/network', icon: 'diversity_3', activeIcon: 'people' },
    { label: 'Create', link: '/create', icon: 'add_circle', activeIcon: 'edit' },
    // { label: 'UniTok', link: '/videos', icon: 'video_library', activeIcon: 'play_circle' },
    { label: 'Groups', link: '/groups', icon: 'handshake', activeIcon: 'group' },
  ];

  constructor(
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  ngOnInit(): void {
    if (this.isBrowser) {
      this.showSidebar = window.innerWidth >= 1024;
    }
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: any): void {
    if (this.isBrowser) {
      this.showSidebar = window.innerWidth >= 1024;
    }
  }

  isActiveRoute(route: string): boolean {
    return this.router.url === route || this.router.url.startsWith(route + '/');
  }

  getIconGradient(label: string): string {
    const gradients: { [key: string]: string } = {
      Feed: 'from-blue-500 to-purple-600',
      Network: 'from-indigo-500 to-purple-500',
      Create: 'from-green-500 to-emerald-500',
      UniTok: 'from-blue-500 to-cyan-500',
      Groups: 'from-pink-500 to-rose-500',
    };
  
    const gradient = gradients[label] || 'from-gray-500 to-gray-700';
    return `bg-gradient-to-r ${gradient}`;
  }

  getActiveIcon(icon: string): string {
    const iconMap: { [key: string]: string } = {
      'dynamic_feed': 'feed',
      'diversity_3': 'people',
      'add_circle': 'edit',
      'video_library': 'play_circle',
      'handshake': 'group',
    };
    return iconMap[icon] || icon;
  }

  openCreatePost(): void {
    this.router.navigate(['/create']);
  }

  openSearch(): void {
    // You can implement search modal or navigate to search page
    this.router.navigate(['/search']);
  }

  logout(): void {
    if (this.isBrowser) {
      localStorage.removeItem('token');
      localStorage.removeItem('userId');
      this.router.navigate(['/login']);
    }
  }
}