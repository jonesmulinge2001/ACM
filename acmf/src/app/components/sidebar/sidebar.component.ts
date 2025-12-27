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
    // { label: 'Opportunities', link: '/opportunities', icon: 'business_center' },
    // { label: 'Fund Me', link: '/fund-me', icon: 'volunteer_activism' },
    { label: 'Groups', link: '/groups', icon: 'handshake' },
  ];

  getIconGradient(label: string): string {
    const gradients: { [key: string]: string } = {
      Feed: 'from-pink-500 to-red-500',
      Network: 'from-indigo-500 to-purple-500',
      Create: 'from-green-500 to-emerald-500',
      Resources: 'from-blue-500 to-cyan-500',
      Opportunities: 'from-yellow-500 to-orange-500',
      'Fund Me': 'from-black via-red-600 to-green-600', 
    };
  
    const gradient = gradients[label] || 'from-gray-500 to-gray-700';
    return `bg-gradient-to-r ${gradient}`;
  }
  

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
