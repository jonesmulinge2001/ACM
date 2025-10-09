import { Component, ElementRef, HostListener, OnInit } from '@angular/core';
import { Router, RouterModule } from "@angular/router";
import { ToastrService } from 'ngx-toastr';
import { AuthService } from '../../services/auth.service';
import { ProfileService } from '../../services/profile.service';
import { Profile } from '../../interfaces';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-institution-admin-layout',
  imports: [RouterModule, CommonModule],
  templateUrl: './institution-admin-layout.component.html',
  styleUrl: './institution-admin-layout.component.css'
})
export class InstitutionAdminLayoutComponent implements OnInit {
  isLoggedIn = false;
  userName = '';
  userImage = '';
  showDropdown = false;

  // declare ElementRef here
  constructor(
    private router: Router,
    private authService: AuthService,
    private profileService: ProfileService,
    private toastr: ToastrService,
    private eRef: ElementRef
  ) {}

  ngOnInit(): void {
    this.isLoggedIn = this.authService.isLoggedIn();

    if (this.isLoggedIn) {
      this.profileService.getMyProfile().subscribe({
        next: (profile: Profile) => {
          this.userName = profile.name;
          this.userImage = profile.profileImage || 'https://via.placeholder.com/40';
        },
        error: () => {
          this.toastr.error('Error loading profile');
        },
      });
    }
  }

  toggleDropdown(): void {
    this.showDropdown = !this.showDropdown;
  }

  logOut(): void {
    localStorage.clear();
    localStorage.removeItem('token');
    localStorage.removeItem('userid');
    localStorage.removeItem('role');
    this.router.navigate(['/login']);
  }

  // Close dropdown when clicking outside
  @HostListener('document:click', ['$event'])
  clickOutside(event: Event): void {
    if (this.showDropdown && !this.eRef.nativeElement.contains(event.target)) {
      this.showDropdown = false;
    }
  }
}
