import { Component, HostListener, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
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

  navItems = [
    { label: 'Feed', link: '/home', icon: 'dynamic_feed' },
    { label: 'Network', link: '/network', icon: 'diversity_3' },
    { label: 'Create', link: '/create', icon: 'add_circle' },
    { label: 'Resources', link: '/resources', icon: 'work' },
    { label: 'Opportunities', link: '/opportunities', icon: 'business_center' },
  ];

  constructor(private router: Router) {}

  ngOnInit(): void {
    this.showSidebar = window.innerWidth >= 768;                         
  }
  
  isActiveRoute(route: string): boolean {
    return this.router.url.includes(route);
  }

  logout(): void{
    localStorage.removeItem('token');
      this.router.navigate(['/login']);
  }
}
