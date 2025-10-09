
import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Router } from '@angular/router';


export interface MenuItem {
  id: string;
  label: string;
  icon: string;
  route: string;
}
@Component({
  selector: 'app-sidebar',
  imports: [CommonModule],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.css'
})


export class SidebarComponent {

  constructor(
    private router: Router
  ){}
  @Input() activeSection: string = 'dashboard';
  @Input() isCollapsed: boolean = false;
  @Input() isDarkMode: boolean = false;

  @Output() sectionChange = new EventEmitter<string>();

  menuItems: MenuItem[] = [
    { id: 'dashboard', label: 'Dashboard Overview', icon: 'dashboard', route: '/admin/dashboard' },
    { id: 'users', label: 'User Management', icon: 'group', route: '/admin/manage-users' },
    { id: 'content', label: 'Posts & Content', icon: 'article', route: '/admin/manage-posts' },
    { id: 'messaging', label: 'Messaging/Feedback', icon: 'chat', route: '/admin/manage-messaging' },
    { id: 'analytics', label: 'Analytics & Growth', icon: 'bar_chart', route: '/admin/manage-analytics' },
    { id: 'groups', label: 'Groups Management', icon: 'group', route: '/admin/manage-analytics' },
    { id: 'Institution-Management', label: 'Institution Management', icon: 'account_balance', route: '/admin/institution-management' },
    { id: 'Logout', label: 'Logout', icon: 'logout', route: '/login' },
  ];

  onSectionSelect(item: MenuItem) {
    this.activeSection = item.id;        
    this.router.navigate([item.route]);  
  }
  


}
