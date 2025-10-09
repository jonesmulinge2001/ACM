import { Component } from '@angular/core';
import { SidebarComponent } from "../../admin/sidebar/sidebar.component";
import { TopbarComponent } from "../../admin/topbar/topbar.component";
import { RouterModule } from "@angular/router";
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-admin-layout',
  imports: [SidebarComponent, TopbarComponent, RouterModule, CommonModule],
  templateUrl: './admin-layout.component.html',
  styleUrl: './admin-layout.component.css'
})
export class AdminLayoutComponent {

  isCollapsed: boolean = false;
  isDarkMode: boolean = false;

  toggleSidebar() {
    this.isCollapsed = !this.isCollapsed;
  }

  toggleDarkMode() {
    this.isDarkMode = !this.isDarkMode;
  }

}
